



import { Component, ChangeDetectionStrategy, input, output, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Course, Topic, ContentItem, ContentType, Pulse, QuizQuestion } from '../../types';
import { CreationWizardComponent } from '../creation-wizard/creation-wizard.component';
import { QuizCreationMethodModalComponent } from '../modals/quiz-creation-method-modal.component';
import { QuizAiAssistantModalComponent } from '../modals/quiz-ai-assistant-modal.component';
import { QuizEditorModalComponent } from '../modals/quiz-editor-modal.component';
import { EMPTY_PULSE } from '../../mock-data';
import { QuizPlayerComponent } from '../quiz-player/quiz-player.component';
import { ImageUploadModalComponent } from '../modals/image-upload-modal.component';
import { ImageCropperModalComponent } from '../modals/image-cropper-modal.component';
import { GoogleGenAI, GenerateContentResponse, Type } from '@google/genai';
import { QuizTypeSelectModalComponent } from '../modals/quiz-type-select-modal.component';
import { QuizNameModalComponent } from '../modals/quiz-name-modal.component';
import { AddQuestionModalComponent } from '../modals/add-question-modal.component';

@Component({
  selector: 'app-course-wizard',
  imports: [
    CommonModule, 
    FormsModule, 
    CreationWizardComponent,
    QuizCreationMethodModalComponent,
    QuizAiAssistantModalComponent,
    QuizEditorModalComponent,
    QuizPlayerComponent,
    ImageUploadModalComponent,
    ImageCropperModalComponent,
    QuizTypeSelectModalComponent,
    QuizNameModalComponent,
    AddQuestionModalComponent
  ],
  templateUrl: './course-wizard.component.html',
  styleUrls: ['./course-wizard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseWizardComponent {
  initialCourseData = input.required<Course>();
  startAtStep = input<number>(1);
  highlightRequest = input<{ target: string; timestamp: number } | null>(null);
  exit = output<void>();
  preview = output<Course>();

  course = signal<Course>({} as Course);
  private initialCourseState = signal<string>(''); // Store initial state for dirty checking.

  currentStep = signal<number>(1);
  activeAddContentMenu = signal<string | null>(null); // Holds topic ID for dropdown
  addContentMenuDirection = signal<'up' | 'down'>('up');

  // --- Signals for simplified UI (Step 4) ---
  editingTopicId = signal<string | null>(null);
  activeTopicMenu = signal<string | null>(null);
  activeContentMenu = signal<string | null>(null);
  expandedTopics = signal<Set<string>>(new Set());
  
  // Drag and Drop State
  draggedItem = signal<{ type: 'topic'; topicId: string } | { type: 'content'; topicId: string; contentId: string } | null>(null);
  dropTargetId = signal<string | null>(null);
  
  // Step 2: Images
  imageTab = signal<'banner' | 'card'>('banner');
  bannerPreview = signal<string | null>(null);
  cardPreview = signal<string | null>(null);
  showImageUploadModal = signal(false);
  showImageCropperModal = signal(false);
  imageTarget = signal<'banner' | 'card' | null>(null);
  imageToCrop = signal<string | null>(null);
  showUseForCardConfirmModal = signal(false);
  originalImageForCard = signal<string | null>(null);

  // Step 3: Settings
  settingsTab = signal<'settings' | 'groups' | 'contributors'>('settings');

  // Step 5: Finalize
  showPublishToast = signal<boolean>(false);

  // --- Quiz Creation State ---
  quizCreationState = signal<'method' | 'ai' | 'editor' | 'quizTypeSelect' | 'quizName' | 'addQuestion' | null>(null);
  quizForContent = signal<Pulse | null>(null);
  targetTopicIdForQuiz = signal<string | null>(null);
  editingContentIdForQuiz = signal<string | null>(null);
  contentForAiQuiz = signal<ContentItem[]>([]);
  quickQuizLoadingTopicId = signal<string | null>(null);
  quizTypeForCreation = signal<'evaluative' | 'survey' | null>(null);
  editingQuizContent = signal<ContentItem | null>(null);
  editingQuestion = signal<QuizQuestion | null>(null);
  highlightTarget = signal<string | null>(null);


  // --- Quiz Preview State ---
  quizToPreview = signal<Pulse | null>(null);

  isDirty = computed(() => {
    if (!this.initialCourseState()) return false;
    return JSON.stringify(this.course()) !== this.initialCourseState();
  });

  hasContent = computed(() => {
    return this.course().topics.some(topic => topic.contents.length > 0);
  });

  steps = [
    { number: 1, name: 'Informações', description: 'Configure os dados do seu curso' },
    { number: 2, name: 'Imagens', description: 'Defina as imagens do seu curso' },
    { number: 3, name: 'Configurações', description: 'Ajuste as configurações para exibição' },
    { number: 4, name: 'Conteúdos', description: 'Adicione os conteúdos em seu curso' },
    { number: 5, name: 'Finalizar', description: 'Publique seu curso' },
  ];

  contentTypes = [
    { type: 'video' as ContentType, label: 'Vídeo', icon: 'movie' },
    { type: 'audio' as ContentType, label: 'Áudio/Podcast', icon: 'headphones' },
    { type: 'image' as ContentType, label: 'Imagem', icon: 'image' },
    { type: 'document' as ContentType, label: 'Documento', icon: 'description' },
    { type: 'web' as ContentType, label: 'Link da Web', icon: 'link' },
    { type: 'scorm' as ContentType, label: 'Conteúdo Interativo (SCORM)', icon: 'extension' },
    { type: 'quiz' as ContentType, label: 'Quiz', icon: 'quiz' }
  ];

  constructor() {
    effect(() => {
      const initialData = this.initialCourseData();
      const deepCopiedData: Course = JSON.parse(JSON.stringify(initialData));
      this.course.set(deepCopiedData);
      this.initialCourseState.set(JSON.stringify(deepCopiedData));
      this.bannerPreview.set(initialData.bannerUrl);
      this.cardPreview.set(initialData.cardUrl);
      this.currentStep.set(this.startAtStep());

      // Initially expand all topics when the wizard loads
      if (deepCopiedData.topics) {
        const allTopicIds = new Set(deepCopiedData.topics.map((topic: Topic) => topic.id));
        this.expandedTopics.set(allTopicIds);
      }
    });

    effect(() => {
      if (this.currentStep() === 4 && this.course().topics?.length === 0) {
        // Automatically add the first topic to get the user started
        this.addTopic();
      }
    }, { allowSignalWrites: true });

    // New effect for handling highlight requests from the Story Map
    effect(() => {
      const request = this.highlightRequest();
      if (!request) return;

      const target = request.target;
      this.highlightTarget.set(target);

      // --- Logic to navigate to the correct UI state ---
      this.currentStep.set(4); // All features are in the content step

      if (target === 'quiz-survey-type') {
        this.targetTopicIdForQuiz.set(this.course().topics[0]?.id || null); // Use first topic
        this.quizCreationState.set('quizTypeSelect');
      } else {
        // For all other quiz features, we need to open the editor.
        // Let's find or create a quiz to open.
        let quizContent = this.course().topics.flatMap(t => t.contents).find(c => c.type === 'quiz');

        if (!quizContent) {
          // If no quiz exists, create a temporary one to open the editor
          const newPulse: Pulse = {
            ...JSON.parse(JSON.stringify(EMPTY_PULSE)),
            type: 'quiz',
            quizType: 'evaluative',
            name: 'Quiz de Demonstração',
            questions: []
          };
          quizContent = {
            id: `content_highlight_${Date.now()}`,
            type: 'quiz',
            title: newPulse.name,
            description: '',
            source: '',
            quizData: newPulse
          };
          const topicId = this.course().topics[0]?.id;
          if (topicId) {
            this.targetTopicIdForQuiz.set(topicId);
            this.editingContentIdForQuiz.set(quizContent.id); // Mark as editing this new one
          }
        }
        
        if (quizContent && quizContent.quizData) {
            this.quizForContent.set(JSON.parse(JSON.stringify(quizContent.quizData)));
            this.quizCreationState.set('editor');
        }
      }
    }, { allowSignalWrites: true });
  }
  
  handleStepChange(step: number): void {
    if (step > 0 && step <= this.steps.length) {
      this.currentStep.set(step);
    }
  }

  handleSaveAndNext(): void {
    if (this.currentStep() < this.steps.length) {
      this.initialCourseState.set(JSON.stringify(this.course()));
      this.currentStep.update(s => s + 1);
    }
  }

  updateField(field: keyof Course, value: any): void {
    this.course.update(c => ({ ...c, [field]: value }));
  }

  updateContentLocking(enabled: boolean, time?: number): void {
    this.course.update(c => {
        const newLocking = {...c.contentLocking, enabled};
        if(time !== undefined) {
            newLocking.minimumTime = time;
        }
        return {...c, contentLocking: newLocking };
    });
  }
  
  addTopic(): void {
    const newTopic: Topic = {
        id: `topic_${Date.now()}`,
        title: 'Novo Tópico',
        contents: []
    };
    this.course.update(c => ({...c, topics: [...c.topics, newTopic]}));
    this.editingTopicId.set(newTopic.id);
    this.expandedTopics.update(set => {
      set.add(newTopic.id);
      return new Set(set);
    });
  }

  removeTopic(topicId: string): void {
     this.course.update(c => ({...c, topics: c.topics.filter(t => t.id !== topicId)}));
     this.activeTopicMenu.set(null);
  }

  duplicateTopic(topicId: string): void {
    this.course.update(c => {
      const topics = [...c.topics];
      const topicIndex = topics.findIndex(t => t.id === topicId);
      if (topicIndex === -1) return c;

      const originalTopic = topics[topicIndex];
      const duplicatedTopic: Topic = JSON.parse(JSON.stringify(originalTopic)); // Deep copy
      duplicatedTopic.id = `topic_${Date.now()}`;
      duplicatedTopic.title = `${originalTopic.title} (Cópia)`;
      duplicatedTopic.contents.forEach((content: ContentItem) => {
        content.id = `content_${Date.now()}_${Math.random()}`;
        if (content.quizData && content.quizData.questions) {
            content.quizData.questions.forEach((q: QuizQuestion) => {
                q.id = `q_${Date.now()}_${Math.random()}`;
            });
        }
      });
      
      topics.splice(topicIndex + 1, 0, duplicatedTopic);
      return {...c, topics };
    });
    this.activeTopicMenu.set(null);
  }

  toggleAddContentMenu(topicId: string, event: MouseEvent): void {
    if (this.activeAddContentMenu() === topicId) {
        this.activeAddContentMenu.set(null);
    } else {
        const trigger = event.currentTarget as HTMLElement;
        const rect = trigger.getBoundingClientRect();
        
        // The dropdown has 7 items, each ~36px high + padding. Let's use 300px as a safe estimate.
        const dropdownHeight = 300;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        // If not enough space below AND there is more space above, open upwards.
        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
            this.addContentMenuDirection.set('up');
        } else {
            // Otherwise, default to downwards.
            this.addContentMenuDirection.set('down');
        }
        this.activeAddContentMenu.set(topicId);
    }
  }

  handleContentSelected(type: ContentType, topicId: string): void {
    if (!topicId) return;
    this.activeAddContentMenu.set(null);

    if (type === 'quiz') {
      this.targetTopicIdForQuiz.set(topicId);
      this.quizCreationState.set('quizTypeSelect'); // Start new quiz flow
      return;
    }

    const contentTypeName = {
      'video': 'Vídeo', 'audio': 'Áudio', 'image': 'Imagem',
      'document': 'Documento', 'web': 'Link da Web',
      'scorm': 'Conteúdo Interativo'
    }[type];

    const newContent: ContentItem = {
      id: `content_${Date.now()}`,
      type: type,
      title: `Novo ${contentTypeName}`,
      description: '',
      source: '',
    };
    
    this.course.update(c => {
      const newTopics = c.topics.map(topic => {
        if(topic.id === topicId) {
          return {...topic, contents: [...topic.contents, newContent]}
        }
        return topic;
      });
      return {...c, topics: newTopics};
    });
  }
  
  startTopicEdit(topicId: string): void {
    this.editingTopicId.set(topicId);
    this.activeTopicMenu.set(null);
  }

  saveTopicTitle(topicId: string, event: Event): void {
    const newTitle = (event.target as HTMLInputElement).value.trim();
    if (newTitle) {
      this.course.update(c => {
        const updatedTopics = c.topics.map(t => t.id === topicId ? { ...t, title: newTitle } : t);
        return { ...c, topics: updatedTopics };
      });
    }
    this.editingTopicId.set(null);
  }

  toggleTopicMenu(topicId: string): void {
    this.activeTopicMenu.update(current => current === topicId ? null : topicId);
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

  isTopicExpanded(topicId: string): boolean {
    return this.expandedTopics().has(topicId);
  }

  toggleContentMenu(contentId: string): void {
    this.activeContentMenu.update(current => current === contentId ? null : contentId);
  }

  removeContentItem(topicId: string, contentId: string): void {
    this.course.update(c => {
      const newTopics = c.topics.map(topic => {
        if(topic.id === topicId) {
          return {...topic, contents: topic.contents.filter(content => content.id !== contentId)}
        }
        return topic;
      });
      return {...c, topics: newTopics};
    });
    this.activeContentMenu.set(null);
  }

  duplicateContentItem(topicId: string, contentId: string): void {
    this.course.update(c => {
      const newTopics = [...c.topics];
      const topicIndex = newTopics.findIndex(t => t.id === topicId);
      if (topicIndex === -1) return c;

      const newContents = [...newTopics[topicIndex].contents];
      const contentIndex = newContents.findIndex(item => item.id === contentId);
      if (contentIndex === -1) return c;

      const originalContent = newContents[contentIndex];
      const duplicatedContent: ContentItem = JSON.parse(JSON.stringify(originalContent));
      duplicatedContent.id = `content_${Date.now()}`;
      duplicatedContent.title = `${originalContent.title} (Cópia)`;
      if (duplicatedContent.quizData && duplicatedContent.quizData.questions) {
        duplicatedContent.quizData.questions.forEach((q: QuizQuestion) => {
          q.id = `q_${Date.now()}_${Math.random()}`;
        });
      }

      newContents.splice(contentIndex + 1, 0, duplicatedContent);
      newTopics[topicIndex] = { ...newTopics[topicIndex], contents: newContents };
      
      return {...c, topics: newTopics };
    });
    this.activeContentMenu.set(null);
  }

  openImageUploadModal(target: 'banner' | 'card'): void {
    this.imageTarget.set(target);
    this.showImageUploadModal.set(true);
  }

  removeImage(target: 'banner' | 'card'): void {
    if (target === 'banner') {
      this.bannerPreview.set(null);
      this.updateField('bannerUrl', null);
    } else if (target === 'card') {
      this.cardPreview.set(null);
      this.updateField('cardUrl', null);
    }
  }

  handleImageSelected(imageUrl: string): void {
    this.showImageUploadModal.set(false);
    this.imageToCrop.set(imageUrl);
    this.showImageCropperModal.set(true);
  }

  handleImageCropped(croppedImageUrl: string): void {
    const target = this.imageTarget();
    const originalImage = this.imageToCrop(); // Capture the original image URL

    if (target === 'banner') {
      this.bannerPreview.set(croppedImageUrl);
      this.updateField('bannerUrl', croppedImageUrl);
      this.closeCropperModal(); // Close the cropper first

      // Now, ask the user if they want to use it for the card
      if (originalImage) {
        this.originalImageForCard.set(originalImage);
        this.showUseForCardConfirmModal.set(true);
      }
    } else if (target === 'card') {
      this.cardPreview.set(croppedImageUrl);
      this.updateField('cardUrl', croppedImageUrl);
      this.closeCropperModal();
    }
  }

  closeCropperModal(): void {
    this.showImageCropperModal.set(false);
    this.imageToCrop.set(null);
    this.imageTarget.set(null);
  }

  handleConfirmUseForCard(): void {
    const originalImage = this.originalImageForCard();
    if (originalImage) {
      this.imageTab.set('card'); // Switch tab
      this.imageTarget.set('card'); // Set the target for the cropper
      this.imageToCrop.set(originalImage);
      this.showImageCropperModal.set(true);
    }
    this.closeConfirmModal();
  }

  handleDeclineUseForCard(): void {
    this.closeConfirmModal();
  }

  private closeConfirmModal(): void {
    this.showUseForCardConfirmModal.set(false);
    this.originalImageForCard.set(null);
  }

  publishCourse(): void {
    this.initialCourseState.set(JSON.stringify(this.course()));
    this.showPublishToast.set(true);
    setTimeout(() => {
        this.showPublishToast.set(false);
        this.exit.emit();
    }, 2500);
  }

  // --- Drag and Drop Methods ---
  onDragStart(event: DragEvent, type: 'topic' | 'content', topicId: string, contentId?: string): void {
    event.dataTransfer!.effectAllowed = 'move';
    (event.target as HTMLElement).classList.add('dragging');

    if (type === 'topic') {
      this.draggedItem.set({ type: 'topic', topicId });
    } else if (contentId) {
      this.draggedItem.set({ type: 'content', topicId, contentId });
    }
  }

  onDragOver(event: DragEvent, targetTopicId: string): void {
    event.preventDefault();
    this.dropTargetId.set(targetTopicId);
  }

  onDragLeave(event: DragEvent): void {
    if((event.relatedTarget as HTMLElement)?.closest('.drop-zone')) return;
    this.dropTargetId.set(null);
  }

  onDrop(event: DragEvent, dropZoneTopicId: string): void {
    event.preventDefault();
    const dragged = this.draggedItem();
    if (!dragged) return;

    this.course.update(currentCourse => {
      const topics = [...currentCourse.topics];
      if (dragged.type === 'topic') {
        const draggedIndex = topics.findIndex(t => t.id === dragged.topicId);
        const targetIndex = topics.findIndex(t => t.id === dropZoneTopicId);
        if (draggedIndex === -1 || targetIndex === -1) return currentCourse;

        const [draggedTopic] = topics.splice(draggedIndex, 1);
        topics.splice(targetIndex, 0, draggedTopic);
      } else { // type is 'content'
        const sourceTopicIndex = topics.findIndex(t => t.id === dragged.topicId);
        const targetTopicIndex = topics.findIndex(t => t.id === dropZoneTopicId);
        if (sourceTopicIndex === -1 || targetTopicIndex === -1) return currentCourse;
        
        const sourceTopic = {...topics[sourceTopicIndex]};
        sourceTopic.contents = [...sourceTopic.contents];
        const draggedContentIndex = sourceTopic.contents.findIndex(c => c.id === dragged.contentId);
        if(draggedContentIndex === -1) return currentCourse;

        const [draggedContent] = sourceTopic.contents.splice(draggedContentIndex, 1);
        
        if (dragged.topicId === dropZoneTopicId) { // Reordering within same topic
           sourceTopic.contents.push(draggedContent);
           topics[sourceTopicIndex] = sourceTopic;
        } else { // Moving to a different topic
          const targetTopic = {...topics[targetTopicIndex]};
          targetTopic.contents = [...targetTopic.contents, draggedContent];
          topics[sourceTopicIndex] = sourceTopic;
          topics[targetTopicIndex] = targetTopic;
        }
      }
      return { ...currentCourse, topics };
    });

    this.onDragEnd(event);
  }

  onDragEnd(event: DragEvent): void {
    (event.target as HTMLElement).classList.remove('dragging');
    this.draggedItem.set(null);
    this.dropTargetId.set(null);
    document.querySelectorAll('.drop-placeholder').forEach(el => el.remove());
  }

  // --- Quiz Creation Flow Handlers ---
  editQuiz(topicId: string, contentId: string): void {
    const topic = this.course().topics.find(t => t.id === topicId);
    const content = topic?.contents.find(c => c.id === contentId);
    if (content && content.quizData) {
        this.targetTopicIdForQuiz.set(topicId);
        this.editingContentIdForQuiz.set(contentId);
        this.quizForContent.set(JSON.parse(JSON.stringify(content.quizData)));
        this.quizCreationState.set('editor');
    }
  }

  isQuickQuizDisabled(topic: Topic): boolean {
    const hasContentForQuiz = topic.contents.some(c => c.type !== 'quiz');
    const hasExistingQuiz = topic.contents.some(c => c.type === 'quiz');
    return !hasContentForQuiz || hasExistingQuiz || !!this.quickQuizLoadingTopicId();
  }

  async generateQuickQuiz(topic: Topic): Promise<void> {
    const contentsForQuiz = topic.contents.filter(c => c.type !== 'quiz');
    if (contentsForQuiz.length === 0 || this.quickQuizLoadingTopicId()) return;

    this.quickQuizLoadingTopicId.set(topic.id);
    
    const contentTitles = contentsForQuiz.map(c => c.title).join(', ');
    const prompt = `Gere um quiz com 5 perguntas de múltipla escolha com 4 alternativas cada sobre o tópico "${topic.title}". O conteúdo de referência inclui: ${contentTitles}. As perguntas devem ser relevantes para esses conteúdos. Apenas uma alternativa deve ser a correta. Retorne o resultado em um formato JSON que corresponda ao schema fornecido.`;
    
    try {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set.");
        }
        const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                questions: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            questionText: { 
                                type: Type.STRING,
                                description: "O enunciado da pergunta."
                            },
                            alternatives: { 
                                type: Type.ARRAY, 
                                items: { type: Type.STRING },
                                description: "Uma lista de 4 possíveis respostas."
                            },
                            correctAnswerIndex: { 
                                type: Type.INTEGER,
                                description: "O índice (base 0) da alternativa correta."
                            }
                        },
                        required: ["questionText", "alternatives", "correctAnswerIndex"]
                    }
                }
            },
            required: ["questions"]
        };
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        let jsonStr = response.text.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
        }
        const quizJson = JSON.parse(jsonStr);
        
        if (!quizJson.questions || !Array.isArray(quizJson.questions)) {
            throw new Error("Formato de resposta da IA inválido.");
        }
        
        const newQuizData: Pulse = {
            ...JSON.parse(JSON.stringify(EMPTY_PULSE)),
            type: 'quiz',
            name: `Quiz sobre: ${topic.title}`,
            description: `Este quiz foi gerado por IA sobre o conteúdo do tópico.`,
            questions: quizJson.questions.map((q: any) => ({
                id: `q_${Date.now()}_${Math.random().toString(36).substring(2)}`,
                questionType: 'multipleChoice',
                questionText: q.questionText,
                alternatives: q.alternatives,
                correctAnswerIndex: q.correctAnswerIndex,
                imageUrl: null,
                imagePosition: 'before',
                isInBank: false,
            }))
        };
        
        const newContent: ContentItem = {
            id: `content_${Date.now()}`,
            type: 'quiz',
            title: newQuizData.name,
            description: newQuizData.description,
            source: `quiz_internal_${Date.now()}`,
            quizData: newQuizData,
        };

        this.course.update(c => {
            const newTopics = c.topics.map(t => {
                if (t.id === topic.id) {
                    return { ...t, contents: [...t.contents, newContent] };
                }
                return t;
            });
            return { ...c, topics: newTopics };
        });

    } catch (error) {
        console.error('Error generating quick quiz:', error);
    } finally {
        this.quickQuizLoadingTopicId.set(null);
    }
  }

  handleQuizTypeSelected(type: 'evaluative' | 'survey'): void {
    this.quizTypeForCreation.set(type);
    if (type === 'evaluative') {
      this.quizCreationState.set('method');
    } else {
      this.quizCreationState.set('quizName');
    }
  }

  handleQuizNameSaved(name: string): void {
    const topicId = this.targetTopicIdForQuiz();
    if (!topicId) return;

    const newPulse: Pulse = {
      ...JSON.parse(JSON.stringify(EMPTY_PULSE)),
      type: 'quiz',
      quizType: this.quizTypeForCreation()!,
      name: name,
      questions: []
    };
    
    const newContent: ContentItem = {
      id: `content_${Date.now()}`,
      type: 'quiz',
      title: newPulse.name,
      description: '',
      source: `quiz_internal_${Date.now()}`,
      quizData: newPulse
    };

    this.course.update(c => {
      const newTopics = c.topics.map(topic => {
        if(topic.id === topicId) {
          return {...topic, contents: [...topic.contents, newContent]}
        }
        return topic;
      });
      return {...c, topics: newTopics};
    });

    this.closeQuizModals();
  }

  backFromQuizName(): void {
    this.quizCreationState.set('quizTypeSelect');
  }

  openAddQuestionModal(content: ContentItem, question: QuizQuestion | null = null): void {
    this.editingQuizContent.set(content);
    this.editingQuestion.set(question);
    this.quizCreationState.set('addQuestion');
  }

  handleQuestionSaved(question: QuizQuestion): void {
    const content = this.editingQuizContent();
    if (!content || !content.quizData) return;

    this.course.update(c => {
      return {
        ...c,
        topics: c.topics.map(topic => ({
          ...topic,
          contents: topic.contents.map(cont => {
            if (cont.id === content.id) {
              const newQuizData = { ...cont.quizData! };
              const questions = [...(newQuizData.questions || [])];
              const existingIndex = questions.findIndex(q => q.id === question.id);
              if (existingIndex > -1) {
                questions[existingIndex] = question;
              } else {
                questions.push(question);
              }
              newQuizData.questions = questions;
              return { ...cont, quizData: newQuizData };
            }
            return cont;
          })
        }))
      };
    });

    this.closeQuizModals();
  }


  handleQuizCreationMethodSelected(method: 'manual' | 'ai'): void {
    if (method === 'manual') {
      const newPulse: Pulse = {
        ...JSON.parse(JSON.stringify(EMPTY_PULSE)),
        type: 'quiz',
        quizType: 'evaluative',
        name: 'Novo Quiz', // Default name
      };
      this.quizForContent.set(newPulse);
      this.quizCreationState.set('editor');
    } else {
      const topicId = this.targetTopicIdForQuiz();
      if (topicId) {
        const topic = this.course().topics.find(t => t.id === topicId);
        // Filter out existing quizzes from being used as context
        const content = topic?.contents.filter(c => c.type !== 'quiz') ?? [];
        this.contentForAiQuiz.set(content);
      }
      this.quizCreationState.set('ai');
    }
  }

  handleAiQuizGenerated(quiz: Pulse): void {
    this.quizForContent.set(quiz);
    this.quizCreationState.set('editor');
  }

  handleQuizSaved(quiz: Pulse): void {
    const topicId = this.targetTopicIdForQuiz();
    const contentId = this.editingContentIdForQuiz();
    if (!topicId) return;

    if (contentId) { // Editing existing quiz
        this.course.update(c => {
            const newTopics = c.topics.map(topic => {
                if (topic.id === topicId) {
                    const newContents = topic.contents.map(content => {
                        if (content.id === contentId) {
                            return { ...content, title: quiz.name, description: quiz.description || '', quizData: quiz };
                        }
                        return content;
                    });
                    return { ...topic, contents: newContents };
                }
                return topic;
            });
            return { ...c, topics: newTopics };
        });
    } else { // Creating new quiz
        const newContent: ContentItem = {
            id: `content_${Date.now()}`,
            type: 'quiz',
            title: quiz.name,
            description: quiz.description || '',
            source: `quiz_internal_${Date.now()}`,
            quizData: quiz,
        };

        this.course.update(c => {
            const newTopics = c.topics.map(topic => {
                if (topic.id === topicId) {
                    return { ...topic, contents: [...topic.contents, newContent] };
                }
                return topic;
            });
            return { ...c, topics: newTopics };
        });
    }

    this.closeQuizModals();
  }


  closeQuizModals(): void {
    this.quizCreationState.set(null);
    this.quizForContent.set(null);
    this.targetTopicIdForQuiz.set(null);
    this.editingContentIdForQuiz.set(null);
    this.contentForAiQuiz.set([]);
    this.quizTypeForCreation.set(null);
    this.editingQuizContent.set(null);
    this.editingQuestion.set(null);
  }

  backFromAiQuiz(): void {
    this.quizCreationState.set('method');
  }

  // --- Quiz Preview Flow Handlers ---
  previewQuiz(quizData: Pulse): void {
    this.quizToPreview.set(quizData);
    this.activeContentMenu.set(null); // Close dropdown
  }

  exitQuizPreview(): void {
    this.quizToPreview.set(null);
  }

  previewCourse(): void {
    this.preview.emit(this.course());
  }
}