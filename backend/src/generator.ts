import { Endpoint, SwaggerJson } from './types';

// Registry to track generated types and avoid duplicates
interface TypeRegistry {
  [refName: string]: {
    name: string;
    schema: any;
    generated: boolean;
  };
}

/**
 * Generates TypeScript interfaces from Swagger schemas
 */
export function generateTypeScript(
  selectedEndpoints: Endpoint[],
  swaggerJson: SwaggerJson
): string {
  if (selectedEndpoints.length === 0) {
    return '// No endpoints selected';
  }

  const registry: TypeRegistry = {};
  let output = '// Generated TypeScript Types\n';
  output += '// DO NOT EDIT - Auto-generated from Swagger/OpenAPI specification\n\n';

  // 1. Generate Endpoint Types
  for (const endpoint of selectedEndpoints) {
    output += `// ${'='.repeat(60)}\n`;
    output += `// ${endpoint.method} ${endpoint.path}\n`;
    output += `// ${'='.repeat(60)}\n\n`;

    // Generate request type
    const requestTypeName = generateTypeName(endpoint.method, endpoint.path, 'Payload');
    if (endpoint.requestSchema) {
      const tsType = schemaToTypeScript(endpoint.requestSchema, swaggerJson, 0, registry);
      output += `export type ${requestTypeName} = ${tsType};\n\n`;
    } else {
      output += `export type ${requestTypeName} = {\n`;
      output += `  // No request body schema defined\n`;
      output += `};\n\n`;
    }

    // Generate response type
    const responseTypeName = generateTypeName(endpoint.method, endpoint.path, 'Response');
    if (endpoint.responseSchema) {
      const tsType = schemaToTypeScript(endpoint.responseSchema, swaggerJson, 0, registry);
      output += `export type ${responseTypeName} = ${tsType};\n\n`;
    } else {
      output += `export type ${responseTypeName} = {\n`;
      output += `  // No response schema defined\n`;
      output += `};\n\n`;
    }
  }

  // 2. Generate Shared Types (recursively)
  const sharedTypesOutput = generateSharedTypes(registry, swaggerJson);
  if (sharedTypesOutput) {
    output += `// ${'='.repeat(60)}\n`;
    output += `// Shared Types\n`;
    output += `// ${'='.repeat(60)}\n\n`;
    output += sharedTypesOutput;
  }

  return output;
}

/**
 * Generates a valid TypeScript type name from endpoint details
 */
function generateTypeName(method: string, path: string, suffix: string): string {
  // Convert path to PascalCase
  const pathParts = path
    .split('/')
    .filter(part => part.length > 0)
    .map(part => {
      const cleaned = part.replace(/[{}]/g, '');
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    });

  const pathName = pathParts.join('');
  // We don't include method in the name if it makes it too long, but usually it's good practice
  // User requested "TypeSignInPayload", so maybe "Type" + Path + Suffix
  // Let's stick to a consistent naming: Type{PascalPath}{Suffix}
  // But we need to handle collisions if different methods use same path.
  // So Type{Method}{PascalPath}{Suffix} is safer.
  // User example: TypeSignInPayload. "SignIn" is likely the path /sign-in.
  
  return `Type${pathName}${suffix}`;
}

/**
 * Generates code for all registered shared types
 */
function generateSharedTypes(registry: TypeRegistry, swaggerJson: SwaggerJson): string {
  let output = '';
  const processedRefs = new Set<string>();
  
  // Keep processing until no new refs are added
  let hasNew = true;
  while (hasNew) {
    hasNew = false;
    for (const [refKey, data] of Object.entries(registry)) {
      if (!data.generated) {
        data.generated = true;
        hasNew = true;
        
        output += `export type ${data.name} = `;
        output += schemaToTypeScript(data.schema, swaggerJson, 0, registry);
        output += ';\n\n';
      }
    }
  }

  return output;
}

/**
 * Converts a JSON schema to TypeScript type definition
 */
