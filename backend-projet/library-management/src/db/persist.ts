/**
 * Persist — Persistance JSON simple pour le stockage en mémoire
 *
 * Usage dans un service :
 *   constructor() {
 *     Persist.register('users', () => this.users, (v) => this.users = v)
 *   }
 *
 * Les données sont sauvegardées automatiquement dans db/data.json
 * toutes les 10 secondes, et rechargées au démarrage.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface Entry {
  get: () => any;
  set: (v: any) => void;
}

const DB_DIR = join(process.cwd(), 'db');
const DB_FILE = join(DB_DIR, 'data.json');

const registry = new Map<string, Entry>();

export const Persist = {
  /**
   * Enregistre une collection pour qu'elle soit persistée.
   * À appeler dans le constructeur du service.
   */
  register(key: string, get: () => any, set: (v: any) => void) {
    registry.set(key, { get, set });
  },

  /**
   * Charge toutes les collections depuis le fichier JSON.
   * À appeler au démarrage de l'application (dans main.ts).
   */
  loadAll() {
    if (!existsSync(DB_FILE)) return;
    try {
      const data = JSON.parse(readFileSync(DB_FILE, 'utf-8'));
      for (const [key, { set }] of registry) {
        if (data[key] !== undefined) {
          set(data[key]);
        }
      }
      console.log(`📦 Données chargées depuis ${DB_FILE} (${registry.size} collections)`);
    } catch (err) {
      console.error('Erreur chargement données:', err);
    }
  },

  /**
   * Sauvegarde toutes les collections dans le fichier JSON.
   */
  saveAll() {
    if (registry.size === 0) return;
    try {
      if (!existsSync(DB_DIR)) {
        mkdirSync(DB_DIR, { recursive: true });
      }
      const data: Record<string, any> = {};
      for (const [key, { get }] of registry) {
        data[key] = get();
      }
      writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Erreur sauvegarde données:', err);
    }
  },
};

// Auto-save toutes les 10 secondes
setInterval(() => Persist.saveAll(), 10_000);
