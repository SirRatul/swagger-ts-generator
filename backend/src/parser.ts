import { SwaggerJson, Endpoint } from './types';

/**
 * Parses Swagger/OpenAPI JSON and extracts all endpoints with their schemas
 */
export function parseEndpoints(swaggerJson: SwaggerJson): Endpoint[] {
  const endpoints: Endpoint[] = [];

  if (!swaggerJson.paths) {
    return endpoints;
  }

  // Iterate through all paths
  for (const [path, pathItem] of Object.entries(swaggerJson.paths)) {
    // Iterate through all HTTP methods for this path
    const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
    
    for (const method of methods) {
      const operation = pathItem[method];
      
      if (!operation) continue;

      // Create unique ID for this endpoint
      const id = `${method.toUpperCase()} ${path}`;

      // Extract request schema
      let requestSchema = null;
      if (operation.requestBody) {
        // OpenAPI 3.x style
        const content = operation.requestBody.content;
        if (content) {
          // Try to get JSON content first
          const jsonContent = content['application/json'] || 
                            content['application/x-www-form-urlencoded'] ||
                            content['multipart/form-data'] ||
                            Object.values(content)[0];
          
          if (jsonContent && jsonContent.schema) {
            requestSchema = jsonContent.schema;
          }
        }
      } else if (operation.parameters) {
        // Swagger 2.0 style - look for body parameter
        const bodyParam = operation.parameters.find((p: any) => p.in === 'body');
        if (bodyParam && bodyParam.schema) {
          requestSchema = bodyParam.schema;
        }
      }

      // Extract response schema (prefer 200, then 201, then first 2xx response)
      let responseSchema = null;
      if (operation.responses) {
        const responses = operation.responses;
        
        // Try common success status codes
        const successResponse = responses['200'] || 
                               responses['201'] || 
                               responses['202'] ||
                               responses['204'];
        
        if (successResponse) {
          // OpenAPI 3.x style
          if (successResponse.content) {
            const jsonContent = successResponse.content['application/json'] ||
                               Object.values(successResponse.content)[0];
            
            if (jsonContent && (jsonContent as any).schema) {
              responseSchema = (jsonContent as any).schema;
            }
          }
          // Swagger 2.0 style
          else if (successResponse.schema) {
            responseSchema = successResponse.schema;
          }
        }
      }

      endpoints.push({
        id,
        method: method.toUpperCase(),
        path,
        summary: operation.summary || operation.description || id,
        requestSchema,
        responseSchema,
      });
    }
  }

  return endpoints;
}
