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

type ParsedCsvQuestionGroup = {
  id: string;
  questionText: string;
  alternatives: string[];
  correctAnswerIndexes: number[];
};

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
  importErrors = signal<string[]>([]);
  parsedQuestions = signal<QuizQuestion[]>([]);
  readonly CSV_TEMPLATE = `ID,ENUNCIADO,ALTERNATIVA,CORRETA
Q1,"Qual destes animais e um mamifero?","Golfinho","SIM"
Q1,"Qual destes animais e um mamifero?","Pardal","NAO"
Q1,"Qual destes animais e um mamifero?","Tartaruga","NAO"
Q2,"Selecione os itens obrigatorios para iniciar o projeto","Briefing aprovado","SIM"
Q2,"Selecione os itens obrigatorios para iniciar o projeto","Escopo definido","SIM"
Q2,"Selecione os itens obrigatorios para iniciar o projeto","Cafe na copa","NAO"`;

  isEditing = computed(() => !!this.initialPulseData()?.name);
  allImportedQuestionsInBank = computed(() =>
    this.parsedQuestions().length > 0 && this.parsedQuestions().every((question) => question.isInBank),
  );

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
    this.updateQuestion(questionId, (question) => {
      const alreadySelected = this.getCorrectIndexes(question).includes(index);
      const correctAnswerIndexes = alreadySelected
        ? this.getCorrectIndexes(question).filter((selectedIndex) => selectedIndex !== index)
        : [...this.getCorrectIndexes(question), index].sort((left, right) => left - right);

      return {
        ...question,
        correctAnswerIndexes,
        correctAnswerIndex: correctAnswerIndexes[0] ?? null,
      };
    });
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

  toggleImportedQuestionBank(questionId: string, inBank: boolean): void {
    this.parsedQuestions.update((questions) =>
      questions.map((question) => (question.id === questionId ? { ...question, isInBank: inBank } : question)),
    );
  }

  setAllImportedQuestionsInBank(inBank: boolean): void {
    this.parsedQuestions.update((questions) => questions.map((question) => ({ ...question, isInBank: inBank })));
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
    this.importErrors.set([]);
    this.parsedQuestions.set([]);
  }

  downloadTemplate(): void {
    const blob = new Blob([this.CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_quiz_importacao.csv');
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
    if (this.parsedQuestions().length === 0 || this.importErrors().length > 0) {
      return;
    }

    const importedQuestions = this.parsedQuestions().map((question) => this.normalizeQuestion(question));
    this.quiz.update((quiz) => ({
      ...quiz,
      questions: [...(quiz.questions ?? []), ...importedQuestions],
    }));

    importedQuestions
      .filter((question) => question.isInBank)
      .forEach((question) => upsertQuestionInBank(question));

    this.expandedQuestionIds.set(importedQuestions.map((question) => question.id));
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
    this.importErrors.set([]);
    this.parsedQuestions.set([]);

    const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
    if (!isCsv) {
      this.importErrors.set(['Formato de arquivo inválido. Envie um arquivo .csv.']);
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
      this.importErrors.set(['Não foi possível ler o arquivo.']);
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

      const header = this.parseCsvRow(lines[0]).map((item) => item.trim().toUpperCase());
      const requiredHeaders = ['ID', 'ENUNCIADO', 'ALTERNATIVA', 'CORRETA'];
      if (!requiredHeaders.every((item) => header.includes(item))) {
        throw new Error('O cabeçalho do arquivo CSV é inválido. Use o modelo disponibilizado.');
      }

      const groups = new Map<string, ParsedCsvQuestionGroup>();
      const errors: string[] = [];

      for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
        const row = this.parseCsvRow(lines[lineIndex]);
        const id = this.getColumnValue(header, row, 'ID');
        const questionText = this.getColumnValue(header, row, 'ENUNCIADO');
        const alternative = this.getColumnValue(header, row, 'ALTERNATIVA');
        const correctValue = this.getColumnValue(header, row, 'CORRETA');
        const lineNumber = lineIndex + 1;

        if (!id) {
          errors.push(`Linha ${lineNumber}: o campo ID é obrigatório.`);
          continue;
        }

        if (!correctValue) {
          errors.push(`Linha ${lineNumber}: o campo CORRETA é obrigatório.`);
          continue;
        }

        const isCorrect = this.parseCorrectFlag(correctValue);
        if (isCorrect == null) {
          errors.push(`Linha ${lineNumber}: o campo CORRETA deve ser preenchido com SIM ou NAO.`);
          continue;
        }

        if (!alternative) {
          errors.push(`Linha ${lineNumber}: a alternativa é obrigatória.`);
          continue;
        }

        const group = groups.get(id) ?? {
          id,
          questionText: '',
          alternatives: [],
          correctAnswerIndexes: [],
        };

        if (questionText && !group.questionText) {
          group.questionText = questionText;
        }

        group.alternatives.push(alternative);
        if (isCorrect) {
          group.correctAnswerIndexes.push(group.alternatives.length - 1);
        }

        groups.set(id, group);
      }

      const questions = Array.from(groups.values()).map((group, index) => {
        if (group.alternatives.length < 2) {
          errors.push(`Questão ${group.id}: é obrigatório informar pelo menos 2 alternativas.`);
        }

        if (group.correctAnswerIndexes.length === 0) {
          errors.push(`Questão ${group.id}: informe ao menos uma alternativa correta.`);
        }

        return this.normalizeQuestion({
          id: `csv_${group.id}_${Date.now()}_${index}`,
          questionType: 'multipleChoice',
          questionText: group.questionText || group.id,
          alternatives: group.alternatives,
          correctAnswerIndexes: group.correctAnswerIndexes,
          correctAnswerIndex: group.correctAnswerIndexes[0] ?? null,
          imageUrl: null,
          imagePosition: 'before',
          isInBank: false,
        });
      });

      if (errors.length > 0) {
        this.importErrors.set(errors);
        this.parsedQuestions.set([]);
        return;
      }

      if (questions.length === 0) {
        throw new Error('Nenhuma questão válida foi encontrada no arquivo.');
      }

      this.importErrors.set([]);
      this.parsedQuestions.set(questions);
    } catch (error: any) {
      this.importErrors.set([error.message]);
      this.importFile.set(null);
      this.parsedQuestions.set([]);
    }
  }

  private parseCsvRow(row: string): string[] {
    const values: string[] = [];
    let current = '';
    let isInsideQuotes = false;

    for (let index = 0; index < row.length; index++) {
      const character = row[index];

      if (character === '"') {
        const nextCharacter = row[index + 1];
        if (isInsideQuotes && nextCharacter === '"') {
          current += '"';
          index++;
        } else {
          isInsideQuotes = !isInsideQuotes;
        }
        continue;
      }

      if (character === ',' && !isInsideQuotes) {
        values.push(current.trim());
        current = '';
        continue;
      }

      current += character;
    }

    values.push(current.trim());
    return values;
  }

  private getColumnValue(header: string[], row: string[], columnName: string): string {
    const index = header.indexOf(columnName);
    return index === -1 ? '' : (row[index] ?? '').trim();
  }

  private parseCorrectFlag(value: string): boolean | null {
    const normalized = value.trim().toUpperCase();
    if (['SIM', 'TRUE', '1', 'S'].includes(normalized)) return true;
    if (['NAO', 'NÃO', 'FALSE', '0', 'N'].includes(normalized)) return false;
    return null;
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
