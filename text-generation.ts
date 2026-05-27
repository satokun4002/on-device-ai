/**
 * Text Generation Module
 * Implements DistilGPT-2 based text generation
 */

import { AIModel, ModelConfig, InferenceInput, InferenceOutput } from './core.js';
import * as ort from 'onnxruntime-node';

const VOCAB_SIZE = 50257; // GPT-2 vocab size
const MAX_LENGTH = 512;

export interface GenerationConfig {
  maxLength?: number;
  temperature?: number;
  topK?: number;
  topP?: number;
  doSample?: boolean;
}

export class TextGenerationModel implements AIModel {
  config: ModelConfig;
  private session: ort.InferenceSession | null = null;
  private tokenizer: Map<string, number> = new Map();

  constructor(config: ModelConfig) {
    this.config = config;
    this.initializeTokenizer();
  }

  private initializeTokenizer(): void {
    // Simplified tokenizer - would use proper BPE tokenizer in production
    this.tokenizer.set('[PAD]', 0);
    this.tokenizer.set('[UNK]', 1);
    this.tokenizer.set('[BOS]', 2);
    this.tokenizer.set('[EOS]', 3);
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

      console.log('✓ Text Generation Model loaded');
    } catch (error) {
      console.error('Failed to load text generation model:', error);
      throw error;
    }
  }

  unload(): void {
    if (this.session) {
      this.session.release();
      this.session = null;
    }
  }

  async infer(input: InferenceInput, config: GenerationConfig = {}): Promise<InferenceOutput> {
    if (!this.session) {
      throw new Error('Model not loaded');
    }

    const {
      maxLength = Math.min(config.maxLength || 100, MAX_LENGTH),
      temperature = 1.0,
      topK = 50,
      doSample = true
    } = config;

    try {
      const prompt = typeof input.data === 'string' ? input.data : '';
      
      // Simple tokenization (in production, use proper BPE)
      const tokens = this.simpleTokenize(prompt);
      const inputIds = new Int64Array([2, ...tokens.slice(0, MAX_LENGTH - 1)]); // Add BOS token

      // Run inference
      const feed: Record<string, ort.Tensor> = {
        'input_ids': new ort.Tensor('int64', inputIds, [1, inputIds.length])
      };

      const output = await this.session.run(feed);
      const logits = output['logits'].data as Float32Array;

      // Simple sampling (argmax for greedy, random sampling for doSample)
      const generatedToken = doSample
        ? this.sampleTopK(logits, topK, temperature)
        : this.argmax(logits);

      const generatedText = prompt + ` [token_${generatedToken}]`;

      return {
        type: 'text',
        data: generatedText,
        metadata: {
          inputLength: tokens.length,
          temperature,
          topK,
          generatedToken
        }
      };
    } catch (error) {
      console.error('Text generation inference failed:', error);
      throw error;
    }
  }

  private simpleTokenize(text: string): number[] {
    // Placeholder tokenizer - use proper BPE in production
    return text.split(' ').map(word => {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = ((hash << 5) - hash) + word.charCodeAt(i);
        hash = hash & hash;
      }
      return Math.abs(hash) % VOCAB_SIZE;
    });
  }

  private argmax(arr: Float32Array): number {
    let max = arr[0];
    let maxIndex = 0;
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] > max) {
        max = arr[i];
        maxIndex = i;
      }
    }
    return maxIndex;
  }

  private sampleTopK(logits: Float32Array, k: number, temperature: number): number {
    // Simplified top-k sampling
    const scaled = new Float32Array(logits.length);
    for (let i = 0; i < logits.length; i++) {
      scaled[i] = logits[i] / temperature;
    }

    const topIndices = Array.from({ length: logits.length }, (_, i) => i)
      .sort((a, b) => scaled[b] - scaled[a])
      .slice(0, k);

    const randomIndex = Math.floor(Math.random() * topIndices.length);
    return topIndices[randomIndex];
  }
}
