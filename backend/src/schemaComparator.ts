import { SwaggerJson } from './types';
import { InterfaceDefinition } from './tsParser';

export interface DiffResult {
  added: { name: string; type: string; description?: string }[];
  removed: { name: string; type: string }[];
  modified: { name: string; expectedType: string; actualType: string }[];
}

/**
 * Resolve $ref in Swagger schema
 */
function resolveRef(ref: string, swaggerJson: SwaggerJson): any {
  const parts = ref.split('/');
  if (parts[0] === '#') {
    if (parts[1] === 'definitions' && swaggerJson.definitions) {
      return swaggerJson.definitions[parts[2]];
    } else if (parts[1] === 'components' && parts[2] === 'schemas' && swaggerJson.components?.schemas) {
      return swaggerJson.components.schemas[parts[3]];
    }
  }
  return null;
}

/**
 * Get displayable type string from Swagger schema
 */
function getSwaggerType(schema: any, swaggerJson: SwaggerJson, isOptional: boolean = false): string {
  if (!schema) return 'any';
  
  let typeStr = 'any';

  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, swaggerJson);
    const refName = schema.$ref.split('/').pop();
    // If we can resolve it, we might want to check its type, but usually refName is good enough
    // coupled with " | undefined" if optional
    typeStr = refName || getSwaggerType(resolved, swaggerJson, false);
  } else if (schema.type === 'string') {
     if (schema.format === 'date' || schema.format === 'date-time') {
         typeStr = 'Date';
     } else {
         typeStr = 'string';
     }
  } else if (schema.type === 'array') {
    typeStr = `${getSwaggerType(schema.items, swaggerJson, false)}[]`;
  } else if (schema.type) {
    typeStr = schema.type;
  }

  // If schema explicitly allows null (OpenAPI 3.1 or x-nullable)
  if (schema.nullable || schema['x-nullable']) {
    typeStr += ' | null';
  }

  if (isOptional) {
    typeStr += ' | undefined';
  }

  return typeStr;
}

/**
 * Compare Swagger Schema (Expected) vs TypeScript Interface (Actual)
 */
export function compareSchemas(
  swaggerSchema: any,
  tsInterface: InterfaceDefinition,
  swaggerJson: SwaggerJson,
  allInterfaces?: { [key: string]: InterfaceDefinition }, // Map of all parsed TS interfaces
  parentPath: string = ''
): DiffResult {
  const diff: DiffResult = {
    added: [],
    removed: [],
    modified: [],
  };

  // Resolve root schema if it's a ref
  let expectedSchema = swaggerSchema;
  if (expectedSchema.$ref) {
    expectedSchema = resolveRef(expectedSchema.$ref, swaggerJson);
  }

  if (!expectedSchema || (!expectedSchema.properties && expectedSchema.type !== 'object')) {
    return diff;
  }

  const expectedProps = expectedSchema.properties || {};
  const requiredProps = expectedSchema.required || [];
  const actualProps = tsInterface.properties;

  // 1. Check for Added (In Swagger but missing in TS)
  for (const [propName, propSchema] of Object.entries(expectedProps)) {
    const isOptional = !requiredProps.includes(propName);
    const fullPropName = parentPath ? `${parentPath}.${propName}` : propName;
    
    if (!actualProps[propName]) {
      // If optional, maybe the user intentionally omitted it?
      // But typically we still want to show it as "Missing" so they know they CAN add it.
      // We just need to make sure the type reflects it is optional.
      diff.added.push({
        name: fullPropName,
        type: getSwaggerType(propSchema, swaggerJson, isOptional),
        description: (propSchema as any).description
      });
    }
  }

  // 2. Check for Removed (In TS but not in Swagger)
  for (const [propName, propDef] of Object.entries(actualProps)) {
    const fullPropName = parentPath ? `${parentPath}.${propName}` : propName;
    if (!expectedProps[propName]) {
      diff.removed.push({
        name: fullPropName,
        type: propDef.type
      });
    }
  }

  // 3. Check for Modified (In both but types differ)
  for (const [propName, propSchema] of Object.entries(expectedProps)) {
    if (actualProps[propName]) {
      const isOptional = !requiredProps.includes(propName);
      const expectedType = getSwaggerType(propSchema, swaggerJson, isOptional);
      const actualType = actualProps[propName].type;
      const fullPropName = parentPath ? `${parentPath}.${propName}` : propName;

      // Check if we can/should recurse FIRST
      const actualInterfaceName = actualType.replace('[]', '').trim();
      const isArray = actualType.endsWith('[]');
      let hasRecursed = false;

      if (allInterfaces && allInterfaces[actualInterfaceName]) {
          const nestedInterface = allInterfaces[actualInterfaceName];
          let propEffectiveSchema: any = propSchema;
          
          if (propEffectiveSchema.$ref) {
               propEffectiveSchema = resolveRef(propEffectiveSchema.$ref, swaggerJson);
          }
          
          if (isArray && propEffectiveSchema?.type === 'array') {
              propEffectiveSchema = propEffectiveSchema.items;
              if (propEffectiveSchema?.$ref) {
                   propEffectiveSchema = resolveRef(propEffectiveSchema.$ref, swaggerJson);
              }
          }

          // If expected schema resembles an object, recurse
          if (propEffectiveSchema && (propEffectiveSchema.type === 'object' || propEffectiveSchema.properties)) {
               hasRecursed = true;
               const nestedDiff = compareSchemas(
                  propEffectiveSchema, 
                  nestedInterface, 
                  swaggerJson, 
                  allInterfaces, 
                  fullPropName
              );
              
              diff.added.push(...nestedDiff.added);
              diff.removed.push(...nestedDiff.removed);
              diff.modified.push(...nestedDiff.modified);
          }
      }

      // If we didn't recurse (or couldn't), THEN check for primitive mismatch
      if (!hasRecursed) {
          const isMismatch = compareTypesLoose(expectedType, actualType);
          if (isMismatch) {
             diff.modified.push({
                name: fullPropName,
                expectedType: expectedType,
                actualType: actualType
            });
          }
      }
    }
  }

  return diff;
}

