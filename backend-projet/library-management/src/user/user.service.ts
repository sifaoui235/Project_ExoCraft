import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from './entities/user.entity.js';
import { Persist } from '../db/persist.js';

@Injectable()
export class UserService {
  private users: User[] = [];
  private nextId = 1;

  constructor() {
    Persist.register('users', () => this.users, (v: User[]) => {
      this.users = v;
      this.nextId = v.length > 0 ? Math.max(...v.map(u => u.id)) + 1 : 1;
    });
  }

  create(data: {
    nom: string;
    prenom: string;
    email: string;
    motDePasse: string;
    role: string;
    associations?: Array<{ className: string; section: string }>;
  }): User {
    const newUser: User = {
      id: this.nextId++,
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      motDePasseHash: data.motDePasse,
      role: data.role || 'enseignant',
      associations: data.associations || [],
    };
    this.users.push(newUser);
    return newUser;
  }

  findAll(): User[] {
    return this.users;
  }

  findOne(id: number): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  findByEmail(email: string): User | undefined {
    return this.users.find((user) => user.email === email);
  }

  update(id: number, updateUserDto: UpdateUserDto): User | null {
    const user = this.findOne(id);
    if (!user) return null;
    Object.assign(user, updateUserDto);
    return user;
  }

  remove(id: number): User | null {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) return null;
    const [removed] = this.users.splice(index, 1);
    return removed;
  }
}
