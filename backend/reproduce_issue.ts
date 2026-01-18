
import { parseTypeScriptToSchema } from './src/tsParser';
import { compareSchemas } from './src/schemaComparator';

const mockSwaggerJson = {};

// Simulate the scenario reported by user
const mockSwaggerSchema = {
    type: 'object',
    required: ['userName', 'password'], // deviceAffinityToken, clientType, appVersion are OPTIONAL
    properties: {
        userName: { type: 'string' },
        password: { type: 'string' },
        deviceAffinityToken: { type: 'string' },
        clientType: { type: 'string' },
        appVersion: { type: 'string' },
    }
};

const tsCode = `
export type TypeSignInPayload = {
  userName: string;
  password: string;
  deviceAffinityToken: string | null;
  // clientType: string | null;
  // firebaseRef: string | null;
  // appVersion: string | null;
};
`;

console.log('--- Testing User Scenario ---');
const parsed = parseTypeScriptToSchema(tsCode)['TypeSignInPayload'];
const diff = compareSchemas(mockSwaggerSchema, parsed, mockSwaggerJson as any);

console.log('Missing in TS (Should mention type is optional/null):', diff.added);
console.log('Mismatch (User says deviceAffinityToken should match or show null):', diff.modified);

// Verification Conditions
const issue1Reproduced = diff.added.find(x => x.name === 'clientType' && x.type === 'string'); // User wants validation that it doesn't show null
const issue2Reproduced = diff.modified.find(x => x.name === 'deviceAffinityToken' && x.expectedType === 'string' && x.actualType.includes('null'));

if (issue1Reproduced) console.log('✅ Issue 1 Reproduced: Missing field shows strict "string" type');
if (issue2Reproduced) console.log('✅ Issue 2 Reproduced: Mismatch "string | null" vs "string"');
