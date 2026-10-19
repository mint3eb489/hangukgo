import React from 'react';
import { VocabItem, TopikLevel } from '../data/vocabData';
import { AppLanguage } from '../utils/translations';
import { SyncModal } from './SyncModal';
import { SrsMap } from '../utils/srs';

interface AddVocabModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: TopikLevel;
  lang?: AppLanguage;
  onAddVocab: (newItems: VocabItem[], targetLevel: TopikLevel) => void;
  onClearCustom: () => void;
  customVocabCount?: number;
  srsMap?: SrsMap;
  customVocab?: VocabItem[];
  onImportSync?: (srsMap: SrsMap, customVocab: VocabItem[]) => void;
}

/**
 * AddVocabModal is now seamlessly unified with SyncModal.
 * When opened, it defaults to the 'single' or 'import' tab of the unified Vokabel & Cloud Hub.
 */
export const AddVocabModal: React.FC<AddVocabModalProps> = ({
  isOpen,
  onClose,
  currentLevel,
  lang = 'de',
  onAddVocab,
  onClearCustom,
  srsMap = {},
  customVocab = [],
  onImportSync = () => {},
}) => {
  if (!isOpen) return null;

  return (
    <SyncModal
      isOpen={isOpen}
      onClose={onClose}
      currentLevel={currentLevel}
      lang={lang}
      initialTab="single"
      srsMap={srsMap}
      customVocab={customVocab}
      onAddVocab={onAddVocab}
      onClearCustom={onClearCustom}
      onImportSync={onImportSync}
    />
  );
};
