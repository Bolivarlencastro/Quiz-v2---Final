import { Component, ChangeDetectionStrategy, output, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-quiz-name-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './quiz-name-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizNameModalComponent {
  quizType = input.required<'evaluative' | 'survey'>();
  close = output<void>();
  back = output<void>();
  nameSaved = output<string>();

  quizName = signal('');
  
  save(): void {
    if (this.quizName().trim()) {
      this.nameSaved.emit(this.quizName().trim());
    }
  }
}
