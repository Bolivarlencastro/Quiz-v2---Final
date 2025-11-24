



import { Component, ChangeDetectionStrategy, output, input, signal, effect, computed, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Pulse, QuizQuestion } from '../../types';
import { SimpleTextEditorComponent } from '../simple-text-editor/simple-text-editor.component';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { QuestionBankModalComponent } from './question-bank-modal.component';

type ActiveTab = 'questions' | 'settings';
type ViewState = 'editor' | 'import';

@Component({
  selector: 'app-quiz-editor-modal',
  imports: [CommonModule, FormsModule, SimpleTextEditorComponent, TooltipDirective, QuestionBankModalComponent],
  templateUrl: './quiz-editor-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizEditorModalComponent {
  initialPulseData = input.required<Pulse>();
  highlightTarget = input<string | null>(null);
  
  close = output<void>();
  save = output<Pulse>();

  quiz = signal<Pulse>({} as Pulse);
  activeTab = signal<ActiveTab>('questions');
  viewState = signal<ViewState>('editor');
  
  // State for inline editing
  editingQuestionId = signal<string | 'new' | null>(null);
  inlineFormQuestion = signal<QuizQuestion | null>(null);

  // State for drag and drop
  draggedQuestionId = signal<string | null>(null);

  isBankOpen = signal<boolean>(false);
  highlightedElementId = signal<string | null>(null);
  
  private elementRef = inject(ElementRef);


  // --- Import state (merged from QuizImportModalComponent) ---
  draggingOver = signal(false);
  importFile = signal<File | null>(null);
  importError = signal<string | null>(null);
  parsedQuestions = signal<QuizQuestion[]>([]);
  readonly CSV_TEMPLATE = `ENUNCIADO,ALTERNATIVA A,ALTERNATIVA B,ALTERNATIVA C,ALTERNATIVA D,ALTERNATIVA E,ALTERNATIVA F,ALTERNATIVA G,ALTERNATIVA H,ALTERNATIVA I,ALTERNATIVA J,ALTERNATIVA CORRETA\n"Qual destes animais é um mamífero?","Golfinho","Pardal","Tartaruga","","","","","","","","A"`;


  isEditing = computed(() => !!this.initialPulseData()?.name);
  
  canPublish = computed(() => {
    const q = this.quiz();
    return q.name.trim().length > 0 && (q.questions ?? []).length > 0;
  });
  
  constructor() {
    effect(() => {
        this.quiz.set(JSON.parse(JSON.stringify(this.initialPulseData())));
    });

    // Effect to handle highlighting requests
    effect(() => {
      const target = this.highlightTarget();
      if (!target) return;

      // Handle navigation within the modal
      if (target.startsWith('quiz-setting-')) {
        this.activeTab.set('settings');
      } else if (target === 'quiz-import') {
        this.viewState.set('import');
      } else if (target === 'quiz-question-bank') {
        this.isBankOpen.set(true);
      } else if (target === 'quiz-image') {
        // If no questions, add one to show the editor for the image
        if ((this.quiz().questions ?? []).length === 0 && !this.editingQuestionId()) {
            this.addQuestion();
        } else if (!this.editingQuestionId()) {
            // if questions exist but none are being edited, edit the first one
            const firstQuestion = this.quiz().questions?.[0];
            if (firstQuestion) {
                this.editQuestion(firstQuestion);
            }
        }
      }
      
      this.highlightedElementId.set(target);

      // Scroll to element and remove highlight after animation
      setTimeout(() => {
          const element = this.elementRef.nativeElement.querySelector(`#${target}`);
          if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          setTimeout(() => {
              this.highlightedElementId.set(null);
          }, 2000); // Must be same duration as animation
      }, 100); // Delay to allow tab/view to switch

    }, { allowSignalWrites: true });
  }

  updateField(field: keyof Pulse, value: any): void {
    this.quiz.update(p => ({ ...p, [field]: value }));
  }

  updateConfigField(field: keyof Pulse['config'], value: any): void {
    this.quiz.update(p => {
      const newConfig = { ...p.config!, [field]: value };
      return {
        ...p,
        config: newConfig
      };
    });
  }
  
  addQuestion(): void {
    const newQuestion: QuizQuestion = {
      id: `q_new_${Date.now()}`,
      questionType: 'multipleChoice',
      questionText: '',
      imageUrl: null,
      imagePosition: 'before',
      alternatives: ['', ''], // Start with two alternatives
      correctAnswerIndex: 0,
      isInBank: false,
    };
    this.editingQuestionId.set('new');
    this.inlineFormQuestion.set(newQuestion);
  }

  addQuestionsFromBank(selectedQuestions: QuizQuestion[]): void {
    const newQuestions = selectedQuestions.map(q => {
      const newQ = JSON.parse(JSON.stringify(q));
      newQ.id = `q_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      return newQ;
    });

    this.quiz.update(p => ({
      ...p,
      questions: [...(p.questions ?? []), ...newQuestions]
    }));

    this.isBankOpen.set(false);
  }

  editQuestion(question: QuizQuestion): void {
    this.editingQuestionId.set(question.id);
    this.inlineFormQuestion.set(JSON.parse(JSON.stringify(question))); // Edit a deep copy
  }
  
  cancelInlineEdit(): void {
    this.editingQuestionId.set(null);
    this.inlineFormQuestion.set(null);
  }

  saveInlineQuestion(): void {
    const questionToSave = this.inlineFormQuestion();
    if (!questionToSave) return;

    this.quiz.update(p => {
      const questions = p.questions ? [...p.questions] : [];
      
      if (this.editingQuestionId() === 'new') {
        // It's a new question, give it a permanent ID
        questionToSave.id = `q_${Date.now()}`;
        questions.push(questionToSave);
      } else {
        const existingIndex = questions.findIndex(q => q.id === questionToSave.id);
        if (existingIndex > -1) {
          questions[existingIndex] = questionToSave;
        }
      }
      return { ...p, questions };
    });
    
    this.cancelInlineEdit();
  }

  duplicateQuestion(questionId: string): void {
     this.quiz.update(p => {
      const questions = p.questions ? [...p.questions] : [];
      const questionIndex = questions.findIndex(q => q.id === questionId);
      if (questionIndex === -1) return p;

      const original = questions[questionIndex];
      const duplicate: QuizQuestion = {
        ...JSON.parse(JSON.stringify(original)),
        id: `q_${Date.now()}`
      };
      
      questions.splice(questionIndex + 1, 0, duplicate);
      return { ...p, questions };
    });
  }

  deleteQuestion(questionId: string): void {
    this.quiz.update(p => ({
      ...p,
      questions: p.questions?.filter(q => q.id !== questionId)
    }));
  }

  handlePublish(): void {
    const finalQuiz = this.quiz();
    finalQuiz.status = 'published';
    this.save.emit(finalQuiz);
  }

  // --- View State Methods ---
  switchToImportView(): void {
    this.viewState.set('import');
  }

  switchToEditorView(): void {
    this.viewState.set('editor');
    // Reset import state
    this.draggingOver.set(false);
    this.importFile.set(null);
    this.importError.set(null);
    this.parsedQuestions.set([]);
  }

  // --- Import Logic Methods ---
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
    if (input.files && input.files[0]) {
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
    reader.onload = (e) => {
      const text = e.target?.result as string;
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
      const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) {
        throw new Error('O arquivo CSV está vazio ou contém apenas o cabeçalho.');
      }

      const header = lines[0].split(',').map(h => h.trim().toUpperCase());
      const expectedHeader = ['ENUNCIADO', 'ALTERNATIVA A', 'ALTERNATIVA CORRETA'];
      if (!expectedHeader.every(h => header.includes(h))) {
        throw new Error('O cabeçalho do arquivo CSV é inválido. Verifique o modelo.');
      }

      const questions: QuizQuestion[] = [];
      for (let i = 1; i < lines.length; i++) {
        const data = lines[i].split(','); 
        
        const questionText = data[header.indexOf('ENUNCIADO')]?.replace(/"/g, '').trim();
        if (!questionText) continue;

        const alternatives: string[] = [];
        for (let j = 1; j <= 10; j++) {
            const altHeader = `ALTERNATIVA ${String.fromCharCode(64 + j)}`;
            const altIndex = header.indexOf(altHeader);
            if (altIndex > -1 && data[altIndex]?.trim()) {
                alternatives.push(data[altIndex].replace(/"/g, '').trim());
            }
        }
        
        const correctAnswerLetter = data[header.indexOf('ALTERNATIVA CORRETA')]?.trim().toUpperCase();
        if (!correctAnswerLetter || alternatives.length < 2) continue;

        const correctAnswerIndex = correctAnswerLetter.charCodeAt(0) - 65;
        if (correctAnswerIndex < 0 || correctAnswerIndex >= alternatives.length) continue;

        questions.push({
          id: `csv_${Date.now()}_${i}`,
          questionType: 'multipleChoice',
          questionText: questionText,
          alternatives: alternatives,
          correctAnswerIndex: correctAnswerIndex,
          imageUrl: null,
          imagePosition: 'before',
          isInBank: false,
        });
      }

      if (questions.length === 0) {
        throw new Error('Nenhuma questão válida foi encontrada no arquivo.');
      }

      this.parsedQuestions.set(questions);

    } catch (e: any) {
      this.importError.set(e.message);
      this.importFile.set(null);
      this.parsedQuestions.set([]);
    }
  }

  handleImport(): void {
    if (this.parsedQuestions().length > 0) {
      this.quiz.update(p => ({
        ...p,
        questions: [...(p.questions ?? []), ...this.parsedQuestions()]
      }));
    }
    this.switchToEditorView();
  }

  // --- Inline Form Methods ---
  addAlternative(): void {
    this.inlineFormQuestion.update(q => {
      if (!q || !q.alternatives) return null;
      const newAlts = [...q.alternatives, ''];
      return { ...q, alternatives: newAlts };
    });
  }

  removeAlternative(indexToRemove: number): void {
    this.inlineFormQuestion.update(q => {
      if (!q || !q.alternatives || q.alternatives.length <= 2) return q;
      const newAlts = q.alternatives.filter((_, index) => index !== indexToRemove);
      
      if (q.correctAnswerIndex != null && q.correctAnswerIndex >= newAlts.length) {
        q.correctAnswerIndex = newAlts.length - 1;
      }

      return { ...q, alternatives: newAlts };
    });
  }
  
  updateQuestionText(newText: string): void {
    this.inlineFormQuestion.update(q => {
      if (!q) return null;
      return { ...q, questionText: newText };
    });
  }

  updateAlternativeText(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.inlineFormQuestion.update(q => {
      if (!q || !q.alternatives) return null;
      const newAlts = [...q.alternatives];
      newAlts[index] = value;
      return {...q, alternatives: newAlts};
    });
  }

  setCorrectAlternative(index: number): void {
     this.inlineFormQuestion.update(q => {
      if (!q) return null;
      return {...q, correctAnswerIndex: index};
    });
  }

  handleImageFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const MAX_SIZE_MB = 2;
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        alert(`O arquivo é muito grande. O tamanho máximo é de ${MAX_SIZE_MB}MB.`);
        input.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX_WIDTH = 640;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            const ratio = MAX_WIDTH / width;
            width = MAX_WIDTH;
            height = height * ratio;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          ctx.drawImage(img, 0, 0, width, height);
          
          const resizedDataUrl = canvas.toDataURL(file.type);

          this.inlineFormQuestion.update(q => {
            if (!q) return null;
            const position = q.imagePosition || 'before';
            return { ...q, imageUrl: resizedDataUrl, imagePosition: position };
          });
        };
        img.onerror = () => {
          alert('Arquivo de imagem inválido.');
          input.value = '';
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  updateImagePosition(position: 'before' | 'after'): void {
    this.inlineFormQuestion.update(q => {
      if (!q) return null;
      return { ...q, imagePosition: position };
    });
  }

  removeImage(): void {
    this.inlineFormQuestion.update(q => {
      if (!q) return null;
      return { ...q, imageUrl: null };
    });
  }

  // --- Drag and Drop Methods ---
  onQuestionDragStart(event: DragEvent, questionId: string): void {
    event.dataTransfer!.effectAllowed = 'move';
    this.draggedQuestionId.set(questionId);
  }

  onQuestionDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onQuestionDrop(event: DragEvent, dropQuestionId: string): void {
    event.preventDefault();
    const draggedId = this.draggedQuestionId();
    if (!draggedId || draggedId === dropQuestionId) return;

    this.quiz.update(p => {
      const questions = [...p.questions!];
      const draggedIndex = questions.findIndex(q => q.id === draggedId);
      const dropIndex = questions.findIndex(q => q.id === dropQuestionId);
      if (draggedIndex === -1 || dropIndex === -1) return p;

      const [draggedItem] = questions.splice(draggedIndex, 1);
      questions.splice(dropIndex, 0, draggedItem);
      
      return { ...p, questions };
    });
    this.draggedQuestionId.set(null);
  }

  onQuestionDragEnd(): void {
    this.draggedQuestionId.set(null);
  }

  // --- Utility ---
  stripHtml(html: string): string {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  }
}