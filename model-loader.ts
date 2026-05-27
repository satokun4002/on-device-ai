/**
 * ONNX Model Loader
 * Handles loading and caching ONNX models
 */

import * as ort from 'onnxruntime-node';
import { AIModel, ModelConfig, InferenceInput, InferenceOutput } from './core.js';

export class ONNXModelLoader implements AIModel {
  config: ModelConfig;
  private session: ort.InferenceSession | null = null;

  constructor(config: ModelConfig) {
    this.config = config;
  }

  async load(): Promise<void> {
    try {
      const options: ort.InferenceSession.SessionOptions = {
        executionProviders: ['cpu'],
        graphOptimizationLevel: 'all'
      };

      this.session = await ort.InferenceSession.create(
        this.config.path,
        options
      );

      console.log(`✓ Loaded model: ${this.config.name}`);
    } catch (error) {
      console.error(`Failed to load model ${this.config.name}:`, error);
      throw error;
    }
  }

  unload(): void {
    if (this.session) {
      this.session.release();
      this.session = null;
    }
  }

  async infer(input: InferenceInput): Promise<InferenceOutput> {
    if (!this.session) {
      throw new Error(`Model not loaded: ${this.config.name}`);
    }

    try {
      // Convert input to appropriate format
      const feed: Record<string, ort.Tensor> = {};
      const inputNames = this.session.inputNames;

      if (inputNames.length === 0) {
        throw new Error('No input nodes found in model');
      }

      // Simplified: assume first input takes the provided data
      const firstInput = inputNames[0];
      
      if (typeof input.data === 'string') {
        // For text inputs, convert to token IDs (simplified)
        const tokenIds = new Float32Array(input.data.split(' ').map(t => parseInt(t)));
        feed[firstInput] = new ort.Tensor('float32', tokenIds, [1, tokenIds.length]);
      } else {
        const shape = this.config.inputShape || [1, input.data.length];
        feed[firstInput] = new ort.Tensor('float32', input.data, shape);
      }

      // Run inference
      const output = await this.session.run(feed);

      // Extract output
      const outputKey = this.session.outputNames[0];
      const result = output[outputKey];

      return {
        type: input.type,
        data: result.data as Uint8Array | Float32Array,
        metadata: {
          shape: result.dims,
          dataType: result.type
        }
      };
    } catch (error) {
      console.error(`Inference failed for ${this.config.name}:`, error);
      throw error;
    }
  }
}

export class ModelManager {
  private modelCache: Map<string, ONNXModelLoader> = new Map();

  async loadModel(config: ModelConfig): Promise<ONNXModelLoader> {
    if (this.modelCache.has(config.name)) {
      return this.modelCache.get(config.name)!;
    }

    const loader = new ONNXModelLoader(config);
    await loader.load();
    this.modelCache.set(config.name, loader);

    return loader;
  }

  getModel(name: string): ONNXModelLoader | undefined {
    return this.modelCache.get(name);
  }

  unloadModel(name: string): void {
    const model = this.modelCache.get(name);
    if (model) {
      model.unload();
      this.modelCache.delete(name);
    }
  }

  unloadAll(): void {
    this.modelCache.forEach(model => model.unload());
    this.modelCache.clear();
  }
}
