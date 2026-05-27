/**
 * Node.js REST API Server
 * Provides HTTP endpoints for AI inference
 */

import { AIEngine } from './core.js';
import { TextGenerationModel } from './text-generation.js';
import { ImageRecognitionModel } from './image-recognition.js';
import { CodeGenerationModel } from './code-generation.js';

const PORT = process.env.API_PORT ? parseInt(process.env.API_PORT) : 3000;

const engine = new AIEngine();

// Mock Express-like server (for demonstration)
const routes: Record<string, (data: unknown) => Promise<unknown>> = {
  'POST /api/text-generate': async (data: unknown) => {
    const { text = 'Hello' } = data as { text?: string };
    console.log(`Generating text from: "${text}"`);
    
    return {
      success: true,
      input: text,
      output: `${text} [generated tokens...]`,
      timestamp: new Date().toISOString()
    };
  },

  'POST /api/image-classify': async (data: unknown) => {
    const { imageUrl = '' } = data as { imageUrl?: string };
    console.log(`Classifying image: ${imageUrl}`);

    return {
      success: true,
      imageUrl,
      predictions: [
        { label: 'dog', confidence: 0.95 },
        { label: 'puppy', confidence: 0.89 },
        { label: 'animal', confidence: 0.87 }
      ],
      timestamp: new Date().toISOString()
    };
  },

  'POST /api/code-generate': async (data: unknown) => {
    const { code = '', language = 'javascript' } = data as { code?: string; language?: string };
    console.log(`Generating code (${language}): "${code}"`);

    return {
      success: true,
      input: code,
      language,
      output: `${code} [generated code...]`,
      timestamp: new Date().toISOString()
    };
  },

  'GET /api/models': async () => {
    return {
      success: true,
      models: [
        {
          name: 'distilgpt2',
          type: 'text-generation',
          status: 'configured',
          endpoint: '/api/text-generate'
        },
        {
          name: 'mobilenetv3',
          type: 'image-classification',
          status: 'configured',
          endpoint: '/api/image-classify'
        },
        {
          name: 'starcoder-small',
          type: 'code-generation',
          status: 'configured',
          endpoint: '/api/code-generate'
        }
      ],
      timestamp: new Date().toISOString()
    };
  },

  'GET /api/health': async () => {
    return {
      status: 'healthy',
      service: 'On-Device AI API',
      version: '0.1.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }
};

async function handleRequest(method: string, path: string, body?: unknown): Promise<unknown> {
  const route = `${method} ${path}`;
  const handler = routes[route];

  if (!handler) {
    return {
      success: false,
      error: 'Route not found',
      path,
      timestamp: new Date().toISOString()
    };
  }

  try {
    return await handler(body);
  } catch (error) {
    console.error(`Error handling ${route}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      path,
      timestamp: new Date().toISOString()
    };
  }
}

async function startServer(): Promise<void> {
  console.log('🚀 On-Device AI API Server\n');
  console.log(`📍 Server configured for port: ${PORT}`);
  console.log(`🏠 Base URL: http://localhost:${PORT}\n`);

  // Display available endpoints
  console.log('📌 Available Endpoints:\n');
  Object.keys(routes).forEach(route => {
    console.log(`   ${route}`);
  });

  // Simulate server startup
  console.log(`\n✨ Server ready! (Demonstration mode - requires HTTP framework)\n`);

  // Example requests
  console.log('📝 Example Requests:\n');
  
  console.log('1. Text Generation:');
  console.log('   POST /api/text-generate');
  console.log('   { "text": "Once upon a time" }\n');

  console.log('2. Image Classification:');
  console.log('   POST /api/image-classify');
  console.log('   { "imageUrl": "https://example.com/image.jpg" }\n');

  console.log('3. Code Generation:');
  console.log('   POST /api/code-generate');
  console.log('   { "code": "function hello", "language": "javascript" }\n');

  console.log('4. Get Available Models:');
  console.log('   GET /api/models\n');

  console.log('5. Health Check:');
  console.log('   GET /api/health\n');

  // Test a few endpoints
  console.log('🧪 Testing Endpoints:\n');

  const testRequests = [
    { method: 'GET', path: '/api/health' },
    { method: 'GET', path: '/api/models' },
    { method: 'POST', path: '/api/text-generate', body: { text: 'Hello world' } },
    { method: 'POST', path: '/api/code-generate', body: { code: 'console.log', language: 'javascript' } }
  ];

  for (const req of testRequests) {
    const result = await handleRequest(req.method, req.path, req.body);
    console.log(`${req.method} ${req.path}`);
    console.log(`✓ Response: ${JSON.stringify(result, null, 2)}\n`);
  }

  console.log('ℹ️  Note: This is a demonstration mode.');
  console.log('For production, integrate with Express.js or similar HTTP framework.\n');
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
