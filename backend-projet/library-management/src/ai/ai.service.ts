import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GenerateContentDto, ContentType } from './dto/generate-content.dto.js';
import { SaveGeneratedDto } from './dto/save-generated.dto.js';
import { GeneratedContent } from './entities/generated-content.entity.js';
import { ChatDto } from './dto/chat.dto.js';
import { ArchiveService } from '../archive/archive.service.js';
import { ContentService } from '../content/content.service.js';
import { QuizService } from '../quiz/quiz.service.js';
import { Content } from '../content/entities/content.entity.js';
import { Quiz } from '../quiz/entities/quiz.entity.js';
import { NiveauQuiz, VisibiliteQuiz } from '../quiz/dto/create-quiz.dto.js';

@Injectable()
export class AiService {
  private readonly client: OpenAI;
  private readonly model: string;

  private contents: GeneratedContent[] = [];
  private nextId = 1;

  constructor(
    private readonly configService: ConfigService,
    private readonly archiveService: ArchiveService,
    private readonly contentService: ContentService,
    private readonly quizService: QuizService,
  ) {
    this.client = new OpenAI({
      apiKey: this.configService.getOrThrow<string>('OPENROUTER_API_KEY'),
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'ExoCraft',
      },
    });

    this.model = this.configService.get<string>(
      'OPENROUTER_MODEL',
      'meta-llama/llama-3.3-70b-instruct',
    );
  }

  // ─────────────────────────────────────────────────────
  // GÉNÉRATION PRINCIPALE
  // ─────────────────────────────────────────────────────

  async generate(dto: GenerateContentDto): Promise<{ contenu: string }> {
    const prompt = this.buildPrompt(dto);

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 1500,
        messages: [
          { role: 'system', content: this.getSystemPrompt(dto.type) },
          { role: 'user', content: prompt },
        ],
      });

      const contenu = response.choices[0]?.message?.content ?? '';
      return { contenu };
    } catch (error) {
      throw new InternalServerErrorException(
        `Erreur lors de la génération IA : ${(error as Error).message}`,
      );
    }
  }

  // ─────────────────────────────────────────────────────
  // GÉNÉRATION DEPUIS UNE ARCHIVE (BF-19)
  // ─────────────────────────────────────────────────────

  async generateFromArchive(
    archiveId: number,
    dto: Omit<GenerateContentDto, 'courseFourni' | 'matiere'>,
  ): Promise<{ contenu: string }> {
    const { texte, matiere } = this.archiveService.getTexte(archiveId);

    // On utilise le texte extrait comme cours fourni + la matière de l'archive
    return this.generate({
      ...dto,
      matiere,
      courseFourni: texte.substring(0, 4000), // limite pour ne pas dépasser le contexte
    } as GenerateContentDto);
  }

  // ─────────────────────────────────────────────────────
  // SAUVEGARDE EN BROUILLON
  // Route vers ContentService (cours, resume) ou QuizService (quiz, serie, examen)
  // ─────────────────────────────────────────────────────

  save(dto: SaveGeneratedDto, auteurId?: number): GeneratedContent | Content | Quiz {
    // Types qui vont dans ContentService
    const CONTENT_TYPES = ['cours', 'resume'];
    // Types qui vont dans QuizService
    const QUIZ_TYPES = ['quiz', 'serie', 'examen'];

    if (CONTENT_TYPES.includes(dto.type)) {
      // Sauvegarde dans ContentService → visible dans "Mes Contenus"
      return this.contentService.create({
        titre: dto.titre,
        type: dto.type as 'cours' | 'resume',
        matiere: dto.matiere,
        theme: dto.theme,
        contenu: dto.contenu,
        auteurId: auteurId ?? 0,
        visibilite: 'prive',
      });
    }

    if (QUIZ_TYPES.includes(dto.type)) {
      // Sauvegarde dans QuizService → visible dans "Mes Quiz"
      const quiz = this.quizService.create({
        titre: dto.titre,
        theme: dto.theme,
        matiere: dto.matiere,
        niveau: NiveauQuiz.INTERMEDIAIRE,
        visibilite: VisibiliteQuiz.PRIVE,
      });
      // Stocke le contenu IA brut + métadonnées
      quiz.contenuIA = dto.contenu;
      quiz.auteurId = auteurId ?? 0;
      quiz.typeIA = dto.type as 'quiz' | 'serie' | 'examen';
      return quiz;
    }

    // Fallback : sauvegarde dans la liste interne (ne devrait pas arriver)
    const newContent: GeneratedContent = {
      id: this.nextId++,
      titre: dto.titre,
      type: dto.type,
      matiere: dto.matiere,
      theme: dto.theme,
      contenu: dto.contenu,
      statut: 'brouillon',
      dateGeneration: new Date(),
    };
    this.contents.push(newContent);
    return newContent;
  }

  // ─────────────────────────────────────────────────────
  // CONSULTER LES CONTENUS GÉNÉRÉS
  // ─────────────────────────────────────────────────────

  findAll(): GeneratedContent[] {
    return this.contents;
  }

  findOne(id: number): GeneratedContent | null {
    return this.contents.find((c) => c.id === id) ?? null;
  }

  // ─────────────────────────────────────────────────────
  // VALIDER UN CONTENU (brouillon → validé)
  // ─────────────────────────────────────────────────────

  valider(id: number): GeneratedContent {
    const content = this.findOne(id);
    if (!content) {
      throw new InternalServerErrorException(`Contenu ${id} introuvable`);
    }
    content.statut = 'valide';
    return content;
  }

  // ─────────────────────────────────────────────────────
  // MODIFIER LE CONTENU MANUELLEMENT
  // ─────────────────────────────────────────────────────

  updateContenu(id: number, nouveauContenu: string): GeneratedContent {
    const content = this.findOne(id);
    if (!content) {
      throw new InternalServerErrorException(`Contenu ${id} introuvable`);
    }
    content.contenu = nouveauContenu;
    content.statut = 'brouillon'; // repasse en brouillon après modification
    return content;
  }

  // ─────────────────────────────────────────────────────
  // CHAT LIBRE AVEC L'IA
  // ─────────────────────────────────────────────────────

  async chat(dto: ChatDto): Promise<{ reponse: string }> {
    // Construire les messages : système + historique + message actuel
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `Tu es ExoCraft, un assistant pédagogique intelligent.
Tu aides les enseignants à créer des contenus pédagogiques : cours, résumés, quiz, séries d'exercices et examens.
Tu réponds toujours en français, de façon claire et concise.
Si on te demande de générer du contenu pédagogique, tu le fais directement.`,
      },
    ];

    // Ajouter l'historique de la conversation si présent
    if (dto.historique && dto.historique.length > 0) {
      for (const msg of dto.historique) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Ajouter le message actuel
    messages.push({ role: 'user', content: dto.message });

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 1000,
        messages,
      });

      const reponse = response.choices[0]?.message?.content ?? '';
      return { reponse };
    } catch (error) {
      throw new InternalServerErrorException(
        `Erreur chat IA : ${(error as Error).message}`,
      );
    }
  }

  // ─────────────────────────────────────────────────────
  // CONSTRUCTION DES PROMPTS
  // ─────────────────────────────────────────────────────

  private buildPrompt(dto: GenerateContentDto): string {
    const base = dto.courseFourni
      ? `Voici le contenu du cours fourni :\n${dto.courseFourni}\n\n`
      : `Génère à partir du thème suivant : "${dto.theme}" en matière de "${dto.matiere}".\n\n`;

    switch (dto.type) {
      case 'quiz':
        return (
          base +
          `Génère un quiz de ${dto.nombreQuestions ?? 5} questions QCM ` +
          `de niveau ${dto.niveau ?? 'intermédiaire'} ` +
          `sur la matière "${dto.matiere}", thème : "${dto.theme}".`
        );

      case 'serie':
        return (
          base +
          `Génère une série d'exercices sur la matière "${dto.matiere}", ` +
          `thème : "${dto.theme}". Inclure des exercices de différents niveaux ` +
          `avec leurs corrigés.`
        );

      case 'examen':
        return (
          base +
          `Génère un examen formel sur la matière "${dto.matiere}", ` +
          `thème : "${dto.theme}". ` +
          `Durée : ${dto.duree ?? '2 heures'}. ` +
          `Barème : ${dto.bareme ?? '20 points'}. ` +
          `Inclure les consignes, les questions et le corrigé.`
        );

      case 'cours':
        return (
          base +
          `Génère un cours complet et structuré sur la matière "${dto.matiere}", ` +
          `thème : "${dto.theme}". Inclure introduction, sections numérotées et conclusion.`
        );

      case 'resume':
        return (
          base +
          `Génère un résumé clair et structuré sur la matière "${dto.matiere}", ` +
          `thème : "${dto.theme}". Inclure les points clés et le thème principal.`
        );
    }
  }

  private getSystemPrompt(type: ContentType): string {
    const base = `Tu es un enseignant expert et pédagogue. 
Tu réponds toujours en français.
Tu structures bien tes réponses avec des titres et sections claires.`;

    switch (type) {
      case 'quiz':
        return (
          base +
          `\n\nFormat de chaque question QCM :
Q1: [intitulé de la question]
A) [option A]
B) [option B]
C) [option C]
D) [option D]
Réponse correcte : [lettre]
Explication : [explication courte]`
        );

      case 'serie':
        return (
          base +
          `\n\nFormat de la série d'exercices :
[EXERCICE 1] : [énoncé]
[CORRIGÉ 1] : [solution détaillée]

Numéroter chaque exercice et son corrigé.`
        );

      case 'examen':
        return (
          base +
          `\n\nFormat de l'examen :
[CONSIGNES] : durée, barème, instructions générales
[PARTIE 1] : [titre] (X points)
  Question 1 : ...
  Question 2 : ...
[CORRIGÉ] : réponses détaillées avec barème`
        );

      case 'cours':
        return (
          base +
          `\n\nFormat du cours :
[INTRODUCTION] : contexte et objectifs
[1. TITRE SECTION] : contenu
[2. TITRE SECTION] : contenu
[CONCLUSION] : synthèse et points clés`
        );

      case 'resume':
        return (
          base +
          `\n\nFormat du résumé :
[RÉSUMÉ] : 5 à 8 lignes synthétiques
[POINTS CLÉS] :
- point 1
- point 2
- point 3
[NIVEAU] : Débutant / Intermédiaire / Avancé
[THÈME PRINCIPAL] : en une phrase`
        );
    }
  }
}
