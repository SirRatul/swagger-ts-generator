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
