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
