import { Component } from '@theme/component';
import {
  supportsViewTransitions,
  startViewTransition,
  onAnimationEnd,
  preloadImage,
} from '@theme/utilities';
import { DialogCloseEvent } from '@theme/dialog';

const highResImagesLoaded = new Set();
let sharedDialog = null;
let initialized = false;

class SectionImageZoomDialog extends Component {
  requiredRefs = ['dialog', 'media'];

  #sourceImage = null;

  async open(sourceImage, event) {
    event.preventDefault();

    this.#sourceImage = sourceImage;
    const { dialog, media } = this.refs;

    if (!media) return;

    this.#updateImageInDialog(sourceImage);

    const open = () => {
      dialog.showModal();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          dialog.classList.add('dialog--open');
          media.scrollIntoView({ behavior: 'instant' });
          this.#loadHighResolutionImage(media);
        });
      });
    };

    if (!supportsViewTransitions || !sourceImage || !media) {
      open();
      return;
    }

    const transitionName = `section-zoom-item`;
    sourceImage.style.setProperty('view-transition-name', transitionName);

    await startViewTransition(() => {
      open();
      sourceImage.style.removeProperty('view-transition-name');
      media.style.setProperty('view-transition-name', transitionName);
    });

    setTimeout(() => {
      media.style.removeProperty('view-transition-name');
    }, 400);
  }

  #updateImageInDialog(sourceImage) {
    const { media } = this.refs;
    if (!media) return;

    const dragZoomWrapper = media.querySelector('drag-zoom-wrapper');
    if (!dragZoomWrapper) return;

    const existingImg = dragZoomWrapper.querySelector('img');
    if (existingImg) {
      existingImg.remove();
    }

    const newImg = sourceImage.cloneNode(true);
    newImg.style.maxWidth = '100%';
    newImg.style.maxHeight = '100%';
    newImg.style.objectFit = 'contain';

    dragZoomWrapper.appendChild(newImg);
  }

  #loadHighResolutionImage(mediaContainer) {
    const image = mediaContainer.querySelector('img');
    if (!image || !(image instanceof HTMLImageElement)) return false;

    const highResolutionUrl = image.getAttribute('data_max_resolution') || image.src;
    if (!highResolutionUrl || highResImagesLoaded.has(highResolutionUrl)) return false;

    const currentSrc = image.src;
    if (highResolutionUrl !== currentSrc) {
      preloadImage(highResolutionUrl);

      const newImage = new Image();
      newImage.className = image.className;
      newImage.alt = image.alt;
      newImage.style.maxWidth = '100%';
      newImage.style.maxHeight = '100%';
      newImage.style.objectFit = 'contain';
      if (image.getAttribute('data_max_resolution')) {
        newImage.setAttribute('data_max_resolution', highResolutionUrl);
      }

      newImage.onload = () => {
        image.replaceWith(newImage);
        highResImagesLoaded.add(highResolutionUrl);
      };

      newImage.src = highResolutionUrl;
    }

    return true;
  }

  async close() {
    const { dialog, media } = this.refs;

    dialog.classList.remove('dialog--open');
    dialog.classList.add('dialog--closed');

    if (!supportsViewTransitions || !this.#sourceImage) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      this.closeDialog();
      return;
    }

    const transitionName = `section-zoom-item`;
    media.style.setProperty('view-transition-name', transitionName);

    await startViewTransition(() => {
      media.style.removeProperty('view-transition-name');
      this.#sourceImage.style.setProperty('view-transition-name', transitionName);
      this.closeDialog();
    });

    setTimeout(() => {
      this.#sourceImage.style.removeProperty('view-transition-name');
      dialog.classList.remove('dialog--closed');
    }, 400);
    this.#sourceImage = null;
  }

  closeDialog() {
    const { dialog } = this.refs;
    dialog.classList.remove('dialog--open', 'dialog--closed');
    dialog.close();
    window.dispatchEvent(new DialogCloseEvent());
    this.#sourceImage = null;
  }

  handleKeyDown(event) {
    if (event.key !== 'Escape') return;

    event.preventDefault();
    this.close();
  }
}

if (!customElements.get('section-image-zoom-dialog')) {
  customElements.define('section-image-zoom-dialog', SectionImageZoomDialog);
}

