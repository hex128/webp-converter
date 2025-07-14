/**
 * WebP Image Converter Application
 * A client-side web application for converting images to WebP format with resizing capabilities
 */

let conversionWorker = null;
let workerInitialized = false;

function initWorker() {
  if (conversionWorker) {
    return;
  }

  conversionWorker = new Worker('webp-worker.js');

  // Listen for messages from the worker
  conversionWorker.addEventListener('message', handleWorkerMessage);

  // Listen for errors from the worker
  conversionWorker.addEventListener('error', error => {
    console.error('Worker error:', error);
    alert('WebP worker error occurred. Please check the console for details.');
  });

  conversionWorker.postMessage({type: 'init'});
}

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const selectFilesBtn = document.getElementById('selectFiles');
const qualitySlider = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');
const resizeCheckbox = document.getElementById('resize');
const resizeOptions = document.getElementById('resizeOptions');
const widthInput = document.getElementById('width');
const heightInput = document.getElementById('height');
const maintainAspectRatio = document.getElementById('maintainAspectRatio');
const imagesContainer = document.getElementById('imagesContainer');
const convertBtn = document.getElementById('convertBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const loadingIndicator = document.getElementById('loadingIndicator');

// State
let images = [];
let convertedImages = [];

// Handle messages from the worker
function handleWorkerMessage(e) {
  const {type, index, webpData, error, message} = e.data;

  switch (type) {
    case 'initialized':
      workerInitialized = true;
      console.log('Conversion worker initialized');
      loadingIndicator.remove();
      break;

    case 'result':
      // Process the converted image
      processConvertedImage(index, webpData);
      break;

    case 'error':
      // Handle error
      console.error(`Worker error: ${message}`, error);

      if (index !== undefined) {
        const imageItem = document.querySelector(`.image-item[data-index="${index}"]`);
        if (imageItem) {
          const imageInfo = imageItem.querySelector('.image-info');
          imageInfo.innerHTML += `<div class="error">Error: ${message || error}</div>`;

          // Remove the loading indicator
          const loading = imageItem.querySelector('.loading');
          if (loading) {
            imageItem.removeChild(loading);
          }
        }
      }
      break;

    default:
      console.warn(`Unknown message type from worker: ${type}`);
  }
}

// Process a converted image from the worker
function processConvertedImage(index, webpData) {
  const imageData = images[index];
  const imageItem = document.querySelector(`.image-item[data-index="${index}"]`);

  if (!imageItem) {
    return;
  }

  try {
    // Create a blob from the WebP data
    const blob = new Blob([new Uint8Array(webpData)], {type: 'image/webp'});

    // Create a URL for the blob
    const url = URL.createObjectURL(blob);

    // Add the converted image to the list
    convertedImages.push({
      originalIndex: index,
      blob,
      url,
      size: blob.size,
      filename: imageData.file.name.replace(/\.[^/.]+$/, '.webp')
    });

    // Update the image info
    const imageInfo = imageItem.querySelector('.image-info');
    imageInfo.innerHTML = `
      <div>${imageData.file.name}</div>
      <div>Original: ${formatFileSize(imageData.originalSize)}</div>
      <div>WebP: ${formatFileSize(blob.size)} (${Math.round((blob.size / imageData.originalSize) * 100)}%)</div>
    `;

    // Add a download button
    const imageActions = document.createElement('div');
    imageActions.className = 'image-actions';
    imageActions.innerHTML = `
      <button class="download-btn" data-index="${convertedImages.length - 1}">Download</button>
    `;
    imageItem.appendChild(imageActions);

    // Add event listener to the download button
    imageActions.querySelector('.download-btn').addEventListener('click', e => {
      const btnIndex = parseInt(e.target.dataset.index, 10);
      downloadImage(btnIndex);
    });
  } catch (error) {
    console.error(`Error processing converted image ${index}:`, error);

    // Update the image info with the error
    const imageInfo = imageItem.querySelector('.image-info');
    imageInfo.innerHTML += `<div class="error">Error: ${error.message}</div>`;
  } finally {
    // Remove the loading indicator
    const loading = imageItem.querySelector('.loading');
    if (loading) {
      imageItem.removeChild(loading);
    }

    // Check if all images have been processed
    const pendingImages = document.querySelectorAll('.image-item .loading');
    if (pendingImages.length === 0) {
      // Enable the convert button and download all button
      convertBtn.disabled = false;
      downloadAllBtn.disabled = convertedImages.length === 0;
    }
  }
}

// Initialize the application
async function init() {
  try {
    // Initialize the worker
    initWorker();

    console.log('Application initialized');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    alert('Failed to initialize the WebP Image Converter. Please check the console for details and try reloading the page.');
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', init);

// File selection button
selectFilesBtn.addEventListener('click', () => fileInput.click());

// File input change
fileInput.addEventListener('change', e => handleFiles(e.target.files));

// Quality slider
function handleQualitySliderChange() {
  qualityValue.textContent = qualitySlider.value;
}
qualitySlider.addEventListener('input', handleQualitySliderChange);
handleQualitySliderChange();

// Resize checkbox
function handleResizeToggle() {
  resizeOptions.style.display = resizeCheckbox.target.checked ? 'block' : 'none';
}
resizeCheckbox.addEventListener('change', handleResizeToggle);
handleResizeToggle();

// Convert button
convertBtn.addEventListener('click', convertImages);

// Download all button
downloadAllBtn.addEventListener('click', downloadAllImages);

// Drag and drop events
dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('active');
});

dropZone.addEventListener('dragleave', () => dropZone.classList.remove('active'));

dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('active');

  if (e.dataTransfer.files.length > 0) {
    handleFiles(e.dataTransfer.files);
  }
});

