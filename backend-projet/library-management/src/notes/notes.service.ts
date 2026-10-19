import { Injectable, NotFoundException } from '@nestjs/common';
import { Persist } from '../db/persist.js';

export interface Note {
  id: number;
  userId: number;
  content: string;
  tag: string;
  pinned: boolean;
  createdAt: Date;
}

@Injectable()
export class NotesService {
  private notes: Note[] = [];
  private nextId = 1;

  constructor() {
    Persist.register('notes', () => this.notes, (v: Note[]) => {
      this.notes = v;
      this.nextId = v.length > 0 ? Math.max(...v.map(n => n.id)) + 1 : 1;
    });
  }

  findAllForUser(userId: number): Note[] {
    return this.notes.filter((n) => n.userId === userId);
  }

  create(userId: number, content: string, tag: string): Note {
    const note: Note = {
      id: this.nextId++,
      userId,
      content,
      tag: tag || '',
      pinned: false,
      createdAt: new Date(),
    };
    this.notes.push(note);
    return note;
  }

  togglePin(id: number, userId: number): Note {
    const note = this.notes.find((n) => n.id === id && n.userId === userId);
    if (!note) throw new NotFoundException(`Note ${id} introuvable`);
    note.pinned = !note.pinned;
    return note;
  }

  remove(id: number, userId: number): Note {
    const index = this.notes.findIndex((n) => n.id === id && n.userId === userId);
    if (index === -1) throw new NotFoundException(`Note ${id} introuvable`);
    const [removed] = this.notes.splice(index, 1);
    return removed;
  }
}
