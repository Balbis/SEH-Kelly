/**
 * Image Rotation Handler
 * Randomly selects one image from multiple images on page refresh
 */
class ImageRotationHandler {
  constructor() {
    this.init();
  }

  init() {
    // Find all rotating image containers
    const rotatingContainers = document.querySelectorAll('.image-block__rotating-container');
    
    rotatingContainers.forEach(/** @param {Element} container */ container => {
      this.setupRotation(container);
    });
  }

  /**
   * @param {Element} container
   */
  setupRotation(container) {
    const images = container.querySelectorAll('.image-block__rotating-image');
    
    if (images.length === 0) return;

    // Hide all images initially
    images.forEach(/** @param {Element} img */ img => {
      img.classList.remove('active');
    });

    // Randomly select one image to show
    const randomIndex = Math.floor(Math.random() * images.length);
    const selectedImage = images[randomIndex];
    
    if (selectedImage) {
      selectedImage.classList.add('active');
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ImageRotationHandler();
});

// Also initialize for dynamic content (if using section rendering)
document.addEventListener('shopify:section:load', (event) => {
  // Check if target is an Element before using querySelectorAll
  if (event.target instanceof Element) {
    const rotatingContainers = event.target.querySelectorAll('.image-block__rotating-container');
    const handler = new ImageRotationHandler();
    
    rotatingContainers.forEach(/** @param {Element} container */ container => {
      handler.setupRotation(container);
    });
  }
}); 