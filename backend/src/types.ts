export interface Endpoint {
  id: string;
  method: string;
  path: string;
  summary?: string;
  requestSchema?: any;
  responseSchema?: any;
}

export interface SwaggerJson {
  openapi?: string;
  swagger?: string;
  info: any;
  paths: {
    [path: string]: {
      [method: string]: {
        summary?: string;
        description?: string;
        requestBody?: any;
        responses?: any;
        parameters?: any[];
      };
    };
  };
  components?: {
    schemas?: {
      [key: string]: any;
    };
  };
  definitions?: {
    [key: string]: any;
  };
}

export interface GenerateRequest {
  selectedEndpoints: string[];
  allEndpoints: Endpoint[];
  swaggerJson: SwaggerJson;
}

export interface FetchSwaggerResponse {
  endpoints: Endpoint[];
  swaggerJson: SwaggerJson;
}

export interface GenerateResponse {
  typescript: string;
}

export interface ComparisonError {
  path: string;
  type: 'missing' | 'type_mismatch' | 'extra' | 'invalid_value';
  expected?: any;
  actual?: any;
  message: string;
}

export interface ComparisonResult {
  isValid: boolean;
  errors: ComparisonError[];
  summary: {
    totalErrors: number;
    missingCount: number;
    typeMismatchCount: number;
    extraCount: number;
  };
}

export interface CompareRequest {
  endpointId: string;
  userResponse: any;
  swaggerJson: SwaggerJson;
  endpoints: Endpoint[];
}

export interface CompareResponse {
  comparison: ComparisonResult;
}

