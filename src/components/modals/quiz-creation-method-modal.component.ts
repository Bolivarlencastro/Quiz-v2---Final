import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quiz-creation-method-modal',
  imports: [CommonModule],
  templateUrl: './quiz-creation-method-modal.component.html',
  styleUrl: './quiz-creation-method-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizCreationMethodModalComponent {
  close = output<void>();
  creationMethodSelected = output<'manual' | 'ai'>();
}
