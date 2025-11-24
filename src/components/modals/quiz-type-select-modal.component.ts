import { Component, ChangeDetectionStrategy, output, input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quiz-type-select-modal',
  imports: [CommonModule],
  templateUrl: './quiz-type-select-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizTypeSelectModalComponent {
  highlightTarget = input<string | null>(null);
  close = output<void>();
  typeSelected = output<'evaluative' | 'survey'>();

  isHighlighting = signal(false);

  constructor() {
    effect(() => {
      if (this.highlightTarget() === 'quiz-survey-type') {
        this.isHighlighting.set(true);
        setTimeout(() => this.isHighlighting.set(false), 2000); // Animation duration is 2s
      }
    });
  }
}
