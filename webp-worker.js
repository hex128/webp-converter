/**
 * WebP Conversion Worker
 * This worker handles the image conversion process in a separate thread
 */

importScripts('webp.js', 'resize.js');

let webp = null;
let initialized = false;
let api = null;

async function init() {
  try {
    console.log('Initializing WebP encoder in worker...');

    const moduleConfig = {
      onRuntimeInitialized() {
        initialized = true;
        api = {
          version: this.cwrap('version', 'number', []),
          create_buffer: this.cwrap('create_buffer', 'number', ['number', 'number']),
          destroy_buffer: this.cwrap('destroy_buffer', '', ['number']),
          encode: this.cwrap('encode', '', ['number', 'number', 'number', 'number']),
          free_result: this.cwrap('free_result', '', ['number']),
          get_result_pointer: this.cwrap('get_result_pointer', 'number', []),
          get_result_size: this.cwrap('get_result_size', 'number', []),
        };
        console.log(`libwebp v${api.version().toString(16)} initialized`);
        self.postMessage({ type: 'initialized' });
      }
    };

    createWebP(moduleConfig).then(Module => {
      webp = Module;
    });
  } catch (error) {
    console.error('Failed to initialize WebP encoder in worker:', error);
    self.postMessage({ 
      type: 'error', 
      message: 'Failed to initialize WebP encoder', 
      error: error.message 
    });
  }
}

// Process an image
async function processImage(data) {
  try {
    const { imageData, options, index } = data;
    const { quality, shouldResize, targetWidth, targetHeight, keepAspectRatio } = options;

    console.log(`Processing image ${index} in worker...`);

    // Create the ImageData object
    const imgData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );

    // Verify that the image data is valid
    if (!imgData.data || !imgData.data.buffer) {
      throw new Error('Invalid image data: data buffer is undefined or null');
    }

    // Resize the image if needed
    let processedImageData = imgData;

    if (shouldResize) {
      console.log(`Resizing image ${index} to ${targetWidth}x${targetHeight}...`);
      if (keepAspectRatio) {
        processedImageData = Resize.resizeKeepAspect(
          imgData,
          targetWidth,
          targetHeight
        );
      } else {
        processedImageData = Resize.resize(
          imgData,
          targetWidth,
          targetHeight
        );
      }
      console.log(`Image ${index} resized to ${processedImageData.width}x${processedImageData.height}`);
    }

    // Convert the image to WebP
    console.log(`Encoding image ${index} to WebP with quality ${quality}...`);

    const p = api.create_buffer(processedImageData.width, processedImageData.height);
    webp.HEAP8.set(new Uint8Array(processedImageData.data), p);
    api.encode(p, processedImageData.width, processedImageData.height, quality);
    const resultPointer = api.get_result_pointer();
    const resultSize = api.get_result_size();
    const resultView = new Uint8Array(
      webp.HEAP8.buffer,
      resultPointer,
      resultSize,
    );
    const webpData = new Uint8Array(resultView);
    api.free_result(resultPointer);
    console.log(`Image ${index} encoded to WebP (${webpData.byteLength} bytes)`);
    self.postMessage({
      type: 'result',
      index,
      webpData,
      width: processedImageData.width,
      height: processedImageData.height
    }, [webpData.buffer]);
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      index: data.index,
      message: 'Error processing image', 
      error: error.message 
    });
  }
}

// Listen for messages from the main thread
self.addEventListener('message', async e => {
  const { type, data } = e.data;

  switch (type) {
    case 'init':
      await init();
      break;

    case 'process':
      if (!initialized) {
        self.postMessage({ 
          type: 'error', 
          index: data.index,
          message: 'WebP encoder not initialized' 
        });
        return;
      }
      await processImage(data);
      break;

    default:
      self.postMessage({ 
        type: 'error', 
        message: `Unknown message type: ${type}` 
      });
  }
});
