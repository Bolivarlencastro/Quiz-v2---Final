
import { Component, ChangeDetectionStrategy, output, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Pulse, ContentItem, QuizQuestion } from '../../types';
import { EMPTY_PULSE } from '../../mock-data';

@Component({
  selector: 'app-quiz-ai-assistant-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './quiz-ai-assistant-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizAiAssistantModalComponent {
  contextContent = input<ContentItem[]>([]);

  close = output<void>();
  back = output<void>();
  quizGenerated = output<Pulse>();

  quizTopic = signal<string>('');
  numberOfQuestions = signal<number>(5);
  answersPerQuestion = signal<number>(4);
  isLoading = signal<boolean>(false);
  loadingMessage = signal<string>('');
  selectedContentIds = signal<Set<string>>(new Set());

  isSelected(contentId: string): boolean {
    return this.selectedContentIds().has(contentId);
  }

  toggleSelection(contentId: string): void {
    this.selectedContentIds.update(currentSet => {
      if (currentSet.has(contentId)) {
        currentSet.delete(contentId);
      } else {
        currentSet.add(contentId);
      }
      return new Set(currentSet);
    });
  }

  generateQuiz(): void {
    if ((this.selectedContentIds().size === 0 && !this.quizTopic().trim()) || this.isLoading()) {
      return;
    }

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
      const selectedContent = this.contextContent().filter(c => this.selectedContentIds().has(c.id));
      const baseName = selectedContent.length > 0 ? selectedContent[0].title : this.quizTopic();

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
        questions: newQuestions
      };
      
      this.isLoading.set(false);
      this.quizGenerated.emit(newQuiz);
    }, 5000); // Simulate generation time
  }
}
