
import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface WizardStep {
  number: number;
  name: string;
  description: string;
}

@Component({
  selector: 'app-creation-wizard',
  imports: [CommonModule],
  templateUrl: './creation-wizard.component.html',
  styleUrl: './creation-wizard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreationWizardComponent {
  title = input.required<string>();
  steps = input.required<WizardStep[]>();
  currentStep = input.required<number>();
  isDirty = input.required<boolean>();

  exit = output<void>();
  stepChange = output<number>();
  saveAndNext = output<void>();
  publish = output<void>();

  showConfirmExitModal = signal<boolean>(false);

  goToStep(step: number): void {
    this.stepChange.emit(step);
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.stepChange.emit(this.currentStep() - 1);
    }
  }

  next(): void {
    this.saveAndNext.emit();
  }

  handlePublish(): void {
    this.publish.emit();
  }

  handleExitRequest(): void {
    if (this.isDirty()) {
      this.showConfirmExitModal.set(true);
    } else {
      this.exit.emit();
    }
  }

  confirmExit(): void {
    this.showConfirmExitModal.set(false);
    this.exit.emit();
  }

  cancelExit(): void {
    this.showConfirmExitModal.set(false);
  }
}
