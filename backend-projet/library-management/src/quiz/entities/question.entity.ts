export class Question {
  id: number;
  enonce: string;
  choixA: string;
  choixB: string;
  choixC: string;
  choixD: string;
  reponseCorrecte: 'A' | 'B' | 'C' | 'D';
  explication: string;
}
