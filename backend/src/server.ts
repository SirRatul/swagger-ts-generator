import express, { 
	Request, 
	Response 
} from 'express';
import cors from 'cors';
import 'dotenv/config';
import { fetchSwaggerJson } from './fetchSwagger';
import { parseEndpoints } from './parser';
import { generateTypeScript } from './generator';
import { 
	FetchSwaggerResponse, 
	GenerateRequest, 
	GenerateResponse 
} from './types';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
		status: 'ok', 
		message: 'Swagger TS Generator API is running' 
	});
});

// Fetch Swagger endpoints
app.post('/api/fetch-swagger', async (req: Request, res: Response) => {
  try {
    const { url, authHeader } = req.body;

    if (!url) {
      return res.status(400).json({ 
				error: 'Swagger URL is required'
			});
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ 
				error: 'Invalid URL format' 
			});
    }

    // Fetch and parse Swagger JSON
    const swaggerJson = await fetchSwaggerJson(url, authHeader);
    const endpoints = parseEndpoints(swaggerJson);

    const response: FetchSwaggerResponse = {
      endpoints,
      swaggerJson,
    };

    res.json(response);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message || 'Failed to fetch Swagger specification' 
    });
  }
});

// Generate TypeScript code
app.post('/api/generate', async (req: Request, res: Response) => {
  try {
    const { selectedEndpoints, allEndpoints, swaggerJson }: GenerateRequest = req.body;

    if (!selectedEndpoints || !Array.isArray(selectedEndpoints)) {
      return res.status(400).json({ 
				error: 'Selected endpoints array is required' 
			});
    }

    if (!allEndpoints || !Array.isArray(allEndpoints)) {
      return res.status(400).json({ 
				error: 'All endpoints array is required' 
			});
    }

    if (!swaggerJson) {
      return res.status(400).json({ 
				error: 'Swagger JSON is required' 
			});
    }

    // Filter endpoints based on selection
    const endpointsToGenerate = allEndpoints.filter(ep => 
      selectedEndpoints.includes(ep.id)
    );

    // Generate TypeScript code
    const typescript = generateTypeScript(endpointsToGenerate, swaggerJson);

    const response: GenerateResponse = {
      typescript,
    };

    res.json(response);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message || 'Failed to generate TypeScript code' 
    });
  }
});

// Compare user response with schema
app.post('/api/compare-response', async (req: Request, res: Response) => {
  try {
    const { endpointId, userResponse, swaggerJson, endpoints } = req.body;

    if (!endpointId) {
      return res.status(400).json({ 
        error: 'Endpoint ID is required' 
      });
    }

    if (userResponse === undefined || userResponse === null) {
      return res.status(400).json({ 
        error: 'User response is required' 
      });
    }

    if (!swaggerJson) {
      return res.status(400).json({ 
        error: 'Swagger JSON is required' 
      });
    }

    if (!endpoints || !Array.isArray(endpoints)) {
      return res.status(400).json({ 
        error: 'Endpoints array is required' 
      });
    }

    // Find the selected endpoint
    const endpoint = endpoints.find(ep => ep.id === endpointId);
    if (!endpoint) {
      return res.status(404).json({ 
        error: 'Endpoint not found' 
      });
    }

    // Import the comparison function
    const { compareResponse } = await import('./compareResponse');

    // Get the response schema
    const responseSchema = endpoint.responseSchema;
    if (!responseSchema) {
      return res.status(400).json({ 
        error: 'No response schema found for this endpoint' 
      });
    }

    // Perform comparison
    const comparison = compareResponse(userResponse, responseSchema, swaggerJson);

    res.json({ comparison });
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message || 'Failed to compare response' 
    });
  }
});

// Compare Swagger Schema vs TypeScript Interface
app.post('/api/compare-swagger-vs-ts', async (req: Request, res: Response) => {
  try {
    const { endpointId, tsCode, swaggerJson, endpoints, comparisonType = 'response' } = req.body;

    if (!endpointId || !tsCode || !swaggerJson || !endpoints) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const endpoint = endpoints.find((ep: any) => ep.id === endpointId);
    if (!endpoint) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }

    const { parseTypeScriptToSchema } = await import('./tsParser');
    const { compareSchemas } = await import('./schemaComparator');

    // 1. Parse TS Code
    const tsInterfaces = parseTypeScriptToSchema(tsCode);
    const interfaceNames = Object.keys(tsInterfaces);

    if (interfaceNames.length === 0) {
      return res.status(400).json({ error: 'No interfaces found in the provided TypeScript code' });
    }

    // 2. Select interface to compare
    // Heuristic: Pick the one that has the most matching keys with the Swagger schema
    let selectedInterface = tsInterfaces[interfaceNames[0]];
    let maxOverlap = -1;

    // Get expected Schema to compare against
    let expectedSchema;
    if (comparisonType === 'request') {
      expectedSchema = endpoint.requestSchema;
    } else {
      expectedSchema = endpoint.responseSchema;
    }

    if (!expectedSchema) {
       // Fallback or early error if schema is missing, though we handle it below too
       // Just let the comparison logic handle empty schema if needed, but for selection we need keys
    }

    // Resolve ref if needed for "keys" check
    // We need a helper to get keys from schema, similar to getSwaggerType logic but for keys?
    // For now, let's assume root schema is usually an object with properties.
    // If it's a $ref, we might need to resolve it to get the properties list.
    
    // We need 'resolveSchema' available here. 
    // It's not exported from 'compareResponse.ts' or 'schemaComparator.ts' easily?
    // Let's import the one from schemaComparator or duplicate simple resolution logic.
    // Actually, schemaComparator has internal helpers. 
    // Let's check if we can export resolveRef from schemaComparator.
    
    // For now, let's implement a simple direct check:
    let swaggerKeys: string[] = [];
    
    // Simple inline Ref Resolution for Selection Heuristic
    let currentSchema = expectedSchema;
    if (currentSchema && currentSchema.$ref && swaggerJson) {
         const parts = currentSchema.$ref.split('/');
         if (parts[0] === '#' && parts[1] === 'definitions' && swaggerJson.definitions) {
            currentSchema = swaggerJson.definitions[parts[2]];
         } else if (parts[0] === '#' && parts[1] === 'components' && parts[2] === 'schemas' && swaggerJson.components?.schemas) {
            currentSchema = swaggerJson.components.schemas[parts[3]];
         }
    }

    if (currentSchema && currentSchema.properties) {
        swaggerKeys = Object.keys(currentSchema.properties);
    }

    for (const name of interfaceNames) {
      const tsKeys = Object.keys(tsInterfaces[name].properties);
      
      // Calculate overlap
      const overlap = tsKeys.filter(key => swaggerKeys.includes(key)).length;
      
      // If overlaps are equal, fallback to total properties count (prefer more complete one?)
      // Or prefer the one with *fewer* non-overlapping keys? (Closer match)
      // For now, overlap count is a strong signal.
      if (overlap > maxOverlap) {
        maxOverlap = overlap;
        selectedInterface = tsInterfaces[name];
      } else if (overlap === maxOverlap) {
         // Tie-breaker: Pick the one that has fewer "extra" keys? 
         // Or just stick with first found.
      }
    }

    // 4. Compare
    const comparison = compareSchemas(expectedSchema, selectedInterface, swaggerJson, tsInterfaces);

    res.json({ comparison, selectedInterfaceName: selectedInterface.name });

  } catch (error: any) {
    console.error('Comparison error:', error);
    res.status(500).json({ error: error.message || 'Failed to compare' });
  }
});

// Start server
app.listen(PORT, () => {
  // Server is running
});
