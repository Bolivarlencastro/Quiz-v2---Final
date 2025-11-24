import { Directive, ElementRef, Renderer2, inject, input, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnDestroy {
  appTooltip = input.required<string>();
  
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);

  private tooltipElement: HTMLElement | null = null;
  private isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  private tooltipId = `app-tooltip-${Date.now()}-${Math.random().toString(36).substring(2)}`;

  host = {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'onFocusOut()',
    '(touchstart)': 'onTouchStart($event)',
  };
  
  ngOnDestroy(): void {
    this.hide();
  }

  onMouseEnter(): void {
    if (!this.isMobile) {
      this.show();
    }
  }

  onMouseLeave(): void {
    if (!this.isMobile) {
      this.hide();
    }
  }
  
  onFocusIn(): void {
    this.show();
  }

  onFocusOut(): void {
    this.hide();
  }

  onTouchStart(event: Event): void {
    event.preventDefault(); // Prevent mouse events from firing
    if (this.tooltipElement) {
      this.hide();
    } else {
      this.show();
      // Hide after a delay on touch devices
      setTimeout(() => this.hide(), 3000);
    }
  }

  private show(): void {
    if (this.tooltipElement || !this.appTooltip()) {
      return;
    }

    // Create container and tooltip elements
    this.tooltipElement = this.renderer.createElement('div');
    const tooltipContent = this.renderer.createElement('div');

    // Style elements
    this.renderer.addClass(this.tooltipElement, 'app-tooltip-container');
    this.renderer.addClass(tooltipContent, 'app-tooltip');
    
    // Accessibility
    this.renderer.setAttribute(tooltipContent, 'role', 'tooltip');
    this.renderer.setAttribute(tooltipContent, 'id', this.tooltipId);
    this.renderer.setAttribute(this.el.nativeElement, 'aria-describedby', this.tooltipId);

    // Set content and append
    tooltipContent.innerHTML = this.appTooltip();
    this.renderer.appendChild(this.tooltipElement, tooltipContent);
    this.renderer.appendChild(this.document.body, this.tooltipElement);
    
    // Position tooltip
    this.positionTooltip(tooltipContent);
  }

  private hide(): void {
    if (this.tooltipElement) {
      this.renderer.removeAttribute(this.el.nativeElement, 'aria-describedby');
      this.renderer.removeChild(this.document.body, this.tooltipElement);
      this.tooltipElement = null;
    }
  }

  private positionTooltip(tooltipContent: HTMLElement): void {
      if (!this.tooltipElement) return;

      const hostRect = this.el.nativeElement.getBoundingClientRect();
      // We need to get the tooltip's dimensions *before* positioning it
      const tooltipRect = this.tooltipElement.getBoundingClientRect();
      
      let position: 'top' | 'bottom' = 'top';
      let top, left;

      // Default to top position
      top = hostRect.top - tooltipRect.height - 8; // 8px for arrow offset

      // If not enough space on top AND more space on bottom, position on bottom
      if (top < 0 && hostRect.bottom + tooltipRect.height + 8 < window.innerHeight) {
        position = 'bottom';
        top = hostRect.bottom + 8;
      }
      
      left = hostRect.left + (hostRect.width / 2) - (tooltipRect.width / 2);

      // Handle horizontal overflow
      if (left < 8) {
        left = 8;
      } else if (left + tooltipRect.width > window.innerWidth) {
        left = window.innerWidth - tooltipRect.width - 8;
      }

      this.renderer.addClass(tooltipContent, position);
      this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
      this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);
  }
}