import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateQuizDto, VisibiliteQuiz, NiveauQuiz } from './dto/create-quiz.dto.js';
import { UpdateQuizDto } from './dto/update-quiz.dto.js';
import { CreateQuestionDto } from './dto/create-question.dto.js';
import { UpdateQuestionDto } from './dto/update-question.dto.js';
import { ImportQuizDto } from './dto/import-quiz.dto.js';
import { Quiz } from './entities/quiz.entity.js';
import { Question } from './entities/question.entity.js';
import { Persist } from '../db/persist.js';

@Injectable()
export class QuizService {
  private quizzes: Quiz[] = [];
  private nextQuizId = 1;
  private nextQuestionId = 1;

  constructor() {
    Persist.register('quizzes', () => this.quizzes, (v: Quiz[]) => {
      this.quizzes = v;
      this.nextQuizId = v.length > 0 ? Math.max(...v.map(q => q.id)) + 1 : 1;
      const allQuestions = v.flatMap(q => q.questions || []);
      this.nextQuestionId = allQuestions.length > 0 ? Math.max(...allQuestions.map(q => q.id)) + 1 : 1;
    });
  }

  // ─────────────────────────────────────────────────────
  // CRUD QUIZ
  // ─────────────────────────────────────────────────────

  create(createQuizDto: CreateQuizDto): Quiz {
    const newQuiz: Quiz = {
      id: this.nextQuizId++,
      titre: createQuizDto.titre,
      theme: createQuizDto.theme,
      matiere: createQuizDto.matiere,
      niveau: createQuizDto.niveau ?? 'intermediaire',
      statut: 'brouillon',
      visibilite: createQuizDto.visibilite ?? 'prive',
      dateGeneration: new Date(),
      questions: [],
      archived: false,
    };
    this.quizzes.push(newQuiz);
    return newQuiz;
  }

  findAll(): Quiz[] {
    return this.quizzes.filter((q) => !q.archived);
  }

  findOne(id: number): Quiz {
    const quiz = this.quizzes.find((q) => q.id === id);
    if (!quiz) {
      throw new NotFoundException(`Quiz avec l'id ${id} introuvable`);
    }
    return quiz;
  }

  update(id: number, updateQuizDto: UpdateQuizDto): Quiz {
    const quiz = this.findOne(id);
    Object.assign(quiz, updateQuizDto);
    return quiz;
  }

  remove(id: number): Quiz {
    const index = this.quizzes.findIndex((q) => q.id === id);
    if (index === -1) {
      throw new NotFoundException(`Quiz avec l'id ${id} introuvable`);
    }
    const [removed] = this.quizzes.splice(index, 1);
    return removed;
  }

  // ─────────────────────────────────────────────────────
  // VALIDER UN QUIZ (brouillon → validé)
  // ─────────────────────────────────────────────────────

  valider(id: number): Quiz {
    const quiz = this.findOne(id);
    if (quiz.questions.length === 0) {
      throw new BadRequestException(
        'Impossible de valider un quiz sans questions',
      );
    }
    quiz.statut = 'valide';
    return quiz;
  }

  // ─────────────────────────────────────────────────────
  // PUBLIER / DÉPUBLIER (privé ↔ public)
  // ─────────────────────────────────────────────────────

  toggleVisibilite(id: number): Quiz {
    const quiz = this.findOne(id);
    if (quiz.statut !== 'valide') {
      throw new BadRequestException(
        'Seul un quiz validé peut être publié',
      );
    }
    quiz.visibilite = quiz.visibilite === 'prive' ? 'public' : 'prive';
    return quiz;
  }

  // ─────────────────────────────────────────────────────
  // GESTION DES QUESTIONS
  // ─────────────────────────────────────────────────────

  addQuestion(quizId: number, dto: CreateQuestionDto): Quiz {
    const quiz = this.findOne(quizId);

    const newQuestion: Question = {
      id: this.nextQuestionId++,
      enonce: dto.enonce,
      choixA: dto.choixA,
      choixB: dto.choixB,
      choixC: dto.choixC,
      choixD: dto.choixD,
      reponseCorrecte: dto.reponseCorrecte,
      explication: dto.explication,
    };

    quiz.questions.push(newQuestion);
    quiz.statut = 'brouillon'; // repasse en brouillon si on ajoute une question
    return quiz;
  }

  updateQuestion(
    quizId: number,
    questionId: number,
    dto: UpdateQuestionDto,
  ): Quiz {
    const quiz = this.findOne(quizId);
    const question = quiz.questions.find((q) => q.id === questionId);

    if (!question) {
      throw new NotFoundException(
        `Question ${questionId} introuvable dans le quiz ${quizId}`,
      );
    }

    Object.assign(question, dto);
    quiz.statut = 'brouillon'; // repasse en brouillon après modification
    return quiz;
  }

