# WebP Image Converter

A client-side web application for converting images to WebP format with resizing capabilities. This application runs entirely in the browser without sending your images to any server.

## Features

- Convert images to WebP format using libwebp with WebAssembly
- Support for multiple image conversions at once
- Drag and drop interface for easy file selection
- Adjustable quality settings for WebP conversion
- Bicubic image resizing with aspect ratio maintenance option
- No server-side processing — all conversion happens in your browser
- Download individual or all converted images

## Live Demo

Visit [WebP Image Converter](https://hex128.github.io/webp-converter/) to try it out.

## How to Use

1. **Select Images**: Drag and drop images onto the drop zone or click the "Select Files" button to choose images from your device.
2. **Adjust Settings**:
   - Set the quality level for the WebP conversion (0-100)
   - Enable resizing if needed and set the desired dimensions
   - Choose whether to maintain the aspect ratio during resizing
3. **Convert**: Click the "Convert to WebP" button to start the conversion process.
4. **Download**: After conversion, you can download individual images or all converted images at once.

## Technical Details

This application uses:

- **libwebp**: Google's WebP encoding library compiled to WebAssembly
- **WebAssembly**: For high-performance image processing in the browser
- **Emscripten**: To compile C/C++ code (libwebp) to WebAssembly
- **Bicubic Interpolation**: For high-quality image resizing
- **Modern JavaScript**: ES6+ features for clean, maintainable code
- **GitHub Actions**: For continuous integration and deployment (including automated WebAssembly compilation)
- **GitHub Pages**: For hosting the application

### WebAssembly Integration

The application uses a custom build process to compile libwebp to WebAssembly:

1. The source code of libwebp is compiled to WebAssembly using Emscripten
2. The WebAssembly binary is loaded by the application at runtime
3. The application communicates with the WebAssembly module to encode images to WebP format

This approach provides several benefits:
- High performance image processing directly in the browser
- No need for server-side processing
- Small file sizes for faster downloads
- Cross-platform compatibility

## Local Development

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- Emscripten (for WebAssembly compilation)

#### Installing Emscripten

Emscripten is required to compile libwebp to WebAssembly. Follow these steps to install Emscripten:

1. Clone the Emscripten repository:
   ```
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   ```

2. Install and activate the latest version:
   ```
   ./emsdk install latest
   ./emsdk activate latest
   ```

3. Set up the environment variables:
   ```
   source ./emsdk_env.sh  # On Linux/macOS
   ```

For more detailed instructions, visit the [Emscripten Installation Guide](https://emscripten.org/docs/getting_started/downloads.html).

### Building

#### Building the WebAssembly Module

The application uses a WebAssembly module compiled from libwebp. The build process automatically compiles libwebp to WebAssembly using Emscripten. To build only the WebAssembly module:

```
npm run build:wasm
```

This script clones the libwebp repository and builds a WebAssembly module with the necessary exported functions

#### Building the Entire Application

To build the entire application for production (including the WebAssembly module):

```
npm run build
```

This command first builds the WebAssembly module and then builds the rest of the application. The built files will be in the `dist` directory.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the LICENSE file for details.

## Acknowledgments

- [libwebp](https://developers.google.com/speed/webp/docs/using) — WebP encoding library
- [WebAssembly](https://webassembly.org/) — For enabling high-performance web applications
