
import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentType } from '../../types';

@Component({
  selector: 'app-add-content-modal',
  imports: [CommonModule],
  templateUrl: './add-content-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddContentModalComponent {
  close = output<void>();
  contentSelected = output<ContentType>();

  selectContent(type: ContentType) {
    // In a real app, this might open a more specific modal (TELA 4.2).
    // For this prototype, we'll just emit the selected type.
    this.contentSelected.emit(type);
  }
}
