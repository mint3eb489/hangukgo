import React, { useState } from 'react';
import { VocabItem } from '../data/vocabData';
import { speakKorean } from '../utils/speech';
import { SrsMap } from '../utils/srs';
import { highlightKoreanVocab } from '../utils/highlightVocab';
import { getHanjaInfo } from '../utils/hanjaLexicon';
import { HanjaBreakdownBox } from './HanjaBreakdownBox';
import { hapticTap } from '../utils/haptics';
import { AppLanguage, translations } from '../utils/translations';
import { Search, Volume2, X } from 'lucide-react';

interface ListViewProps {
  items: VocabItem[];
  srsMap?: SrsMap;
  lang?: AppLanguage;
  onMarkSrs?: (id: string, success: boolean) => void;
  onDeleteItem?: (id: string) => void;
  onOpenUpload?: () => void;
}

export const ListView: React.FC<ListViewProps> = ({
  items,
  lang = 'de',
  onOpenUpload,
}) => {
  const t = translations[lang];
  const [search, setSearch] = useState('');

  const filtered = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    const hanjaInfo = getHanjaInfo(item.kr, item.cat);
    const hanjaMatch =
      hanjaInfo &&
      (hanjaInfo.hanja.toLowerCase().includes(q) ||
        hanjaInfo.roots.some(
          (r) =>
            r.char.toLowerCase().includes(q) ||
            r.de.toLowerCase().includes(q) ||
            r.kr.toLowerCase().includes(q)
        ) ||
        (hanjaInfo.family && hanjaInfo.family.some((f) => f.toLowerCase().includes(q))));

    return (
      item.kr.toLowerCase().includes(q) ||
      item.de.toLowerCase().includes(q) ||
      (item.en && item.en.toLowerCase().includes(q)) ||
      item.sub.toLowerCase().includes(q) ||
      (item.exKr && item.exKr.toLowerCase().includes(q)) ||
      (item.exDe && item.exDe.toLowerCase().includes(q)) ||
      (item.exEn && item.exEn.toLowerCase().includes(q)) ||
      Boolean(hanjaMatch)
    );
  });

  return (
    <section className="mt-1.5 flex flex-col max-h-[72vh]">
      {/* Search Input */}
      <div className="mb-3 relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.list.searchPlaceholder}
          className="w-full hanji-card rounded-2xl pl-11 pr-10 py-3 text-sm text-ink placeholder-muted focus:outline-none focus:border-celadon"
        />
        {search && (
          <button
            type="button"
            onClick={() => {
              hapticTap();
              setSearch('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-ink rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* List Container with Hanji Paper Elevation */}
      <div className="flex-grow overflow-y-auto rounded-3xl hanji-card-elevated divide-y divide-border-card">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm flex flex-col items-center gap-3">
            {items.length === 0 ? (
              <>
                <p className="font-semibold text-ink text-base">
                  {lang === 'kr' ? '등록된 단어가 없습니다 (0개)' : 'Noch keine Vokabeln vorhanden (0 Einträge)'}
                </p>
                <p className="text-xs text-muted max-w-sm">
                  {lang === 'kr'
                    ? 'CSV 또는 .md 단어 목록을 업로드하거나 단어를 직접 추가해 보세요.'
                    : 'Lade deine eigenen CSV- oder .md-Listen über die Vokabel- & Cloud-Zentrale hoch.'}
                </p>
                {onOpenUpload && (
                  <button
                    type="button"
                    onClick={() => {
                      hapticTap();
                      onOpenUpload();
                    }}
                    className="mt-1 px-4 py-2.5 rounded-xl bg-celadon hover:bg-celadon/90 text-white text-xs font-semibold shadow-2xs transition"
                  >
                    {lang === 'kr' ? '+ CSV / .md 업로드 및 단어 추가' : '+ CSV / .md Liste hochladen'}
                  </button>
                )}
              </>
            ) : (
              <span>{t.list.noResults(search)}</span>
            )}
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 hover:bg-surface/45 transition flex items-start justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="hangul-display font-bold text-xl sm:text-2xl text-ink">
                    {item.kr}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      hapticTap();
                      speakKorean(item.kr);
                    }}
                    className="text-muted hover:text-ink p-1.5 rounded-full hover:bg-surface transition"
                    title={t.list.listenTitle}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  {/* Clean unboxed metadata: only subcategory/topic */}
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <span>{item.sub}</span>
                  </div>
                </div>

                <p className="text-sm sm:text-base font-semibold text-ink leading-snug flex flex-wrap items-baseline gap-x-2">
                  <span>{item.de}</span>
                  {item.en && item.en !== item.de && (
                    <span className="text-xs sm:text-sm font-medium text-muted font-sans">
                      ({item.en})
                    </span>
                  )}
                </p>

                {/* Inline Hanja Root Breakdown */}
                <HanjaBreakdownBox
                  krWord={item.kr}
                  cat={item.cat}
                  lang={lang}
                  variant="inline"
                />

                {item.exKr && (
                  <p className="text-xs sm:text-sm font-kr text-ink/90 pt-1 leading-relaxed tracking-wide">
                    <span className="text-celadon font-semibold">예: </span>
                    {highlightKoreanVocab(item.exKr, item.kr, 'celadon')}{' '}
                    <span className="font-sans text-xs text-muted">
                      ({item.exDe || item.exEn}{item.exEn && item.exDe && item.exEn !== item.exDe ? ` · EN: ${item.exEn}` : ''})
                    </span>
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
