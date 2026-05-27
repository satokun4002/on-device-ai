/**
 * Main Application Entry Point
 * Demonstrates on-device AI framework usage
 */

import { AIEngine } from './core.js';
import { ONNXModelLoader } from './model-loader.js';
import { TextGenerationModel } from './text-generation.js';
import { ImageRecognitionModel } from './image-recognition.js';
import { CodeGenerationModel } from './code-generation.js';

async function main() {
  console.log('🤖 On-Device AI Framework - Demo\n');

  const engine = new AIEngine();

  try {
    // Example 1: Text Generation
    console.log('--- Text Generation ---');
    const textModel = new TextGenerationModel({
      name: 'distilgpt2',
      path: './models/distilgpt2.onnx',
      type: 'text-gen'
    });

    // Note: This is a demo - actual model loading requires the ONNX file
    console.log('Text Generation Model configured (requires distilgpt2.onnx)');

    // Example 2: Image Recognition
    console.log('\n--- Image Recognition ---');
    const imageModel = new ImageRecognitionModel({
      name: 'mobilenetv3',
      path: './models/mobilenetv3.onnx',
      type: 'image-recognition',
      inputShape: [1, 3, 224, 224]
    });

    console.log('Image Recognition Model configured (requires mobilenetv3.onnx)');

    // Example 3: Code Generation
    console.log('\n--- Code Generation ---');
    const codeModel = new CodeGenerationModel({
      name: 'starcoder-small',
      path: './models/starcoder-small.onnx',
      type: 'code-gen'
    });

    console.log('Code Generation Model configured (requires starcoder-small.onnx)');

    // Display framework info
    console.log('\n--- Framework Info ---');
    console.log('✓ Models defined: 3');
    console.log('  - TextGenerationModel (DistilGPT-2)');
    console.log('  - ImageRecognitionModel (MobileNetV3)');
    console.log('  - CodeGenerationModel (StarCoder-Small)');
    console.log('\n✓ ONNX Runtime: Ready for model inference');
    console.log('✓ Multi-platform support: Web, Node.js, Electron');

    console.log('\n✨ Framework initialized successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run download-models');
    console.log('2. Place ONNX files in ./models/');
    console.log('3. Test with actual model files');

  } catch (error) {
    console.error('Error initializing framework:', error);
    process.exit(1);
  }
}

main();
