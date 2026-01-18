import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Endpoint {
  id: string;
  method: string;
  path: string;
  summary?: string;
  requestSchema?: any;
  responseSchema?: any;
}

export interface FetchSwaggerResponse {
  endpoints: Endpoint[];
  swaggerJson: any;
}


export interface GenerateResponse {
  typescript: string;
}

export interface DiffItem {
  name: string;
  type?: string; 
  description?: string;
  expectedType?: string;
  actualType?: string;
}

export interface ComparisonResult {
  added: { name: string; type: string; description?: string }[];
  removed: { name: string; type: string }[];
  modified: { name: string; expectedType: string; actualType: string }[];
}

export interface CompareSwaggerVsTsResponse {
  comparison: ComparisonResult;
  selectedInterfaceName: string;
}

export async function fetchSwaggerEndpoints(url: string, authHeader?: string): Promise<FetchSwaggerResponse> {
  const response = await apiClient.post<FetchSwaggerResponse>('/api/fetch-swagger', { url, authHeader });
  return response.data;
}

export async function generateTypeScript(
  selectedEndpoints: string[],
  allEndpoints: Endpoint[],
  swaggerJson: any
): Promise<GenerateResponse> {
  const response = await apiClient.post<GenerateResponse>('/api/generate', {
    selectedEndpoints,
    allEndpoints,
    swaggerJson,
  });
  return response.data;
}



export async function compareSwaggerVsTs(
  endpointId: string,
  tsCode: string,
  swaggerJson: any,
  endpoints: Endpoint[],
  comparisonType: 'request' | 'response' = 'response'
): Promise<CompareSwaggerVsTsResponse> {
  const response = await apiClient.post<CompareSwaggerVsTsResponse>('/api/compare-swagger-vs-ts', {
    endpointId,
    tsCode,
    swaggerJson,
    endpoints,
    comparisonType,
  });
  return response.data;
}
