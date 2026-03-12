
import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-course-modal',
  imports: [CommonModule],
  templateUrl: './create-course-modal.component.html',
  styleUrl: './create-course-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateCourseModalComponent {
  close = output<void>();
  startFromScratch = output<void>();
  useAi = output<void>();
  importFile = output<void>();
}
