import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-trail-modal',
  imports: [CommonModule],
  templateUrl: './create-trail-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateTrailModalComponent {
  close = output<void>();
  startFromScratch = output<void>();
  useAi = output<void>();
}
