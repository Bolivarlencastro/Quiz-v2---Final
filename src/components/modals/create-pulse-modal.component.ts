import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PulseType } from '../../types';

@Component({
  selector: 'app-create-pulse-modal',
  imports: [CommonModule],
  templateUrl: './create-pulse-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatePulseModalComponent {
  close = output<void>();
  pulseTypeSelected = output<PulseType>();

  selectType(type: PulseType): void {
    this.pulseTypeSelected.emit(type);
  }
}
