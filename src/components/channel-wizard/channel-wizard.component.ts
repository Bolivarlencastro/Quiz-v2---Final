import { Component, ChangeDetectionStrategy, input, output, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Channel } from '../../types';
import { CreationWizardComponent } from '../creation-wizard/creation-wizard.component';

@Component({
  selector: 'app-channel-wizard',
  imports: [CommonModule, FormsModule, CreationWizardComponent],
  templateUrl: './channel-wizard.component.html',
  styleUrls: ['./channel-wizard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChannelWizardComponent {
  initialChannelData = input.required<Channel>();
  exit = output<void>();

  channel = signal<Channel>({} as Channel);
  private initialChannelState = signal<string>('');

  currentStep = signal<number>(1);

  isDirty = computed(() => {
    if (!this.initialChannelState()) return false;
    return JSON.stringify(this.channel()) !== this.initialChannelState();
  });

  // Step 2: Image
  coverImagePreview = signal<string | null>(null);

  // Step 3: Finalize
  showPublishToast = signal<boolean>(false);

  steps = [
    { number: 1, name: 'Informações Básicas', description: 'Dados gerais do seu canal' },
    { number: 2, name: 'Imagem de Capa', description: 'Defina a imagem do seu canal' },
    { number: 3, name: 'Finalizar', description: 'Publique seu canal' },
  ];

  constructor() {
    effect(() => {
      const initialData = this.initialChannelData();
      const deepCopiedData = JSON.parse(JSON.stringify(initialData));
      this.channel.set(deepCopiedData);
      this.initialChannelState.set(JSON.stringify(deepCopiedData));
      this.coverImagePreview.set(initialData.coverImageUrl);
    });
  }

  handleStepChange(step: number): void {
    if (step > 0 && step <= this.steps.length) {
      this.currentStep.set(step);
    }
  }

  handleSaveAndNext(): void {
    if (this.currentStep() < this.steps.length) {
      this.initialChannelState.set(JSON.stringify(this.channel()));
      this.currentStep.update(s => s + 1);
    }
  }

  updateField(field: keyof Channel, value: any): void {
    this.channel.update(c => ({ ...c, [field]: value }));
  }

  publishChannel(): void {
    this.initialChannelState.set(JSON.stringify(this.channel()));
    this.showPublishToast.set(true);
    setTimeout(() => {
      this.showPublishToast.set(false);
      this.exit.emit();
    }, 2500);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.coverImagePreview.set(result);
        this.updateField('coverImageUrl', result);
      };
      reader.readAsDataURL(file);
    }
  }
}
