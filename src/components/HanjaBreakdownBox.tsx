import React from 'react';
import { VocabCategory } from '../data/vocabData';
import { getHanjaInfo } from '../utils/hanjaLexicon';
import { AppLanguage } from '../utils/translations';

interface HanjaBreakdownBoxProps {
  krWord: string;
  cat?: VocabCategory;
  lang?: AppLanguage;
  variant?: 'card' | 'inline';
}

export const HanjaBreakdownBox: React.FC<HanjaBreakdownBoxProps> = ({
  krWord,
  cat,
  lang = 'de',
  variant = 'card',
}) => {
  const info = getHanjaInfo(krWord, cat);
  if (!info) return null;

  const isKr = lang === 'kr';

  if (variant === 'inline') {
    return (
      <div className="text-xs text-muted pt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-semibold text-ochre">
          한자 {info.hanja}:
        </span>
        {info.roots.map((root, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span aria-hidden="true">·</span>}
            <span>
              <strong className="font-kr text-ink font-semibold">
                {root.syllable}({root.char})
              </strong>{' '}
              {isKr ? root.kr : root.de}
            </span>
          </React.Fragment>
        ))}
        {info.family && info.family.length > 0 && (
          <span className="text-muted/85">
            ({isKr ? '관련어' : 'Wortfamilie'}: {info.family.join(', ')})
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="text-left bg-surface/65 p-3.5 rounded-2xl border border-border-card/80 space-y-1.5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-ochre">
          {isKr ? '한자 어원 (Hanja-Wurzeln)' : 'Hanja-Wurzeln'}
        </span>
        <span className="font-kr text-sm font-bold text-ink tracking-widest">
          {info.hanja}
        </span>
      </div>

      {/* Syllable Root Breakdown */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink">
        {info.roots.map((root, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <span className="text-muted" aria-hidden="true">
                +
              </span>
            )}
            <span>
              <strong className="font-kr font-bold text-ink">
                {root.syllable} ({root.char})
              </strong>
              : <span className="text-muted">{isKr ? root.kr : root.de}</span>
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Word Family Examples */}
      {info.family && info.family.length > 0 && (
        <div className="text-[11px] text-muted pt-0.5 border-t border-border-card/60">
          <span className="font-semibold text-ink/80">
            {isKr ? '파생/연관 단어: ' : 'Wortfamilie: '}
          </span>
          <span className="font-kr">{info.family.join(' · ')}</span>
        </div>
      )}
    </div>
  );
};
