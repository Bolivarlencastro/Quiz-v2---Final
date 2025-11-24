import { Component, ChangeDetectionStrategy, output, input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuizQuestion } from '../../types';

@Component({
  selector: 'app-add-question-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-question-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddQuestionModalComponent {
  quizType = input.required<'evaluative' | 'survey'>();
  questionToEdit = input<QuizQuestion | null>(null);

  close = output<void>();
  questionSaved = output<QuizQuestion>();

  question = signal<QuizQuestion>({} as QuizQuestion);

  constructor() {
    effect(() => {
      const qToEdit = this.questionToEdit();
      if (qToEdit) {
        this.question.set(JSON.parse(JSON.stringify(qToEdit)));
      } else {
        this.question.set({
          id: `q_${Date.now()}`,
          questionType: 'multipleChoice',
          questionText: '',
          alternatives: ['', ''],
          correctAnswerIndex: 0,
        });
      }
    });
  }

  setQuestionType(type: 'multipleChoice' | 'openText'): void {
    this.question.update(q => ({ ...q, questionType: type }));
  }

  updateQuestionText(text: string): void {
    this.question.update(q => ({ ...q, questionText: text }));
  }

  updateAlternative(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.question.update(q => {
      const newAlts = [...(q.alternatives || [])];
      newAlts[index] = value;
      return { ...q, alternatives: newAlts };
    });
  }
  
  addAlternative(): void {
    this.question.update(q => {
      const newAlts = [...(q.alternatives || []), ''];
      return { ...q, alternatives: newAlts };
    });
  }

  removeAlternative(indexToRemove: number): void {
    this.question.update(q => {
      if (!q.alternatives || q.alternatives.length <= 2) return q;
      const newAlts = q.alternatives.filter((_, index) => index !== indexToRemove);
      
      if (q.correctAnswerIndex !== null && q.correctAnswerIndex !== undefined && q.correctAnswerIndex >= newAlts.length) {
        q.correctAnswerIndex = newAlts.length - 1;
      }
      return { ...q, alternatives: newAlts };
    });
  }

  setCorrectAlternative(index: number): void {
    this.question.update(q => ({ ...q, correctAnswerIndex: index }));
  }

  save(): void {
    // Basic validation
    if (!this.question().questionText.trim()) return;
    if (this.question().questionType === 'multipleChoice') {
      if ((this.question().alternatives || []).some(alt => !alt.trim())) return;
    }
    this.questionSaved.emit(this.question());
  }
}
