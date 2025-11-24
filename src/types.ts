export interface Course {
  name: string;
  internalCode: string;
  category: string;
  language: string;
  description: string;
  bannerUrl: string | null;
  cardUrl: string | null;
  workload: string; // e.g., "02:30"
  courseType: string;
  evaluationType: string;

  // Settings from Step 3
  isActive: boolean;
  enableSatisfactionSurvey: boolean;
  allowRetake: boolean;
  allowRetakeForFailed: boolean;
  minimumPerformanceRequired: boolean;
  hasCustomMetadata: boolean;
  isTemporary: boolean;
  contentLocking: {
    enabled: boolean;
    minimumTime: number; // in percentage
  };
  hasCustomCertificate: boolean;

  visibility: 'internal' | 'external';
  topics: Topic[];
}

export interface Topic {
  id: string;
  title: string;
  contents: ContentItem[];
}

export type ContentType = 'video' | 'audio' | 'image' | 'document' | 'web' | 'scorm' | 'quiz';

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  source: string; // URL, file path, etc.
  quizData?: Pulse;
}

export type PulseType = 'file' | 'link' | 'quiz' | 'text';

export interface QuizQuestion {
  id: string;
  questionType: 'multipleChoice' | 'openText';
  questionText: string;
  imageUrl?: string | null;
  imagePosition?: 'before' | 'after';
  alternatives?: string[];
  correctAnswerIndex?: number | null;
  isInBank?: boolean;
}

export interface QuizConfig {
  questionsToDisplay: number | null;
  randomizeQuestions: boolean;
  randomizeAlternatives: boolean;
  retakeAttempts: number;
  showImmediateFeedback: boolean;
  maxTimeMinutes: number | null;
}

export interface Pulse {
  type: PulseType;
  name: string;
  description: string;
  coverImageUrl: string | null;
  status?: 'draft' | 'published';
  quizType?: 'evaluative' | 'survey';
  // For file type
  fileName?: string;
  // For link type
  linkUrl?: string;
  // For text type
  textContent?: string;
  // For quiz type
  questions?: QuizQuestion[];
  config?: QuizConfig;
}

// FIX: Add missing Trail, TrailContentItem, Event, EventDate, Instructor, SupportMaterial, Channel, and Group types.
export type TrailContentType = 'course' | 'mission' | 'pulse';

export interface TrailContentItem {
  id: string;
  type: TrailContentType;
  title: string;
  duration?: string;
}

export interface Trail {
  name: string;
  description: string;
  bannerUrl: string | null;
  cardUrl: string | null;
  content: TrailContentItem[];
  trailType: string;
  language: string;
  isActive: boolean;
  hasCertificate: boolean;
  expirationDate: string;
}

export interface EventDate {
  id: string;
  startDate: string;
  endDate: string;
}

export interface Instructor {
  id: string;
  name: string;
}

export interface SupportMaterial {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface Event {
  name: string;
  description: string;
  bannerUrl: string | null;
  cardUrl: string | null;
  dates: EventDate[];
  instructors: Instructor[];
  supportMaterials: SupportMaterial[];
  internalCode: string;
  category: string;
  language: string;
  missionType: string;
  evaluationType: string;
  isActive: boolean;
  isEvaluationRequired: boolean;
  minimumPerformance: number;
  completionGoalDays: number;
  hasCustomCertificate: boolean;
  address: string;
  callLink: string;
  vacancies: number;
}

export interface Channel {
  name: string;
  description: string;
  coverImageUrl: string | null;
  category: string;
  channelType: string;
  language: string;
  isActive: boolean;
}

export interface Group {
  id: string;
  name: string;
  users: number;
  missions: number;
  learning_trails: number;
  channels: number;
  is_integration?: boolean;
}