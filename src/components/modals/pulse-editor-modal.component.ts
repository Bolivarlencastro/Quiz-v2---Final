import { Component, ChangeDetectionStrategy, output, input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Pulse } from '../../types';

@Component({
  selector: 'app-pulse-editor-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './pulse-editor-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PulseEditorModalComponent {
  initialPulseData = input.required<Pulse>();
  
  close = output<void>();
  save = output<Pulse>();

  pulse = signal<Pulse>({} as Pulse);

  constructor() {
    effect(() => {
        this.pulse.set(JSON.parse(JSON.stringify(this.initialPulseData())));
    });
  }

  updateField(field: keyof Pulse, value: any): void {
    this.pulse.update(p => ({ ...p, [field]: value }));
  }

  handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.updateField('fileName', file.name);
      // In a real app, you would handle the file upload here.
      // For the prototype, we just store the name.
    }
  }

  handleSave(): void {
    this.save.emit(this.pulse());
  }

  get title(): string {
    switch(this.pulse().type) {
        case 'file': return 'Criar Pulse de Arquivo';
        case 'link': return 'Criar Pulse de Link';
        case 'text': return 'Criar Pulse de Texto';
        default: return 'Criar Pulse';
    }
  }
}
