import { Component, ChangeDetectionStrategy, signal, computed, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Group } from '../../types';
import { MOCK_GROUPS } from '../../mock-data';

type ModalView = 'none' | 'createEdit' | 'delete' | 'import';
type ImportType = 'Usuários' | 'Missões' | 'Canais';

@Component({
  selector: 'app-group-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './group-management.component.html',
  styleUrls: ['./group-management.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupManagementComponent implements OnInit {
  startWithCreateModal = input<boolean>(false);
  
  groups = signal<Group[]>(MOCK_GROUPS);
  searchQuery = signal('');
  
  modalView = signal<ModalView>('none');
  isEditing = signal(false);
  groupToEdit = signal<Group | null>(null);
  groupToDelete = signal<Group | null>(null);
  importType = signal<ImportType | null>(null);
  
  newGroupName = signal('');
  nameError = signal<string | null>(null);
  
  activeGroupMenu = signal<string | null>(null);

  filteredGroups = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.groups();
    return this.groups().filter(g => g.name.toLowerCase().includes(query));
  });

  ngOnInit(): void {
    if (this.startWithCreateModal()) {
      this.openCreateModal();
    }
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.newGroupName.set('');
    this.groupToEdit.set(null);
    this.nameError.set(null);
    this.modalView.set('createEdit');
  }

  openEditModal(group: Group): void {
    if (group.is_integration) return;
    this.isEditing.set(true);
    this.groupToEdit.set(group);
    this.newGroupName.set(group.name);
    this.nameError.set(null);
    this.modalView.set('createEdit');
    this.activeGroupMenu.set(null);
  }
  
  openDeleteModal(group: Group): void {
    if (group.is_integration) return;
    this.groupToDelete.set(group);
    this.modalView.set('delete');
    this.activeGroupMenu.set(null);
  }

  openImportModal(type: ImportType): void {
    this.importType.set(type);
    this.modalView.set('import');
  }

  closeModal(): void {
    this.modalView.set('none');
  }

  saveGroup(): void {
    const name = this.newGroupName().trim();
    if (!name) {
      this.nameError.set('O nome do grupo é obrigatório.');
      return;
    }
    
    const existingGroup = this.groups().find(g => g.name.toLowerCase() === name.toLowerCase() && g.id !== this.groupToEdit()?.id);
    if (existingGroup) {
      this.nameError.set('Já existe um grupo com este nome.');
      return;
    }
    
    if (this.isEditing()) {
      this.groups.update(groups => 
        groups.map(g => g.id === this.groupToEdit()!.id ? { ...g, name: name } : g)
      );
    } else {
      const newGroup: Group = {
        id: Date.now().toString(),
        name: name,
        users: 0,
        missions: 0,
        learning_trails: 0,
        channels: 0
      };
      this.groups.update(groups => [...groups, newGroup]);
    }
    this.closeModal();
  }

  confirmDelete(): void {
    if (!this.groupToDelete()) return;
    this.groups.update(groups => groups.filter(g => g.id !== this.groupToDelete()!.id));
    this.closeModal();
  }

  handleImport(): void {
    // Simulate import
    console.log(`Importando ${this.importType()}...`);
    this.closeModal();
  }

  toggleGroupMenu(groupId: string): void {
    this.activeGroupMenu.update(current => current === groupId ? null : groupId);
  }
}