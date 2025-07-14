/**
 * Image Resizer Utility
 * Provides bicubic interpolation for image resizing
 */

class Resize {
  /**
   * Resize an image using bicubic interpolation
   * @param {ImageData} imageData - The original image data
   * @param {number} targetWidth - The target width
   * @param {number} targetHeight - The target height
   * @returns {ImageData} - The resized image data
   */
  static resize(imageData, targetWidth, targetHeight) {
    const { width: srcWidth, height: srcHeight, data: srcData } = imageData;
    
    // Create a new ImageData for the resized image
    const destData = new Uint8ClampedArray(targetWidth * targetHeight * 4);
    
    // Calculate scaling factors
    const scaleX = srcWidth / targetWidth;
    const scaleY = srcHeight / targetHeight;
    
    // For each pixel in the target image
    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        // Get the corresponding position in the source image
        const srcX = x * scaleX;
        const srcY = y * scaleY;
        
        // Get the four surrounding pixels in the source image
        const x0 = Math.floor(srcX);
        const y0 = Math.floor(srcY);
        const x1 = Math.min(x0 + 1, srcWidth - 1);
        const y1 = Math.min(y0 + 1, srcHeight - 1);
        
        // Calculate the interpolation weights
        const wx = srcX - x0;
        const wy = srcY - y0;
        const w00 = (1 - wx) * (1 - wy);
        const w01 = (1 - wx) * wy;
        const w10 = wx * (1 - wy);
        const w11 = wx * wy;
        
        // For each color channel (R, G, B, A)
        for (let c = 0; c < 4; c++) {
          // Get the color values of the four surrounding pixels
          const p00 = srcData[(y0 * srcWidth + x0) * 4 + c];
          const p01 = srcData[(y1 * srcWidth + x0) * 4 + c];
          const p10 = srcData[(y0 * srcWidth + x1) * 4 + c];
          const p11 = srcData[(y1 * srcWidth + x1) * 4 + c];
          
          // Calculate the interpolated color value
          const value = Math.round(
            w00 * p00 + w01 * p01 + w10 * p10 + w11 * p11
          );
          
          // Set the color value in the destination image
          destData[(y * targetWidth + x) * 4 + c] = value;
        }
      }
    }
    
    // Return the resized image data
    return new ImageData(destData, targetWidth, targetHeight);
  }
  
  /**
   * Resize an image while maintaining aspect ratio
   * @param {ImageData} imageData - The original image data
   * @param {number} maxWidth - The maximum width
   * @param {number} maxHeight - The maximum height
   * @returns {ImageData} - The resized image data
   */
  static resizeKeepAspect(imageData, maxWidth, maxHeight) {
    const { width: srcWidth, height: srcHeight } = imageData;
    
    // Calculate the aspect ratio
    const aspectRatio = srcWidth / srcHeight;
    
    // Calculate the target dimensions while maintaining aspect ratio
    let targetWidth = maxWidth;
    let targetHeight = maxHeight;
    
    if (targetWidth / targetHeight > aspectRatio) {
      // Height is the limiting factor
      targetWidth = Math.round(targetHeight * aspectRatio);
    } else {
      // Width is the limiting factor
      targetHeight = Math.round(targetWidth / aspectRatio);
    }
    
    // Resize the image
    return this.resize(imageData, targetWidth, targetHeight);
  }
}
