import { ComparisonError, ComparisonResult, SwaggerJson } from './types';

/**
 * Get the schema definition, resolving $ref if necessary
 */
function resolveSchema(schema: any, swaggerJson: SwaggerJson): any {
  if (!schema) return null;

  if (schema.$ref) {
    const ref = schema.$ref;
    const parts = ref.split('/');
    
    // Handle #/definitions/ModelName or #/components/schemas/ModelName
    if (parts[0] === '#') {
      if (parts[1] === 'definitions' && swaggerJson.definitions) {
        return swaggerJson.definitions[parts[2]];
      } else if (parts[1] === 'components' && parts[2] === 'schemas' && swaggerJson.components?.schemas) {
        return swaggerJson.components.schemas[parts[3]];
      }
    }
  }

  return schema;
}

/**
 * Get the TypeScript/JSON type from a schema type
 */
function getExpectedType(schema: any): string {
  if (!schema) return 'unknown';
  
  if (schema.type === 'array') {
    return 'array';
  }
  
  if (schema.type === 'object') {
    return 'object';
  }
  
  if (schema.enum) {
    return `enum: ${schema.enum.join(' | ')}`;
  }
  
  return schema.type || 'unknown';
}

/**
 * Get the actual type of a value
 */
function getActualType(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * Check if a value matches the expected schema type
 */
function isTypeMatch(value: any, schema: any, swaggerJson: SwaggerJson): boolean {
  const resolvedSchema = resolveSchema(schema, swaggerJson);
  if (!resolvedSchema || !resolvedSchema.type) return true; // Skip validation if no type specified

  const schemaType = resolvedSchema.type;
  const actualType = getActualType(value);

  if (schemaType === 'array') {
    return Array.isArray(value);
  }

  if (schemaType === 'object') {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  if (schemaType === 'integer' || schemaType === 'number') {
    return typeof value === 'number';
  }

  if (schemaType === 'string') {
    return typeof value === 'string';
  }

  if (schemaType === 'boolean') {
    return typeof value === 'boolean';
  }

  return true;
}

/**
 * Compare a user response with a schema and collect errors
 */
export function compareWithSchema(
  userResponse: any,
  schema: any,
  swaggerJson: SwaggerJson,
  path: string = 'root'
): ComparisonError[] {
  const errors: ComparisonError[] = [];
  const resolvedSchema = resolveSchema(schema, swaggerJson);

  if (!resolvedSchema) {
    return errors;
  }

  // Check type match
  if (!isTypeMatch(userResponse, resolvedSchema, swaggerJson)) {
    errors.push({
      path,
      type: 'type_mismatch',
      expected: getExpectedType(resolvedSchema),
      actual: getActualType(userResponse),
      message: `Expected type '${getExpectedType(resolvedSchema)}' but got '${getActualType(userResponse)}'`,
    });
    return errors; // Don't continue if type is completely wrong
  }

  // Handle array validation
  if (resolvedSchema.type === 'array' && Array.isArray(userResponse)) {
    if (resolvedSchema.items) {
      userResponse.forEach((item, index) => {
        const itemErrors = compareWithSchema(
          item,
          resolvedSchema.items,
          swaggerJson,
          `${path}[${index}]`
        );
        errors.push(...itemErrors);
      });
    }
    return errors;
  }

  // Handle object validation
  if (resolvedSchema.type === 'object' || resolvedSchema.properties) {
    if (typeof userResponse !== 'object' || userResponse === null) {
      errors.push({
        path,
        type: 'type_mismatch',
        expected: 'object',
        actual: getActualType(userResponse),
        message: `Expected an object but got '${getActualType(userResponse)}'`,
      });
      return errors;
    }

    const properties = resolvedSchema.properties || {};
    const required = resolvedSchema.required || [];

    // Check for missing required properties
    required.forEach((propName: string) => {
      if (!(propName in userResponse)) {
        errors.push({
          path: `${path}.${propName}`,
          type: 'missing',
          expected: properties[propName] ? getExpectedType(properties[propName]) : 'defined',
          actual: 'undefined',
          message: `Required property '${propName}' is missing`,
        });
      }
    });

    // Check existing properties
    Object.keys(userResponse).forEach((propName) => {
      if (properties[propName]) {
        // Property is defined in schema, validate it
        const propErrors = compareWithSchema(
          userResponse[propName],
          properties[propName],
          swaggerJson,
          `${path}.${propName}`
        );
        errors.push(...propErrors);
      } else {
        // Property exists but not in schema
        if (resolvedSchema.additionalProperties === false) {
          errors.push({
            path: `${path}.${propName}`,
            type: 'extra',
            expected: 'not defined',
            actual: getActualType(userResponse[propName]),
            message: `Property '${propName}' is not defined in schema`,
          });
        }
      }
    });

    // Check for missing optional properties (for informational purposes)
    Object.keys(properties).forEach((propName) => {
      if (!required.includes(propName) && !(propName in userResponse)) {
        // Optional property missing - this is not an error, just info
        // We can skip this or add as a warning if needed
      }
    });
  }

  // Validate enum values
  if (resolvedSchema.enum && !resolvedSchema.enum.includes(userResponse)) {
    errors.push({
      path,
      type: 'invalid_value',
      expected: `one of: ${resolvedSchema.enum.join(', ')}`,
      actual: userResponse,
      message: `Value '${userResponse}' is not in the allowed enum values`,
    });
  }

  return errors;
}

/**
 * Main comparison function that returns a complete comparison result
 */
export function compareResponse(
  userResponse: any,
  responseSchema: any,
  swaggerJson: SwaggerJson
): ComparisonResult {
  const errors = compareWithSchema(userResponse, responseSchema, swaggerJson, 'response');

  const summary = {
    totalErrors: errors.length,
    missingCount: errors.filter((e) => e.type === 'missing').length,
    typeMismatchCount: errors.filter((e) => e.type === 'type_mismatch').length,
    extraCount: errors.filter((e) => e.type === 'extra').length,
  };

  return {
    isValid: errors.length === 0,
    errors,
    summary,
  };
}
