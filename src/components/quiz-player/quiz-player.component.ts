import { ChangeDetectionStrategy, Component, Pipe, PipeTransform, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { Pulse, QuizQuestion } from '../../types';

@Pipe({ name: 'safeHtml', standalone: true })
export class SafeHtmlPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(value: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}

type QuizState = 'intro' | 'playing' | 'finished';

interface Answer {
  questionId: string;
  selectedAlternativeIndices?: number[];
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
  exitPreview = output<void>();
  progressUpdate = output<number>();
  progressTextUpdate = output<string>();

  registeredQuestions = computed(() => (this.quizData().questions ?? []).map((question) => this.normalizeQuestion(question)));
  activeQuestions = signal<QuizQuestion[]>([]);
  answers = signal<Answer[]>([]);
  quizState = signal<QuizState>('intro');
  currentQuestionIndex = signal(0);
  selectedAnswerIndexes = signal<Set<number>>(new Set());
  openTextAnswer = signal('');

  currentQuestion = computed<QuizQuestion | null>(() => this.activeQuestions()[this.currentQuestionIndex()] ?? null);
  isLastQuestion = computed(() => this.currentQuestionIndex() === this.activeQuestions().length - 1);
  isConfirmDisabled = computed(() => {
    const question = this.currentQuestion();
    if (!question) return true;
    if (question.questionType === 'multipleChoice') {
      return this.selectedAnswerIndexes().size === 0;
    }
    return !this.openTextAnswer().trim();
  });
  progress = computed(() => {
    const total = this.activeQuestions().length;
    if (total === 0) return 0;
    if (this.quizState() === 'finished') return 100;
    return (this.currentQuestionIndex() / total) * 100;
  });

  score = signal(0);
  correctAnswers = signal(0);

  constructor() {
    effect(() => {
      this.progressUpdate.emit(this.progress());
      const total = this.activeQuestions().length;
      if (this.quizState() === 'playing' && total > 0) {
        this.progressTextUpdate.emit(`${this.currentQuestionIndex() + 1} / ${total}`);
      } else {
        this.progressTextUpdate.emit('');
      }
    });
  }

  startQuiz(): void {
    const config = this.quizData().config;
    let questions = [...this.registeredQuestions()];

    if (config?.randomizeQuestions) {
      questions = this.shuffle(questions);
    }

    const questionsToDisplay = config?.questionsToDisplay ?? null;
    if (questionsToDisplay && questionsToDisplay > 0) {
      questions = questions.slice(0, questionsToDisplay);
    }

    this.activeQuestions.set(questions);
    this.currentQuestionIndex.set(0);
    this.answers.set([]);
    this.quizState.set('playing');
    this.resetQuestionState();
  }

  toggleAnswer(index: number): void {
    this.selectedAnswerIndexes.update((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  confirmAnswer(): void {
    const question = this.currentQuestion();
    if (!question) return;

    if (question.questionType === 'openText') {
      this.answers.update((answers) => [...answers, {
        questionId: question.id,
        openTextAnswer: this.openTextAnswer().trim(),
      }]);
      this.nextQuestion();
      return;
    }

    const selectedIndexes = Array.from(this.selectedAnswerIndexes()).sort((a, b) => a - b);
    if (selectedIndexes.length === 0) return;

    const correctIndexes = this.getCorrectAnswerIndexes(question);
    const isCorrect = selectedIndexes.length === correctIndexes.length
      && selectedIndexes.every((index, position) => index === correctIndexes[position]);

    this.answers.update((answers) => [...answers, {
      questionId: question.id,
      selectedAlternativeIndices: selectedIndexes,
      isCorrect,
    }]);

    this.nextQuestion();
  }

  nextQuestion(): void {
    if (!this.isLastQuestion()) {
      this.currentQuestionIndex.update((index) => index + 1);
      this.resetQuestionState();
      return;
    }

    this.finishQuiz();
  }

  finishQuiz(): void {
    const correctCount = this.answers().filter((answer) => answer.isCorrect).length;
    this.correctAnswers.set(correctCount);

    const totalQuestions = this.activeQuestions().length;
    this.score.set(totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0);
    this.quizState.set('finished');

    if (this.isInlinePlayer()) {
      this.quizCompleted.emit();
    }
  }

  getAlternativeLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  getAlternativeClass(index: number): string {
    if (this.selectedAnswerIndexes().has(index)) {
      return 'border-purple-500 bg-purple-50 dark:bg-purple-900/30';
    }

    return 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-900/20';
  }

  private resetQuestionState(): void {
    this.selectedAnswerIndexes.set(new Set());
    this.openTextAnswer.set('');
  }

  private getCorrectAnswerIndexes(question: QuizQuestion): number[] {
    if (question.correctAnswerIndexes?.length) {
      return [...question.correctAnswerIndexes].sort((a, b) => a - b);
    }

    if (question.correctAnswerIndex != null) {
      return [question.correctAnswerIndex];
    }

    return [];
  }

  private normalizeQuestion(question: QuizQuestion): QuizQuestion {
    const correctAnswerIndexes = this.getCorrectAnswerIndexes(question);
    return {
      ...question,
      alternatives: [...(question.alternatives ?? [])],
      correctAnswerIndexes,
      correctAnswerIndex: correctAnswerIndexes[0] ?? null,
    };
  }

  private shuffle<T>(items: T[]): T[] {
    const next = [...items];
    for (let index = next.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
    }
    return next;
  }
}
