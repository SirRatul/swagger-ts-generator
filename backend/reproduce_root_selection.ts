
import { parseTypeScriptToSchema } from './src/tsParser';

// 1. Mock Swagger Root Schema
const mockSwaggerResponse = {
    type: 'object',
    properties: {
        success: { type: 'boolean' },
        successMessage: { type: 'string' },
        data: { 
            type: 'object',
            properties: { /* nested content */ } 
        },
        errors: { type: 'object' },
        errorCode: { type: 'string' }
    }
};

// 2. Mock User TS Code (Multiple interfaces)
const tsCode = `
export type TypeApiResponseData = {
  data?: TypeSignIn;
  success?: boolean;
  successMessage?: string;
  errorMessage: string;
  errors?: any;
};

// This one has MANY properties, "tricking" the current heuristic
export type TypeAuthData = {
  userId: string;
  roleId: string;
  userLabel: string;
  agencyId: string;
  agencyName: string;
  deviceRef: string;
  tempAuthKey: string;
  deviceAffinityToken: string;
  accessToken: string;
  accessTokenExpiresUtc: Date;
  refreshToken: string;
  refreshTokenExpiresUtc: Date;
  isPersistentRefreshToken: boolean;
  clientSessionIdleTimeout: number;
  elevatedPermissionScopes: string[];
  tags: string[];
};

export type TypeSignIn = {
   authData: TypeAuthData;
}
`;

console.log('--- Testing Interface Selection Heuristic ---');

// Parse
const tsInterfaces = parseTypeScriptToSchema(tsCode);
const interfaceNames = Object.keys(tsInterfaces);
console.log('Found Interfaces:', interfaceNames);

// Current Heuristic: Max Properties
let selectedMaxProps = tsInterfaces[interfaceNames[0]];
for (const name of interfaceNames) {
    if (Object.keys(tsInterfaces[name].properties).length > Object.keys(selectedMaxProps.properties).length) {
    selectedMaxProps = tsInterfaces[name];
    }
}
console.log('Current Heuristic Selected:', selectedMaxProps.name);

// Proposed Heuristic: Max Overlap with Swagger Root
const swaggerKeys = Object.keys(mockSwaggerResponse.properties);
let selectedOverlap = tsInterfaces[interfaceNames[0]];
let maxOverlap = -1;

for (const name of interfaceNames) {
    const props = Object.keys(tsInterfaces[name].properties);
    const overlap = props.filter(p => swaggerKeys.includes(p)).length;
    console.log(`Interface ${name} overlap: ${overlap}`);
    
    if (overlap > maxOverlap) {
        maxOverlap = overlap;
        selectedOverlap = tsInterfaces[name];
    }
}
console.log('New Heuristic Selected:', selectedOverlap.name);

if (selectedMaxProps.name !== 'TypeApiResponseData' && selectedOverlap.name === 'TypeApiResponseData') {
    console.log('✅ Reproduction Successful: Current heuristic failed, New heuristic succeeded.');
} else {
    console.log('ℹ️ Result:', { current: selectedMaxProps.name, new: selectedOverlap.name });
}
