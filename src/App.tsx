import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TopikLevel,
  VocabItem,
  rawDataTopik1,
  rawDataTopik2,
} from './data/vocabData';
import {
  SrsMap,
  getSrsRecord,
  advanceSrs,
  failSrs,
  isCardDue,
} from './utils/srs';
import { FlashcardView } from './components/FlashcardView';
import { ListeningView } from './components/ListeningView';
import { QuizView } from './components/QuizView';
import { ListView } from './components/ListView';
import { SyncModal } from './components/SyncModal';
import { ResetModal } from './components/ResetModal';
import { AppLogo } from './components/AppLogo';
import { HangukGoWordmark } from './components/HangukGoWordmark';
import { RamyeonTimerModal, RamyeonFloatingWidget } from './components/RamyeonTimerModal';
import { SojuRouletteModal } from './components/SojuRouletteModal';
import { DramaModeModal, DramaViewMode } from './components/DramaModeModal';
import { BunnyModeModal, BunnyViewMode } from './components/BunnyModeModal';
import { RetroTvIcon } from './components/RetroTvIcon';
import { BunnyEarsIcon } from './components/BunnyEarsIcon';
import { DRAMA_VOCAB_ITEMS } from './data/dramaVocabData';
import { generateBunnyHopList } from './utils/bunnyRandomizer';
import { TaegeukThemeToggle } from './components/TaegeukThemeToggle';
import { ExtrasDrawer } from './components/ExtrasDrawer';
import { DeckFilterPopover, CategoryFilter } from './components/DeckFilterPopover';
import { GatHatIcon } from './components/GatHatIcon';
import { DancheongSettingsIcon } from './components/DancheongSettingsIcon';
import { UserProfileModal } from './components/UserProfileModal';
import { LoginScreen } from './components/LoginScreen';
import { auth, onAuthStateChanged, User } from './services/firebase';
import {
  loadAllFromCloud,
  saveMultipleVocabToCloud,
  deleteSingleVocabFromCloud,
  clearAllCustomVocabFromCloud,
  saveSingleSrsToCloud,
  isDramaVocab,
  convertItemsToDramaInCloud,
} from './services/vocabDatabase';
import { SyncModalTab } from './components/SyncModal';
import { SojuSelection } from './utils/sojuRandomizer';
import { loadAllMarkdownFilesVocab } from './utils/markdownVocabLoader';
import { playRamyeonDoneChime } from './utils/timerAudio';
import { hapticTap } from './utils/haptics';
import { AppLanguage, translations } from './utils/translations';
import confetti from 'canvas-confetti';
import {
  Layers,
  Headphones,
  Sparkles,
  List,
  RotateCw,
  X,
} from 'lucide-react';

