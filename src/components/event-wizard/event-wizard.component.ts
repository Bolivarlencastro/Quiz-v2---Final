

import { Component, ChangeDetectionStrategy, input, output, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Event, EventDate, Instructor, SupportMaterial } from '../../types';
import { CreationWizardComponent } from '../creation-wizard/creation-wizard.component';

@Component({
  selector: 'app-event-wizard',
  imports: [CommonModule, FormsModule, CreationWizardComponent],
  templateUrl: './event-wizard.component.html',
  styleUrls: ['./event-wizard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventWizardComponent {
  initialEventData = input.required<Event>();
  exit = output<void>();

  event = signal<Event>({} as Event);
  private initialEventState = signal<string>('');

  currentStep = signal<number>(1);

  isDirty = computed(() => {
    if (!this.initialEventState()) return false;
    return JSON.stringify(this.event()) !== this.initialEventState();
  });

  // Step 2: Images
  imageTab = signal<'banner' | 'card'>('banner');
  bannerPreview = signal<string | null>(null);
  cardPreview = signal<string | null>(null);

  // Step 3: Settings
  settingsTab = signal<'settings' | 'groups' | 'contributors'>('settings');
  
  // Step 5: Support Materials
  isDraggingOver = signal(false);

  // Step 6: Finalize
  showPublishToast = signal<boolean>(false);

  steps = [
    { number: 1, name: 'Informações Básicas', description: 'Dados gerais do seu evento' },
    { number: 2, name: 'Imagens', description: 'Banner e card do evento' },
    { number: 3, name: 'Configurações', description: 'Ajuste de regras e permissões' },
    { number: 4, name: 'Detalhes do Evento', description: 'Local, datas e instrutores' },
    { number: 5, name: 'Materiais de Apoio', description: 'Anexe arquivos para os participantes' },
    { number: 6, name: 'Publicação', description: 'Revise e publique seu evento' },
  ];

  constructor() {
    effect(() => {
      const initialData = this.initialEventData();
      const deepCopiedData = JSON.parse(JSON.stringify(initialData));
      this.event.set(deepCopiedData);
      this.initialEventState.set(JSON.stringify(deepCopiedData));
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
      this.initialEventState.set(JSON.stringify(this.event()));
      this.currentStep.update(s => s + 1);
    }
  }

  updateField(field: keyof Event, value: any): void {
    this.event.update(e => ({ ...e, [field]: value }));
  }

  publishEvent(): void {
    this.initialEventState.set(JSON.stringify(this.event()));
    this.showPublishToast.set(true);
    setTimeout(() => {
      this.showPublishToast.set(false);
      this.exit.emit();
    }, 2500);
  }

  onFileSelected(event: globalThis.Event, type: 'banner' | 'card'): void {
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

  // --- Step 4 Methods ---
  addDate(): void {
    const newDate: EventDate = {
      id: `date_${Date.now()}`,
      startDate: '',
      endDate: ''
    };
    this.event.update(e => ({...e, dates: [...e.dates, newDate]}));
  }

  removeDate(dateId: string): void {
    this.event.update(e => ({...e, dates: e.dates.filter(d => d.id !== dateId)}));
  }

  updateDate(dateId: string, field: 'startDate' | 'endDate', value: string): void {
    this.event.update(e => {
        const dates = e.dates.map(d => {
            if (d.id === dateId) {
                return {...d, [field]: value};
            }
            return d;
        });
        return {...e, dates};
    });
  }

  addInstructor(): void {
    const newInstructor: Instructor = {
      id: `inst_${Date.now()}`,
      name: ''
    };
    this.event.update(e => ({...e, instructors: [...e.instructors, newInstructor]}));
  }

  removeInstructor(instructorId: string): void {
    this.event.update(e => ({...e, instructors: e.instructors.filter(i => i.id !== instructorId)}));
  }

  updateInstructorName(instructorId: string, newName: string): void {
     this.event.update(e => {
        const instructors = e.instructors.map(i => {
            if (i.id === instructorId) {
                return {...i, name: newName};
            }
            return i;
        });
        return {...e, instructors};
    });
  }

  // --- Step 5 Methods ---
  handleFileSelect(event: globalThis.Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
        this.addFiles(input.files);
        input.value = ''; // Reset input to allow re-uploading the same file
    }
  }

  handleFileDrop(event: DragEvent): void {
      event.preventDefault();
      this.isDraggingOver.set(false);
      if (event.dataTransfer?.files) {
          this.addFiles(event.dataTransfer.files);
      }
  }

  private addFiles(files: FileList): void {
      const newMaterials: SupportMaterial[] = [];
      for (let i = 0; i < files.length; i++) {
          const file = files[i];
          newMaterials.push({
              id: `mat_${Date.now()}_${i}`,
              name: file.name,
              size: file.size,
              type: file.type,
          });
      }
      this.event.update(e => ({
          ...e,
          supportMaterials: [...(e.supportMaterials || []), ...newMaterials]
      }));
  }

  removeSupportMaterial(materialId: string): void {
      this.event.update(e => ({
          ...e,
          supportMaterials: e.supportMaterials.filter(m => m.id !== materialId)
      }));
  }

  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
