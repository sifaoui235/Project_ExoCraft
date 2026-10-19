import { Injectable, BadRequestException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx';
import { ContentService } from '../content/content.service.js';
import { QuizService } from '../quiz/quiz.service.js';

// DTO pour export direct depuis texte brut
export interface ExportDirectDto {
  titre: string;
  matiere: string;
  theme: string;
  type: string;
  contenu: string;
  avecCorrige?: boolean; // pour quiz/examen : inclure les réponses
}

@Injectable()
export class ExportService {
  constructor(
    private readonly contentService: ContentService,
    private readonly quizService: QuizService,
  ) {}

  // ─────────────────────────────────────────────────────
  // EXPORT PDF — Contenu pédagogique
  // ─────────────────────────────────────────────────────

  async exportContentPdf(id: number): Promise<Buffer> {
    const content = this.contentService.findOne(id);

    if (!content.contenu || content.contenu.trim().length === 0) {
      throw new BadRequestException('Impossible d\'exporter un contenu vide');
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // En-tête
      doc.fontSize(20).font('Helvetica-Bold').text(content.titre, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`Matière : ${content.matiere}`, { align: 'center' });
      doc.text(`Thème : ${content.theme}`, { align: 'center' });
      doc.text(`Type : ${content.type}`, { align: 'center' });
      doc.moveDown(1);

      // Ligne séparatrice
      doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke();
      doc.moveDown(1);

      // Contenu
      doc.fontSize(11).font('Helvetica').text(content.contenu, { lineGap: 4 });

      // Pied de page
      doc.moveDown(2);
      doc.fontSize(9).fillColor('grey').text(
        `Généré par ExoCraft — ${new Date().toLocaleDateString('fr-FR')}`,
        { align: 'right' },
      );

      doc.end();
    });
  }

  // ─────────────────────────────────────────────────────
  // EXPORT PDF — Quiz
  // ─────────────────────────────────────────────────────

  async exportQuizPdf(id: number, avecCorrige = false): Promise<Buffer> {
    const quiz = this.quizService.findOne(id);

    if (quiz.questions.length === 0) {
      throw new BadRequestException('Impossible d\'exporter un quiz sans questions');
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // En-tête
      doc.fontSize(20).font('Helvetica-Bold').text(quiz.titre, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`Matière : ${quiz.matiere}  |  Thème : ${quiz.theme}  |  Niveau : ${quiz.niveau}`, { align: 'center' });
      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke();
      doc.moveDown(1);

      // Questions
      quiz.questions.forEach((q, i) => {
        doc.fontSize(12).font('Helvetica-Bold').text(`Q${i + 1}. ${q.enonce}`);
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica');
        doc.text(`   A) ${q.choixA}`);
        doc.text(`   B) ${q.choixB}`);
        doc.text(`   C) ${q.choixC}`);
        doc.text(`   D) ${q.choixD}`);

        if (avecCorrige) {
          doc.moveDown(0.3);
          doc.fontSize(10).fillColor('green')
            .text(`   ✓ Réponse : ${q.reponseCorrecte}  —  ${q.explication}`);
          doc.fillColor('black');
        }
        doc.moveDown(0.8);
      });

      // Pied de page
      doc.fontSize(9).fillColor('grey').text(
        `Généré par ExoCraft — ${new Date().toLocaleDateString('fr-FR')}`,
        { align: 'right' },
      );

      doc.end();
    });
  }

  // ─────────────────────────────────────────────────────
  // EXPORT WORD — Contenu pédagogique
  // ─────────────────────────────────────────────────────

  async exportContentWord(id: number): Promise<Buffer> {
    const content = this.contentService.findOne(id);

    if (!content.contenu || content.contenu.trim().length === 0) {
      throw new BadRequestException('Impossible d\'exporter un contenu vide');
    }

    const lignes = content.contenu.split('\n');

    const paragraphs = [
      new Paragraph({
        text: content.titre,
        heading: HeadingLevel.HEADING_1,
      }),
      new Paragraph({
        children: [new TextRun({ text: `Matière : ${content.matiere}`, bold: true })],
      }),
      new Paragraph({
        children: [new TextRun({ text: `Thème : ${content.theme}` })],
      }),
      new Paragraph({ text: '' }),
      ...lignes.map(
        (ligne) =>
          new Paragraph({
            children: [new TextRun({ text: ligne })],
          }),
      ),
      new Paragraph({ text: '' }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Généré par ExoCraft — ${new Date().toLocaleDateString('fr-FR')}`,
            color: '999999',
            size: 18,
          }),
        ],
      }),
    ];

    const doc = new Document({ sections: [{ children: paragraphs }] });
    return Packer.toBuffer(doc);
  }

  // ─────────────────────────────────────────────────────
  // EXPORT WORD — Quiz
  // ─────────────────────────────────────────────────────

  async exportQuizWord(id: number, avecCorrige = false): Promise<Buffer> {
    const quiz = this.quizService.findOne(id);

    if (quiz.questions.length === 0) {
      throw new BadRequestException('Impossible d\'exporter un quiz sans questions');
    }

    const paragraphs: Paragraph[] = [];

    // En-tête
    paragraphs.push(
      new Paragraph({
        text: quiz.titre,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `Matière : ${quiz.matiere}  |  Thème : ${quiz.theme}  |  Niveau : ${quiz.niveau}`,
            bold: true,
          }),
        ],
      }),
      new Paragraph({ text: '' }),
    );

    // Questions
    quiz.questions.forEach((q, i) => {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: `Q${i + 1}. ${q.enonce}`, bold: true })],
        }),
        new Paragraph({
          children: [new TextRun({ text: `   A) ${q.choixA}` })],
        }),
        new Paragraph({
          children: [new TextRun({ text: `   B) ${q.choixB}` })],
        }),
        new Paragraph({
          children: [new TextRun({ text: `   C) ${q.choixC}` })],
        }),
        new Paragraph({
          children: [new TextRun({ text: `   D) ${q.choixD}` })],
        }),
      );

      if (avecCorrige) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `   ✓ Réponse : ${q.reponseCorrecte}  —  ${q.explication}`,
                color: '15803d',
                bold: true,
              }),
            ],
          }),
        );
      }

      paragraphs.push(new Paragraph({ text: '' }));
    });

    // Pied de page
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: `Généré par ExoCraft — ${new Date().toLocaleDateString('fr-FR')}`,
            color: '999999',
            size: 18,
          }),
        ],
      }),
    );

    const doc = new Document({ sections: [{ children: paragraphs }] });
    return Packer.toBuffer(doc);
  }

  // ─────────────────────────────────────────────────────
  // EXPORT PDF — Direct depuis texte brut (sans ID)
  // Utilisé juste après la génération IA, avant sauvegarde
  // ─────────────────────────────────────────────────────

  async exportDirectPdf(dto: ExportDirectDto): Promise<Buffer> {
    const { titre, matiere, theme, type, contenu, avecCorrige = false } = dto;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end',  () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── En-tête ─────────────────────────────────────
      doc.fontSize(20).font('Helvetica-Bold').text(titre, { align: 'center' });
      doc.moveDown(0.4);
      doc.fontSize(11).font('Helvetica')
        .fillColor('#555555')
        .text(`Matière : ${matiere}   |   Thème : ${theme}   |   Type : ${type}`, { align: 'center' });

      if (avecCorrige) {
        doc.moveDown(0.3);
        doc.fontSize(10).fillColor('#b91c1c')
          .text('— Version avec corrigé (réservée au professeur) —', { align: 'center' });
      }

      doc.fillColor('#000000').moveDown(0.8);
      doc.moveTo(50, doc.y).lineTo(560, doc.y).lineWidth(0.5).stroke();
      doc.moveDown(0.8);

      // ── Contenu ──────────────────────────────────────
      // Séparation intelligente : si "Réponse correcte" dans le texte et pas corrigé → on la masque
      const lignes = contenu.split('\n');
      for (const ligne of lignes) {
        const isCorrige =
          ligne.trim().startsWith('Réponse correcte') ||
          ligne.trim().startsWith('✓') ||
          ligne.trim().startsWith('Explication');

        if (isCorrige && !avecCorrige) continue; // masquer si pas de corrigé

        if (isCorrige && avecCorrige) {
          doc.fontSize(10).fillColor('#15803d').text(ligne, { lineGap: 2 });
          doc.fillColor('#000000');
        } else if (ligne.startsWith('Q') && ligne.includes('.')) {
          doc.fontSize(12).font('Helvetica-Bold').text(ligne, { lineGap: 3 });
          doc.font('Helvetica');
        } else if (ligne.trim() === '') {
          doc.moveDown(0.5);
        } else {
          doc.fontSize(11).text(ligne, { lineGap: 2 });
        }
      }

      // ── Pied de page ─────────────────────────────────
      doc.moveDown(2);
      doc.fontSize(9).fillColor('#999999').text(
        `Généré par ExoCraft — ${new Date().toLocaleDateString('fr-FR')}`,
        { align: 'right' },
      );

      doc.end();
    });
  }

  // ─────────────────────────────────────────────────────
  // EXPORT WORD — Direct depuis texte brut (sans ID)
  // ─────────────────────────────────────────────────────

  async exportDirectWord(dto: ExportDirectDto): Promise<Buffer> {
    const { titre, matiere, theme, type, contenu, avecCorrige = false } = dto;

    const paragraphs: Paragraph[] = [];

    // ── En-tête ───────────────────────────────────────
    paragraphs.push(
      new Paragraph({ text: titre, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `Matière : ${matiere}   |   Thème : ${theme}   |   Type : ${type}`, bold: true, color: '555555' })],
      }),
    );

    if (avecCorrige) {
      paragraphs.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: '— Version avec corrigé (réservée au professeur) —', color: 'b91c1c', italics: true })],
      }));
    }

    paragraphs.push(new Paragraph({ text: '' }));

    // ── Contenu ───────────────────────────────────────
    const lignes = contenu.split('\n');
    for (const ligne of lignes) {
      const isCorrige =
        ligne.trim().startsWith('Réponse correcte') ||
        ligne.trim().startsWith('✓') ||
        ligne.trim().startsWith('Explication');

      if (isCorrige && !avecCorrige) continue;

      if (ligne.trim() === '') {
        paragraphs.push(new Paragraph({ text: '' }));
      } else if (isCorrige && avecCorrige) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: ligne, color: '15803d', bold: true })],
        }));
      } else if (ligne.startsWith('Q') && ligne.includes('.')) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: ligne, bold: true })],
        }));
      } else {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: ligne })],
        }));
      }
    }

    // ── Pied de page ──────────────────────────────────
    paragraphs.push(
      new Paragraph({ text: '' }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({
          text: `Généré par ExoCraft — ${new Date().toLocaleDateString('fr-FR')}`,
          color: '999999',
          size: 18,
        })],
      }),
    );

    const docx = new Document({ sections: [{ children: paragraphs }] });
    return Packer.toBuffer(docx);
  }
}
