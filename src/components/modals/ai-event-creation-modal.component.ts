
import { Component, ChangeDetectionStrategy, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Event } from '../../types';
import { MOCK_EVENT_TEMPLATE } from '../../mock-data';

@Component({
  selector: 'app-ai-event-creation-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-event-creation-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiEventCreationModalComponent {
  close = output<void>();
  back = output<void>();
  eventGenerated = output<Event>();

  prompt = signal<string>('');
  isLoading = signal<boolean>(false);
  loadingMessage = signal<string>('');

  presetPrompts = [
    'Um workshop de um dia sobre Design Thinking para equipes de produto',
    'Uma live de 1 hora sobre as novidades em marketing digital',
    'Um treinamento presencial de 3 dias sobre liderança',
    'Webinar sobre segurança da informação para trabalho remoto'
  ];

  usePresetPrompt(preset: string): void {
    this.prompt.set(preset);
  }

  generateEvent(): void {
    if (!this.prompt().trim() || this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    const messages = [
        "Analisando seu pedido...",
        "Definindo os objetivos do evento...",
        "Sugerindo datas e instrutores...",
        "Finalizando os detalhes..."
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
      const newEvent: Event = {
        ...JSON.parse(JSON.stringify(MOCK_EVENT_TEMPLATE)),
        name: `Evento IA: ${this.prompt()}`,
        description: `Este evento foi gerado por IA com base no prompt: "${this.prompt()}". ${MOCK_EVENT_TEMPLATE.description}`,
      };
      
      this.isLoading.set(false);
      this.eventGenerated.emit(newEvent);
    }, 5000); 
  }
}
