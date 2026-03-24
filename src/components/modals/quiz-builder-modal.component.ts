import { Component, ChangeDetectionStrategy, output, input, signal, effect, computed, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Pulse, QuizQuestion } from '../../types';
import { SimpleTextEditorComponent } from '../simple-text-editor/simple-text-editor.component';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { QuestionBankModalComponent } from './question-bank-modal.component';
import { upsertQuestionInBank } from '../../question-bank.store';

type ActiveTab = 'questions' | 'settings';
type ViewState = 'editor' | 'import';

@Component({
  selector: 'app-quiz-builder-modal',
  imports: [CommonModule, FormsModule, SimpleTextEditorComponent, TooltipDirective, QuestionBankModalComponent],
  templateUrl: './quiz-editor-modal.component.html',
  styleUrl: './quiz-editor-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizBuilderModalComponent {
  initialPulseData = input.required<Pulse>();
  highlightTarget = input<string | null>(null);

  close = output<void>();
  save = output<Pulse>();

  quiz = signal<Pulse>({} as Pulse);
  activeTab = signal<ActiveTab>('questions');
  viewState = signal<ViewState>('editor');
  isBankOpen = signal(false);
  highlightedElementId = signal<string | null>(null);
  expandedQuestionIds = signal<string[]>([]);

  private elementRef = inject(ElementRef);

  draggingOver = signal(false);
  importFile = signal<File | null>(null);
  importError = signal<string | null>(null);
  parsedQuestions = signal<QuizQuestion[]>([]);
  readonly CSV_TEMPLATE = `ENUNCIADO,ALTERNATIVA A,ALTERNATIVA B,ALTERNATIVA C,ALTERNATIVA D,ALTERNATIVA E,ALTERNATIVA F,ALTERNATIVA G,ALTERNATIVA H,ALTERNATIVA I,ALTERNATIVA J,ALTERNATIVA CORRETA\n"Qual destes animais é um mamífero?","Golfinho","Pardal","Tartaruga","","","","","","","","A"`;

  isEditing = computed(() => !!this.initialPulseData()?.name);

  canPublish = computed(() => {
    const quiz = this.quiz();
    return quiz.name.trim().length > 0 && (quiz.questions ?? []).length > 0;
  });

  constructor() {
    effect(() => {
      const initialQuiz = JSON.parse(JSON.stringify(this.initialPulseData()));
      const normalized = this.normalizeQuiz(initialQuiz);
      this.quiz.set(normalized);
      this.activeTab.set('questions');
      this.viewState.set('editor');
      this.expandedQuestionIds.set((normalized.questions ?? []).slice(0, 1).map((question) => question.id));
    });

    effect(() => {
      const target = this.highlightTarget();
      if (!target) return;

      if (target.startsWith('quiz-setting-')) {
        this.activeTab.set('settings');
      } else if (target === 'quiz-import') {
        this.viewState.set('import');
      } else if (target === 'quiz-question-bank') {
        this.isBankOpen.set(true);
      } else if (target === 'quiz-image') {
        const firstQuestion = this.quiz().questions?.[0];
        if (firstQuestion) {
          this.expandQuestion(firstQuestion.id);
        } else {
          this.addQuestion();
        }
      }

      this.highlightedElementId.set(target);

      setTimeout(() => {
        const element = this.elementRef.nativeElement.querySelector(`#${target}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setTimeout(() => this.highlightedElementId.set(null), 2000);
      }, 100);
    });
  }

  updateField(field: keyof Pulse, value: any): void {
    this.quiz.update((quiz) => ({ ...quiz, [field]: value }));
  }

  updateConfigField(field: keyof NonNullable<Pulse['config']>, value: any): void {
    this.quiz.update((quiz) => ({
      ...quiz,
      config: {
        ...this.ensureConfig(quiz),
        [field]: value,
      },
    }));
  }

  addQuestion(): void {
    const newQuestion = this.normalizeQuestion({
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      questionType: 'multipleChoice',
      questionText: '',
      imageUrl: null,
      imagePosition: 'before',
      alternatives: [''],
      correctAnswerIndexes: [],
      correctAnswerIndex: null,
      isInBank: false,
    });

    this.quiz.update((quiz) => ({
      ...quiz,
      questions: [...(quiz.questions ?? []), newQuestion],
    }));

    this.expandQuestion(newQuestion.id);
  }

  addQuestionsFromBank(selectedQuestions: QuizQuestion[]): void {
    const newQuestions = selectedQuestions.map((question, index) =>
      this.normalizeQuestion({
        ...JSON.parse(JSON.stringify(question)),
        id: `q_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`,
      }),
    );

    this.quiz.update((quiz) => ({
      ...quiz,
      questions: [...(quiz.questions ?? []), ...newQuestions],
    }));

    this.expandedQuestionIds.update((ids) => [...ids, ...newQuestions.map((question) => question.id)]);
    this.isBankOpen.set(false);
  }

  deleteQuestion(questionId: string): void {
    this.quiz.update((quiz) => ({
      ...quiz,
      questions: (quiz.questions ?? []).filter((question) => question.id !== questionId),
    }));

    this.expandedQuestionIds.update((ids) => ids.filter((id) => id !== questionId));
  }

  toggleQuestion(questionId: string): void {
    this.expandedQuestionIds.update((ids) =>
      ids.includes(questionId) ? ids.filter((id) => id !== questionId) : [...ids, questionId],
    );
  }

  isQuestionExpanded(questionId: string): boolean {
    return this.expandedQuestionIds().includes(questionId);
  }

  getQuestionTitle(index: number): string {
    return `Pergunta ${index + 1}`;
  }

  updateQuestionText(questionId: string, newText: string): void {
    this.updateQuestion(questionId, (question) => ({ ...question, questionText: newText }));
  }

  addAlternative(questionId: string): void {
    this.updateQuestion(questionId, (question) => ({
      ...question,
      alternatives: [...(question.alternatives ?? []), ''],
    }));
  }

  removeAlternative(questionId: string, indexToRemove: number): void {
    this.updateQuestion(questionId, (question) => {
      const alternatives = [...(question.alternatives ?? [])];
      if (indexToRemove < 0 || indexToRemove >= alternatives.length) {
        return question;
      }

      alternatives.splice(indexToRemove, 1);
      const correctIndexes = this.getCorrectIndexes(question)
        .filter((index) => index !== indexToRemove)
        .map((index) => (index > indexToRemove ? index - 1 : index));

      return {
        ...question,
        alternatives,
        correctAnswerIndexes: correctIndexes,
        correctAnswerIndex: correctIndexes[0] ?? null,
      };
    });
  }

  updateAlternativeText(questionId: string, index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.updateQuestion(questionId, (question) => {
      const alternatives = [...(question.alternatives ?? [])];
      alternatives[index] = value;
      return { ...question, alternatives };
    });
  }

  setCorrectAlternative(questionId: string, index: number): void {
    this.updateQuestion(questionId, (question) => ({
      ...question,
      correctAnswerIndexes: [index],
      correctAnswerIndex: index,
    }));
  }

  toggleQuestionBank(questionId: string, inBank: boolean): void {
    this.updateQuestion(questionId, (question) => {
      const nextQuestion = { ...question, isInBank: inBank };
      if (inBank) {
        upsertQuestionInBank(this.normalizeQuestion(nextQuestion));
      }
      return nextQuestion;
    });
  }

  handlePublish(): void {
    const finalQuiz = this.normalizeQuiz(this.quiz());
    finalQuiz.status = 'published';
    this.save.emit(finalQuiz);
  }

  switchToImportView(): void {
    if ((this.quiz().questions ?? []).length > 0) {
      return;
    }

    this.viewState.set('import');
  }

  switchToEditorView(): void {
    this.viewState.set('editor');
    this.draggingOver.set(false);
    this.importFile.set(null);
    this.importError.set(null);
    this.parsedQuestions.set([]);
  }

  downloadTemplate(): void {
    const blob = new Blob([this.CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_quiz.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.processFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.draggingOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.draggingOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.draggingOver.set(false);
    if (event.dataTransfer?.files[0]) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  stripHtml(html: string): string {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  }

  handleImport(): void {
    if (this.parsedQuestions().length > 0) {
      const importedQuestions = this.parsedQuestions().map((question) => this.normalizeQuestion(question));
      this.quiz.update((quiz) => ({
        ...quiz,
        questions: [...(quiz.questions ?? []), ...importedQuestions],
      }));
      this.expandedQuestionIds.set(importedQuestions.map((question) => question.id));
    }
    this.switchToEditorView();
  }

  private expandQuestion(questionId: string): void {
    this.expandedQuestionIds.update((ids) => (ids.includes(questionId) ? ids : [...ids, questionId]));
  }

  private updateQuestion(questionId: string, updater: (question: QuizQuestion) => QuizQuestion): void {
    this.quiz.update((quiz) => ({
      ...quiz,
      questions: (quiz.questions ?? []).map((question) => {
        if (question.id !== questionId) return question;
        const nextQuestion = this.normalizeQuestion(updater(this.normalizeQuestion(question)));
        if (nextQuestion.isInBank) {
          upsertQuestionInBank(nextQuestion);
        }
        return nextQuestion;
      }),
    }));
  }

  private processFile(file: File): void {
    this.importError.set(null);
    this.parsedQuestions.set([]);

    if (file.type !== 'text/csv') {
      this.importError.set('Formato de arquivo inválido. Por favor, envie um arquivo .csv');
      this.importFile.set(null);
      return;
    }

    this.importFile.set(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      this.parseCSV(text);
    };
    reader.onerror = () => {
      this.importError.set('Não foi possível ler o arquivo.');
      this.importFile.set(null);
    };
    reader.readAsText(file);
  }

  private parseCSV(csvText: string): void {
    try {
      const lines = csvText.split(/\r\n|\n/).filter((line) => line.trim() !== '');
      if (lines.length < 2) {
        throw new Error('O arquivo CSV está vazio ou contém apenas o cabeçalho.');
      }

      const header = lines[0].split(',').map((item) => item.trim().toUpperCase());
      const expectedHeader = ['ENUNCIADO', 'ALTERNATIVA A', 'ALTERNATIVA CORRETA'];
      if (!expectedHeader.every((item) => header.includes(item))) {
        throw new Error('O cabeçalho do arquivo CSV é inválido. Verifique o modelo.');
      }

      const questions: QuizQuestion[] = [];
      for (let i = 1; i < lines.length; i++) {
        const data = lines[i].split(',');
        const questionText = data[header.indexOf('ENUNCIADO')]?.replace(/"/g, '').trim();
        if (!questionText) continue;

        const alternatives: string[] = [];
        for (let j = 1; j <= 10; j++) {
          const alternativeHeader = `ALTERNATIVA ${String.fromCharCode(64 + j)}`;
          const alternativeIndex = header.indexOf(alternativeHeader);
          if (alternativeIndex > -1 && data[alternativeIndex]?.trim()) {
            alternatives.push(data[alternativeIndex].replace(/"/g, '').trim());
          }
        }

        const correctAnswerLetter = data[header.indexOf('ALTERNATIVA CORRETA')]?.trim().toUpperCase();
        if (!correctAnswerLetter || alternatives.length < 2) continue;

        const correctAnswerIndex = correctAnswerLetter.charCodeAt(0) - 65;
        if (correctAnswerIndex < 0 || correctAnswerIndex >= alternatives.length) continue;

        questions.push({
          id: `csv_${Date.now()}_${i}`,
          questionType: 'multipleChoice',
          questionText,
          alternatives,
          correctAnswerIndexes: [correctAnswerIndex],
          correctAnswerIndex,
          imageUrl: null,
          imagePosition: 'before',
          isInBank: false,
        });
      }

      if (questions.length === 0) {
        throw new Error('Nenhuma questão válida foi encontrada no arquivo.');
      }

      this.parsedQuestions.set(questions);
    } catch (error: any) {
      this.importError.set(error.message);
      this.importFile.set(null);
      this.parsedQuestions.set([]);
    }
  }

  private normalizeQuiz(quiz: Pulse): Pulse {
    return {
      ...quiz,
      config: this.ensureConfig(quiz),
      questions: (quiz.questions ?? []).map((question) => this.normalizeQuestion(question)),
    };
  }

  private normalizeQuestion(question: QuizQuestion): QuizQuestion {
    const correctAnswerIndexes = this.getCorrectIndexes(question);
    return {
      ...question,
      alternatives: [...(question.alternatives ?? [''])],
      correctAnswerIndexes,
      correctAnswerIndex: correctAnswerIndexes[0] ?? null,
      isInBank: question.isInBank ?? false,
    };
  }

  private getCorrectIndexes(question: QuizQuestion): number[] {
    if (question.correctAnswerIndexes?.length) return [...question.correctAnswerIndexes];
    if (question.correctAnswerIndex != null) return [question.correctAnswerIndex];
    return [];
  }

  private ensureConfig(quiz: Pulse): NonNullable<Pulse['config']> {
    return {
      questionsToDisplay: quiz.config?.questionsToDisplay ?? null,
      randomizeQuestions: quiz.config?.randomizeQuestions ?? false,
      randomizeAlternatives: quiz.config?.randomizeAlternatives ?? false,
      retakeAttempts: quiz.config?.retakeAttempts ?? 1,
      showImmediateFeedback: quiz.config?.showImmediateFeedback ?? true,
      maxTimeMinutes: quiz.config?.maxTimeMinutes ?? null,
    };
  }
}
