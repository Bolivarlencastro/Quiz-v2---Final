
import { Component, ChangeDetectionStrategy, input, output, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Trail, TrailContentItem } from '../../types';
import { MOCK_SEARCHABLE_CONTENT } from '../../mock-data';
import { CreationWizardComponent } from '../creation-wizard/creation-wizard.component';

@Component({
  selector: 'app-trail-wizard',
  imports: [CommonModule, FormsModule, CreationWizardComponent],
  templateUrl: './trail-wizard.component.html',
  styleUrls: ['./trail-wizard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrailWizardComponent {
  initialTrailData = input.required<Trail>();
  exit = output<void>();

  trail = signal<Trail>({} as Trail);
  private initialTrailState = signal<string>('');

  currentStep = signal<number>(1);

  // Exit confirmation
  isDirty = computed(() => {
    if (!this.initialTrailState()) return false;
    return JSON.stringify(this.trail()) !== this.initialTrailState();
  });

  // Step 2: Images
  imageTab = signal<'banner' | 'card'>('banner');
  bannerPreview = signal<string | null>(null);
  cardPreview = signal<string | null>(null);

  // Step 3: Settings
  settingsTab = signal<'settings'>('settings');

  // Step 4: Content
  searchQuery = signal<string>('');
  searchResults = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return MOCK_SEARCHABLE_CONTENT;
    return MOCK_SEARCHABLE_CONTENT.filter(item => item.title.toLowerCase().includes(query));
  });
  draggedItem = signal<TrailContentItem | null>(null);

  // Step 5: Finalize
  showPublishToast = signal<boolean>(false);

  steps = [
    { number: 1, name: 'Informações Básicas', description: 'Configure os dados da sua trilha' },
    { number: 2, name: 'Imagens', description: 'Defina as imagens da sua trilha' },
    { number: 3, name: 'Configurações', description: 'Ajuste as configurações para exibição' },
    { number: 4, name: 'Conteúdo', description: 'Adicione missões e pulses' },
    { number: 5, name: 'Finalizar', description: 'Publique sua trilha' },
  ];

  constructor() {
    effect(() => {
      const initialData = this.initialTrailData();
      const deepCopiedData = JSON.parse(JSON.stringify(initialData));
      this.trail.set(deepCopiedData);
      this.initialTrailState.set(JSON.stringify(deepCopiedData));
      this.bannerPreview.set(initialData.bannerUrl);
      this.cardPreview.set(initialData.cardUrl);
    });
  }

  handleStepChange(step: number): void {
    if (step > 0 && step <= this.steps.length) {
      this.currentStep.set(step);
    }
  }

  handleSaveAndNext(): void {
    if (this.currentStep() < this.steps.length) {
      this.initialTrailState.set(JSON.stringify(this.trail()));
      this.currentStep.update(s => s + 1);
    }
  }

  updateField(field: keyof Trail, value: any): void {
    this.trail.update(t => ({ ...t, [field]: value }));
  }

  publishTrail(): void {
    this.initialTrailState.set(JSON.stringify(this.trail()));
    this.showPublishToast.set(true);
    setTimeout(() => {
      this.showPublishToast.set(false);
      this.exit.emit();
    }, 2500);
  }

  onFileSelected(event: Event, type: 'banner' | 'card'): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (type === 'banner') {
          this.bannerPreview.set(result);
          this.updateField('bannerUrl', result);
        } else {
          this.cardPreview.set(result);
          this.updateField('cardUrl', result);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  // --- Step 4: Content Methods ---
  addContent(item: TrailContentItem): void {
    this.trail.update(t => {
      if (t.content.some(c => c.id === item.id)) return t;
      return { ...t, content: [...t.content, item] };
    });
  }

  removeContent(itemId: string): void {
    this.trail.update(t => ({...t, content: t.content.filter(c => c.id !== itemId)}));
  }

  // --- Drag and Drop Methods ---
  onDragStart(event: DragEvent, item: TrailContentItem): void {
    event.dataTransfer!.effectAllowed = 'move';
    (event.target as HTMLElement).classList.add('dragging');
    this.draggedItem.set(item);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent, dropIndex: number): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.remove('drag-over');
    const dragged = this.draggedItem();
    if (!dragged) return;

    this.trail.update(currentTrail => {
      const content = [...currentTrail.content];
      const sourceIndex = content.findIndex(c => c.id === dragged.id);
      if (sourceIndex === -1) return currentTrail;

      const [movedItem] = content.splice(sourceIndex, 1);
      content.splice(dropIndex, 0, movedItem);
      
      return { ...currentTrail, content };
    });
  }

  onDragEnd(event: DragEvent): void {
    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
    this.draggedItem.set(null);
  }

  onDragEnter(event: DragEvent) {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.add('drag-over');
  }

  onDragLeave(event: DragEvent) {
    (event.currentTarget as HTMLElement).classList.remove('drag-over');
  }
}
