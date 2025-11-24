import { Component, ChangeDetectionStrategy, forwardRef, viewChild, ElementRef, AfterViewInit, inject, Renderer2, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-simple-text-editor',
  imports: [CommonModule],
  templateUrl: './simple-text-editor.component.html',
  styleUrls: ['./simple-text-editor.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SimpleTextEditorComponent),
      multi: true,
    },
  ],
})
export class SimpleTextEditorComponent implements ControlValueAccessor, AfterViewInit {
  private sanitizer = inject(DomSanitizer);
  private renderer = inject(Renderer2);

  editor = viewChild.required<ElementRef<HTMLDivElement>>('editor');

  private onChange = (_: any) => {};
  private onTouched = () => {};
  private isDisabled = false;

  ngAfterViewInit() {
    this.renderer.listen(this.editor().nativeElement, 'input', () => {
      this.onChange(this.editor().nativeElement.innerHTML);
      this.onTouched();
    });
     this.renderer.listen(this.editor().nativeElement, 'blur', () => {
      this.onTouched();
    });
  }

  writeValue(value: any): void {
    if (this.editor()) {
      const sanitizedValue = this.sanitizer.sanitize(SecurityContext.HTML, value || '');
      this.renderer.setProperty(this.editor().nativeElement, 'innerHTML', sanitizedValue || '');
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    if (this.editor()) {
      this.renderer.setAttribute(this.editor().nativeElement, 'contenteditable', String(!isDisabled));
    }
  }

  execCommand(command: string, value: string | null = null): void {
    document.execCommand(command, false, value);
    this.editor().nativeElement.focus();
  }

  createLink(): void {
    const url = prompt("Enter the link URL:");
    if (url) {
      this.execCommand('createLink', url);
    }
  }
}