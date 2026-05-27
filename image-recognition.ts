/**
 * Image Recognition Module
 * Implements MobileNetV3 based image classification
 */

import { AIModel, ModelConfig, InferenceInput, InferenceOutput } from './core.js';
import * as ort from 'onnxruntime-node';

export interface ImageInput {
  width: number;
  height: number;
  channels: number;
  data: Uint8Array | Float32Array;
}

export interface ClassificationResult {
  label: string;
  confidence: number;
}

export class ImageRecognitionModel implements AIModel {
  config: ModelConfig;
  private session: ort.InferenceSession | null = null;
  private labels: Map<number, string> = new Map();

  constructor(config: ModelConfig) {
    this.config = config;
    this.loadImageNetLabels();
  }

  private loadImageNetLabels(): void {
    // Top-1000 ImageNet labels (simplified subset)
    const commonLabels = [
      'tench', 'goldfish', 'great white shark', 'tiger shark', 'hammerhead shark',
      'stingray', 'barracuda', 'sea bass', 'largemouth bass', 'small mouth bass',
      // ... (would load full 1000-class dataset in production)
    ];

    commonLabels.forEach((label, idx) => {
      this.labels.set(idx, label);
    });
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

      console.log('✓ Image Recognition Model loaded');
    } catch (error) {
      console.error('Failed to load image recognition model:', error);
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
      throw new Error('Model not loaded');
    }

    try {
      const metadata = input.metadata as ImageInput;
      if (!metadata || !metadata.width || !metadata.height) {
        throw new Error('Invalid image metadata');
      }

      // Normalize image to [0, 1]
      const normalized = this.normalizeImage(input.data, metadata);

      // Create tensor with correct shape [1, channels, height, width] for ONNX
      const imageTensor = new ort.Tensor(
        'float32',
        normalized,
        [1, metadata.channels || 3, metadata.height, metadata.width]
      );

      // Run inference
      const feed: Record<string, ort.Tensor> = {
        'images': imageTensor
      };

      const output = await this.session.run(feed);
      const logits = output['logits'].data as Float32Array;

      // Get top-5 predictions
      const topResults = this.getTopPredictions(logits, 5);

      return {
        type: 'image-classification',
        data: JSON.stringify(topResults),
        metadata: {
          predictions: topResults,
          imageSize: { width: metadata.width, height: metadata.height }
        }
      };
    } catch (error) {
      console.error('Image recognition inference failed:', error);
      throw error;
    }
  }

  private normalizeImage(data: Uint8Array | Float32Array, metadata: ImageInput): Float32Array {
    const normalized = new Float32Array(metadata.width * metadata.height * metadata.channels);
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data.buffer);

    // ImageNet normalization constants
    const mean = [0.485, 0.456, 0.406];
    const std = [0.229, 0.224, 0.225];

    for (let i = 0; i < bytes.length; i++) {
      const channel = i % 3;
      const pixelValue = bytes[i] / 255.0; // Normalize to [0, 1]
      normalized[i] = (pixelValue - mean[channel]) / std[channel];
    }

    return normalized;
  }

  private getTopPredictions(logits: Float32Array, k: number): ClassificationResult[] {
    const predictions = Array.from(logits)
      .map((value, idx) => ({
        label: this.labels.get(idx) || `class_${idx}`,
        confidence: this.softmax(logits, idx),
        index: idx
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, k);

    return predictions;
  }

  private softmax(logits: Float32Array, idx: number): number {
    const exp = Math.exp(logits[idx]);
    const sum = Array.from(logits).reduce((acc, val) => acc + Math.exp(val), 0);
    return exp / sum;
  }
}
