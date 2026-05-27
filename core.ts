/**
 * Core AI Inference Engine
 * Unified interface for ONNX model inference across platforms
 */

export interface ModelConfig {
  name: string;
  path: string;
  type: 'text-gen' | 'image-recognition' | 'code-gen';
  inputShape?: number[];
  outputShape?: number[];
}

export interface InferenceInput {
  type: string;
  data: Uint8Array | Float32Array | string;
  metadata?: Record<string, unknown>;
}

export interface InferenceOutput {
  type: string;
  data: Uint8Array | Float32Array | string;
  metadata?: Record<string, unknown>;
}

export interface AIModel {
  config: ModelConfig;
  load(): Promise<void>;
  unload(): void;
  infer(input: InferenceInput): Promise<InferenceOutput>;
}

export class AIEngine {
  private models: Map<string, AIModel> = new Map();

  async registerModel(model: AIModel): Promise<void> {
    console.log(`Registering model: ${model.config.name}`);
    await model.load();
    this.models.set(model.config.name, model);
  }

  async infer(modelName: string, input: InferenceInput): Promise<InferenceOutput> {
    const model = this.models.get(modelName);
    if (!model) {
      throw new Error(`Model not found: ${modelName}`);
    }
    return model.infer(input);
  }

  unloadModel(modelName: string): void {
    const model = this.models.get(modelName);
    if (model) {
      console.log(`Unloading model: ${modelName}`);
      model.unload();
      this.models.delete(modelName);
    }
  }

  listModels(): string[] {
    return Array.from(this.models.keys());
  }
}