function compareTypesLoose(expected: string, actual: string): boolean {
  // Normalize
  const e = expected.replace(/\s+/g, '').toLowerCase();
  const a = actual.replace(/\s+/g, '').toLowerCase();
  
  if (e === a) return false;

  const normalizeType = (t: string) => t.replace(/integer/g, 'number').replace(/int32/g, ''); 
  // User wants 'Date' to match 'string($date-time)'
  // In getSwaggerType we might return 'string', but format is lost here.
  // Ideally getSwaggerType should return 'Date' if format is date-time.
  // But let's handle the string vs Date loose match here if needed.
  // If 'a' is 'date' and 'e' is 'string' (or vice versa), check if context implies date?
  // Actually, I should update getSwaggerType first to return 'Date' for date-time format.
  
  if (normalizeType(e) === normalizeType(a)) return false;

  // Handling "string | null" vs "string" (if optional)
  // If expected is "string | undefined" (optional), and actual is "string | null", 
  // User might consider this valid.
  // BUT strictly they are usually different.
  // However, often in TS for JSON, people treat optional and null loosely.
  // Let's implement a loose check: if they overlap significantly.
  
  const eParts = new Set(e.split('|').map(normalizeType));
  const aParts = new Set(a.split('|').map(normalizeType));
  
  // If "number" is in both, that's good.
  // If "string" is in both, that's good.
  // If "date" is in both (after update), that's good.
  const coreTypes = ['string', 'number', 'boolean', 'array', 'object', 'date'];
  
  let hasCoreMatch = false;
  for (const t of coreTypes) {
      if (eParts.has(t) && aParts.has(t)) {
          hasCoreMatch = true;
          break;
      }
      // Check array variants
      if (eParts.has(t + '[]') && aParts.has(t + '[]')) {
          hasCoreMatch = true;
          break;
      }
      // Check for array<T> style if normalized
  }

  if (hasCoreMatch) {
      // Core types match. Now check modifiers (null/undefined).
      return false; 
  }

  // If expected is "object" and actual is "someinterface", assume match (rough heuristic)
  if (e.includes('object') && !['string', 'number', 'boolean', 'array'].some(t => a.includes(t))) {
      return false;
  }
  
  return true; // They are different
}
