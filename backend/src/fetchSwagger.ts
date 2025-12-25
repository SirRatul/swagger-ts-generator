import axios from 'axios';
import * as cheerio from 'cheerio';
import { SwaggerJson } from './types';

/**
 * Fetches Swagger UI HTML page and extracts the JSON spec URL
 * Then fetches and returns the parsed Swagger/OpenAPI JSON
 */
export async function fetchSwaggerJson(swaggerUrl: string, authHeader?: string): Promise<SwaggerJson> {
  try {
    const headers: any = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

		const axiosInstance = axios.create({
			timeout: 10_000, // 10 seconds
		});

    // Step 1: Fetch the HTML page
    const htmlResponse = await axiosInstance.get(swaggerUrl, { headers });

    const html = htmlResponse.data;
    const $ = cheerio.load(html);

    // Step 2: Try to extract JSON URL from various common patterns
    let jsonUrl: string | null = null;

    // Pattern 1: Look for swagger-ui configuration in script tags
    $('script').each((_, element) => {
      const scriptContent = $(element).html() || '';
      
      // Look for url: "..." or url:"..." pattern in SwaggerUIBundle config
      const urlMatch = scriptContent.match(/url\s*:\s*["']([^"']+)["']/);
      if (urlMatch && urlMatch[1]) {
        jsonUrl = urlMatch[1];
        return false; // break the loop
      }

      // Look for spec: {...} inline specification
      const specMatch = scriptContent.match(/spec\s*:\s*(\{[\s\S]*?\})\s*[,}]/);
      if (specMatch && specMatch[1]) {
        try {
          // Try to parse inline spec
          const inlineSpec = eval('(' + specMatch[1] + ')');
          if (inlineSpec && (inlineSpec.swagger || inlineSpec.openapi)) {
            // Found inline spec, we'll use htmlResponse.config.url as base
            jsonUrl = 'INLINE_SPEC';
            return false;
          }
        } catch (e) {
          // Failed to parse inline spec, continue searching
        }
      }
    });

    // Pattern 2: Look for common JSON endpoints in HTML content
    if (!jsonUrl) {
      const commonPatterns = [
        '/swagger/v1/swagger.json',
        '/swagger.json',
        '/api-docs',
        '/openapi.json',
        '/v2/api-docs',
        '/v3/api-docs',
      ];

      for (const pattern of commonPatterns) {
        if (html.includes(pattern)) {
          jsonUrl = pattern;
          break;
        }
      }
    }

    // Pattern 3: Look in link or meta tags
    if (!jsonUrl) {
      const link = $('link[rel="alternate"][type="application/json"]').attr('href');
      if (link) {
        jsonUrl = link;
      }
    }

    if (!jsonUrl) {
      throw new Error(
        'Could not extract Swagger JSON URL from HTML. Make sure the URL points to a Swagger UI page.'
      );
    }

    // Step 3: Resolve relative URLs
    let fullJsonUrl: string;
    const originalUrlObj = new URL(swaggerUrl);

    if (jsonUrl === 'INLINE_SPEC') {
      // For inline specs, we already have the data in htmlResponse
      // This is a fallback that might not work in all cases
      throw new Error(
        'Inline Swagger specifications are not fully supported. Please provide a URL that serves the JSON separately.'
      );
    } else {
      // Resolve the URL (handle both relative and absolute)
      const resolvedUrl = new URL(jsonUrl, originalUrlObj.origin);
      
      // Forward query parameters from the original URL (e.g. ?k=...)
      // This is crucial for APIs that use query params for auth
      originalUrlObj.searchParams.forEach((value, key) => {
        if (!resolvedUrl.searchParams.has(key)) {
          resolvedUrl.searchParams.append(key, value);
        }
      });

      fullJsonUrl = resolvedUrl.toString();
    }

    // Step 4: Fetch the JSON specification
    const jsonResponse = await axiosInstance.get(fullJsonUrl, {
      headers: {
        ...headers,
        'Accept': 'application/json',
      },
    });

    const swaggerJson: SwaggerJson = jsonResponse.data;

    // Validate that it's actually a Swagger/OpenAPI spec
    if (!swaggerJson.swagger && !swaggerJson.openapi) {
      throw new Error(
        'The fetched JSON does not appear to be a valid Swagger/OpenAPI specification.'
      );
    }

    return swaggerJson;
  } catch (error: any) {
		if (error.code === 'ECONNABORTED') {
			throw new Error('Request timed out while trying to reach the Swagger URL.');
		}

    if (error.response) {
      throw new Error(
        `Failed to fetch Swagger specification: ${error.response.status} ${error.response.statusText}`
      );
    } else if (error.request) {
      throw new Error(
        `Failed to reach the Swagger URL. Please check the URL and your network connection.`
      );
    } else {
      throw error;
    }
  }
}
