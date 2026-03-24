
import { Component, ChangeDetectionStrategy, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuizQuestion } from '../../types';
import { questionBankState, removeQuestionFromBank } from '../../question-bank.store';

@Component({
  selector: 'app-question-bank-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './question-bank-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionBankModalComponent {
  close = output<void>();
  questionsSelected = output<QuizQuestion[]>();

  searchQuery = signal<string>('');
  selectedQuestionIds = signal<Set<string>>(new Set());

  filteredQuestions = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const questions = questionBankState();

    if (!query) return questions;

    return questions.filter((question) => {
      const questionText = question.questionText.toLowerCase();
      const alternatives = (question.alternatives ?? []).join(' ').toLowerCase();
      return questionText.includes(query) || alternatives.includes(query);
    });
  });

  isSelected(questionId: string): boolean {
    return this.selectedQuestionIds().has(questionId);
  }

  toggleSelection(questionId: string): void {
    this.selectedQuestionIds.update(currentSet => {
      if (currentSet.has(questionId)) {
        currentSet.delete(questionId);
      } else {
        currentSet.add(questionId);
      }
      return new Set(currentSet);
    });
  }

  addSelectedQuestions(): void {
    const selectedIds = this.selectedQuestionIds();
    const questionsToAdd = questionBankState().filter(q => selectedIds.has(q.id));
    this.questionsSelected.emit(questionsToAdd);
  }

  removeFromBank(questionId: string, event: Event): void {
    event.stopPropagation();
    this.selectedQuestionIds.update((currentSet) => {
      currentSet.delete(questionId);
      return new Set(currentSet);
    });
    removeQuestionFromBank(questionId);
  }

  getCorrectAnswers(question: QuizQuestion): string {
    const indexes = question.correctAnswerIndexes?.length
      ? question.correctAnswerIndexes
      : question.correctAnswerIndex != null
        ? [question.correctAnswerIndex]
        : [];

    return indexes
      .map((index) => question.alternatives?.[index])
      .filter(Boolean)
      .join(', ');
  }

  stripHtml(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  }
}
