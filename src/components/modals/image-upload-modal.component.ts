import { Component, ChangeDetectionStrategy, output, input, signal, viewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleGenAI } from '@google/genai';

type UploadSource = 'computer' | 'drive' | 'pexels' | 'freepik' | 'ai';

interface AiChatEntry {
  timestamp: Date;
  prompt: string;
  images: string[];
  isLoading?: boolean;
  error?: string;
}

@Component({
  selector: 'app-image-upload-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './image-upload-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUploadModalComponent {
  // Inputs & Outputs
  imageType = input.required<'banner' | 'card'>();
  close = output<void>();
  imageSelected = output<string>();

  // State
  activeSource = signal<UploadSource>('computer');
  isLoading = signal(false);
  
  // AI State
  aiPrompt = signal('');
  aiReferenceImage = signal<{ base64: string; mimeType: string } | null>(null);
  aiChatHistory = signal<AiChatEntry[]>([]);
  
  // Template ref for file input
  refImageInput = viewChild<ElementRef<HTMLInputElement>>('refImageInput');

  // Image Bank State
  bankSearchTerm = signal('');
  bankImages = signal<string[]>([]);

  // Computer upload state
  draggingOver = signal(false);

  constructor() {
    // No initial load needed, will load on source selection
  }

  selectSource(source: UploadSource) {
    this.activeSource.set(source);
    if (source === 'pexels' || source === 'freepik') {
      this.bankImages.set([]); // Clear previous results
      this.bankSearchTerm.set(''); // Clear search term
      this.loadBankImages('abstract', source); // Load default images for the new source
    }
  }

  // --- Computer Upload Methods ---
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
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imageSelected.emit(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  // --- Image Bank Methods ---
  loadBankImages(term: string = 'abstract', source: 'pexels' | 'freepik'): void {
    this.isLoading.set(true);
    // Simulate API call
    setTimeout(() => {
      const images: string[] = [];
      for(let i = 0; i < 12; i++) {
        const seed = Math.floor(Math.random() * 1000);
        // Use source in seed to get different images for Pexels and Freepik
        images.push(`https://picsum.photos/seed/${source}-${term}${seed}/400/300`);
      }
      this.bankImages.set(images);
      this.isLoading.set(false);
    }, 500);
  }
  
  searchBank(): void {
    const source = this.activeSource();
    if(source === 'pexels' || source === 'freepik') {
        this.loadBankImages(this.bankSearchTerm() || 'abstract', source);
    }
  }
  
  selectBankImage(url: string): void {
     this.imageSelected.emit(url);
  }

  // --- AI Generation Methods ---
  adjustTextareaHeight(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.generateImage();
    }
  }

  onReferenceImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        console.error('Invalid file type. Please select an image.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const [header, base64] = result.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1];
        if (base64 && mimeType) {
          this.aiReferenceImage.set({ base64, mimeType });
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset file input to allow selecting the same file again
    if (input) {
      input.value = '';
    }
  }

  removeReferenceImage(): void {
    this.aiReferenceImage.set(null);
  }

  async generateImage(): Promise<void> {
    const promptText = this.aiPrompt().trim();
    if (!promptText || this.isLoading()) return;

    this.isLoading.set(true);

    const newEntry: AiChatEntry = {
      timestamp: new Date(),
      prompt: promptText,
      images: [],
      isLoading: true,
    };
    this.aiChatHistory.update(history => [...history, newEntry]);
    this.aiPrompt.set('');

    try {
      const apiKey = localStorage.getItem('GOOGLE_GENAI_API_KEY') || (window as any).ENV?.API_KEY;
      if (!apiKey) {
        throw new Error("API_KEY not configured. Please set up your API key in the environment settings.");
      }
      const ai = new GoogleGenAI({apiKey});

      const referenceImage = this.aiReferenceImage();
        
      const imageGenerationRequest: any = {
          model: 'imagen-4.0-generate-001',
          prompt: promptText,
          config: {
            numberOfImages: 2,
            outputMimeType: 'image/jpeg',
            aspectRatio: this.imageType() === 'card' ? '9:16' : '16:9',
          },
      };

      if (referenceImage) {
          imageGenerationRequest.image = {
              imageBytes: referenceImage.base64,
              mimeType: referenceImage.mimeType
          };
      }
      
      const response = await ai.models.generateImages(imageGenerationRequest);

      if (response.generatedImages && response.generatedImages.length > 0) {
        const imageUrls = response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
        this.aiChatHistory.update(history => {
            const lastEntry = history[history.length - 1];
            if (lastEntry) {
                lastEntry.images = imageUrls;
                lastEntry.isLoading = false;
            }
            return [...history];
        });
      } else {
        throw new Error('Nenhuma imagem foi gerada.');
      }

    } catch (error) {
      console.error('Error generating image:', error);
       this.aiChatHistory.update(history => {
            const lastEntry = history[history.length - 1];
            if (lastEntry) {
                lastEntry.isLoading = false;
                lastEntry.error = 'Ocorreu um erro ao gerar as imagens. Tente novamente.';
            }
            return [...history];
        });
    } finally {
      this.isLoading.set(false);
    }
  }

  async regenerateImages(entryToRegenerate: AiChatEntry): Promise<void> {
    if (this.isLoading()) return; // Prevent multiple generations at once

    this.isLoading.set(true);
    // Mark the specific entry as loading
    this.aiChatHistory.update(history => {
      const entry = history.find(e => e.timestamp === entryToRegenerate.timestamp);
      if (entry) {
        entry.isLoading = true;
        entry.error = undefined; // Clear previous error
        entry.images = []; // Clear previous images
      }
      return [...history];
    });

    try {
      const apiKey = localStorage.getItem('GOOGLE_GENAI_API_KEY') || (window as any).ENV?.API_KEY;
      if (!apiKey) {
        throw new Error("API_KEY not configured. Please set up your API key in the environment settings.");
      }
      const ai = new GoogleGenAI({apiKey});
      
      const imageGenerationRequest: any = {
        model: 'imagen-4.0-generate-001',
        prompt: entryToRegenerate.prompt, // Use the original prompt
        config: {
          numberOfImages: 2,
          outputMimeType: 'image/jpeg', // Use jpeg
          aspectRatio: this.imageType() === 'card' ? '9:16' : '16:9',
        },
      };

      const response = await ai.models.generateImages(imageGenerationRequest);

      if (response.generatedImages && response.generatedImages.length > 0) {
        const imageUrls = response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
        this.aiChatHistory.update(history => {
          const entry = history.find(e => e.timestamp === entryToRegenerate.timestamp);
          if (entry) {
            entry.images = imageUrls;
            entry.isLoading = false;
          }
          return [...history];
        });
      } else {
        throw new Error('Nenhuma imagem foi gerada na regeneração.');
      }

    } catch (error) {
      console.error('Error regenerating image:', error);
      this.aiChatHistory.update(history => {
        const entry = history.find(e => e.timestamp === entryToRegenerate.timestamp);
        if (entry) {
          entry.isLoading = false;
          entry.error = 'Ocorreu um erro ao regenerar as imagens. Tente novamente.';
        }
        return [...history];
      });
    } finally {
      this.isLoading.set(false);
    }
  }
}
