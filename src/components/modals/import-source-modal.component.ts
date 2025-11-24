import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-import-source-modal',
  imports: [CommonModule],
  templateUrl: './import-source-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportSourceModalComponent {
  close = output<void>();
  back = output<void>();
  sourceSelected = output<'scorm' | 'csv'>();
}