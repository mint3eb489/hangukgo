import { VocabItem } from './vocabData';

export interface DramaShowMeta {
  id: string;
  subcategory: string;
  titleKr: string;
  titleDe: string;
  year?: string;
  genreDe?: string;
  genreKr?: string;
  quoteKr?: string;
  quoteDe?: string;
}

/**
 * Alle zuvor vordefinierten K-Drama Vokabellisten wurden vollständig entfernt.
 * Der K-Drama-Modus wird nun rein durch die vom Nutzer selbst hochgeladenen Drama-Listen
 * (über "Vokabeln hinzufügen" -> Ziel: "K-Drama") gefüllt.
 */
export const DRAMA_SHOWS: DramaShowMeta[] = [];
export const DRAMA_VOCAB_ITEMS: VocabItem[] = [];
