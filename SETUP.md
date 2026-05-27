# SETUP GUIDE

## Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **Disk Space**: Minimum 2GB for all models
- **RAM**: 4GB+ recommended

## Installation

### 1. Install Dependencies

```bash
npm install
```

This installs:
- **onnxruntime-node**: ONNX Runtime for Node.js
- **TypeScript**: For development
- **Supporting tools**: Jest, ts-node, etc.

### 2. Download Models

```bash
npm run download-models
```

Downloads three pre-trained models:
- **DistilGPT-2** (345 MB) - Text generation
- **MobileNetV3** (22 MB) - Image recognition
- **StarCoder-Small** (1.3 GB) - Code generation

⚠️ **Note**: Total download size ~1.7 GB. This may take several minutes depending on connection speed.

### 3. Build TypeScript

```bash
npm run build
```

Compiles TypeScript files to JavaScript.

### 4. Run the Framework

```bash
npm start
```

Initializes the AI framework and displays system information.

## Development Workflow

### Watch Mode

```bash
npm run dev
```

### Running Tests

```bash
npm test
```

## License

MIT
