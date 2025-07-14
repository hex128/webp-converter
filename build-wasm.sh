#!/bin/bash
set -e

# Build script for compiling libwebp to WebAssembly

# Check if Emscripten is installed
if ! command -v emcc &> /dev/null; then
    echo "Error: Emscripten (emcc) is not installed or not in PATH"
    echo "Please install Emscripten: https://emscripten.org/docs/getting_started/downloads.html"
    exit 1
fi

# Create build directory
mkdir -p build
cd build

# Clone libwebp if not already cloned
if [ ! -d "libwebp" ]; then
    echo "Cloning libwebp repository..."
    git clone https://github.com/webmproject/libwebp.git
    cd libwebp
else
    echo "Using existing libwebp repository..."
    cd libwebp
    git pull
fi

cd ../..

echo "Building WASM binary"

emcc -O3 -s WASM=1 -s EXPORTED_RUNTIME_METHODS='["cwrap", "HEAP8"]' \
    -s MODULARIZE=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s ASSERTIONS=1 \
    -s EXPORT_NAME="createWebP" \
    -o webp.js \
    -I build/libwebp \
    webp.c \
    build/libwebp/src/{dec,dsp,demux,enc,mux,utils}/*.c \
    build/libwebp/sharpyuv/*.c

echo "WASM build completed successfully!"
