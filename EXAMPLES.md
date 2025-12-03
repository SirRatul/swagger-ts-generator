# Example Generated Output

This document shows sample outputs from the Swagger TypeScript Generator.

## Example 1: Petstore API

### Input
- **Swagger URL**: `https://petstore.swagger.io/`
- **Selected Endpoints**: 
  - GET /pet/{petId}
  - POST /pet
  - PUT /pet
  - DELETE /pet/{petId}

### Generated TypeScript

```typescript
// Generated TypeScript Interfaces
// DO NOT EDIT - Auto-generated from Swagger/OpenAPI specification

// ============================================================
// GET /pet/{petId}
// ============================================================

export interface GetPetByPetIdRequest {
  // No request body schema defined
}

export interface GetPetByPetIdResponse {
  id?: number;
  name: string;
  category?: {
    id?: number;
    name?: string;
  };
  photoUrls: string[];
  tags?: {
    id?: number;
    name?: string;
  }[];
  /** pet status in the store */
  status?: 'available' | 'pending' | 'sold';
}

// ============================================================
// POST /pet
// ============================================================

export interface PostPetRequest {
  id?: number;
  name: string;
  category?: {
    id?: number;
    name?: string;
  };
  photoUrls: string[];
  tags?: {
    id?: number;
    name?: string;
  }[];
  /** pet status in the store */
  status?: 'available' | 'pending' | 'sold';
}

export interface PostPetResponse {
  id?: number;
  name: string;
  category?: {
    id?: number;
    name?: string;
  };
  photoUrls: string[];
  tags?: {
    id?: number;
    name?: string;
  }[];
  /** pet status in the store */
  status?: 'available' | 'pending' | 'sold';
}

// ============================================================
// PUT /pet
// ============================================================

export interface PutPetRequest {
  id?: number;
  name: string;
  category?: {
    id?: number;
    name?: string;
  };
  photoUrls: string[];
  tags?: {
    id?: number;
    name?: string;
  }[];
  /** pet status in the store */
  status?: 'available' | 'pending' | 'sold';
}

export interface PutPetResponse {
  id?: number;
  name: string;
  category?: {
    id?: number;
    name?: string;
  };
  photoUrls: string[];
  tags?: {
    id?: number;
    name?: string;
  }[];
  /** pet status in the store */
  status?: 'available' | 'pending' | 'sold';
}

// ============================================================
// DELETE /pet/{petId}
// ============================================================

export interface DeletePetByPetIdRequest {
  // No request body schema defined
}

export interface DeletePetByPetIdResponse {
  // No response schema defined
}
```

## Example 2: RESTful User API

### Sample Swagger Specification
```json
{
  "openapi": "3.0.0",
  "paths": {
    "/users": {
      "get": {
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/User"
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateUserRequest"
              }
            }
          }
        },
        "responses": {
          "201": {
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/User"
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### Generated Output
```typescript
// ============================================================
// GET /users
// ============================================================

export interface GetUsersRequest {
  // No request body schema defined
}

export interface GetUsersResponse User[]

// ============================================================
// POST /users
// ============================================================

export interface PostUsersRequest CreateUserRequest

export interface PostUsersResponse User
```

## Schema Conversion Rules

The generator follows these rules when converting Swagger schemas to TypeScript:

### Object Types
```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "number" }
  },
  "required": ["name"]
}
```
→
```typescript
{
  name: string;
  age?: number;
}
```

### Array Types
```json
{
  "type": "array",
  "items": { "type": "string" }
}
```
→
```typescript
string[]
```

### Enum Types
```json
{
  "type": "string",
  "enum": ["active", "inactive", "pending"]
}
```
→
```typescript
'active' | 'inactive' | 'pending'
```

### References
```json
{
  "$ref": "#/components/schemas/User"
}
```
→
```typescript
User
```

### AllOf (Intersection)
```json
{
  "allOf": [
    { "$ref": "#/components/schemas/Base" },
    { "$ref": "#/components/schemas/Extended" }
  ]
}
```
→
```typescript
Base & Extended
```

### OneOf/AnyOf (Union)
```json
{
  "oneOf": [
    { "$ref": "#/components/schemas/Dog" },
    { "$ref": "#/components/schemas/Cat" }
  ]
}
```
→
```typescript
Dog | Cat
```

## Usage in Your Project

After generating the TypeScript interfaces, you can use them in your application:

```typescript
import { PostPetRequest, PostPetResponse } from './generated-types';

async function createPet(pet: PostPetRequest): Promise<PostPetResponse> {
  const response = await fetch('https://petstore.swagger.io/v2/pet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pet),
  });
  
  return response.json();
}

// TypeScript will enforce the correct structure
const newPet: PostPetRequest = {
  name: 'Fluffy',
  photoUrls: ['https://example.com/fluffy.jpg'],
  status: 'available',
};

const createdPet = await createPet(newPet);
console.log(createdPet.id); // TypeScript knows this exists
```

## Benefits

✅ **Type Safety** - Catch errors at compile time, not runtime  
✅ **IntelliSense** - Get autocomplete suggestions in your IDE  
✅ **Documentation** - Interfaces serve as inline documentation  
✅ **Refactoring** - Safely rename and restructure your code  
✅ **Consistency** - Ensure frontend and backend stay in sync
