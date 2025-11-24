import { Component, ChangeDetectionStrategy, output, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-file-upload-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './file-upload-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadModalComponent {
  source = input.required<'scorm' | 'csv'>();
  
  close = output<void>();
  back = output<void>();
  import = output<{ workload: string }>();

  workload = signal<string>('00:00');
  fileName = signal<string | null>(null);

  handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.fileName.set(input.files[0].name);
    }
  }

  triggerImport(): void {
    // In a real app, you would handle the file upload here.
    // For the prototype, we just confirm the import.
    if (this.fileName()) {
      this.import.emit({ workload: this.workload() });
    } else {
      alert('Por favor, selecione um arquivo.');
    }
  }
}
