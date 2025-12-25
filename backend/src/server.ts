import express, { 
	Request, 
	Response 
} from 'express';
import cors from 'cors';
import 'dotenv/config';
import { fetchSwaggerJson } from './fetchSwagger';
import { parseEndpoints } from './parser';
import { generateTypeScript } from './generator';
import { 
	FetchSwaggerResponse, 
	GenerateRequest, 
	GenerateResponse 
} from './types';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
		status: 'ok', 
		message: 'Swagger TS Generator API is running' 
	});
});

// Fetch Swagger endpoints
app.post('/api/fetch-swagger', async (req: Request, res: Response) => {
  try {
    const { url, authHeader } = req.body;

    if (!url) {
      return res.status(400).json({ 
				error: 'Swagger URL is required'
			});
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ 
				error: 'Invalid URL format' 
			});
    }

    // Fetch and parse Swagger JSON
    const swaggerJson = await fetchSwaggerJson(url, authHeader);
    const endpoints = parseEndpoints(swaggerJson);

    const response: FetchSwaggerResponse = {
      endpoints,
      swaggerJson,
    };

    res.json(response);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message || 'Failed to fetch Swagger specification' 
    });
  }
});

// Generate TypeScript code
app.post('/api/generate', async (req: Request, res: Response) => {
  try {
    const { selectedEndpoints, allEndpoints, swaggerJson }: GenerateRequest = req.body;

    if (!selectedEndpoints || !Array.isArray(selectedEndpoints)) {
      return res.status(400).json({ 
				error: 'Selected endpoints array is required' 
			});
    }

    if (!allEndpoints || !Array.isArray(allEndpoints)) {
      return res.status(400).json({ 
				error: 'All endpoints array is required' 
			});
    }

    if (!swaggerJson) {
      return res.status(400).json({ 
				error: 'Swagger JSON is required' 
			});
    }

    // Filter endpoints based on selection
    const endpointsToGenerate = allEndpoints.filter(ep => 
      selectedEndpoints.includes(ep.id)
    );

    // Generate TypeScript code
    const typescript = generateTypeScript(endpointsToGenerate, swaggerJson);

    const response: GenerateResponse = {
      typescript,
    };

    res.json(response);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message || 'Failed to generate TypeScript code' 
    });
  }
});

// Start server
app.listen(PORT, () => {
  // Server is running
});
