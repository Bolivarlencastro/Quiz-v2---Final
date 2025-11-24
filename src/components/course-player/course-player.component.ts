
import { Component, ChangeDetectionStrategy, input, output, signal, computed, inject, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Course, ContentItem, Topic, QuizQuestion } from '../../types';
import { QuizPlayerComponent } from '../quiz-player/quiz-player.component';

@Component({
  selector: 'app-course-player',
  imports: [CommonModule, QuizPlayerComponent],
  templateUrl: './course-player.component.html',
  styleUrls: ['./course-player.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoursePlayerComponent implements OnDestroy {
  course = input.required<Course>();
  isFullScreen = input<boolean>(false);
  theme = input.required<'light' | 'dark'>();
  
  exit = output<void>();
  toggleFullScreen = output<void>();
  toggleTheme = output<void>();

  // UI state
  isIndexCollapsed = signal(false);
  isEntireSidebarCollapsed = signal(false);
  showExitConfirmModal = signal(false);
  private hasInitialized = signal(false);
  
  // Quiz progress state
  quizProgress = signal(0);
  quizProgressText = signal('');

  // Content lock state
  isContentLocked = signal(false);
  lockdownTimer = signal(0);
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  readonly circumference = 2 * Math.PI * 14; // SVG circle radius is 14
  completedContentIds = signal<Set<string>>(new Set());
  showContentBlockedModal = signal(false);


  lockdownProgress = computed(() => {
    if (this.activeContent()?.type === 'quiz') {
      return this.quizProgress();
    }

    const duration = this.course().contentLocking.minimumTime;
    if (!this.isContentLocked()) {
        return 100;
    }
    if (this.activeContent()?.type === 'quiz') {
        return 0; // For quizzes, it's locked with no progress until completion
    }
    if (duration <= 0) {
        return 100; // No duration means unlocked
    }
    const remaining = this.lockdownTimer();
    const progress = ((duration - remaining) / duration) * 100;
    return Math.min(100, Math.max(0, progress));
  });

  // --- DEBUGGER STATE ---
  isDebugMenuOpen = signal(false);
  debugOptions = signal<Record<string, boolean>>({});
  debugMenuOptions = {
    structure: [
      { key: 'manyTopics', label: 'Muitos Tópicos (15+)' },
      { key: 'variedContent', label: 'Conteúdos Variados' },
      { key: 'multipleQuizzes', label: 'Múltiplos Quizzes' },
    ],
    quiz: [
      { key: 'longQuestionText', label: 'Textos Longos nas Perguntas' },
      { key: 'longAnswerText', label: 'Textos Longos nas Respostas' },
      { key: 'imageBeforeText', label: 'Pergunta com Imagem (Antes)' },
      { key: 'imageAfterText', label: 'Pergunta com Imagem (Depois)' },
      { key: 'manyQuestions', label: 'Muitas Perguntas (20)' },
      { key: 'fewQuestions', label: 'Poucas Perguntas (1)' },
      { key: 'manyAnswers', label: 'Muitas Alternativas (6)' },
      { key: 'fewAnswers', label: 'Poucas Alternativas (2)' },
      { key: 'shortTimeLimit', label: 'Tempo Curto (1 min)' },
      { key: 'noFeedback', label: 'Sem Feedback Imediato' },
    ]
  };

  // The course data that is actually rendered, potentially modified by debug options.
  displayedCourse = computed(() => {
    const originalCourse = this.course();
    const options = this.debugOptions();
    const structureOptions = this.debugMenuOptions.structure.map(o => o.key);
    
    if (structureOptions.some(key => options[key])) {
        return this.applyCourseDebugTransformations(originalCourse, options);
    }
    return originalCourse;
  });

  // Content state derived from the displayed course
  public allContentItems = computed<ContentItem[]>(() =>
    this.displayedCourse().topics.flatMap(topic => topic.contents)
  );
  public activeContentIndex = signal(0);

  private baseActiveContent = computed<ContentItem | null>(() => {
    const all = this.allContentItems();
    if (all.length > 0) {
      return all[this.activeContentIndex()] ?? null;
    }
    return null;
  });
  
  activeContent = computed<ContentItem | null>(() => {
    const content = this.baseActiveContent();
    const options = this.debugOptions();
    
    if (content?.type !== 'quiz' || Object.values(options).every(v => !v)) {
        return content;
    }
    return this.applyQuizDebugTransformations(content, options);
  });

  activeTopicId = computed<string | null>(() => {
    const content = this.baseActiveContent();
    if (!content) return null;
    return this.displayedCourse().topics.find(t => t.contents.some(c => c.id === content.id))?.id ?? null;
  });

  activeTopicIndex = computed<number>(() => {
    const topicId = this.activeTopicId();
    if (!topicId) return -1;
    return this.displayedCourse().topics.findIndex(t => t.id === topicId);
  });

  activeContentIndexInTopic = computed<number>(() => {
    const topicId = this.activeTopicId();
    const contentId = this.baseActiveContent()?.id;
    if (!topicId || !contentId) return -1;
    const topic = this.displayedCourse().topics.find(t => t.id === topicId);
    if (!topic) return -1;
    return topic.contents.findIndex(c => c.id === contentId);
  });
  
  expandedTopics = signal<Set<string>>(new Set());
  
  private sanitizer = inject(DomSanitizer);
  
  safeVideoUrl = computed<SafeResourceUrl | null>(() => {
    const content = this.activeContent();
    if (content?.type === 'video' && content.source && content.source.includes('youtube.com/watch?v=')) {
      const videoId = content.source.split('v=')[1]?.split('&')[0];
      if (videoId) {
        const url = `https://www.youtube.com/embed/${videoId}`;
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
      }
    }
    return null;
  });

  constructor() {
    // Effect to expand the topic of the active content if user collapses it and navigates back
    effect(() => {
      const topicId = this.activeTopicId();
      if (topicId) {
        this.expandedTopics.update(set => {
          set.add(topicId);
          return new Set(set);
        });
      }
    });

    // Initialize topics to expanded and select first content item, ONCE.
    effect(() => {
      const course = this.displayedCourse();
      if (course?.topics && !this.hasInitialized()) {
        // Expand all topics initially
        const allTopicIds = new Set(course.topics.map(t => t.id));
        this.expandedTopics.set(allTopicIds);

        // Select first content item
        if (course.topics[0]?.contents?.[0]) {
          this.selectContent(course.topics[0].contents[0]);
        }

        this.hasInitialized.set(true);
      }
    }, { allowSignalWrites: true });

    // Effect to manage the content lock timer
    effect(() => {
        this.startContentLockTimer();
    }, { allowSignalWrites: true });
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
        clearInterval(this.timerInterval);
    }
  }

  isCompleted(contentId: string): boolean {
    return this.completedContentIds().has(contentId);
  }

  isAccessible(contentId: string): boolean {
    if (!this.course().contentLocking.enabled) {
      return true;
    }
    const all = this.allContentItems();
    const index = all.findIndex(c => c.id === contentId);
    if (index <= 0) {
      return true;
    }
    const prevContentId = all[index - 1].id;
    return this.completedContentIds().has(prevContentId);
  }

  private markContentAsCompleted(contentId: string): void {
    this.completedContentIds.update(set => {
      set.add(contentId);
      return new Set(set);
    });
  }

  private startContentLockTimer(): void {
    if (this.timerInterval) {
        clearInterval(this.timerInterval);
    }
    this.isContentLocked.set(false);
    this.lockdownTimer.set(0);

    const course = this.course();
    const content = this.activeContent();
    if (!content) return;

    // If already completed, it can't be locked.
    if (this.isCompleted(content.id)) {
        return;
    }

    const isLastContent = this.activeContentIndex() === this.allContentItems().length - 1;

    if (!course.contentLocking.enabled || isLastContent) {
        // If locking is disabled, or it's the last item, mark as complete upon viewing.
        this.markContentAsCompleted(content.id);
        return;
    }
    
    if (content?.type === 'quiz') {
        this.isContentLocked.set(true);
    } else {
        const duration = course.contentLocking.minimumTime;
        if (duration > 0) {
            this.isContentLocked.set(true);
            this.lockdownTimer.set(duration);
            this.timerInterval = setInterval(() => {
                this.lockdownTimer.update(t => {
                    const newTime = t - 1;
                    if (newTime <= 0) {
                        if (this.timerInterval) clearInterval(this.timerInterval);
                        this.isContentLocked.set(false);
                        this.markContentAsCompleted(content.id);
                        return 0;
                    }
                    return newTime;
                });
            }, 1000);
        } else {
            // If duration is 0, mark as complete immediately
            this.markContentAsCompleted(content.id);
        }
    }
  }

  handleQuizCompletion(): void {
    const content = this.activeContent();
    if (content) {
      this.markContentAsCompleted(content.id);
    }
    this.isContentLocked.set(false);
  }

  handleQuizProgress(progress: number): void {
    this.quizProgress.set(progress);
  }

  handleQuizProgressText(text: string): void {
    this.quizProgressText.set(text);
  }

  toggleIndex(): void {
    this.isIndexCollapsed.update(v => !v);
  }

  toggleEntireSidebar(): void {
    this.isEntireSidebarCollapsed.update(v => !v);
  }

  isTopicExpanded(topicId: string): boolean {
    return this.expandedTopics().has(topicId);
  }

  toggleTopicExpansion(topicId: string): void {
    this.expandedTopics.update(set => {
      if (set.has(topicId)) {
        set.delete(topicId);
      } else {
        set.add(topicId);
      }
      return new Set(set);
    });
  }

  selectContent(content: ContentItem) {
    if (!this.isAccessible(content.id)) {
      this.showContentBlockedModal.set(true);
      return;
    }
    const index = this.allContentItems().findIndex(c => c.id === content.id);
    if (index !== -1) {
      this.activeContentIndex.set(index);
    }
  }

  nextContent(): void {
    if (this.activeContentIndex() < this.allContentItems().length - 1) {
      this.activeContentIndex.update(i => i + 1);
    }
  }

  prevContent(): void {
    if (this.activeContentIndex() > 0) {
      this.activeContentIndex.update(i => i - 1);
    }
  }
  
  confirmExit() {
    this.showExitConfirmModal.set(false);
    this.exit.emit();
  }
  
  cancelExit() {
    this.showExitConfirmModal.set(false);
  }
  
  getContentIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      video: 'smart_display',
      audio: 'volume_up',
      image: 'image',
      document: 'article',
      web: 'link',
      scorm: 'extension',
      quiz: 'quiz',
    };
    return iconMap[type] || 'help_outline';
  }

  // --- DEBUGGER METHODS ---
  toggleDebugMenu(): void {
    this.isDebugMenuOpen.update(v => !v);
  }

  toggleDebugOption(optionKey: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.debugOptions.update(options => ({ ...options, [optionKey]: isChecked }));
  }

  private applyCourseDebugTransformations(course: Course, options: Record<string, boolean>): Course {
    const newCourse: Course = JSON.parse(JSON.stringify(course));

    if (options['variedContent'] || options['multipleQuizzes']) {
        const firstQuiz = newCourse.topics.flatMap(t => t.contents).find(c => c.type === 'quiz');

        newCourse.topics.forEach(topic => {
            if (options['variedContent']) {
                topic.contents.push(
                    { id: `debug_video_${topic.id}`, type: 'video', title: 'Debug: Vídeo de Exemplo', description: '', source: 'https://www.youtube.com/watch?v=nO_d_J-h3bY'},
                    { id: `debug_doc_${topic.id}`, type: 'document', title: 'Debug: Documento Importante', description: '', source: ''}
                );
            }
            if (options['multipleQuizzes'] && firstQuiz) {
                const newQuizContent = JSON.parse(JSON.stringify(firstQuiz));
                newQuizContent.id = `debug_quiz_${topic.id}`;
                newQuizContent.title = `Debug: Quiz Adicional`;
                topic.contents.push(newQuizContent);
            }
        });
    }

    if (options['manyTopics']) {
        for (let i = 0; i < 15; i++) {
            newCourse.topics.push({
                id: `debug_topic_${i}`,
                title: `Tópico de Debug ${i + 1}`,
                contents: [
                     { id: `debug_content_${i}`, type: 'document', title: `Conteúdo de Exemplo ${i + 1}`, description: '', source: ''}
                ]
            });
        }
    }
    
    return newCourse;
  }

  private applyQuizDebugTransformations(content: ContentItem, options: Record<string, boolean>): ContentItem {
    const newContent: ContentItem = JSON.parse(JSON.stringify(content));
    const quizData = newContent.quizData;
    if (!quizData) return newContent;

    let questions: QuizQuestion[] = quizData.questions ?? [];
    if (questions.length === 0) {
      questions.push({
        id: 'default_debug_1', questionText: 'Esta é uma pergunta padrão.',
        // FIX: Add missing questionType property
        questionType: 'multipleChoice',
        alternatives: ['Alternativa A', 'Alternativa B'], correctAnswerIndex: 0
      });
    }

    // Amount transformations first
    if (options['manyQuestions']) {
      const baseQuestion = questions[0];
      questions = Array(20).fill(null).map((_, i) => ({
        ...JSON.parse(JSON.stringify(baseQuestion)),
        id: `debug_many_${i}`,
        questionText: `Esta é a pergunta de teste número ${i + 1}. Qual é a resposta correta para este item?`
      }));
    } else if (options['fewQuestions']) {
      questions = questions.slice(0, 1);
    }

    // Content transformations on the resulting question list
    questions = questions.map(q => {
      let newQuestion = { ...q };
      if (options['longQuestionText']) {
        newQuestion.questionText = `<strong>Este é um enunciado de pergunta excepcionalmente longo para testar o comportamento do layout em situações de overflow de texto.</strong> ${'O objetivo é verificar se o alinhamento, quebra de linha e espaçamento se mantêm consistentes e legíveis. '.repeat(5)} A pergunta continua, elaborando sobre um tópico complexo que exige atenção total do usuário para garantir que todos os detalhes sejam compreendidos antes de selecionar uma resposta.`;
      }

      // Handle image position: 'after' takes precedence
      if (options['imageAfterText']) {
        newQuestion.imageUrl = `https://picsum.photos/seed/${q.id}/600/300`;
        newQuestion.imagePosition = 'after';
      } else if (options['imageBeforeText']) {
        newQuestion.imageUrl = `https://picsum.photos/seed/${q.id}/600/300`;
        newQuestion.imagePosition = 'before';
      }

      let alternatives = [...(q.alternatives ?? [])];
      if (options['manyAnswers']) {
        while (alternatives.length < 6) alternatives.push(`Nova Alternativa ${alternatives.length + 1}`);
      } else if (options['fewAnswers']) {
        alternatives = alternatives.slice(0, 2);
        if (newQuestion.correctAnswerIndex && newQuestion.correctAnswerIndex >= 2) newQuestion.correctAnswerIndex = 1;
      }
      
      if (options['longAnswerText']) {
        alternatives = alternatives.map((alt, i) => `[Alternativa ${i + 1}] Esta é uma opção de resposta muito mais longa que o normal, projetada para testar como a interface do usuário lida com várias linhas de texto dentro de um único botão de alternativa, garantindo que a legibilidade e a usabilidade não sejam comprometidas.`);
      }
      
      newQuestion.alternatives = alternatives;
      return newQuestion;
    });

    newContent.quizData!.questions = questions;

    // Config transformations
    const defaultConfig = { questionsToDisplay: null, randomizeQuestions: false, randomizeAlternatives: false, retakeAttempts: 1, showImmediateFeedback: true, maxTimeMinutes: null };
    if (!newContent.quizData!.config) newContent.quizData!.config = defaultConfig;

    if (options['shortTimeLimit']) newContent.quizData!.config!.maxTimeMinutes = 1;
    if (options['noFeedback']) newContent.quizData!.config!.showImmediateFeedback = false;

    return newContent;
  }
}
