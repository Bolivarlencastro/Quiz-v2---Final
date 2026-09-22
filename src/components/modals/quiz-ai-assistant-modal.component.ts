
import { Component, ChangeDetectionStrategy, output, signal, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Pulse, ContentItem, QuizQuestion } from '../../types';
import { EMPTY_PULSE } from '../../mock-data';

// Simula o tempo de processamento/transcrição assíncrona de um conteúdo no backend.
// Conteúdos sem `createdAt` (ex: mocks legados) são tratados como já processados.
export const CONTENT_PROCESSING_DURATION_MS = 15000;

export type ContentProcessingStatus = 'processing' | 'processed' | 'error';

@Component({
  selector: 'app-quiz-ai-assistant-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './quiz-ai-assistant-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizAiAssistantModalComponent {
  contextContent = input<ContentItem[]>([]);
  // Controles de teste vindos do debug FAB do wizard (corner/edge cases) —
  // não representam controles reais de produto.
  simulateFailure = input<boolean>(false);
  forceAllEligible = input<boolean>(false);
  forceAllError = input<boolean>(false);
  loseEligibilityOnRefresh = input<boolean>(false);

  close = output<void>();
  back = output<void>();
  quizGenerated = output<Pulse>();

  numberOfQuestions = signal<number>(5);
  answersPerQuestion = signal<number>(4);
  isLoading = signal<boolean>(false);
  loadingMessage = signal<string>('');
  selectedContentIds = signal<Set<string>>(new Set());
  generationError = signal<string | null>(null);

  // Incrementado apenas pelo clique no botão "Atualizar" — não há polling nem
  // atualização automática. É o que força a reavaliação do status de cada conteúdo.
  private refreshTick = signal<number>(0);
  isCheckingStatus = signal<boolean>(false);

  // Conteúdos que, num "Atualizar" anterior, foram derrubados para erro pelo
  // toggle de debug "perder elegibilidade" — permanece assim até o modal reabrir.
  private forcedErrorIds = signal<Set<string>>(new Set());

  private contentStatusById = computed<Map<string, ContentProcessingStatus>>(() => {
    this.refreshTick();
    const now = Date.now();
    const forceAllEligible = this.forceAllEligible();
    const forceAllError = this.forceAllError();
    const forcedErrorIds = this.forcedErrorIds();
    const map = new Map<string, ContentProcessingStatus>();
    for (const content of this.contextContent()) {
      if (forcedErrorIds.has(content.id) || forceAllError) {
        map.set(content.id, 'error');
        continue;
      }
      const isProcessed = forceAllEligible || !content.createdAt || (now - content.createdAt) >= CONTENT_PROCESSING_DURATION_MS;
      map.set(content.id, isProcessed ? 'processed' : 'processing');
    }
    return map;
  });

  eligibleContent = computed<ContentItem[]>(() =>
    this.contextContent().filter(c => this.isEligible(c.id))
  );

  hasEligibleContent = computed<boolean>(() => this.eligibleContent().length > 0);

  hasErrorContent = computed<boolean>(() =>
    this.contextContent().some(c => this.contentStatus(c.id) === 'error')
  );

  contentStatus(contentId: string): ContentProcessingStatus {
    return this.contentStatusById().get(contentId) ?? 'processed';
  }

  isEligible(contentId: string): boolean {
    return this.contentStatus(contentId) === 'processed';
  }

  isSelected(contentId: string): boolean {
    return this.selectedContentIds().has(contentId);
  }

  toggleSelection(contentId: string): void {
    if (!this.isEligible(contentId)) {
      return;
    }
    this.selectedContentIds.update(currentSet => {
      if (currentSet.has(contentId)) {
        currentSet.delete(contentId);
      } else {
        currentSet.add(contentId);
      }
      return new Set(currentSet);
    });
    this.generationError.set(null);
  }

  refreshContentStatus(): void {
    if (this.isCheckingStatus()) {
      return;
    }
    this.isCheckingStatus.set(true);
    // Feedback breve e único (não é um spinner contínuo): simula a consulta
    // manual de status disparada pelo usuário ao clicar em "Atualizar".
    setTimeout(() => {
      if (this.loseEligibilityOnRefresh() && this.forcedErrorIds().size === 0) {
        const target = this.eligibleContent()[0];
        if (target) {
          this.forcedErrorIds.update(ids => new Set(ids).add(target.id));
          this.selectedContentIds.update(current => {
            const next = new Set(current);
            next.delete(target.id);
            return next;
          });
        }
      }
      this.refreshTick.update(v => v + 1);
      this.isCheckingStatus.set(false);
    }, 600);
  }

  generateQuiz(): void {
    if (this.selectedContentIds().size === 0 || this.isLoading()) {
      return;
    }

    this.generationError.set(null);
    this.isLoading.set(true);
    const messages = [
        "Analisando seu pedido e conteúdos...",
        "Gerando questões sobre o tema...",
        "Criando alternativas e definindo respostas...",
        "Montando o rascunho do quiz..."
    ];
    let messageIndex = 0;
    this.loadingMessage.set(messages[messageIndex]);

    const interval = setInterval(() => {
        messageIndex++;
        if (messageIndex < messages.length) {
            this.loadingMessage.set(messages[messageIndex]);
        } else {
            clearInterval(interval);
        }
    }, 1200);

    setTimeout(() => {
      clearInterval(interval);

      if (this.simulateFailure()) {
        this.isLoading.set(false);
        this.generationError.set('Não foi possível gerar o quiz agora. A seleção de conteúdos foi mantida — você pode tentar novamente.');
        return;
      }

      const selectedContent = this.contextContent().filter(c => this.selectedContentIds().has(c.id));
      const baseName = selectedContent[0].title;

      const newQuestions: QuizQuestion[] = [];
      for (let i = 0; i < this.numberOfQuestions(); i++) {
        const alternatives: string[] = [];
        for (let j = 0; j < this.answersPerQuestion(); j++) {
          alternatives.push(`Alternativa ${j + 1} para a questão ${i + 1}`);
        }
        newQuestions.push({
          id: `q_${Date.now()}_${i}`,
          // FIX: Add missing questionType property
          questionType: 'multipleChoice',
          questionText: `Esta é a pergunta ${i + 1} sobre "${baseName}"?`,
          alternatives: alternatives,
          correctAnswerIndex: 0, // Mock correct answer as the first one
          imageUrl: null,
          imagePosition: 'before',
          isInBank: false,
        });
      }

      const newQuiz: Pulse = {
        ...JSON.parse(JSON.stringify(EMPTY_PULSE)),
        type: 'quiz',
        name: `Quiz sobre: ${baseName}`,
        description: `Este quiz foi gerado por IA. Revise as questões e configurações.`,
        status: 'draft',
        generatedByAi: true,
        questions: newQuestions
      };
      
      this.isLoading.set(false);
      this.quizGenerated.emit(newQuiz);
    }, 5000); // Simulate generation time
  }
}
