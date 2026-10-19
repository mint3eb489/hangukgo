export type TopikLevel = 'TOPIK I' | 'TOPIK II';
export type VocabCategory = 'noun' | 'verb' | 'grammar';

export interface VocabItem {
  id: string;
  level: TopikLevel;
  cat: VocabCategory;
  sub: string;
  kr: string;
  de: string;
  en?: string;
  exKr?: string;
  exDe?: string;
  exEn?: string;
  hanja?: string;
  custom?: boolean;
}

// TOPIK I Basis-Datensatz (Auf 0 gesetzt – Vokabeln werden über die Vokabel- & Cloud-Zentrale geladen)
export const rawDataTopik1: VocabItem[] = [];

// TOPIK II Basis-Datensatz (Auf 0 gesetzt – Vokabeln werden über die Vokabel- & Cloud-Zentrale geladen)
export const rawDataTopik2: VocabItem[] = [];
