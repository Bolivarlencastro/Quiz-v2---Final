
import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-event-modal',
  imports: [CommonModule],
  templateUrl: './create-event-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateEventModalComponent {
  close = output<void>();
  startFromScratch = output<void>();
  useAi = output<void>();
}
