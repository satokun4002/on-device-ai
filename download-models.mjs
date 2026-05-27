#!/usr/bin/env node

/**
 * Model Download & Optimization Script
 * Downloads lightweight ONNX models from HuggingFace Hub
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelsDir = path.join(__dirname, 'models');

interface ModelInfo {
  name: string;
  url: string;
  filename: string;
  size: string;
  description: string;
}

const MODELS = [
  {
    name: 'DistilGPT-2',
    url: 'https://huggingface.co/distilgpt2/resolve/main/model.onnx',
    filename: 'distilgpt2.onnx',
    size: '345 MB',
    description: 'Lightweight text generation model'
  },
  {
    name: 'MobileNetV3',
    url: 'https://github.com/onnx/models/raw/main/vision/classification/mobilenet/mobilenetv3-small.onnx',
    filename: 'mobilenetv3.onnx',
    size: '22 MB',
    description: 'Efficient image classification model'
  },
  {
    name: 'StarCoder-Small',
    url: 'https://huggingface.co/bigcode/starcoder-small/resolve/main/onnx/model.onnx',
    filename: 'starcoder-small.onnx',
    size: '1.3 GB',
    description: 'Code generation model (quantized)'
  }
];

function ensureModelsDir() {
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
    console.log(`✓ Created models directory: ${modelsDir}`);
  }
}

async function downloadModel(modelInfo) {
  const filePath = path.join(modelsDir, modelInfo.filename);

  // Check if already exists
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✓ Already exists: ${modelInfo.filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    return;
  }

  console.log(`⏳ Downloading: ${modelInfo.name} (${modelInfo.size})...`);
  console.log(`   ${modelInfo.description}`);

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);

    https.get(modelInfo.url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          https.get(redirectUrl, (redirectResponse) => {
            redirectResponse.pipe(file);
            file.on('finish', () => {
              file.close();
              console.log(`✓ Downloaded: ${modelInfo.filename}`);
              resolve();
            });
          }).on('error', reject);
        }
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✓ Downloaded: ${modelInfo.filename}`);
          resolve();
        });
      }
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
}

async function createModelConfig() {
  const configPath = path.join(modelsDir, 'models.json');

  const config = {
    models: [
      {
        name: 'distilgpt2',
        type: 'text-generation',
        path: './models/distilgpt2.onnx',
        inputShape: [1, 512],
        outputShape: [1, 512, 50257],
        vocabSize: 50257
      },
      {
        name: 'mobilenetv3',
        type: 'image-classification',
        path: './models/mobilenetv3.onnx',
        inputShape: [1, 3, 224, 224],
        outputShape: [1, 1000],
        numClasses: 1000
      },
      {
        name: 'starcoder-small',
        type: 'code-generation',
        path: './models/starcoder-small.onnx',
        inputShape: [1, 2048],
        outputShape: [1, 2048, 50256],
        vocabSize: 50256
      }
    ],
    metadata: {
      framework: 'ONNX Runtime',
      createdAt: new Date().toISOString(),
      version: '1.0.0'
    }
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`\n✓ Created model configuration: models.json`);
}

async function main() {
  console.log('📥 On-Device AI Model Download Manager\n');

  ensureModelsDir();

  console.log(`📦 Available Models (${MODELS.length}):\n`);
  MODELS.forEach((m, i) => {
    console.log(`${i + 1}. ${m.name.padEnd(20)} - ${m.description}`);
  });

  console.log('\n⚠️  Note: Some models are large. Ensure sufficient disk space.\n');

  try {
    for (const modelInfo of MODELS) {
      try {
        await downloadModel(modelInfo);
      } catch (err) {
        console.warn(`⚠️  Failed to download ${modelInfo.name}: ${err}`);
      }
    }

    await createModelConfig();

    console.log('\n✨ Model setup complete!');
    console.log('\nNext steps:');
    console.log('1. Verify models in ./models/');
    console.log('2. Run: npm run build');
    console.log('3. Run: npm start');
  } catch (error) {
    console.error('Error during model download:', error);
    process.exit(1);
  }
}

main();
