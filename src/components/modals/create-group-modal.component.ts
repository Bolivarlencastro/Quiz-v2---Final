import { Component, ChangeDetectionStrategy, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Group } from '../../types';

@Component({
  selector: 'app-create-group-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './create-group-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateGroupModalComponent {
  close = output<void>();
  groupCreated = output<Group>();

  newGroupName = signal('');
  nameError = signal<string | null>(null);

  saveGroup(): void {
    const name = this.newGroupName().trim();
    if (!name) {
      this.nameError.set('O nome do grupo é obrigatório.');
      return;
    }
    
    const newGroup: Group = {
      id: Date.now().toString(),
      name: name,
      users: 0,
      missions: 0,
      learning_trails: 0,
      channels: 0
    };

    this.groupCreated.emit(newGroup);
  }
}
