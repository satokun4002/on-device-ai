/**
 * Code Generation Module
 * Implements StarCoder-Small based code generation
 */

import { AIModel, ModelConfig, InferenceInput, InferenceOutput } from './core.js';
import * as ort from 'onnxruntime-node';

export interface CodeGenerationConfig {
  maxNewTokens?: number;
  temperature?: number;
  topP?: number;
  language?: string;
}

export class CodeGenerationModel implements AIModel {
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

      console.log('✓ Code Generation Model loaded');
    } catch (error) {
      console.error('Failed to load code generation model:', error);
      throw error;
    }
  }

  unload(): void {
    if (this.session) {
      this.session.release();
      this.session = null;
    }
  }

  async infer(input: InferenceInput, config: CodeGenerationConfig = {}): Promise<InferenceOutput> {
    if (!this.session) {
      throw new Error('Model not loaded');
    }

    const {
      maxNewTokens = 256,
      temperature = 0.8,
      topP = 0.95,
      language = 'javascript'
    } = config;

    try {
      const prompt = typeof input.data === 'string' ? input.data : '';
      
      // Tokenize input (simplified)
      const tokens = this.tokenizeCode(prompt);
      const inputIds = new Int64Array([0, ...tokens.slice(0, 1024)]); // BOS token + prompt

      // Run inference
      const feed: Record<string, ort.Tensor> = {
        'input_ids': new ort.Tensor('int64', inputIds, [1, inputIds.length])
      };

      const output = await this.session.run(feed);
      const logits = output['logits'].data as Float32Array;

      // Sample next token with top-p (nucleus) sampling
      const nextTokenId = this.sampleTopP(logits, topP, temperature);
      const generatedCode = prompt + this.decodeToken(nextTokenId);

      return {
        type: 'code',
        data: generatedCode,
        metadata: {
          language,
          temperature,
          topP,
          maxNewTokens,
          inputLength: tokens.length,
          generatedTokenId: nextTokenId
        }
      };
    } catch (error) {
      console.error('Code generation inference failed:', error);
      throw error;
    }
  }

  private tokenizeCode(code: string): number[] {
    // Simplified code tokenization
    // In production, use proper BPE tokenizer from StarCoder
    const tokens: number[] = [];
    let i = 0;

    while (i < code.length) {
      const char = code[i];
      let hash = 0;

      // Multi-byte token handling
      if (char === ' ') {
        tokens.push(220); // Space token
        i++;
      } else if (/[a-zA-Z_]/.test(char)) {
        // Identifier
        let word = '';
        while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) {
          word += code[i++];
        }
        tokens.push(this.hashToken(word));
      } else if (/[0-9]/.test(char)) {
        // Number
        let num = '';
        while (i < code.length && /[0-9.]/.test(code[i])) {
          num += code[i++];
        }
        tokens.push(this.hashToken(num));
      } else {
        // Operator or punctuation
        tokens.push(this.hashToken(char));
        i++;
      }
    }

    return tokens;
  }

  private hashToken(token: string): number {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = ((hash << 5) - hash) + token.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 50256; // StarCoder vocab size
  }

  private decodeToken(tokenId: number): string {
    // Placeholder - in production, use proper BPE decoder
    const charCodes = [
      32, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110,
      111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122
    ];
    return String.fromCharCode(charCodes[tokenId % charCodes.length]);
  }

  private sampleTopP(logits: Float32Array, topP: number, temperature: number): number {
    // Nucleus (top-p) sampling
    const scaled = new Float32Array(logits.length);
    let maxLogit = Math.max(...Array.from(logits));

    for (let i = 0; i < logits.length; i++) {
      scaled[i] = Math.exp((logits[i] - maxLogit) / temperature);
    }

    const sum = Array.from(scaled).reduce((a, b) => a + b, 0);
    const probs = Array.from(scaled).map(x => x / sum);

    const indices = Array.from({ length: probs.length }, (_, i) => i)
      .sort((a, b) => probs[b] - probs[a]);

    let cumProb = 0;
    let topPIndices: number[] = [];

    for (const idx of indices) {
      cumProb += probs[idx];
      topPIndices.push(idx);
      if (cumProb >= topP) break;
    }

    return topPIndices[Math.floor(Math.random() * topPIndices.length)];
  }
}
