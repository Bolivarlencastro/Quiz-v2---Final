import { Course, Pulse, Trail, TrailContentItem, Event, Channel, Group } from './types';

export const EMPTY_COURSE: Course = {
  name: '',
  internalCode: '',
  category: 'Sem Categoria',
  language: 'pt-BR',
  description: '',
  bannerUrl: null,
  cardUrl: null,
  workload: '00:00',
  courseType: 'type1',
  evaluationType: 'eval1',
  isActive: true,
  enableSatisfactionSurvey: true,
  allowRetake: false,
  allowRetakeForFailed: false,
  minimumPerformanceRequired: false,
  hasCustomMetadata: false,
  isTemporary: false,
  contentLocking: {
    enabled: false,
    minimumTime: 10
  },
  hasCustomCertificate: false,
  visibility: 'internal',
  topics: []
};


export const MOCK_COURSE_TEMPLATE: Course = {
  name: 'Integração de Novos Colaboradores',
  internalCode: 'INC-2024',
  category: 'Recursos Humanos',
  language: 'pt-BR',
  description: 'Um processo de integração padrão para todos os novos contratados. Cobre a cultura da empresa, políticas e ferramentas essenciais.',
  bannerUrl: null,
  cardUrl: null,
  workload: '08:00',
  courseType: 'type2',
  evaluationType: 'eval2',
  isActive: true,
  enableSatisfactionSurvey: true,
  allowRetake: true,
  allowRetakeForFailed: true,
  minimumPerformanceRequired: false,
  hasCustomMetadata: false,
  isTemporary: false,
  contentLocking: {
    enabled: false,
    minimumTime: 10
  },
  hasCustomCertificate: true,
  visibility: 'internal',
  topics: [
    {
      id: 'topic_1',
      title: 'Módulo 1: Boas-vindas à Empresa',
      contents: [
        { id: 'content_1', type: 'video', title: 'Uma Mensagem do nosso CEO', description: '', source: 'https://www.youtube.com/watch?v=nO_d_J-h3bY'},
        { id: 'content_2', type: 'document', title: 'Manual da Empresa', description: '', source: ''}
      ]
    },
    {
      id: 'topic_2',
      title: 'Módulo 2: Ferramentas e Sistemas',
      contents: [
        { id: 'content_3', type: 'video', title: '6 dicas essenciais de como dar feedback', description: 'Episódio 2', source: 'https://www.youtube.com/watch?v=3z_PYm_H50I'}
      ]
    }
  ]
};

export const EMPTY_PULSE: Pulse = {
  type: 'text',
  name: '',
  description: '',
  coverImageUrl: null,
  status: 'draft',
  quizType: 'evaluative',
  fileName: '',
  linkUrl: '',
  textContent: '',
  questions: [],
  config: {
    questionsToDisplay: null,
    randomizeQuestions: false,
    randomizeAlternatives: false,
    retakeAttempts: 1,
    showImmediateFeedback: true,
    maxTimeMinutes: null
  }
};

// FIX: Add missing mock data for Trail, Event, Channel, and Group features.
export const MOCK_SEARCHABLE_CONTENT: TrailContentItem[] = [
  { id: 'course_1', type: 'course', title: 'Curso: Onboarding de Vendas', duration: '45 min' },
  { id: 'pulse_1', type: 'pulse', title: 'Pulse: Vídeo Motivacional', duration: '5 min' },
  { id: 'mission_1', type: 'mission', title: 'Missão: Primeiras Ligações', duration: '2h' },
  { id: 'course_2', type: 'course', title: 'Curso: Técnicas de Negociação', duration: '1h 30min' },
  { id: 'pulse_2', type: 'pulse', title: 'Pulse: Artigo sobre Fechamento', duration: '10 min' },
];

export const MOCK_TRAIL_TEMPLATE: Trail = {
  name: 'Trilha de Exemplo',
  description: 'Uma trilha de aprendizado para novos funcionários.',
  bannerUrl: null,
  cardUrl: null,
  content: [
    { id: 'course_1', type: 'course', title: 'Curso: Onboarding de Vendas' },
    { id: 'mission_1', type: 'mission', title: 'Missão: Primeiras Ligações' },
  ],
  trailType: 'Técnico',
  language: 'pt-BR',
  isActive: true,
  hasCertificate: false,
  expirationDate: '',
};

export const MOCK_EVENT_TEMPLATE: Event = {
  name: 'Evento de Exemplo',
  description: 'Um evento de exemplo gerado para demonstração.',
  bannerUrl: null,
  cardUrl: null,
  dates: [
    { id: 'date_1', startDate: '2024-09-01T09:00', endDate: '2024-09-01T17:00' }
  ],
  instructors: [
    { id: 'inst_1', name: 'João da Silva' }
  ],
  supportMaterials: [],
  internalCode: 'EVT-001',
  category: 'Treinamento',
  language: 'pt-BR',
  missionType: 'online',
  evaluationType: 'eval1',
  isActive: true,
  isEvaluationRequired: true,
  minimumPerformance: 70,
  completionGoalDays: 7,
  hasCustomCertificate: true,
  address: '',
  callLink: 'https://meet.google.com/xyz-abc-def',
  vacancies: 100,
};

export const MOCK_CHANNEL_TEMPLATE: Channel = {
  name: 'Canal de Exemplo',
  description: 'Um canal sobre as novidades da empresa.',
  coverImageUrl: null,
  category: 'Comunicação Interna',
  channelType: 'Notícias',
  language: 'pt-BR',
  isActive: true,
};

export const MOCK_GROUPS: Group[] = [
  { id: '1', name: 'Todos os colaboradores', users: 150, missions: 12, learning_trails: 5, channels: 3, is_integration: true },
  { id: '2', name: 'Equipe de Vendas', users: 25, missions: 8, learning_trails: 2, channels: 2 },
  { id: '3', name: 'Desenvolvimento', users: 40, missions: 5, learning_trails: 3, channels: 2 },
];