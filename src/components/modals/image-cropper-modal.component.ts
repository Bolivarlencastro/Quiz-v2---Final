import { Component, ChangeDetectionStrategy, output, input, signal, viewChild, ElementRef, computed, AfterViewInit, Renderer2, inject, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

type Handle = 'top-left' | 'top-middle' | 'top-right' | 'middle-left' | 'middle-right' | 'bottom-left' | 'bottom-middle' | 'bottom-right';

@Component({
  selector: 'app-image-cropper-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-cropper-modal.component.html',
  styleUrls: ['./image-cropper-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageCropperModalComponent implements AfterViewInit, OnDestroy {
  // Inputs & Outputs
  imageUrl = input.required<string>();
  aspectRatioType = input.required<'banner' | 'card'>();
  close = output<void>();
  cropped = output<string>();

  // Element Refs
  private imageRef = viewChild.required<ElementRef<HTMLImageElement>>('imageToCrop');
  private imageContainerRef = viewChild.required<ElementRef<HTMLDivElement>>('imageContainer');

  // State
  private image = new Image();
  imageLoaded = signal(false);
  
  // Dimensions of the image as displayed on screen
  imageDisplay = signal({ x: 0, y: 0, width: 1, height: 1 });
  
  // Crop box dimensions relative to the displayed image
  cropBox = signal({ x: 0, y: 0, width: 200, height: 200 });

  private interactionState = signal<{
    type: 'move' | 'resize';
    handle?: Handle;
    startX: number;
    startY: number;
    startCropBox: { x: number; y: number; width: number; height: number; };
  } | null>(null);

  private renderer = inject(Renderer2);
  private unlistenMouseMove: (() => void) | null = null;
  private unlistenMouseUp: (() => void) | null = null;
  
  aspectRatio = computed(() => {
    return this.aspectRatioType() === 'banner' ? 3 / 1 : 9 / 16;
  });

  constructor() {
    effect(() => {
        const url = this.imageUrl();
        if (url) {
            this.imageLoaded.set(false);
            this.image.crossOrigin = 'anonymous';
            this.image.onload = () => {
                this.imageLoaded.set(true);
                this.initializeCropper();
            };
            this.image.src = url;
        }
    });
  }

  ngAfterViewInit() {
    this.initializeCropper();
    // Use Renderer2 for global listeners to ensure they are cleaned up properly
    this.unlistenMouseMove = this.renderer.listen('window', 'mousemove', this.onMouseMove.bind(this));
    this.unlistenMouseUp = this.renderer.listen('window', 'mouseup', this.onMouseUp.bind(this));
  }

  ngOnDestroy(): void {
    if (this.unlistenMouseMove) this.unlistenMouseMove();
    if (this.unlistenMouseUp) this.unlistenMouseUp();
  }

  private initializeCropper() {
    if (!this.imageLoaded() || !this.imageContainerRef()) return;
    
    const container = this.imageContainerRef().nativeElement;
    const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();
    const { naturalWidth, naturalHeight } = this.image;

    const containerAspect = containerWidth / containerHeight;
    const imageAspect = naturalWidth / naturalHeight;

    let displayWidth, displayHeight, displayX, displayY;

    if (imageAspect > containerAspect) {
      // Image is wider, so it's constrained by container width
      displayWidth = containerWidth;
      displayHeight = displayWidth / imageAspect;
      displayX = 0;
      displayY = (containerHeight - displayHeight) / 2;
    } else {
      // Image is taller, so it's constrained by container height
      displayHeight = containerHeight;
      displayWidth = displayHeight * imageAspect;
      displayY = 0;
      displayX = (containerWidth - displayWidth) / 2;
    }
    
    this.imageDisplay.set({ x: displayX, y: displayY, width: displayWidth, height: displayHeight });

    // Initialize crop box in the center
    const aspect = this.aspectRatio();
    let initialCropWidth = displayWidth * 0.8;
    let initialCropHeight = initialCropWidth / aspect;

    if (initialCropHeight > displayHeight * 0.8) {
      initialCropHeight = displayHeight * 0.8;
      initialCropWidth = initialCropHeight * aspect;
    }

    const initialCropX = (displayWidth - initialCropWidth) / 2;
    const initialCropY = (displayHeight - initialCropHeight) / 2;

    this.cropBox.set({
      x: initialCropX,
      y: initialCropY,
      width: initialCropWidth,
      height: initialCropHeight,
    });
  }

  // --- Interaction Start ---
  startMove(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    const point = this.getEventPoint(event);
    this.interactionState.set({
      type: 'move',
      startX: point.x,
      startY: point.y,
      startCropBox: this.cropBox(),
    });
  }

  startResize(event: MouseEvent | TouchEvent, handle: Handle) {
    event.preventDefault();
    event.stopPropagation();
    const point = this.getEventPoint(event);
    this.interactionState.set({
      type: 'resize',
      handle,
      startX: point.x,
      startY: point.y,
      startCropBox: this.cropBox(),
    });
  }
  
  // --- Global Interaction Handlers ---
  private onMouseMove(event: MouseEvent | TouchEvent) {
    if (!this.interactionState()) return;

    event.preventDefault();
    const state = this.interactionState()!;
    const point = this.getEventPoint(event);
    const deltaX = point.x - state.startX;
    const deltaY = point.y - state.startY;

    if (state.type === 'move') {
      this.moveCropBox(deltaX, deltaY);
    } else if (state.type === 'resize') {
      this.resizeCropBox(deltaX, deltaY, state.handle!);
    }
  }
  
  private onMouseUp() {
    this.interactionState.set(null);
  }

  // --- Interaction Logic ---
  private moveCropBox(deltaX: number, deltaY: number) {
    const { x, y, width, height } = this.interactionState()!.startCropBox;
    const { width: displayWidth, height: displayHeight } = this.imageDisplay();
    
    let newX = x + deltaX;
    let newY = y + deltaY;

    // Clamp to image boundaries
    newX = Math.max(0, Math.min(newX, displayWidth - width));
    newY = Math.max(0, Math.min(newY, displayHeight - height));

    this.cropBox.update(b => ({...b, x: newX, y: newY }));
  }

  private resizeCropBox(deltaX: number, deltaY: number, handle: Handle) {
    let { x, y, width, height } = this.interactionState()!.startCropBox;
    const { width: displayWidth, height: displayHeight } = this.imageDisplay();
    const aspect = this.aspectRatio();
    const minSize = 20;

    // Adjust dimensions based on handle
    if (handle.includes('right')) width += deltaX;
    if (handle.includes('left')) { width -= deltaX; x += deltaX; }
    if (handle.includes('bottom')) height += deltaY;
    if (handle.includes('top')) { height -= deltaY; y += deltaY; }

    // Enforce aspect ratio
    if (handle.includes('left') || handle.includes('right')) {
        const newHeight = width / aspect;
        if(handle.includes('top')) y += height - newHeight;
        height = newHeight;
    } else { // top/bottom handles are dominant
        const newWidth = height * aspect;
        if(handle.includes('left')) x += width - newWidth;
        width = newWidth;
    }

    // Clamp minimum size
    if (width < minSize) { width = minSize; height = minSize / aspect; }
    if (height < minSize) { height = minSize; width = minSize * aspect; }

    // Clamp position and size to image boundaries
    if (x < 0) { width += x; x = 0; }
    if (y < 0) { height += y; y = 0; }
    if (x + width > displayWidth) width = displayWidth - x;
    if (y + height > displayHeight) height = displayHeight - y;
    
    // Final aspect ratio correction after clamping
    if (width / aspect > height) width = height * aspect;
    else height = width / aspect;

    this.cropBox.set({ x, y, width, height });
  }

  confirmCrop() {
    if (!this.imageLoaded()) return;

    const { x: cropX, y: cropY, width: cropWidth, height: cropHeight } = this.cropBox();
    const { width: displayWidth, height: displayHeight } = this.imageDisplay();
    const { naturalWidth, naturalHeight } = this.image;

    const scale = naturalWidth / displayWidth;
    
    const sourceX = cropX * scale;
    const sourceY = cropY * scale;
    const sourceWidth = cropWidth * scale;
    const sourceHeight = cropHeight * scale;

    const canvas = this.renderer.createElement('canvas');
    canvas.width = Math.round(sourceWidth);
    canvas.height = Math.round(sourceHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(
      this.image,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, canvas.width, canvas.height
    );
    
    this.cropped.emit(canvas.toDataURL('image/jpeg', 0.9));
  }
  
  private getEventPoint(event: MouseEvent | TouchEvent): { x: number; y: number } {
    if (event instanceof MouseEvent) {
      return { x: event.clientX, y: event.clientY };
    }
    const touch = event.touches[0] || event.changedTouches[0];
    return { x: touch.clientX, y: touch.clientY };
  }
}
