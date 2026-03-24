import { signal } from '@angular/core';
import { QuizQuestion } from './types';

function normalizeQuestion(question: QuizQuestion): QuizQuestion {
  const correctAnswerIndexes = question.correctAnswerIndexes?.length
    ? [...question.correctAnswerIndexes]
    : question.correctAnswerIndex != null
      ? [question.correctAnswerIndex]
      : [];

  return {
    ...question,
    alternatives: [...(question.alternatives ?? [])],
    correctAnswerIndexes,
    correctAnswerIndex: correctAnswerIndexes[0] ?? null,
    isInBank: question.isInBank ?? true,
  };
}

const INITIAL_QUESTION_BANK: QuizQuestion[] = [
  {
    id: 'bq_1',
    questionType: 'multipleChoice',
    questionText: 'O que significa a sigla "CEO"?',
    alternatives: ['Chief Executive Officer', 'Chief Engineering Officer', 'Central Executive Official', 'Corporate Executive Office'],
    correctAnswerIndexes: [0],
    correctAnswerIndex: 0,
    isInBank: true,
  },
  {
    id: 'bq_2',
    questionType: 'multipleChoice',
    questionText: 'Qual destes é um pilar da cultura da nossa empresa?',
    alternatives: ['Inovação Contínua', 'Apenas Resultados', 'Hierarquia Rígida', 'Competição Interna'],
    correctAnswerIndexes: [0],
    correctAnswerIndex: 0,
    isInBank: true,
  },
  {
    id: 'bq_3',
    questionType: 'multipleChoice',
    questionText: 'Qual é a política de home office?',
    alternatives: ['100% Remoto', 'Modelo Híbrido Flexível', 'Apenas Presencial', 'Remoto apenas às sextas'],
    correctAnswerIndexes: [1],
    correctAnswerIndex: 1,
    isInBank: true,
  },
  {
    id: 'bq_4',
    questionType: 'multipleChoice',
    questionText: 'Quais atitudes fortalecem uma cultura de colaboração?',
    alternatives: ['Compartilhar conhecimento', 'Isolar decisões', 'Ouvir o time', 'Evitar feedbacks'],
    correctAnswerIndexes: [0, 2],
    correctAnswerIndex: 0,
    isInBank: true,
  },
];

export const questionBankState = signal<QuizQuestion[]>(
  INITIAL_QUESTION_BANK.map(normalizeQuestion),
);

export function upsertQuestionInBank(question: QuizQuestion): void {
  const normalized = normalizeQuestion(question);
  questionBankState.update((questions) => {
    const existingIndex = questions.findIndex((item) => item.id === normalized.id);
    if (existingIndex === -1) {
      return [...questions, normalized];
    }

    const next = [...questions];
    next[existingIndex] = normalized;
    return next;
  });
}

export function removeQuestionFromBank(questionId: string): void {
  questionBankState.update((questions) => questions.filter((question) => question.id !== questionId));
}