function createSharedDialog() {
  if (sharedDialog) return sharedDialog;

  const dialog = document.createElement('section-image-zoom-dialog');
  dialog.id = 'section-zoom-dialog-shared';

  const dialogElement = document.createElement('dialog');
  dialogElement.setAttribute('ref', 'dialog');
  dialogElement.setAttribute('on:keydown', '/handleKeyDown');
  dialogElement.setAttribute('scroll-lock', '');

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'button button-unstyled close-button dialog-zoomed-gallery__close-button';
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.setAttribute('on:click', '/close');

  const closeIconText = document.createElement('span');
  closeIconText.className = 'visually-hidden';
  closeIconText.textContent = 'Close';
  closeButton.appendChild(closeIconText);

  const iconClose = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  iconClose.setAttribute('width', '14');
  iconClose.setAttribute('height', '14');
  iconClose.setAttribute('viewBox', '0 0 14 14');
  iconClose.setAttribute('fill', 'none');
  iconClose.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  
  const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path1.setAttribute('d', 'M12 2L2 12');
  path1.setAttribute('stroke', 'currentColor');
  path1.setAttribute('stroke-width', 'var(--icon-stroke-width)');
  path1.setAttribute('stroke-linecap', 'round');
  path1.setAttribute('stroke-linejoin', 'round');
  
  const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path2.setAttribute('d', 'M12 12L2 2');
  path2.setAttribute('stroke', 'currentColor');
  path2.setAttribute('stroke-width', 'var(--icon-stroke-width)');
  path2.setAttribute('stroke-linecap', 'round');
  path2.setAttribute('stroke-linejoin', 'round');
  
  iconClose.appendChild(path1);
  iconClose.appendChild(path2);
  closeButton.appendChild(iconClose);

  const mediaContainer = document.createElement('div');
  mediaContainer.className = 'product-media-container product-media-container--image product-media-container--zoomable';
  mediaContainer.setAttribute('ref', 'media');
  mediaContainer.setAttribute('on:click', '/close');

  const dragZoomWrapper = document.createElement('drag-zoom-wrapper');
  dragZoomWrapper.className = 'product-media__drag-zoom-wrapper';

  dialogElement.appendChild(closeButton);
  dialogElement.appendChild(mediaContainer);
  mediaContainer.appendChild(dragZoomWrapper);

  dialog.appendChild(dialogElement);

  const style = document.createElement('style');
  style.textContent = `
    section-image-zoom-dialog dialog {
      width: 100vw;
      height: 100vh;
      max-width: 100vw;
      max-height: 100vh;
      padding: 0;
      border: none;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    section-image-zoom-dialog dialog::backdrop {
      background: rgba(0, 0, 0, 0);
      transition: background 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    section-image-zoom-dialog dialog.dialog--open {
      opacity: 1;
    }

    section-image-zoom-dialog dialog.dialog--open::backdrop {
      background: rgba(0, 0, 0, 0.9);
    }

    section-image-zoom-dialog dialog.dialog--closed {
      opacity: 0;
    }

    section-image-zoom-dialog dialog.dialog--closed::backdrop {
      background: rgba(0, 0, 0, 0);
    }

    section-image-zoom-dialog dialog .product-media-container {
      opacity: 0;
      transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s;
    }

    section-image-zoom-dialog dialog.dialog--open .product-media-container {
      opacity: 1;
    }

    section-image-zoom-dialog dialog.dialog--closed .product-media-container {
      opacity: 0;
      transition-delay: 0s;
    }

    section-image-zoom-dialog .dialog-zoomed-gallery__close-button {
      color: white;
      mix-blend-mode: difference;
      z-index: var(--layer-raised);
    }

    section-image-zoom-dialog .product-media-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: zoom-out;
      position: relative;
    }

    section-image-zoom-dialog .product-media__drag-zoom-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: scroll;
      scrollbar-width: none;
    }

    section-image-zoom-dialog .product-media__drag-zoom-wrapper::-webkit-scrollbar {
      display: none;
    }

    section-image-zoom-dialog .product-media__drag-zoom-wrapper img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      transform: scale(var(--drag-zoom-scale, 1))
        translate(var(--drag-zoom-translate-x, 0), var(--drag-zoom-translate-y, 0));
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @media (max-width: 749px) {
      section-image-zoom-dialog .product-media__drag-zoom-wrapper {
        overscroll-behavior: none;
      }
    }
  `;

  dialog.appendChild(style);
  document.body.appendChild(dialog);

  sharedDialog = dialog;
  return dialog;
}

function initSectionImageZoom() {
  const sections = document.querySelectorAll('[data-section-image-zoom]');

  if (sections.length === 0) return;

  const dialog = createSharedDialog();

  sections.forEach((section) => {
    const images = section.querySelectorAll('img:not([data-zoom-handled])');

    images.forEach((img) => {
      const container = img.closest('a, button');

      if (container && (container.tagName === 'A' || container.tagName === 'BUTTON')) {
        container.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          dialog.open(img, e);
        });
        container.style.cursor = 'zoom-in';
      } else {
        img.addEventListener('click', (e) => {
          e.stopPropagation();
          dialog.open(img, e);
        });
        img.style.cursor = 'zoom-in';
      }

      img.setAttribute('data-zoom-handled', 'true');
    });
  });
}

if (!initialized) {
  initialized = true;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSectionImageZoom);
  } else {
    initSectionImageZoom();
  }

  const observer = new MutationObserver(() => {
    initSectionImageZoom();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