  removeQuestion(quizId: number, questionId: number): Quiz {
    const quiz = this.findOne(quizId);
    const index = quiz.questions.findIndex((q) => q.id === questionId);

    if (index === -1) {
      throw new NotFoundException(
        `Question ${questionId} introuvable dans le quiz ${quizId}`,
      );
    }

    quiz.questions.splice(index, 1);
    quiz.statut = 'brouillon';
    return quiz;
  }

  // ─────────────────────────────────────────────────────
  // IMPORT DEPUIS L'IA
  // Crée un quiz avec ses questions en une seule opération
  // ─────────────────────────────────────────────────────

  importFromAi(dto: ImportQuizDto): Quiz {
    const quiz = this.create({
      titre: dto.titre,
      theme: dto.theme,
      matiere: dto.matiere,
      niveau: dto.niveau,
      visibilite: VisibiliteQuiz.PRIVE,
    });

    for (const questionDto of dto.questions) {
      this.addQuestion(quiz.id, questionDto);
    }

    quiz.statut = 'brouillon';
    return quiz;
  }

  // ─────────────────────────────────────────────────────
  // VARIANTE D'UN QUIZ (BF-08)
  // Crée une copie du quiz avec les questions mélangées
  // et les choix de réponses permutés aléatoirement
  // ─────────────────────────────────────────────────────

  creerVariante(id: number): Quiz {
    const original = this.findOne(id);

    // Mélange des questions
    const questionsMelangees = [...original.questions]
      .sort(() => Math.random() - 0.5)
      .map((q) => {
        // Mélange des choix tout en gardant la bonne réponse
        const choix: { lettre: 'A' | 'B' | 'C' | 'D'; texte: string }[] = [
          { lettre: 'A', texte: q.choixA },
          { lettre: 'B', texte: q.choixB },
          { lettre: 'C', texte: q.choixC },
          { lettre: 'D', texte: q.choixD },
        ];
        const bonneReponseTexte = choix.find(
          (c) => c.lettre === q.reponseCorrecte,
        )!.texte;

        // Mélange aléatoire des choix
        choix.sort(() => Math.random() - 0.5);

        // Retrouver la nouvelle lettre de la bonne réponse
        const nouvelleBonneReponse = choix.find(
          (c) => c.texte === bonneReponseTexte,
        )!.lettre;

        return {
          id: this.nextQuestionId++,
          enonce: q.enonce,
          choixA: choix[0].texte,
          choixB: choix[1].texte,
          choixC: choix[2].texte,
          choixD: choix[3].texte,
          reponseCorrecte: nouvelleBonneReponse,
          explication: q.explication,
        };
      });

    const variante: Quiz = {
      id: this.nextQuizId++,
      titre: `${original.titre} — Variante`,
      theme: original.theme,
      matiere: original.matiere,
      niveau: original.niveau,
      statut: 'brouillon',
      visibilite: 'prive',
      dateGeneration: new Date(),
      questions: questionsMelangees,
      archived: false,
    };

    this.quizzes.push(variante);
    return variante;
  }

  // ─────────────────────────────────────────────────────
  // PAGINATION + FILTRES
  // ─────────────────────────────────────────────────────

  findAllPaginated(filters: {
    matiere?: string;
    statut?: 'brouillon' | 'valide';
    niveau?: string;
    page?: number;
    limit?: number;
  }): { data: Quiz[]; total: number; page: number; limit: number } {
    // Exclure les archivés de la liste normale
    let result = this.quizzes.filter((q) => !q.archived);

    if (filters.matiere) result = result.filter((q) => q.matiere.toLowerCase().includes(filters.matiere!.toLowerCase()));
    if (filters.statut)  result = result.filter((q) => q.statut === filters.statut);
    if (filters.niveau)  result = result.filter((q) => q.niveau === filters.niveau);

    const total = result.length;
    const page  = filters.page  ?? 1;
    const limit = filters.limit ?? 10;
    const start = (page - 1) * limit;

    return { data: result.slice(start, start + limit), total, page, limit };
  }

  // ─────────────────────────────────────────────────────
  // ARCHIVER / DÉSARCHIVER
  // ─────────────────────────────────────────────────────

  archiver(id: number): Quiz {
    const quiz = this.findOne(id);
    quiz.archived = true;
    quiz.archivedAt = new Date();
    return quiz;
  }

  desarchiver(id: number): Quiz {
    const quiz = this.findOne(id);
    quiz.archived = false;
    quiz.archivedAt = undefined;
    return quiz;
  }

  findArchived(filters: {
    matiere?: string;
    page?: number;
    limit?: number;
  }): { data: Quiz[]; total: number; page: number; limit: number } {
    let result = this.quizzes.filter((q) => q.archived);

    if (filters.matiere) result = result.filter((q) => q.matiere.toLowerCase().includes(filters.matiere!.toLowerCase()));

    const total = result.length;
    const page  = filters.page  ?? 1;
    const limit = filters.limit ?? 10;
    const start = (page - 1) * limit;

    return { data: result.slice(start, start + limit), total, page, limit };
  }
}
