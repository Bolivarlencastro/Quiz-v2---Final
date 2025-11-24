import { Component, ChangeDetectionStrategy, input, output, signal, computed, Pipe, PipeTransform, inject, SecurityContext, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Pulse, QuizQuestion } from '../../types';
import { FormsModule } from '@angular/forms';

@Pipe({ name: 'safeHtml', standalone: true })
export class SafeHtmlPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);
  transform(value: string): SafeHtml {
    // Sanitize the value to prevent XSS attacks, but still allow safe HTML
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}

type QuizState = 'intro' | 'playing' | 'finished';

interface Answer {
  questionId: string;
  selectedAlternativeIndex?: number;
  openTextAnswer?: string;
  isCorrect?: boolean;
}

@Component({
  selector: 'app-quiz-player',
  imports: [CommonModule, SafeHtmlPipe, FormsModule],
  templateUrl: './quiz-player.component.html',
  styleUrls: ['./quiz-player.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizPlayerComponent {
  quizData = input.required<Pulse>();
  isInlinePlayer = input<boolean>(false);

  quizCompleted = output<void>();
  exitPreview = output<void>(); // This is still used by the wizard preview
  progressUpdate = output<number>();
  progressTextUpdate = output<string>();

  questions = computed(() => this.quizData().questions ?? []);
  answers = signal<Answer[]>([]);
  quizState = signal<QuizState>('intro');
  currentQuestionIndex = signal(0);
  
  // For single question view
  selectedAnswerIndex = signal<number | null>(null);
  openTextAnswer = signal<string>('');
  isReviewing = signal(false);

  // Computed state
  currentQuestion = computed<QuizQuestion | null>(() => {
    const qs = this.questions();
    if (qs.length > 0) {
        return qs[this.currentQuestionIndex()] ?? null;
    }
    return null;
  });
  
  isLastQuestion = computed(() => this.currentQuestionIndex() === this.questions().length - 1);

  isConfirmDisabled = computed(() => {
    if (this.isReviewing()) return false;
    const question = this.currentQuestion();
    if (!question) return true;

    if (question.questionType === 'multipleChoice') {
        return this.selectedAnswerIndex() === null;
    }
    if (question.questionType === 'openText') {
        return !this.openTextAnswer().trim();
    }
    return true;
  });


  progress = computed(() => {
    const total = this.questions().length;
    if (total === 0) return 0;
    if (this.quizState() === 'finished') return 100;
    
    // Progress is based on confirmed answers for immediate feedback mode, or current index otherwise
    if (this.quizData().config?.showImmediateFeedback) {
        return (this.answers().length / total) * 100;
    }
    return (this.currentQuestionIndex() / total) * 100;
  });
  
  score = signal(0);
  correctAnswers = signal(0);

  constructor() {
    effect(() => {
      this.progressUpdate.emit(this.progress());

      const total = this.questions().length;
      if (this.quizState() === 'playing' && total > 0) {
        this.progressTextUpdate.emit(`${this.currentQuestionIndex() + 1} / ${total}`);
      } else {
        this.progressTextUpdate.emit('');
      }
    });
  }

  startQuiz(): void {
    this.currentQuestionIndex.set(0);
    this.answers.set([]);
    this.quizState.set('playing');
    this.resetQuestionState();
  }

  selectAnswer(index: number): void {
    if (this.isReviewing()) return;
    this.selectedAnswerIndex.set(index);
  }

  confirmAnswer(): void {
    const question = this.currentQuestion();
    if (!question) return;

    if (this.quizData().quizType === 'survey') {
      const newAnswer: Answer = { questionId: question.id };
      if (question.questionType === 'multipleChoice') {
        if (this.selectedAnswerIndex() === null) return;
        newAnswer.selectedAlternativeIndex = this.selectedAnswerIndex()!;
      } else if (question.questionType === 'openText') {
        if (!this.openTextAnswer().trim()) return;
        newAnswer.openTextAnswer = this.openTextAnswer();
      }
      this.answers.update(a => [...a, newAnswer]);
      this.nextQuestion();
    } else { // Evaluative quiz logic
      const selectedIndex = this.selectedAnswerIndex();
      if (selectedIndex === null) return;

      const isCorrect = selectedIndex === question.correctAnswerIndex;
      this.answers.update(a => [...a, {
        questionId: question.id,
        selectedAlternativeIndex: selectedIndex,
        isCorrect: isCorrect
      }]);

      if (this.quizData().config?.showImmediateFeedback) {
          this.isReviewing.set(true);
      } else {
          this.nextQuestion();
      }
    }
  }

  nextQuestion(): void {
    if (!this.isLastQuestion()) {
      this.currentQuestionIndex.update(i => i + 1);
      this.resetQuestionState();
    } else {
      this.finishQuiz();
    }
  }

  next(): void {
    // This is only called from the button that appears when !isInlinePlayer()
    this.exitPreview.emit();
  }

  finishQuiz(): void {
    if (this.quizData().quizType === 'evaluative') {
        const correctCount = this.answers().filter(a => a.isCorrect).length;
        this.correctAnswers.set(correctCount);
        const totalQuestions = this.questions().length;
        this.score.set(totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0);
    }
    this.quizState.set('finished');

    if (this.isInlinePlayer()) {
      this.quizCompleted.emit();
    }
  }
  
  private resetQuestionState(): void {
    this.selectedAnswerIndex.set(null);
    this.openTextAnswer.set('');
    this.isReviewing.set(false);
  }

  getAlternativeLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }
  
  getAlternativeClass(question: QuizQuestion, index: number): string {
    const isSelected = index === this.selectedAnswerIndex();

    if (this.quizData().quizType === 'survey') {
        if (isSelected) {
            return 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
        }
        return 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-900/20';
    }

    // While reviewing the answer (evaluative)
    if (this.isReviewing()) {
      const isCorrect = index === question.correctAnswerIndex;
      if (isCorrect) {
        return 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      }
      if (isSelected && !isCorrect) {
        return 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      }
      return 'border-gray-300 dark:border-gray-600 opacity-70';
    }

    // While selecting an answer (evaluative)
    if (isSelected) {
      return 'border-purple-500 bg-purple-50 dark:bg-purple-900/30';
    }

    // Default state
    return 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-900/20';
  }
}