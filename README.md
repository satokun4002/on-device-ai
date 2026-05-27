# On-Device AI Framework

Lightweight, multi-platform AI framework featuring text generation, image recognition, and code generation using ONNX models.

## Features

- **Text Generation**: DistilGPT-2 based text generation
- **Image Recognition**: MobileNet v3 based image classification
- **Code Generation**: StarCoder-Small based code completion
- **Cross-Platform**: Web, Node.js, Electron, Mobile support

## Quick Start

```bash
# Install dependencies
npm install

# Download and optimize models
npm run download-models

# Development
npm run dev

# Build
npm run build
```

## Project Structure

```
on-device-ai/
├── src/                 # Core inference engine
│   ├── text-gen.ts      # Text generation module
│   ├── image-recognition.ts
│   └── code-gen.ts
├── models/              # Downloaded ONNX models (gitignored)
└── platforms/           # Platform-specific implementations
```

## License

MIT