/**
 * Handle the selected files
 * @param {FileList} files - The selected files
 */
function handleFiles(files) {
  if (files.length === 0) return;

  // Clear previous images if any
  images = [];
  convertedImages = [];
  imagesContainer.innerHTML = '';

  // Process each file
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) {
      console.warn(`Skipping non-image file: ${file.name}`);
      return;
    }

    const reader = new FileReader();

    reader.onload = e => {
      const image = new Image();

      image.onload = () => {
        // Create a canvas to get the image data
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Add the image to the list
        images.push({
          file,
          image,
          imageData,
          canvas,
          originalSize: file.size
        });

        // Display the image
        displayImage(images.length - 1);

        // Enable the convert button if there are images
        if (images.length > 0) {
          convertBtn.disabled = false;
        }
      };

      image.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Display an image in the images container
 * @param {number} index - The index of the image in the images array
 */
function displayImage(index) {
  const imageData = images[index];
  const {file, canvas} = imageData;

  const imageItem = document.createElement('div');
  imageItem.className = 'image-item';
  imageItem.dataset.index = index;

  // Create the image preview
  const img = document.createElement('img');
  img.src = canvas.toDataURL();
  imageItem.appendChild(img);

  // Create the image info
  const imageInfo = document.createElement('div');
  imageInfo.className = 'image-info';
  imageInfo.innerHTML = `
    <div>${file.name}</div>
    <div>Original: ${formatFileSize(file.size)}</div>
  `;
  imageItem.appendChild(imageInfo);

  // Add the image item to the container
  imagesContainer.appendChild(imageItem);
}

/**
 * Convert the images to WebP format using a web worker
 */
async function convertImages() {
  if (images.length === 0) {
    alert('Please select at least one image to convert.');
    return;
  }

  // Make sure the worker is initialized
  if (!conversionWorker) {
    initWorker();
  }

  // Wait for the worker to be initialized
  if (!workerInitialized) {
    alert('WebP Image Converter is initializing. Please wait a moment and try again.');
    return;
  }

  // Remove download buttons
  const downloadButtons = document.querySelectorAll('.image-actions');
  downloadButtons.forEach(btn => btn.remove());

  // Disable the convert button during conversion
  convertBtn.disabled = true;

  // Get the quality value
  const quality = parseInt(qualitySlider.value, 10);

  // Get the resize options
  const shouldResize = resizeCheckbox.checked;
  const targetWidth = parseInt(widthInput.value, 10);
  const targetHeight = parseInt(heightInput.value, 10);
  const keepAspectRatio = maintainAspectRatio.checked;

  // Clear previous converted images
  convertedImages = [];

  // Process each image using the worker
  for (let i = 0; i < images.length; i++) {
    const imageData = images[i];
    const imageItem = document.querySelector(`.image-item[data-index="${i}"]`);

    // Add loading indicator
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.innerHTML = '<div class="spinner"></div>';
    imageItem.appendChild(loading);

    // Prepare the image data for transfer to the worker
    // We need to clone the imageData because we can't transfer the original
    // (it's attached to the canvas)

    // Verify that the image data is valid
    if (!imageData.imageData || !imageData.imageData.data || !imageData.imageData.data.buffer) {
      console.error(`Invalid image data for image ${i}:`, imageData);

      // Update the image info with the error
      const imageInfo = imageItem.querySelector('.image-info');
      imageInfo.innerHTML += `<div class="error">Error: Invalid image data</div>`;

      // Remove the loading indicator
      imageItem.removeChild(loading);

      continue; // Skip this image
    }

    console.log(`Preparing image ${i} for worker (${imageData.imageData.width}x${imageData.imageData.height})...`);

    const transferableImageData = {
      data: imageData.imageData.data.buffer.slice(),
      width: imageData.imageData.width,
      height: imageData.imageData.height
    };

    // Send the image data to the worker for processing
    conversionWorker.postMessage({
      type: 'process',
      data: {
        imageData: transferableImageData,
        options: {
          quality,
          shouldResize,
          targetWidth,
          targetHeight,
          keepAspectRatio
        },
        index: i
      }
    }, [transferableImageData.data]);
  }
}

/**
 * Download a converted image
 * @param {number} index - The index of the image in the convertedImages array
 */
function downloadImage(index) {
  const convertedImage = convertedImages[index];

  // Create a download link
  const link = document.createElement('a');
  link.href = convertedImage.url;
  link.download = convertedImage.filename;

  // Trigger the download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download all converted images
 */
function downloadAllImages() {
  if (convertedImages.length === 0) {
    alert('No converted images to download.');
    return;
  }

  // Download each image
  convertedImages.forEach((_, index) => downloadImage(index));
}

/**
 * Format a file size in bytes to a human-readable string
 * @param {number} bytes - The file size in bytes
 * @returns {string} - The formatted file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
