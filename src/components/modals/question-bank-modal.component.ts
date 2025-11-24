
import { Component, ChangeDetectionStrategy, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuizQuestion } from '../../types';

// Mock data, in a real app this would come from a service.
const MOCK_QUESTION_BANK: QuizQuestion[] = [
  // FIX: Add missing questionType property
  { id: 'bq_1', questionType: 'multipleChoice', questionText: 'O que significa a sigla "CEO"?', alternatives: ['Chief Executive Officer', 'Chief Engineering Officer', 'Central Executive Official', 'Corporate Executive Office'], correctAnswerIndex: 0, isInBank: true },
  { id: 'bq_2', questionType: 'multipleChoice', questionText: 'Qual destes é um pilar da cultura da nossa empresa?', alternatives: ['Inovação Contínua', 'Apenas Resultados', 'Hierarquia Rígida', 'Competição Interna'], correctAnswerIndex: 0, isInBank: true },
  { id: 'bq_3', questionType: 'multipleChoice', questionText: 'Qual é a política de home office?', alternatives: ['100% Remoto', 'Modelo Híbrido Flexível', 'Apenas Presencial', 'Remoto apenas às sextas'], correctAnswerIndex: 1, isInBank: true },
  { id: 'bq_4', questionType: 'multipleChoice', questionText: 'Qual ferramenta usamos para comunicação interna?', alternatives: ['E-mail', 'WhatsApp', 'Slack', 'Telegram'], correctAnswerIndex: 2, isInBank: true },
  { id: 'bq_5', questionType: 'multipleChoice', questionText: 'Qual o procedimento para solicitar férias?', alternatives: ['Enviar um e-mail para o RH', 'Falar com o gestor direto', 'Utilizar o portal do colaborador', 'Nenhuma das anteriores'], correctAnswerIndex: 2, isInBank: true },
  { id: 'bq_6', questionType: 'multipleChoice', questionText: 'O que é "feedback 360 graus"?', alternatives: ['Uma avaliação feita apenas pelo gestor', 'Uma autoavaliação', 'Uma avaliação que inclui feedback de pares, subordinados e gestores', 'Uma avaliação de desempenho anual'], correctAnswerIndex: 2, isInBank: true },
];

@Component({
  selector: 'app-question-bank-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './question-bank-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionBankModalComponent {
  close = output<void>();
  questionsSelected = output<QuizQuestion[]>();

  private allBankQuestions = signal<QuizQuestion[]>(MOCK_QUESTION_BANK);
  searchQuery = signal<string>('');
  selectedQuestionIds = signal<Set<string>>(new Set());

  filteredQuestions = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.allBankQuestions();
    return this.allBankQuestions().filter(q => q.questionText.toLowerCase().includes(query));
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
    const questionsToAdd = this.allBankQuestions().filter(q => selectedIds.has(q.id));
    this.questionsSelected.emit(questionsToAdd);
  }

  stripHtml(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  }
}
