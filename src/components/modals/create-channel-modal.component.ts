import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-channel-modal',
  imports: [CommonModule],
  templateUrl: './create-channel-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateChannelModalComponent {
  close = output<void>();
  startFromScratch = output<void>();
  useAi = output<void>();
}
