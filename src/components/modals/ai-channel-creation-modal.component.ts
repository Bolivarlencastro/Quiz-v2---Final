import { Component, ChangeDetectionStrategy, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Channel } from '../../types';
import { MOCK_CHANNEL_TEMPLATE } from '../../mock-data';

@Component({
  selector: 'app-ai-channel-creation-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-channel-creation-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChannelCreationModalComponent {
  close = output<void>();
  back = output<void>();
  channelGenerated = output<Channel>();

  prompt = signal<string>('');
  isLoading = signal<boolean>(false);
  loadingMessage = signal<string>('');

  presetPrompts = [
    'Um canal sobre dicas de produtividade para equipes de tecnologia',
    'Canal com notícias e atualizações da empresa',
    'Canal de desenvolvimento de liderança',
    'Canal com dicas rápidas de bem-estar e saúde mental'
  ];

  usePresetPrompt(preset: string): void {
    this.prompt.set(preset);
  }

  generateChannel(): void {
    if (!this.prompt().trim() || this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    const messages = [
        "Analisando seu pedido...",
        "Definindo o propósito do canal...",
        "Gerando descrição e categoria...",
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
      const newChannel: Channel = {
        ...JSON.parse(JSON.stringify(MOCK_CHANNEL_TEMPLATE)),
        name: `Canal IA: ${this.prompt()}`,
        description: `Este canal foi gerado por IA com base no prompt: "${this.prompt()}". ${MOCK_CHANNEL_TEMPLATE.description}`,
      };
      
      this.isLoading.set(false);
      this.channelGenerated.emit(newChannel);
    }, 5000); 
  }
}