export default function App() {
  // Firebase Authentication State
  const [authUser, setAuthUser] = useState<User | null>(() => auth.currentUser);
  const [authReady, setAuthReady] = useState<boolean>(false);
  // Language state: 'de' | 'kr' - defaults to 'de'
  const [language, setLanguage] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem('app_language');
      if (saved === 'kr' || saved === 'de') return saved;
    } catch {
      // ignore
    }
    return 'de';
  });

  const toggleLanguage = () => {
    const nextLang: AppLanguage = language === 'de' ? 'kr' : 'de';
    setLanguage(nextLang);
    try {
      localStorage.setItem('app_language', nextLang);
    } catch {
      // ignore
    }
  };

  const t = translations[language];

  useEffect(() => {
    document.title = '한국GO';
  }, []);

  // Theme state: 'light' | 'dark' - defaults to light
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('kr_b1_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // ignore
    }
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem('kr_b1_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      const themeColor = theme === 'dark' ? '#181716' : '#F7F4EF';
      document.querySelectorAll('meta[name="theme-color"]').forEach((el) => {
        el.setAttribute('content', themeColor);
      });
    } catch (e) {
      console.warn('localStorage error', e);
    }
  }, [theme]);

  // Current TOPIK Level
  const [topikLevel, setTopikLevel] = useState<TopikLevel>(() => {
    try {
      const saved = localStorage.getItem('kr_b1_topik_level');
      return saved === 'TOPIK I' ? 'TOPIK I' : 'TOPIK II';
    } catch {
      return 'TOPIK II';
    }
  });

  // Custom vocabulary uploaded by user
  const [customVocab, setCustomVocab] = useState<VocabItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('kr_b1_custom_vocab') || '[]');
    } catch {
      return [];
    }
  });

  // SRS Data Map: { [itemId]: SrsRecord }
  const [srsMap, setSrsMap] = useState<SrsMap>(() => {
    try {
      const savedSrs = localStorage.getItem('kr_b1_srs');
      if (savedSrs) {
        return JSON.parse(savedSrs);
      }
      // Migrate from legacy progress if exists
      const savedLegacy = localStorage.getItem('kr_b1_progress');
      if (savedLegacy) {
        const legacy = JSON.parse(savedLegacy);
        const migrated: SrsMap = {};
        Object.keys(legacy).forEach((id) => {
          migrated[id] = getSrsRecord(id, {}, legacy);
        });
        return migrated;
      }
      return {};
    } catch {
      return {};
    }
  });

  // View mode: 'card' | 'listening' | 'quiz' | 'list'
  const [viewMode, setViewMode] = useState<'card' | 'listening' | 'quiz' | 'list'>('card');

  // Filters & State
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [subcategory, setSubcategory] = useState<string>('all');
  const [onlyDue, setOnlyDue] = useState<boolean>(false);
  const [krToDe, setKrToDe] = useState<boolean>(true);

  // Deck state
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [deckOrder, setDeckOrder] = useState<string[]>([]);

  // Modals & Progressive Disclosure Drawer
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isExtrasOpen, setIsExtrasOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncModalTab, setSyncModalTab] = useState<SyncModalTab>('single');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSojuModalOpen, setIsSojuModalOpen] = useState(false);
  const [isDramaModalOpen, setIsDramaModalOpen] = useState(false);
  const [isBunnyModalOpen, setIsBunnyModalOpen] = useState(false);

  // Special Play Modes ('none' | 'drama' | 'bunny')
  const [specialPlayMode, setSpecialPlayMode] = useState<'none' | 'drama' | 'bunny'>('none');
  const [bunnyDeck, setBunnyDeck] = useState<VocabItem[]>([]);
  const [bunnySourceSubs, setBunnySourceSubs] = useState<string[]>([]);

  // Ramyeon 4-Minuten Timer State
  const [ramyeonTimeLeft, setRamyeonTimeLeft] = useState<number>(240);
  const [ramyeonTotalDuration, setRamyeonTotalDuration] = useState<number>(240);
  const [isRamyeonRunning, setIsRamyeonRunning] = useState<boolean>(false);
  const [isRamyeonSoundEnabled, setIsRamyeonSoundEnabled] = useState<boolean>(true);
  const [isRamyeonModalOpen, setIsRamyeonModalOpen] = useState<boolean>(false);
  const [isRamyeonDone, setIsRamyeonDone] = useState<boolean>(false);

  // Ramyeon countdown interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRamyeonRunning && ramyeonTimeLeft > 0) {
      interval = setInterval(() => {
        setRamyeonTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRamyeonRunning(false);
            setIsRamyeonDone(true);
            if (isRamyeonSoundEnabled) {
              playRamyeonDoneChime();
            }
            try {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
              });
            } catch {
              // ignore
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRamyeonRunning, ramyeonTimeLeft, isRamyeonSoundEnabled]);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('kr_b1_topik_level', topikLevel);
    } catch (e) {
      console.warn('localStorage error', e);
    }
  }, [topikLevel]);

  useEffect(() => {
    try {
      localStorage.setItem('kr_b1_srs', JSON.stringify(srsMap));
    } catch (e) {
      console.warn('localStorage error', e);
    }
  }, [srsMap]);

  useEffect(() => {
    try {
      localStorage.setItem('kr_b1_custom_vocab', JSON.stringify(customVocab));
    } catch (e) {
      console.warn('localStorage error', e);
    }
  }, [customVocab]);

  // Combine items per TOPIK level (base datasets + static /src/data/*.md files + custom uploaded vocab)
  const topik1AllItems = useMemo<VocabItem[]>(() => {
    const mdItems = loadAllMarkdownFilesVocab().filter(
      (item) => item.level === 'TOPIK I' && !isDramaVocab(item)
    );
    const customs = customVocab.filter(
      (item) => item.level === 'TOPIK I' && !isDramaVocab(item)
    );
    return [...rawDataTopik1, ...mdItems, ...customs];
  }, [customVocab]);

  const topik2AllItems = useMemo<VocabItem[]>(() => {
    const mdItems = loadAllMarkdownFilesVocab().filter(
      (item) => (item.level === 'TOPIK II' || !item.level) && !isDramaVocab(item)
    );
    const customs = customVocab.filter(
      (item) => (item.level === 'TOPIK II' || !item.level) && !isDramaVocab(item)
    );
    return [...rawDataTopik2, ...mdItems, ...customs];
  }, [customVocab]);

  // Drama exclusive items: only shown in Drama mode
  const dramaAllItems = useMemo<VocabItem[]>(() => {
    const mdItems = loadAllMarkdownFilesVocab().filter((item) => isDramaVocab(item));
    const customs = customVocab.filter((item) => isDramaVocab(item));
    return [...DRAMA_VOCAB_ITEMS, ...mdItems, ...customs];
  }, [customVocab]);

  // Combined pool of all available lists across TOPIK I, TOPIK II (and fallback to Drama if none uploaded)
  const bunnySourcePool = useMemo<VocabItem[]>(() => {
    const combined = [...topik1AllItems, ...topik2AllItems];
    return combined.length > 0 ? combined : dramaAllItems;
  }, [topik1AllItems, topik2AllItems, dramaAllItems]);

  const allLevelItems = useMemo<VocabItem[]>(() => {
    if (specialPlayMode === 'drama') {
      return dramaAllItems;
    }
    if (specialPlayMode === 'bunny') {
      return bunnyDeck;
    }
    return topikLevel === 'TOPIK I' ? topik1AllItems : topik2AllItems;
  }, [specialPlayMode, bunnyDeck, topikLevel, topik1AllItems, topik2AllItems, dramaAllItems]);

  // Apply random selection from Soju Roulette
  const handleApplySojuSelection = useCallback((sel: SojuSelection) => {
    setSpecialPlayMode('none');
    setViewMode(sel.mode);
    setCategory(sel.category);
    setSubcategory(sel.subcategory);
    setCurrentIndex(0);
    setIsFlipped(false);
    setDeckOrder([]);
  }, []);

  // Start Drama Mode
  const handleStartDramaMode = useCallback((dramaSub: string, mode: DramaViewMode) => {
    setSpecialPlayMode('drama');
    setViewMode(mode);
    setCategory('all');
    setSubcategory(dramaSub);
    setCurrentIndex(0);
    setIsFlipped(false);
    setDeckOrder([]);
  }, []);

  // Start Bunny Mode
  const handleStartBunnyList = useCallback(
    (items: VocabItem[], mode: BunnyViewMode, sourceSubs: string[]) => {
      setBunnyDeck(items);
      setBunnySourceSubs(sourceSubs);
      setSpecialPlayMode('bunny');
      setViewMode(mode);
      setCategory('all');
      setSubcategory('all');
      setCurrentIndex(0);
      setIsFlipped(false);
      setDeckOrder([]);
    },
    []
  );

  const handleQuickRehopBunny = useCallback(() => {
    hapticTap();
    const size = bunnyDeck.length > 0 ? bunnyDeck.length : 25;
    const next = generateBunnyHopList(bunnySourcePool, size);
    setBunnyDeck(next.items);
    setBunnySourceSubs(next.sourceSubcategories);
    setCurrentIndex(0);
    setIsFlipped(false);
    setDeckOrder([]);
  }, [bunnyDeck.length, bunnySourcePool]);

  // Counts for Category buttons: Drama vocabulary strictly excluded from grammatical categories
  const counts = useMemo(() => {
    const regularItems = allLevelItems.filter((i) => !isDramaVocab(i));
    const noun = regularItems.filter((i) => i.cat === 'noun').length;
    const verb = regularItems.filter((i) => i.cat === 'verb').length;
    const adjective = regularItems.filter((i) => i.cat === 'adjective').length;
    const adverb = regularItems.filter((i) => i.cat === 'adverb').length;
    const phrase = regularItems.filter((i) => i.cat === 'phrase').length;
    const grammar = regularItems.filter((i) => i.cat === 'grammar').length;
    const custom = allLevelItems.filter((i) => i.custom === true).length;
    return {
      all: allLevelItems.length, // Gesamtzahl contains all!
      noun,
      verb,
      adjective,
      adverb,
      phrase,
      grammar,
      custom,
    };
  }, [allLevelItems]);

  // Normalize legacy 'custom' category filter to 'all', and force 'all' in Drama mode
  useEffect(() => {
    if (category === 'custom' || (specialPlayMode === 'drama' && category !== 'all')) {
      setCategory('all');
    }
  }, [category, specialPlayMode]);

  // All subcategories available in the current TOPIK level or Drama mode
  const availableSubcategories = useMemo(() => {
    const subs = Array.from(
      new Set(allLevelItems.map((i) => (i.sub && i.sub.trim() ? i.sub.trim() : 'Allgemein')))
    );
    return subs;
  }, [allLevelItems]);

  // Reset subcategory only if available list is non-empty and selected subcategory is missing
  useEffect(() => {
    if (availableSubcategories.length === 0) return;
    if (subcategory !== 'all' && !availableSubcategories.includes(subcategory)) {
      setSubcategory('all');
    }
  }, [availableSubcategories, subcategory]);

  // Filtered Deck
  const filteredDeck = useMemo(() => {
    const filtered = allLevelItems.filter((item) => {
      const matchCat =
        category === 'all' ||
        category === 'custom' ||
        item.cat === category;
      const itemSub = item.sub && item.sub.trim() ? item.sub.trim() : 'Allgemein';
      const matchSub = subcategory === 'all' || itemSub === subcategory;

      const record = getSrsRecord(item.id, srsMap);
      const matchDue = !onlyDue || isCardDue(record);

      return matchCat && matchSub && matchDue;
    });

    // If deckOrder is set, preserve user's shuffled order
    if (deckOrder.length > 0) {
      const orderMap = new Map(deckOrder.map((id, index) => [id, index]));
      return [...filtered].sort((a, b) => {
        const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999999;
        const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999999;
        return orderA - orderB;
      });
    }

    return filtered;
  }, [allLevelItems, category, subcategory, onlyDue, srsMap, deckOrder]);

  // Safety check on currentIndex
  useEffect(() => {
    if (currentIndex >= filteredDeck.length) {
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [filteredDeck.length, currentIndex]);

  // Navigation callbacks
  const handleFlip = useCallback(() => {
    if (filteredDeck.length === 0) return;
    setIsFlipped((prev) => !prev);
  }, [filteredDeck.length]);

  const handleNext = useCallback(() => {
    if (filteredDeck.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredDeck.length);
    }, 140);
  }, [filteredDeck.length]);

  const handlePrev = useCallback(() => {
    if (filteredDeck.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + filteredDeck.length) % filteredDeck.length);
    }, 140);
  }, [filteredDeck.length]);

  // SRS Rating Handler
  const handleMarkSrs = useCallback(
    (id: string, success: boolean) => {
      setSrsMap((prev) => {
        const currentRecord = getSrsRecord(id, prev);
        const updated = success ? advanceSrs(currentRecord) : failSrs(currentRecord);
        if (auth.currentUser) {
          saveSingleSrsToCloud(id, updated).catch((err) =>
            console.warn('SRS save error:', err)
          );
        }
        return { ...prev, [id]: updated };
      });

      // ONLY advance the card in Flashcard and Listening modes!
      // In Quiz and List modes, the view manages its own progression and MUST NOT trigger handleNext()!
      if (viewMode === 'card' || viewMode === 'listening') {
        if (!onlyDue || !success) {
          handleNext();
        }
      }
    },
    [onlyDue, handleNext, viewMode]
  );

  const handleShuffle = () => {
    hapticTap();
    const ids = filteredDeck.map((i) => i.id).sort(() => Math.random() - 0.5);
    setDeckOrder(ids);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleAddVocab = async (newItems: VocabItem[], targetLevel: TopikLevel) => {
    setCustomVocab((prev) => {
      const merged = [...prev];
      newItems.forEach((item) => {
        const isItemDrama = isDramaVocab(item) || targetLevel === 'Drama';
        const existingIndex = merged.findIndex((m) => {
          if (m.id === item.id) return true;
          if (m.kr.trim() !== item.kr.trim()) return false;
          const isExistingDrama = isDramaVocab(m);
          if (isItemDrama !== isExistingDrama) return false;
          if (isItemDrama) {
            return (m.sub || '').trim() === (item.sub || '').trim();
          }
          return m.level === item.level;
        });
        if (existingIndex !== -1) {
          // Update existing item in-place (preserving original ID so SRS progress stays intact!)
          merged[existingIndex] = {
            ...merged[existingIndex],
            ...item,
            id: merged[existingIndex].id,
          };
        } else {
          merged.push(item);
        }
      });
      return merged;
    });
    if (targetLevel === 'Drama') {
      setSpecialPlayMode('drama');
      setCategory('all');
      setSubcategory('all');
    } else if (topikLevel !== targetLevel) {
      setSpecialPlayMode('none');
      setTopikLevel(targetLevel);
    }
  };

  const handleConvertSubcategoryToDrama = useCallback((subName: string) => {
    const trimmedTarget = subName.trim();
    if (!trimmedTarget) return;
    setCustomVocab((prev) => {
      const toConvert: VocabItem[] = [];
      const next = prev.map((item) => {
        if ((item.sub || '').trim() === trimmedTarget) {
          const updated: VocabItem = {
            ...item,
            level: 'Drama',
            cat: 'custom',
          };
          toConvert.push(updated);
          return updated;
        }
        return item;
      });
      if (toConvert.length > 0) {
        convertItemsToDramaInCloud(toConvert, trimmedTarget).catch(() => {});
      }
      return next;
    });
  }, []);

  const handleClearCustom = async () => {
    if (customVocab.length === 0) return;
    const customIds = new Set(customVocab.map((i) => i.id));
    setSrsMap((prev) => {
      const next = { ...prev };
      customIds.forEach((id) => delete next[id]);
      return next;
    });
    setCustomVocab([]);
    if (auth.currentUser) {
      try {
        await clearAllCustomVocabFromCloud();
      } catch (err) {
        console.warn('Cloud clear failed:', err);
      }
    }
  };

  const handleDeleteItem = async (id: string) => {
    setCustomVocab((prev) => prev.filter((item) => item.id !== id));
    setSrsMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (auth.currentUser) {
      try {
        await deleteSingleVocabFromCloud(id);
      } catch (err) {
        console.warn('Cloud delete failed:', err);
      }
    }
  };

  const handleDeleteVocabBatch = (deletedIds: string[]) => {
    if (!deletedIds || deletedIds.length === 0) return;
    const idSet = new Set(deletedIds);
    setCustomVocab((prev) => prev.filter((item) => !idSet.has(item.id)));
    setSrsMap((prev) => {
      const next = { ...prev };
      deletedIds.forEach((id) => delete next[id]);
      return next;
    });
  };

  const handleImportSync = (
    newSrsMap: SrsMap,
    newCustom: VocabItem[]
  ) => {
    setSrsMap(newSrsMap);
    if (newCustom && Array.isArray(newCustom)) {
      setCustomVocab(newCustom);
    }
  };

  const handleConfirmReset = () => {
    setSrsMap({});
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Ramyeon Timer Handlers
  const handleRamyeonButtonClick = useCallback(() => {
    if (!isRamyeonRunning) {
      if (ramyeonTimeLeft <= 0) {
        setRamyeonTimeLeft(240);
        setRamyeonTotalDuration(240);
      }
      setIsRamyeonRunning(true);
      setIsRamyeonModalOpen(true);
    } else {
      setIsRamyeonModalOpen(true);
    }
  }, [isRamyeonRunning, ramyeonTimeLeft]);

  const handleTogglePlayRamyeon = useCallback(() => {
    if (ramyeonTimeLeft <= 0) {
      setRamyeonTimeLeft(ramyeonTotalDuration || 240);
      setIsRamyeonRunning(true);
    } else {
      setIsRamyeonRunning((prev) => !prev);
    }
  }, [ramyeonTimeLeft, ramyeonTotalDuration]);

  const handleResetRamyeon = useCallback((newDuration = 240) => {
    setIsRamyeonRunning(false);
    setRamyeonTotalDuration(newDuration);
    setRamyeonTimeLeft(newDuration);
  }, []);

  const handleAddTimeRamyeon = useCallback((seconds: number) => {
    setRamyeonTimeLeft((prev) => prev + seconds);
    setRamyeonTotalDuration((prev) => prev + seconds);
  }, []);

  const handleToggleSoundRamyeon = useCallback(() => {
    setIsRamyeonSoundEnabled((prev) => !prev);
  }, []);

  const handleDismissDoneRamyeon = useCallback(() => {
    setIsRamyeonDone(false);
  }, []);

  // SRS Global Statistics
  const stats = useMemo(() => {
    let due = 0;
    let mastered = 0;
    let learning = 0;

    allLevelItems.forEach((item) => {
      const r = getSrsRecord(item.id, srsMap);
      if (r.level === 5) {
        mastered++;
        if (isCardDue(r)) due++;
      } else if (r.level > 0) {
        learning++;
        if (isCardDue(r)) due++;
      } else {
        due++; // Level 0 is due
      }
    });

    return { due, mastered, learning };
  }, [allLevelItems, srsMap]);

  // Listen to Firebase Auth state & auto-load cloud vocabulary on login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      setAuthReady(true);
      if (user) {
        try {
          const cloudData = await loadAllFromCloud();
          setCustomVocab(cloudData.customVocab);
          setSrsMap(cloudData.srsMap);
        } catch (err) {
          console.warn('Initial cloud load check:', err);
        }
      } else {
        setCustomVocab([]);
        setSrsMap({});
      }
    });
    return () => unsubscribe();
  }, []);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-hanji text-ink flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <AppLogo className="w-12 h-12" />
          <HangukGoWordmark />
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <LoginScreen
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        language={language}
        onToggleLanguage={toggleLanguage}
      />
    );
  }

  return (
    <div className="safe-app-shell bg-hanji text-ink transition-colors duration-200 flex flex-col max-w-5xl mx-auto select-none relative font-sans">
      {/* STREAMLINED HEADER WITH PROGRESSIVE DISCLOSURE */}
      <header className="space-y-2">
        {/* TOP BAR: 3 Zones (Brand | Desktop Mode Nav | Primary Controls & Extras Drawer Trigger) */}
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-border-card">
          {/* Zone 1: Brand Logo & Calligraphic „한국GO“ Wordmark (identical across DE & KR) */}
          <div className="flex items-center gap-2 shrink-0">
            <AppLogo className="w-8 h-8 md:w-9 md:h-9" />
            <h1 className="m-0 leading-none flex items-center">
              <HangukGoWordmark />
            </h1>
          </div>

          {/* Zone 2: Desktop Mode Switcher (Hidden on Mobile, replaced by Fixed Bottom Nav Bar) */}
          <nav
            className="hidden md:flex items-center bg-surface p-1 rounded-xl border border-border-card"
            aria-label={language === 'kr' ? '학습 모드' : 'Lernmodi'}
          >
            <button
              type="button"
              onClick={() => {
                hapticTap();
                setViewMode('card');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
                viewMode === 'card'
                  ? 'bg-card text-ink shadow-2xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{t.modes.card}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                hapticTap();
                setViewMode('listening');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
                viewMode === 'listening'
                  ? 'bg-card text-ink shadow-2xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>{t.modes.listening}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                hapticTap();
                setViewMode('quiz');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
                viewMode === 'quiz'
                  ? 'bg-card text-ink shadow-2xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.modes.quiz}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                hapticTap();
                setViewMode('list');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
                viewMode === 'list'
                  ? 'bg-card text-ink shadow-2xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>{t.modes.list}</span>
            </button>
          </nav>

          {/* Zone 3: Responsive TOPIK Switcher, Taegeuk Theme Toggle & Extras Drawer Button */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile Only: Fixed-width Single TOPIK Toggle Button (Never changes width between TOPIK I & TOPIK II) */}
            <button
              type="button"
              onClick={() => {
                hapticTap();
                setSpecialPlayMode('none');
                setTopikLevel(topikLevel === 'TOPIK I' ? 'TOPIK II' : 'TOPIK I');
                setDeckOrder([]);
              }}
              title={
                language === 'kr'
                  ? `클릭하여 ${topikLevel === 'TOPIK I' ? 'TOPIK II' : 'TOPIK I'}로 전환`
                  : `Klicken zum Wechseln auf ${topikLevel === 'TOPIK I' ? 'TOPIK II' : 'TOPIK I'}`
              }
              className={`md:hidden min-h-[38px] w-[88px] px-2 py-1.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1 whitespace-nowrap shadow-2xs ${
                specialPlayMode !== 'none'
                  ? 'bg-surface text-muted border-border-card'
                  : topikLevel === 'TOPIK I'
                  ? 'bg-obangBlue text-white border-obangBlue'
                  : 'bg-celadon text-white border-celadon'
              }`}
            >
              <span>{topikLevel}</span>
              <span className="text-[10px] opacity-80 font-normal">⇄</span>
            </button>

            {/* Desktop Only: Two-Button TOPIK I / TOPIK II Toggle */}
            <div className="hidden md:inline-flex items-center bg-surface p-0.5 rounded-xl border border-border-card">
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  setSpecialPlayMode('none');
                  setTopikLevel('TOPIK I');
                  setDeckOrder([]);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  specialPlayMode === 'none' && topikLevel === 'TOPIK I'
                    ? 'bg-obangBlue text-white shadow-2xs'
                    : 'text-muted hover:text-ink'
                }`}
              >
                TOPIK I
              </button>
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  setSpecialPlayMode('none');
                  setTopikLevel('TOPIK II');
                  setDeckOrder([]);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  specialPlayMode === 'none' && topikLevel === 'TOPIK II'
                    ? 'bg-celadon text-white shadow-2xs'
                    : 'text-muted hover:text-ink'
                }`}
              >
                TOPIK II
              </button>
            </div>

            {/* Taegeuk Light/Dark Theme Toggle (Yang / Eum) */}
            <TaegeukThemeToggle
              theme={theme}
              lang={language}
              onToggle={() => {
                hapticTap();
                setTheme(theme === 'dark' ? 'light' : 'dark');
              }}
            />

            {/* User Profile Button with Traditional Joseon Gat Hat (갓) Icon */}
            <button
              type="button"
              onClick={() => {
                hapticTap();
                setIsProfileOpen(true);
              }}
              title={
                language === 'kr'
                  ? '선비 학습 프로필 및 진행도 보기'
                  : 'Benutzerprofil & Lernfortschritt anzeigen'
              }
              aria-label={language === 'kr' ? '선비 학습 프로필' : 'Benutzerprofil & Fortschritt'}
              className="w-9 h-9 rounded-xl bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border border-border-card text-ink transition-all duration-300 flex items-center justify-center group shadow-2xs"
            >
              <GatHatIcon className="w-5 h-5 text-ink transition-transform duration-200 group-hover:scale-110" />
            </button>

            {/* Progressive Disclosure: Dancheong Lotus-Gear Settings & Extras Trigger */}
            <button
              type="button"
              onClick={() => {
                hapticTap();
                setIsExtrasOpen(true);
              }}
              title={
                language === 'kr'
                  ? '문화 도구 (라면 타이머, 소주 룰렛) 및 설정 열기'
                  : 'Extras (Ramyeon-Timer, Soju-Roulette) & Einstellungen öffnen'
              }
              aria-label={language === 'kr' ? '도구 및 설정' : 'Einstellungen & Extras'}
              className="w-9 h-9 rounded-xl bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border border-border-card text-ink transition-all duration-300 flex items-center justify-center group shadow-2xs relative"
            >
              <DancheongSettingsIcon className="w-5 h-5 transition-transform duration-300 group-hover:rotate-45 shrink-0" />
              {isRamyeonRunning && (
                <span
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-dancheong ring-2 ring-hanji animate-pulse"
                  title={`${Math.floor(ramyeonTimeLeft / 60)}:${(ramyeonTimeLeft % 60)
                    .toString()
                    .padStart(2, '0')}`}
                />
              )}
            </button>
          </div>
        </div>

        {/* UNIFIED SUB-BAR: Single Filter Popover Button + Interactive SRS Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-xs">
          <DeckFilterPopover
            isOpen={isFilterOpen}
            onToggleOpen={() => setIsFilterOpen((prev) => !prev)}
            onClose={() => setIsFilterOpen(false)}
            category={category}
            onSelectCategory={(cat) => {
              setCategory(cat);
              setCurrentIndex(0);
            }}
            subcategory={subcategory}
            onSelectSubcategory={(sub) => {
              setSubcategory(sub);
              setCurrentIndex(0);
            }}
            availableSubcategories={availableSubcategories}
            getSubcategoryCount={(sub) =>
              allLevelItems.filter(
                (i) =>
                  (i.sub && i.sub.trim() ? i.sub.trim() : 'Allgemein') === sub &&
                  (category === 'all' || category === 'custom' || i.cat === category)
              ).length
            }
            categoryCounts={counts}
            customCount={counts.custom}
            deckCount={filteredDeck.length}
            onlyDue={onlyDue}
            dueCount={stats.due}
            onToggleOnlyDue={() => setOnlyDue((prev) => !prev)}
            krToDe={krToDe}
            onToggleDirection={() => {
              setKrToDe((prev) => !prev);
              setIsFlipped(false);
            }}
            onShuffle={handleShuffle}
            lang={language}
            isDramaMode={specialPlayMode === 'drama'}
          />

          {/* Interactive SRS Metrics (Clicking "due" toggles onlyDue filter directly) */}
          <div className="flex items-center gap-2 text-xs text-muted tabular-nums ml-auto">
            <button
              type="button"
              onClick={() => {
                hapticTap();
                setOnlyDue(!onlyDue);
              }}
              title={t.actions.dueOnlyTitle}
              className={`px-2 py-0.5 rounded-lg font-semibold transition flex items-center gap-1 ${
                onlyDue
                  ? 'bg-ochre text-white shadow-2xs'
                  : 'text-ochre hover:bg-ochre/12'
              }`}
            >
              <span>
                {stats.due} {t.stats.due}
              </span>
              {onlyDue && <span className="text-[10px] leading-none">×</span>}
            </button>
            <span aria-hidden="true">·</span>
            <span className="text-celadon font-semibold">
              {stats.mastered} {t.stats.mastered}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-obangBlue font-semibold">
              {stats.learning} {t.stats.learning}
            </span>
          </div>
        </div>

        {/* ACTIVE SPECIAL MODE BANNER (Drama Mode or Bunny Mode) */}
        {specialPlayMode !== 'none' && (
          <div
            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-2xl border text-xs ${
              specialPlayMode === 'drama'
                ? 'bg-obangBlue/10 border-obangBlue/30 text-ink'
                : 'bg-ochre/10 border-ochre/30 text-ink'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {specialPlayMode === 'drama' ? (
                <RetroTvIcon className="w-5 h-5 shrink-0" idPrefix="active-drama-banner" />
              ) : (
                <BunnyEarsIcon className="w-5 h-5 shrink-0" idPrefix="active-bunny-banner" />
              )}
              <span className="font-bold truncate">
                {specialPlayMode === 'drama'
                  ? language === 'kr'
                    ? `드라마 모드 · ${subcategory}`
                    : `Drama-Modus · ${subcategory}`
                  : language === 'kr'
                  ? `토끼 모드 · ${bunnyDeck.length}단어 (${bunnySourceSubs.length}개 리스트 믹스)`
                  : `Bunny-Modus · ${bunnyDeck.length} Wörter (${bunnySourceSubs.length} Listen gemischt)`}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {specialPlayMode === 'drama' ? (
                <>
                  {availableSubcategories.length > 1 && (
                    <select
                      value={subcategory}
                      onChange={(e) => {
                        hapticTap();
                        setSubcategory(e.target.value);
                        setCurrentIndex(0);
                        setIsFlipped(false);
                        setDeckOrder([]);
                      }}
                      className="bg-card border border-border-card text-ink text-[11px] font-semibold rounded-lg px-2 py-1 focus:outline-none focus:border-obangBlue cursor-pointer max-w-[140px] sm:max-w-[190px] truncate"
                      aria-label={language === 'kr' ? 'K-드라마 시리즈 선택' : 'K-Drama Serie auswählen'}
                    >
                      {availableSubcategories.map((sub) => {
                        const count = dramaAllItems.filter(
                          (i) => (i.sub?.trim() || 'Allgemein') === sub
                        ).length;
                        return (
                          <option key={sub} value={sub}>
                            {sub} ({count})
                          </option>
                        );
                      })}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      hapticTap();
                      setIsDramaModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-card hover:bg-surface border border-border-card font-semibold text-[11px] transition"
                  >
                    {language === 'kr' ? '채널 변경' : 'Serie wählen'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleQuickRehopBunny}
                  className="px-2.5 py-1 rounded-lg bg-card hover:bg-surface border border-border-card font-semibold text-[11px] flex items-center gap-1 transition"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>{language === 'kr' ? '다시 점프' : 'Neu hüpfen'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  setSpecialPlayMode('none');
                  setSubcategory('all');
                  setCurrentIndex(0);
                }}
                className="p-1 rounded-lg hover:bg-card text-muted hover:text-ink transition"
                title={language === 'kr' ? '일반 모드로 돌아가기' : 'Modus beenden'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* MAIN VIEW CONTENT */}
      <main className="mt-1.5 flex flex-col">
        {viewMode === 'card' && (
          <FlashcardView
            deck={filteredDeck}
            totalLevelCount={allLevelItems.length}
            currentIndex={currentIndex}
            isFlipped={isFlipped}
            krToDe={krToDe}
            srsMap={srsMap}
            lang={language}
            onFlip={handleFlip}
            onNext={handleNext}
            onPrev={handlePrev}
            onMarkSrs={handleMarkSrs}
            onOpenUpload={() => {
              setSyncModalTab('import');
              setIsSyncModalOpen(true);
            }}
          />
        )}

        {viewMode === 'listening' && (
          <ListeningView
            deck={filteredDeck}
            totalLevelCount={allLevelItems.length}
            currentIndex={currentIndex}
            isFlipped={isFlipped}
            srsMap={srsMap}
            lang={language}
            onFlip={handleFlip}
            onNext={handleNext}
            onPrev={handlePrev}
            onMarkSrs={handleMarkSrs}
            onOpenUpload={() => {
              setSyncModalTab('import');
              setIsSyncModalOpen(true);
            }}
          />
        )}

        {viewMode === 'quiz' && (
          <QuizView
            deck={filteredDeck}
            allLevelItems={allLevelItems}
            krToDe={krToDe}
            lang={language}
            onMarkSrs={handleMarkSrs}
            onOpenUpload={() => {
              setSyncModalTab('import');
              setIsSyncModalOpen(true);
            }}
          />
        )}

        {viewMode === 'list' && (
          <ListView
            items={filteredDeck}
            srsMap={srsMap}
            lang={language}
            onMarkSrs={handleMarkSrs}
            onDeleteItem={handleDeleteItem}
            onOpenUpload={() => {
              setSyncModalTab('import');
              setIsSyncModalOpen(true);
            }}
          />
        )}
      </main>

      {/* DESKTOP SHORTCUT FOOTER */}
      <footer className="hidden md:block text-center text-xs text-muted pt-3 border-t border-border-card mt-4">
        {language === 'kr' ? (
          <>
            단축키:{' '}
            <kbd className="px-1.5 py-0.5 bg-surface text-ink border border-border-card rounded font-mono">
              스페이스바
            </kbd>{' '}
            뒤집기 ·{' '}
            <kbd className="px-1.5 py-0.5 bg-surface text-ink border border-border-card rounded font-mono">
              ←
            </kbd>{' '}
            <kbd className="px-1.5 py-0.5 bg-surface text-ink border border-border-card rounded font-mono">
              →
            </kbd>{' '}
            이동 ·{' '}
            <kbd className="px-1.5 py-0.5 bg-surface text-ink border border-border-card rounded font-mono">
              1
            </kbd>{' '}
            다시 복습 ·{' '}
            <kbd className="px-1.5 py-0.5 bg-surface text-ink border border-border-card rounded font-mono">
              2
            </kbd>{' '}
            알고 있음 · 듣기 모드:{' '}
            <kbd className="px-1.5 py-0.5 bg-surface text-ink border border-border-card rounded font-mono">
              A
            </kbd>{' '}
            발음 듣기
          </>
        ) : (
          <>
            Shortcuts:{' '}
            <kbd className="px-1.5 py-0.5 bg-surface text-ink border border-border-card rounded font-mono">
              Leertaste
            </kbd>{' '}
            Umdrehen ·{' '}
            <kbd className="px-1.5 py-0.5 bg-surface text-ink border border-border-card rounded font-mono">
              ←
            </kbd>{' '}
            <kbd className="px-1.5 py-0.5 bg-surface text-ink border border-border-card rounded font-mono">
              →
            </kbd>{' '}
            Blättern ·{' '}
            <kbd className="px-1.5 py-0.5 bg-surface text-ink border border-border-card rounded font-mono">
              1
            </kbd>{' '}
            Wiederholen ·{' '}
            <kbd className="px-1.5 py-0.5 bg-surface text-ink border border-border-card rounded font-mono">
              2
            </kbd>{' '}
            Gelernt · Im 듣기-Modus:{' '}
            <kbd className="px-1.5 py-0.5 bg-surface text-ink border border-border-card rounded font-mono">
              A
            </kbd>{' '}
            Audio
          </>
        )}
      </footer>

      {/* MOBILE FIXED BOTTOM NAVIGATION BAR (Respects iPhone 17 Pro Max Home Swipe Bar) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border-card grid grid-cols-4 items-center safe-bottom-nav"
        aria-label={language === 'kr' ? '모바일 하단 내비게이션' : 'Mobile Modus-Auswahl'}
      >
        <button
          type="button"
          onClick={() => {
            hapticTap();
            setViewMode('card');
          }}
          className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition ${
            viewMode === 'card'
              ? 'text-celadon font-bold'
              : 'text-muted hover:text-ink font-medium'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[11px] tracking-tight mt-0.5 whitespace-nowrap">
            {t.modes.card}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            hapticTap();
            setViewMode('listening');
          }}
          className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition ${
            viewMode === 'listening'
              ? 'text-obangBlue font-bold'
              : 'text-muted hover:text-ink font-medium'
          }`}
        >
          <Headphones className="w-5 h-5" />
          <span className="text-[11px] tracking-tight mt-0.5 whitespace-nowrap">
            {t.modes.listening}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            hapticTap();
            setViewMode('quiz');
          }}
          className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition ${
            viewMode === 'quiz'
              ? 'text-ochre font-bold'
              : 'text-muted hover:text-ink font-medium'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[11px] tracking-tight mt-0.5 whitespace-nowrap">
            {t.modes.quiz}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            hapticTap();
            setViewMode('list');
          }}
          className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition ${
            viewMode === 'list'
              ? 'text-celadon font-bold'
              : 'text-muted hover:text-ink font-medium'
          }`}
        >
          <List className="w-5 h-5" />
          <span className="text-[11px] tracking-tight mt-0.5 whitespace-nowrap">
            {t.modes.list}
          </span>
        </button>
      </nav>

      {/* PROGRESSIVE DISCLOSURE DRAWER FOR EXTRAS & SETTINGS */}
      <ExtrasDrawer
        isOpen={isExtrasOpen}
        onClose={() => setIsExtrasOpen(false)}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        language={language}
        onToggleLanguage={toggleLanguage}
        isRamyeonRunning={isRamyeonRunning}
        ramyeonTimeLeft={ramyeonTimeLeft}
        onOpenRamyeon={handleRamyeonButtonClick}
        onOpenSoju={() => setIsSojuModalOpen(true)}
        onOpenDrama={() => setIsDramaModalOpen(true)}
        onOpenBunny={() => setIsBunnyModalOpen(true)}
        onOpenAddVocab={() => {
          setSyncModalTab('single');
          setIsSyncModalOpen(true);
        }}
        onOpenReset={() => setIsResetModalOpen(true)}
        customCount={customVocab.length}
      />

      {/* USER PROFILE & PROGRESS MODAL (Joseon Gat Scholar Profile) */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentLevel={topikLevel}
        topik1Items={topik1AllItems}
        topik2Items={topik2AllItems}
        dramaItems={dramaAllItems}
        srsMap={srsMap}
        lang={language}
        onOpenSync={() => {
          setSyncModalTab('cloud');
          setIsSyncModalOpen(true);
        }}
        onOpenReset={() => setIsResetModalOpen(true)}
      />

      {/* UNIFIED VOCAB & FIREBASE CLOUD MODAL */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        srsMap={srsMap}
        customVocab={customVocab}
        lang={language}
        currentLevel={specialPlayMode === 'drama' ? 'Drama' : topikLevel}
        initialTab={syncModalTab}
        onAddVocab={handleAddVocab}
        onImportSync={handleImportSync}
        onClearCustom={handleClearCustom}
        onDeleteVocabBatch={handleDeleteVocabBatch}
      />

      <ResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        lang={language}
        onConfirm={handleConfirmReset}
      />

      {/* Ramyeon Floating Widget when timer is running and modal minimized */}
      {isRamyeonRunning && !isRamyeonModalOpen && !isRamyeonDone && (
        <RamyeonFloatingWidget
          timeLeft={ramyeonTimeLeft}
          isRunning={isRamyeonRunning}
          lang={language}
          onClick={() => setIsRamyeonModalOpen(true)}
        />
      )}

      {/* Ramyeon Timer Modal & Completion Screen */}
      <RamyeonTimerModal
        isOpen={isRamyeonModalOpen}
        onClose={() => setIsRamyeonModalOpen(false)}
        timeLeft={ramyeonTimeLeft}
        totalDuration={ramyeonTotalDuration}
        isRunning={isRamyeonRunning}
        soundEnabled={isRamyeonSoundEnabled}
        isDone={isRamyeonDone}
        lang={language}
        onTogglePlay={handleTogglePlayRamyeon}
        onReset={handleResetRamyeon}
        onAddTime={handleAddTimeRamyeon}
        onToggleSound={handleToggleSoundRamyeon}
        onDismissDone={handleDismissDoneRamyeon}
      />

      {/* Soju Roulette Modal */}
      <SojuRouletteModal
        isOpen={isSojuModalOpen}
        onClose={() => setIsSojuModalOpen(false)}
        availableItems={bunnySourcePool}
        lang={language}
        onApplySelection={handleApplySojuSelection}
      />

      {/* Drama Mode Modal */}
      <DramaModeModal
        isOpen={isDramaModalOpen}
        onClose={() => setIsDramaModalOpen(false)}
        lang={language}
        currentShowSub={specialPlayMode === 'drama' && subcategory !== 'all' ? subcategory : ''}
        currentMode={viewMode}
        dramaItems={dramaAllItems}
        onStartDramaMode={handleStartDramaMode}
      />

      {/* Bunny Mode / 토끼 모드 Modal */}
      <BunnyModeModal
        isOpen={isBunnyModalOpen}
        onClose={() => setIsBunnyModalOpen(false)}
        availableItems={bunnySourcePool}
        lang={language}
        onStartBunnyList={handleStartBunnyList}
      />
    </div>
  );
}