function schemaToTypeScript(
  schema: any, 
  swaggerJson: SwaggerJson, 
  indent: number,
  registry: TypeRegistry
): string {
  if (!schema) {
    return 'any';
  }

  // Handle $ref
  if (schema.$ref) {
    const refName = extractCleanRefName(schema.$ref);
    const typeName = `Type${refName}`;
    
    // Register this ref to be generated later
    if (!registry[schema.$ref]) {
      const resolvedSchema = resolveRef(schema.$ref, swaggerJson);
      if (resolvedSchema) {
        registry[schema.$ref] = {
          name: typeName,
          schema: resolvedSchema,
          generated: false
        };
      } else {
        return 'any'; // Could not resolve ref
      }
    }
    
    return typeName;
  }

  // Handle type
  if (schema.type === 'object' || schema.properties || (!schema.type && !schema.$ref)) {
    return objectToTypeScript(schema, swaggerJson, indent, registry);
  }

  if (schema.type === 'array') {
    const itemType = schemaToTypeScript(schema.items, swaggerJson, indent, registry);
    return `${itemType}[]`;
  }

  if (schema.type === 'string') {
    if (schema.enum) {
      return schema.enum.map((v: string) => `'${v}'`).join(' | ');
    }
    if (schema.format === 'date' || schema.format === 'date-time') {
      return 'Date'; // User preference: use Date for date-time
    }
    return 'string';
  }

  if (schema.type === 'number' || schema.type === 'integer') {
    return 'number';
  }

  if (schema.type === 'boolean') {
    return 'boolean';
  }

  // Handle allOf (Intersection)
  if (schema.allOf) {
    const types = schema.allOf.map((s: any) => schemaToTypeScript(s, swaggerJson, indent, registry));
    return types.join(' & ');
  }

  // Handle oneOf/anyOf (Union)
  if (schema.oneOf || schema.anyOf) {
    const types = (schema.oneOf || schema.anyOf).map((s: any) => 
      schemaToTypeScript(s, swaggerJson, indent, registry)
    );
    return types.join(' | ');
  }

  return 'any';
}

/**
 * Converts an object schema to TypeScript type body
 */
function objectToTypeScript(
  schema: any, 
  swaggerJson: SwaggerJson, 
  indent: number,
  registry: TypeRegistry
): string {
  const indentStr = '  '.repeat(indent);
  const nextIndentStr = '  '.repeat(indent + 1);

  let output = '{\n';

  const properties = schema.properties || {};
  const required = schema.required || [];

  for (const [propName, propSchema] of Object.entries(properties)) {
    const isRequired = required.includes(propName);
    const optional = isRequired ? '' : '?';

    // Add description as comment if available
    if ((propSchema as any).description) {
      output += `${nextIndentStr}/** ${(propSchema as any).description} */\n`;
    }

    const propType = schemaToTypeScript(propSchema, swaggerJson, indent + 1, registry);
    
    // Handle property names with special characters
    const propKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(propName) 
      ? propName 
      : `'${propName}'`;

    output += `${nextIndentStr}${propKey}${optional}: ${propType};\n`;
  }

  // Handle additionalProperties
  if (schema.additionalProperties) {
    if (schema.additionalProperties === true) {
      output += `${nextIndentStr}[key: string]: any;\n`;
    } else {
      const addPropType = schemaToTypeScript(schema.additionalProperties, swaggerJson, indent + 1, registry);
      output += `${nextIndentStr}[key: string]: ${addPropType};\n`;
    }
  }

  output += `${indentStr}}`;

  return output;
}

/**
 * Extracts a clean reference name from a $ref string
 * Removes namespaces (dots) and takes the last part
 */
function extractCleanRefName(ref: string): string {
  // Example: #/components/schemas/CredSys.CoordinatorPortal...SignInCommand
  const parts = ref.split('/');
  const lastPart = parts[parts.length - 1];
  
  // Split by dots and take the last part to remove namespaces
  const nameParts = lastPart.split('.');
  return nameParts[nameParts.length - 1];
}

/**
 * Resolves a $ref to the actual schema object
 */
function resolveRef(ref: string, swaggerJson: SwaggerJson): any {
  // Example: #/components/schemas/User
  if (!ref.startsWith('#/')) {
    return null; // External refs not supported yet
  }

  const parts = ref.substring(2).split('/');
  let current: any = swaggerJson;

  for (const part of parts) {
    if (current && typeof current === 'object') {
      current = current[part];
    } else {
      return null;
    }
  }

  return current;
}
