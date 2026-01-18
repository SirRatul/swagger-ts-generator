
import { parseTypeScriptToSchema } from './src/tsParser';
import { compareSchemas } from './src/schemaComparator';

// 1. Mock Schema with Nested Object
const mockSwaggerJson = {};
const mockSwaggerSchema = {
    type: 'object',
    properties: {
        rootField: { type: 'string' },
        nestedData: {
            type: 'object',
            properties: {
                childField: { type: 'string' },
                missingChild: { type: 'boolean' }
            }
        },
        items: {
             type: 'array',
             items: {
                 type: 'object',
                 properties: {
                     itemField: { type: 'number' },
                     missingItemField: { type: 'string' }
                 }
             }
        }
    }
};

// 2. Mock TS Code
// Nested interfaces are typically separate in the output
const tsCode = `
export type RootType = {
  rootField: string;
  nestedData: NestedType;
  items: ItemType[];
};

export type NestedType = {
  childField: string;
  // missingChild is missing here
};

export type ItemType = {
    itemField: number;
    // missingItemField missing
};
`;

console.log('--- Testing Recursive Comparison ---');
const interfaces = parseTypeScriptToSchema(tsCode);
const rootInterface = interfaces['RootType'];

const diff = compareSchemas(mockSwaggerSchema, rootInterface, mockSwaggerJson as any, interfaces);

console.log('Added (Missing in TS):', diff.added);
console.log('Modified (Mismatch):', diff.modified);

const nestedMissing = diff.added.find(x => x.name === 'nestedData.missingChild');
const arrayMissing = diff.added.find(x => x.name === 'items.missingItemField');

if (nestedMissing && arrayMissing) {
    console.log('✅ Recursive Verification PASSED');
} else {
    console.log('❌ Recursive Verification FAILED');
    if (!nestedMissing) console.log('Failed to find nestedData.missingChild');
    if (!arrayMissing) console.log('Failed to find items.missingItemField');
}
