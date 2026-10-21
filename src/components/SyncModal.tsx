import React, { useState, useEffect, useRef } from 'react';
import { VocabItem, TopikLevel, VocabCategory } from '../data/vocabData';
import { SrsMap } from '../utils/srs';
import { AppLanguage, translations } from '../utils/translations';
import {
  X,
  Copy,
  Check,
  AlertCircle,
  Cloud,
  CloudUpload,
  CloudDownload,
  FileSpreadsheet,
  LogIn,
  LogOut,
  Trash2,
  Database,
  UploadCloud,
  FileText,
  Mail,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  auth,
  signInWithEmail,
  signOutUser,
  onAuthStateChanged,
  User,
} from '../services/firebase';
import {
  saveCsvFileToCloud,
  saveSingleVocabToCloud,
  saveMultipleVocabToCloud,
  deleteSingleVocabFromCloud,
  clearAllCustomVocabFromCloud,
  fetchUserCsvFiles,
  deleteCsvFileFromCloud,
  deleteCsvFileAndVocabFromCloud,
  syncAllToCloud,
  loadAllFromCloud,
  parseVocabCsv,
  cleanDramaTitle,
  VocabFileRecord,
} from '../services/vocabDatabase';
import { hapticTap } from '../utils/haptics';

export type SyncModalTab = 'single' | 'import' | 'cloud' | 'manual';

export interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  srsMap: SrsMap;
  customVocab: VocabItem[];
  lang?: AppLanguage;
  currentLevel?: TopikLevel;
  initialTab?: SyncModalTab;
  onAddVocab: (newItems: VocabItem[], targetLevel: TopikLevel) => void;
  onImportSync: (srsMap: SrsMap, customVocab: VocabItem[]) => void;
  onClearCustom: () => void;
  onDeleteVocabBatch?: (deletedIds: string[]) => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  srsMap,
  customVocab,
  lang = 'de',
  currentLevel = 'TOPIK II',
  initialTab = 'single',
  onAddVocab,
  onImportSync,
  onClearCustom,
  onDeleteVocabBatch,
}) => {
  const t = translations[lang];
  const isKr = lang === 'kr';

  const [activeTab, setActiveTab] = useState<SyncModalTab>(initialTab);
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [authLoading, setAuthLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [cloudFiles, setCloudFiles] = useState<VocabFileRecord[]>([]);

  // In-app Delete Confirmation States (replaces window.confirm)
  const [fileToDelete, setFileToDelete] = useState<VocabFileRecord | null>(null);
  const [deleteAssociatedVocabs, setDeleteAssociatedVocabs] = useState(true);
  const [deletingFile, setDeletingFile] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

  // Email / Password Form State (for when not logged in)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Tab 1: Single Vocab Form State
  const [singleLevel, setSingleLevel] = useState<TopikLevel>(currentLevel);
  const [singleCat, setSingleCat] = useState<VocabCategory>('noun');
  const [singleSub, setSingleSub] = useState('Allgemein');
  const [singleKr, setSingleKr] = useState('');
  const [singleDe, setSingleDe] = useState('');
  const [singleEn, setSingleEn] = useState('');
  const [singleHanja, setSingleHanja] = useState('');
  const [singleExKr, setSingleExKr] = useState('');
  const [singleExDe, setSingleExDe] = useState('');
  const [singleExEn, setSingleExEn] = useState('');

  // Tab 2: Bulk / CSV / File State
  const [bulkLevel, setBulkLevel] = useState<TopikLevel>(currentLevel);
  const [bulkCat, setBulkCat] = useState<VocabCategory>('noun');
  const [bulkSub, setBulkSub] = useState('Allgemein');
  const [bulkText, setBulkText] = useState('');
  const [bulkFileName, setBulkFileName] = useState('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab 4: Manual Code State
  const [syncCode, setSyncCode] = useState('');

  // Feedback Notification
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Sync initial tab when opening
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSingleLevel(currentLevel);
      setBulkLevel(currentLevel);
      if (currentLevel === 'Drama') {
        setSingleSub(isKr ? '사랑의 불시착' : 'K-Drama');
        setBulkSub(isKr ? '사랑의 불시착' : 'K-Drama');
      }
      setFeedback(null);
      setAuthError(null);

      const exportBundle = {
        version: 2,
        exportedAt: new Date().toISOString(),
        srsMap,
        customVocab,
      };
      setSyncCode(JSON.stringify(exportBundle, null, 2));

      if (auth.currentUser) {
        loadCloudFiles();
      }
    }
  }, [isOpen, initialTab, currentLevel, srsMap, customVocab]);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        loadCloudFiles();
      } else {
        setCloudFiles([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadCloudFiles = async () => {
    try {
      const files = await fetchUserCsvFiles();
      setCloudFiles(files);
    } catch (err) {
      console.warn('Could not load cloud files:', err);
    }
  };

  if (!isOpen) return null;

  // ----------------------------------------------------
  // AUTH HANDLERS
  // ----------------------------------------------------
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setAuthError(isKr ? '이메일과 비밀번호를 입력해주세요.' : 'Bitte gib E-Mail und Passwort ein.');
      return;
    }

    hapticTap();
    setAuthLoading(true);
    setAuthError(null);
    setFeedback(null);

    try {
      await signInWithEmail(loginEmail, loginPassword);
      setFeedback({
        type: 'success',
        message: isKr
          ? `${loginEmail} 계정으로 로그인되었습니다!`
          : `Erfolgreich als ${loginEmail} angemeldet!`,
      });
      setLoginPassword('');
      await loadCloudFiles();
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      const code = errorObj?.code || '';
      let msg = isKr ? '로그인에 실패했습니다.' : 'Anmeldung fehlgeschlagen.';

      if (code === 'auth/operation-not-allowed') {
        msg = isKr
          ? 'Firebase 콘솔에서 [Authentication > Sign-in method > 이메일/비밀번호]를 사용 설정해야 합니다.'
          : 'E-Mail/Passwort-Login ist im Firebase-Projekt noch nicht aktiviert. Bitte aktiviere "E-Mail/Passwort" in der Firebase Console.';
      } else if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        msg = isKr
          ? '이메일 또는 비밀번호가 올바르지 않습니다.'
          : 'E-Mail-Adresse oder Passwort ist falsch.';
      } else if (code === 'auth/invalid-email') {
        msg = isKr ? '유효하지 않은 이메일 형식입니다.' : 'Ungültiges E-Mail-Format.';
      } else if (code === 'auth/too-many-requests') {
        msg = isKr
          ? '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.'
          : 'Zu viele fehlgeschlagene Anmeldeversuche. Bitte kurz warten.';
      } else if (errorObj?.message) {
        msg = errorObj.message;
      }

      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    hapticTap();
    try {
      await signOutUser();
      setFeedback({
        type: 'info',
        message: isKr ? '로그아웃되었습니다.' : 'Erfolgreich abgemeldet.',
      });
      setAuthError(null);
    } catch {
      // Ignore
    }
  };

  // ----------------------------------------------------
  // TAB 1: ADD SINGLE VOCABULARY TO FIREBASE & APP
  // ----------------------------------------------------
  const handleSingleAdd = async () => {
    const krWord = singleKr.trim();
    const deWord = singleDe.trim();
    const enWord = singleEn.trim();

    if (!krWord || (!deWord && !enWord)) {
      setFeedback({
        type: 'error',
        message: isKr
          ? '한국어 단어와 번역(독일어 또는 영어)을 입력해주세요.'
          : 'Bitte mindestens das koreanische Wort und eine Übersetzung (Deutsch oder Englisch) angeben.',
      });
      return;
    }

    hapticTap();
    let cat = singleCat;
    if (singleLevel === 'Drama') {
      cat = 'custom';
    } else if (krWord.startsWith('-')) {
      cat = 'grammar';
    }

    const newItemId = `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newItem: VocabItem = {
      id: newItemId,
      level: singleLevel,
      cat,
      sub: singleSub.trim() || (singleLevel === 'Drama' ? 'K-Drama' : 'Eigene Vokabeln'),
      kr: krWord,
      de: deWord || enWord, // fallback to English if German is omitted
      en: enWord || undefined,
      hanja: singleHanja.trim() || undefined,
      exKr: singleExKr.trim() || undefined,
      exDe: singleExDe.trim() || (singleExEn.trim() || undefined),
      exEn: singleExEn.trim() || undefined,
      custom: true,
    };

    setSyncLoading(true);
    setFeedback(null);

    try {
      // 1. Save directly to Firebase Cloud if authenticated
      if (currentUser) {
        await saveSingleVocabToCloud(newItem);
      }

      // 2. Add to active learning state
      onAddVocab([newItem], singleLevel);

      const transLabel = [newItem.de, newItem.en].filter(Boolean).join(' / ');
      setFeedback({
        type: 'success',
        message: isKr
          ? `✓ „${newItem.kr}“ (${transLabel}) Firebase 클라우드 및 덱에 저장되었습니다!`
          : currentUser
          ? `✓ „${newItem.kr}“ (${transLabel}) in Firebase-Datenbank (für alle) & im Kartendeck gespeichert!`
          : `✓ „${newItem.kr}“ (${transLabel}) im Kartendeck gespeichert (Melde dich an, um es in der Cloud zu sichern).`,
      });

      // Clear input fields for next entry
      setSingleKr('');
      setSingleDe('');
      setSingleEn('');
      setSingleHanja('');
      setSingleExKr('');
      setSingleExDe('');
      setSingleExEn('');
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Fehler beim Speichern in Firebase.',
      });
    } finally {
      setSyncLoading(false);
    }
  };

  // ----------------------------------------------------
  // TAB 2: IMPORT CSV / FILE / TEXT TO FIREBASE & APP
  // ----------------------------------------------------
  const formatFileNameToSubcategory = (name: string): string => {
    return (
      name
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .trim() || 'Allgemein'
    );
  };

  const processFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    hapticTap();

    if (files.length === 1) {
      const file = files[0];
      const cleanSub = formatFileNameToSubcategory(file.name);
      setBulkSub(cleanSub);
      setBulkFileName(file.name);

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = (event.target?.result as string) || '';
        setBulkText(content);
        const preview = parseVocabCsv(content, bulkLevel, cleanSub, bulkCat);
        const subs = Array.from(new Set(preview.map((i) => i.sub)));
        setFeedback({
          type: 'info',
          message: isKr
            ? `„${file.name}“ 로드됨 (${preview.length}개 단어, ${subs.length}개 세부 주제). 아래 버튼을 눌러 저장하세요.`
            : `„${file.name}“ geladen (${preview.length} Vokabeln in ${subs.length} ${subs.length === 1 ? 'Unterkategorie' : 'Unterkategorien'}: ${subs.slice(0, 3).join(', ')}).`,
        });
      };
      reader.readAsText(file, 'UTF-8');
    } else {
      // Multiple files dropped at once
      const names = files.map((f) => f.name).join(', ');
      setBulkFileName(`${files.length} Dateien (${names})`);
      setBulkSub(
        bulkLevel === 'Drama'
          ? cleanDramaTitle(files[0].name) || formatFileNameToSubcategory(files[0].name)
          : formatFileNameToSubcategory(files[0].name)
      );

      Promise.all(
        files.map(
          (file) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = (ev) => {
                const raw = ((ev.target?.result as string) || '').trim();
                const topicFromFile =
                  bulkLevel === 'Drama'
                    ? cleanDramaTitle(file.name) || formatFileNameToSubcategory(file.name)
                    : formatFileNameToSubcategory(file.name);
                // Always prepend an explicit series/topic marker per file so multi-file uploads keep each file's K-Drama or topic name
                if (raw) {
                  const prefix = bulkLevel === 'Drama' ? `# @drama: ${topicFromFile}` : `# ${topicFromFile}`;
                  resolve(`${prefix}\n${raw}`);
                } else {
                  resolve('');
                }
              };
              reader.onerror = () => resolve('');
              reader.readAsText(file, 'UTF-8');
            })
        )
      ).then((contents) => {
        const combined = contents.filter(Boolean).join('\n\n');
        setBulkText(combined);
        const preview = parseVocabCsv(
          combined,
          bulkLevel,
          'Allgemein',
          bulkLevel === 'Drama' ? 'custom' : bulkCat
        );
        const subs = Array.from(new Set(preview.map((i) => i.sub)));
        setFeedback({
          type: 'info',
          message: isKr
            ? `${files.length}개 파일 로드됨 (${preview.length}개 단어, ${subs.length}개 세부 주제)`
            : `${files.length} Dateien geladen (${preview.length} Vokabeln in ${subs.length} Serien/Unterkategorien: ${subs.slice(0, 4).join(', ')}). Klicke unten auf Speichern.`,
        });
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingFile) {
      setIsDraggingFile(true);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only reset if leaving the dropzone container itself
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    } else {
      const droppedText = e.dataTransfer.getData('text/plain');
      if (droppedText && droppedText.trim()) {
        setBulkText(droppedText);
      }
    }
  };

  const insertSampleFormat = (type: 'csv' | 'md' = 'csv') => {
    if (type === 'md') {
      const mdSample = [
        '# TOPIK Lektion: Wichtige Verben & Nomen',
        '',
        '| Korean | Deutsch | English | Wortart | Unterkategorie | Beispielsatz (KR) | Beispiel (DE) | Example (EN) |',
        '| --- | --- | --- | --- | --- | --- | --- | --- |',
        '| 극복하다 | überwinden | overcome | verb | Alltag | 어려움을 극복했어요. | Ich habe die Schwierigkeiten überwunden. | I overcame the difficulties. |',
        '| 적응하다 | sich anpassen | adapt / adjust | verb | Alltag | 새로운 환경에 적응했어요. | Ich habe mich an die neue Umgebung angepasst. | I adapted to the new environment. |',
        '| 고민 | Sorge / Grübelei | worry / concern | noun | Gefühle | 요즘 고민이 많아요. | Ich mache mir zurzeit viele Sorgen. | I have lots of worries. |',
        '| 행복 | Glück / Freude | happiness / joy | noun | Gefühle | 행복한 하루 보내세요! | Hab einen glücklichen Tag! | Have a happy day! |',
      ].join('\n');
      setBulkText(mdSample);
      setBulkFileName('vokabeln_beispiel.md');
    } else {
      const csvSample = [
        'Koreanisch;Deutsch;Englisch;Wortart;Unterkategorie;Beispiel KR;Beispiel DE;Beispiel EN',
        '극복하다;überwinden / bewältigen;overcome;verb;Alltag;어려움을 극복했어요.;Ich habe die Schwierigkeiten überwunden.;I overcame the difficulties.',
        '적응하다;sich anpassen / eingewöhnen;adapt / adjust;verb;Alltag;새로운 환경에 적응했어요.;Ich habe mich an die neue Umgebung angepasst.;I adapted to the new environment.',
        '고민;Sorge / Grübelei;worry / concern;noun;Gefühle;요즘 고민이 많아요.;Ich mache mir viele Sorgen.;I have lots of worries.',
        '행복;Glück / Freude;happiness / joy;noun;Gefühle;행복한 하루 보내세요!;Hab einen glücklichen Tag!;Have a happy day!',
      ].join('\n');
      setBulkText(csvSample);
      setBulkFileName('vokabeln_beispiel.csv');
    }
  };

  // Live preview of parsed items from bulkText
  const bulkPreviewItems = parseVocabCsv(
    bulkText,
    bulkLevel,
    bulkSub.trim() || 'Allgemein',
    bulkLevel === 'Drama' ? 'custom' : bulkCat
  );
  const bulkPreviewSubcategories = Array.from(
    bulkPreviewItems.reduce((acc, item) => {
      const s = item.sub || 'Allgemein';
      acc.set(s, (acc.get(s) || 0) + 1);
      return acc;
    }, new Map<string, number>())
  );
  const bulkPreviewCounts = {
    noun: bulkPreviewItems.filter((i) => i.cat === 'noun').length,
    verb: bulkPreviewItems.filter((i) => i.cat === 'verb').length,
    adjective: bulkPreviewItems.filter((i) => i.cat === 'adjective').length,
    adverb: bulkPreviewItems.filter((i) => i.cat === 'adverb').length,
    phrase: bulkPreviewItems.filter((i) => i.cat === 'phrase').length,
    grammar: bulkPreviewItems.filter((i) => i.cat === 'grammar').length,
  };

  const handleBulkImportAndCloudSave = async () => {
    const fallbackSubName =
      bulkSub.trim() ||
      (bulkFileName ? formatFileNameToSubcategory(bulkFileName) : 'Allgemein');

    const effectiveBulkCat = bulkLevel === 'Drama' ? 'custom' : bulkCat;
    const items = parseVocabCsv(bulkText, bulkLevel, fallbackSubName, effectiveBulkCat);

    if (items.length === 0) {
      setFeedback({
        type: 'error',
        message: isKr
          ? '유효한 단어를 찾을 수 없습니다. (CSV, TSV, 마크다운 표, 또는 한국어 ; 독일어 ; 영어 형식을 확인해주세요)'
          : 'Keine gültigen Zeilen erkannt. Bitte Format prüfen (CSV, TSV, Markdown-Tabelle oder Koreanisch ; Deutsch ; Englisch).',
      });
      return;
    }

    hapticTap();
    setSyncLoading(true);
    setFeedback(null);

    try {
      const fileName =
        bulkFileName.trim() || `${fallbackSubName.replace(/\s+/g, '_')}_${Date.now()}.csv`;

      let finalItems = items;
      // 1. Save to Firebase Cloud (upserts existing words so subcategories update cleanly!)
      if (currentUser) {
        finalItems = await saveMultipleVocabToCloud(items, bulkText, fileName, bulkLevel);
        await loadCloudFiles();
      }

      // 2. Add/update active learning state
      onAddVocab(finalItems, bulkLevel);

      const detectedSubs = Array.from(new Set(finalItems.map((i) => i.sub)));
      setFeedback({
        type: 'success',
        message: isKr
          ? `✓ ${finalItems.length}개 단어가 ${detectedSubs.length}개 세부 주제(${detectedSubs.slice(0, 3).join(', ')})로 저장되었습니다!`
          : `✓ ${finalItems.length} Vokabeln in ${detectedSubs.length} ${detectedSubs.length === 1 ? 'Unterkategorie' : 'Unterkategorien'} (${detectedSubs.slice(0, 4).join(', ')}) gespeichert!`,
      });

      setBulkText('');
      setBulkFileName('');
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Fehler beim Speichern in Firebase.',
      });
    } finally {
      setSyncLoading(false);
    }
  };

  // ----------------------------------------------------
  // TAB 3: CLOUD SYNC & FILE MANAGEMENT
  // ----------------------------------------------------
  const handlePushToCloud = async () => {
    if (!currentUser) {
      setFeedback({
        type: 'error',
        message: isKr ? '먼저 이메일과 비밀번호로 로그인해주세요.' : 'Bitte melde dich zuerst an.',
      });
      return;
    }
    hapticTap();
    setSyncLoading(true);
    setFeedback(null);
    try {
      const res = await syncAllToCloud(customVocab, srsMap);
      setFeedback({
        type: 'success',
        message: isKr
          ? `클라우드 동기화 완료! (${res.vocabSaved}개 단어, ${res.srsSaved}개 SRS 기록)`
          : `Erfolgreich in Firebase gesichert! (${res.vocabSaved} Vokabeln, ${res.srsSaved} SRS-Einträge)`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Fehler beim Speichern in Firebase.',
      });
    } finally {
      setSyncLoading(false);
    }
  };

  const handlePullFromCloud = async () => {
    if (!currentUser) {
      setFeedback({
        type: 'error',
        message: isKr ? '먼저 이메일과 비밀번호로 로그인해주세요.' : 'Bitte melde dich zuerst an.',
      });
      return;
    }
    hapticTap();
    setSyncLoading(true);
    setFeedback(null);
    try {
      const res = await loadAllFromCloud();
      onImportSync(res.srsMap, res.customVocab);
      setFeedback({
        type: 'success',
        message: isKr
          ? `클라우드에서 불러오기 성공! (${res.customVocab.length}개 단어, ${Object.keys(res.srsMap).length}개 SRS)`
          : `Erfolgreich aus Firebase geladen! (${res.customVocab.length} Vokabeln, ${Object.keys(res.srsMap).length} SRS-Einträge)`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Fehler beim Laden aus Firebase.',
      });
    } finally {
      setSyncLoading(false);
    }
  };

  const handleReparseCloudFile = async (file: VocabFileRecord) => {
    if (!file.content) return;
    hapticTap();
    setSyncLoading(true);
    setFeedback(null);
    try {
      const isFileDrama =
        String(file.topikLevel || '').toLowerCase().includes('drama') ||
        String(file.fileName || '').toLowerCase().includes('drama');
      const fallbackSub = isFileDrama
        ? cleanDramaTitle(file.fileName) || 'K-Drama'
        : formatFileNameToSubcategory(file.fileName);
      const level = (
        isFileDrama
          ? 'Drama'
          : file.topikLevel === 'TOPIK II'
          ? 'TOPIK II'
          : 'TOPIK I'
      ) as TopikLevel;
      const items = parseVocabCsv(file.content, level, fallbackSub, isFileDrama ? 'custom' : 'noun');
      if (items.length === 0) {
        setFeedback({
          type: 'error',
          message: 'Keine gültigen Vokabeln in der gespeicherten Datei gefunden.',
        });
        return;
      }
      const updatedItems = await saveMultipleVocabToCloud(items, undefined, undefined, level);
      onAddVocab(updatedItems, level);
      const subs = Array.from(new Set(updatedItems.map((i) => i.sub)));
      setFeedback({
        type: 'success',
        message: `✓ „${file.fileName}“ neu eingelesen: ${updatedItems.length} Vokabeln in ${subs.length} Unterkategorien (${subs.slice(0, 4).join(', ')}) aktualisiert!`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Fehler beim Aktualisieren.',
      });
    } finally {
      setSyncLoading(false);
    }
  };

  const handleConfirmDeleteFile = async () => {
    if (!fileToDelete) return;
    hapticTap();
    setDeletingFile(true);
    setFeedback(null);
    try {
      const res = await deleteCsvFileAndVocabFromCloud(fileToDelete, deleteAssociatedVocabs);
      if (res.deletedIds && res.deletedIds.length > 0) {
        onDeleteVocabBatch?.(res.deletedIds);
      }
      await loadCloudFiles();
      setFeedback({
        type: 'info',
        message: isKr
          ? `„${fileToDelete.fileName}“ 파일 삭제 완료${res.deletedVocabCount > 0 ? ` (${res.deletedVocabCount}개 단어 삭제됨)` : ''}`
          : `Datei „${fileToDelete.fileName}“ gelöscht${res.deletedVocabCount > 0 ? ` (${res.deletedVocabCount} Vokabeln entfernt)` : ''}.`,
      });
      setFileToDelete(null);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : (isKr ? '삭제 실패' : 'Fehler beim Löschen.'),
      });
    } finally {
      setDeletingFile(false);
    }
  };

  const handleConfirmClearAll = async () => {
    hapticTap();
    setClearingAll(true);
    setFeedback(null);
    try {
      if (currentUser) {
        await clearAllCustomVocabFromCloud();
      }
      onClearCustom();
      await loadCloudFiles();
      setFeedback({
        type: 'info',
        message: isKr ? '모든 단어와 파일이 삭제되었습니다.' : 'Alle eigenen Vokabeln & Cloud-Dateien wurden gelöscht.',
      });
      setShowClearAllConfirm(false);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : (isKr ? '삭제 실패' : 'Fehler beim Löschen.'),
      });
    } finally {
      setClearingAll(false);
    }
  };

  // ----------------------------------------------------
  // TAB 4: MANUAL JSON BACKUP
  // ----------------------------------------------------
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(syncCode);
      setFeedback({ type: 'success', message: t.syncModal.copiedSuccess });
    } catch {
      setFeedback({ type: 'error', message: t.syncModal.copyError });
    }
  };

  const handleImportCode = () => {
    try {
      const parsed = JSON.parse(syncCode.trim());
      if (typeof parsed === 'object' && parsed !== null) {
        let importedSrs: SrsMap = {};
        let importedCustom: VocabItem[] = [];

        if (parsed.srsMap) {
          importedSrs = parsed.srsMap;
        }

        if (Array.isArray(parsed.customVocab)) {
          importedCustom = parsed.customVocab;
        }

        onImportSync(importedSrs, importedCustom);
        setFeedback({
          type: 'success',
          message: t.syncModal.loadSuccess,
        });
      } else {
        throw new Error('Ungültiges Format');
      }
    } catch {
      setFeedback({
        type: 'error',
        message: t.syncModal.loadError,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-ink/60 dark:bg-black/80 flex items-center justify-center safe-modal-overlay z-50">
      <div className="bg-hanji border border-border-card rounded-2xl max-w-xl w-full p-4 md:p-6 shadow-xl space-y-4 animate-pop safe-modal-panel overflow-y-auto overscroll-contain font-sans relative">
        {/* HEADER WITH UNIFIED TITLE & FIREBASE CLOUD BADGE */}
        <div className="flex items-center justify-between border-b border-border-card pb-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-celadon/15 text-celadon flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base text-ink flex items-center gap-2 truncate">
                <span>{isKr ? '단어 관리 & Firebase 클라우드' : 'Vokabel- & Cloud-Zentrale'}</span>
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-muted">
                <span className="font-mono text-celadon">hangukgo-36dfe</span>
                <span>·</span>
                <span>
                  {currentUser ? (
                    <span className="text-celadon font-medium flex items-center gap-1 inline-flex">
                      <span className="w-1.5 h-1.5 rounded-full bg-celadon"></span>
                      <span className="truncate max-w-[160px]">{currentUser.email}</span>
                    </span>
                  ) : (
                    <span className="text-muted">
                      {isKr ? '로그인 필요' : 'Nicht angemeldet'}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-ink hover:bg-surface transition shrink-0"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* UNIFIED 3 MAIN TABS + 1 BACKUP TAB */}
        <div className="flex items-center gap-1 p-1 bg-surface rounded-xl border border-border-card text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => {
              hapticTap();
              setActiveTab('single');
              setFeedback(null);
            }}
            className={`flex-1 py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'single'
                ? 'bg-card text-ink shadow-2xs font-bold'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-celadon shrink-0" />
            <span>{isKr ? '단어 직접 추가' : 'Einzeln'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              hapticTap();
              setActiveTab('import');
              setFeedback(null);
            }}
            className={`flex-1 py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'import'
                ? 'bg-card text-ink shadow-2xs font-bold'
                : 'text-muted hover:text-ink'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-obangBlue shrink-0" />
            <span>{isKr ? 'CSV & 파일 가져오기' : 'CSV & Datei'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              hapticTap();
              setActiveTab('cloud');
              setFeedback(null);
            }}
            className={`flex-1 py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'cloud'
                ? 'bg-card text-ink shadow-2xs font-bold'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-celadon shrink-0" />
            <span>
              {isKr ? '클라우드 동기화' : 'Cloud Sync'}
              {cloudFiles.length > 0 && ` (${cloudFiles.length})`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              hapticTap();
              setActiveTab('manual');
              setFeedback(null);
            }}
            className={`py-1.5 px-2 rounded-lg flex items-center justify-center transition ${
              activeTab === 'manual'
                ? 'bg-card text-ink shadow-2xs'
                : 'text-muted hover:text-ink'
            }`}
            title={isKr ? '코드 백업' : 'JSON / Code-Backup'}
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="space-y-4 pr-0.5">
          {/* USER AUTH BAR (IF NOT LOGGED IN, PROMPT INLINE) */}
          {!currentUser && (
            <div className="p-3.5 bg-card border border-border-card rounded-xl space-y-2.5">
              <form onSubmit={handleEmailLogin} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ink flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-celadon" />
                    <span>{isKr ? 'Firebase 로그인 (필수)' : 'Firebase E-Mail & Passwort Login'}</span>
                  </span>
                  <span className="text-[10px] text-muted">
                    {isKr ? 'Cloud 동기화 활성화' : 'Für automatische Cloud-Speicherung'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-muted absolute left-2.5 top-2.5" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        setAuthError(null);
                      }}
                      placeholder="beispiel@domain.de"
                      required
                      className="w-full bg-surface border border-border-card rounded-xl pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-muted focus:outline-none focus:border-celadon transition"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-muted absolute left-2.5 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setAuthError(null);
                      }}
                      placeholder={isKr ? '비밀번호' : 'Passwort'}
                      required
                      className="w-full bg-surface border border-border-card rounded-xl pl-8 pr-8 py-1.5 text-xs text-ink placeholder:text-muted focus:outline-none focus:border-celadon transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2 text-muted hover:text-ink transition"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {authError && (
                  <div className="p-2 rounded-lg bg-dancheong/10 border border-dancheong/30 text-dancheong text-[11px] flex items-start gap-1.5 leading-snug">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2 rounded-xl bg-celadon hover:bg-celadon/90 text-white font-semibold text-xs shadow-2xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>
                    {authLoading
                      ? isKr
                        ? '로그인 확인 중...'
                        : 'Wird angemeldet...'
                      : isKr
                      ? '로그인하여 Cloud 동기화 켜기'
                      : 'Anmelden & Cloud-Speicherung aktivieren'}
                  </span>
                </button>
              </form>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 1: ADD SINGLE VOCABULARY */}
          {/* ==================================================== */}
          {activeTab === 'single' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-surface rounded-xl border border-border-card flex flex-col gap-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-celadon" />
                    <span>{isKr ? '앱 전체 공유 단어장' : 'Gilt für die gesamte App'}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-card border border-border-card font-mono text-[11px] font-semibold text-ink shrink-0">
                    {customVocab.length} {isKr ? '개 등록됨' : 'eigene'}
                  </span>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  {isKr
                    ? '추가된 단어는 앱 전체에 저장되어 모든 사용자가 학습할 수 있습니다. 각 사용자의 SRS 학습 진도는 개별 계정에만 저장됩니다.'
                    : 'Hinzugefügte Vokabeln & CSVs gelten für die gesamte App (für alle Nutzer). Dein SRS-Lernfortschritt bleibt individuell für dein Profil.'}
                </p>
              </div>

              {/* Target Level, Category & Subcategory */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">
                    {t.vocabModal.targetLevel}
                  </label>
                  <select
                    value={singleLevel}
                    onChange={(e) => setSingleLevel(e.target.value as TopikLevel)}
                    className="w-full bg-card border border-border-card rounded-xl px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:border-celadon"
                  >
                    <option value="TOPIK I">TOPIK I (A1/A2)</option>
                    <option value="TOPIK II">TOPIK II (B1/B2)</option>
                    <option value="Drama">🎬 K-Drama Modus (Exklusiv)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">
                    {t.vocabModal.category}
                    {singleLevel === 'Drama' && (
                      <span className="ml-1 text-[10px] text-muted font-normal">
                        ({isKr ? '드라마 모드 비활성화' : 'im Drama-Modus deaktiviert'})
                      </span>
                    )}
                  </label>
                  <select
                    value={singleLevel === 'Drama' ? 'custom' : singleCat}
                    disabled={singleLevel === 'Drama'}
                    onChange={(e) => setSingleCat(e.target.value as VocabCategory)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs font-medium text-ink focus:outline-none transition ${
                      singleLevel === 'Drama'
                        ? 'opacity-40 cursor-not-allowed bg-surface/80 border-dashed border-border-card text-muted select-none'
                        : 'bg-card border-border-card focus:border-celadon'
                    }`}
                  >
                    {singleLevel === 'Drama' ? (
                      <option value="custom">🎬 {isKr ? '드라마 전용 (카테고리 제외)' : 'K-Drama (Keine Wortart)'}</option>
                    ) : (
                      <>
                        <option value="noun">{lang === 'kr' ? '명사 (Nomen)' : '명사 Nomen'}</option>
                        <option value="verb">{lang === 'kr' ? '동사 (Verben)' : '동사 Verben'}</option>
                        <option value="adjective">{lang === 'kr' ? '형용사 (Adjektive)' : '형용사 Adjektive'}</option>
                        <option value="adverb">{lang === 'kr' ? '부사 (Adverbien)' : '부사 Adverbien'}</option>
                        <option value="phrase">{lang === 'kr' ? '표현 (Ausdrücke)' : '표현 Ausdrücke'}</option>
                        <option value="grammar">{lang === 'kr' ? '문법 (Grammatik)' : '문법 Grammatik'}</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">
                    {singleLevel === 'Drama'
                      ? isKr
                        ? '드라마 제목 (K-Drama)'
                        : 'K-Drama Serie / Titel'
                      : t.vocabModal.subcategoryName}
                  </label>
                  <input
                    type="text"
                    value={singleSub}
                    onChange={(e) => setSingleSub(e.target.value)}
                    placeholder={
                      singleLevel === 'Drama'
                        ? isKr
                          ? '예: 사랑의 불시착, 도깨비'
                          : 'z. B. Goblin, Crash Landing on You'
                        : isKr
                        ? '예: 4과, 음식'
                        : 'z. B. Lektion 4'
                    }
                    className="w-full bg-card border border-border-card rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-celadon"
                  />
                </div>
              </div>

              {singleLevel === 'Drama' && (
                <div className="p-2.5 bg-obangBlue/10 border border-obangBlue/30 rounded-xl text-xs text-obangBlue flex items-center gap-2 font-medium animate-fadeIn">
                  <span className="text-base">📺</span>
                  <span>
                    {isKr
                      ? '드라마 모드 전용: 이 단어는 일반 TOPIK 목록에 섞이지 않고, 오직 K-드라마 게임 모드에서만 실행됩니다.'
                      : 'Exklusiv für K-Drama Modus: Diese Vokabel erscheint nicht in den normalen TOPIK-Listen, sondern ausschließlich im Drama-Spielmodus!'}
                  </span>
                </div>
              )}

              {/* Korean Word & Hanja */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-muted mb-1">
                    {t.vocabModal.koreanWord} *
                  </label>
                  <input
                    type="text"
                    value={singleKr}
                    onChange={(e) => setSingleKr(e.target.value)}
                    placeholder="z. B. 극복하다"
                    className="w-full bg-card border border-border-card rounded-xl px-3 py-2 text-sm font-kr font-bold text-ink focus:outline-none focus:border-celadon"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">
                    {isKr ? '한자 (선택):' : 'Hanja (optional):'}
                  </label>
                  <input
                    type="text"
                    value={singleHanja}
                    onChange={(e) => setSingleHanja(e.target.value)}
                    placeholder="z. B. 克服"
                    className="w-full bg-card border border-border-card rounded-xl px-3 py-2 text-xs font-kr text-ink focus:outline-none focus:border-celadon"
                  />
                </div>
              </div>

              {/* German & English Meanings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">
                    {t.vocabModal.germanWord} (Deutsch):
                  </label>
                  <input
                    type="text"
                    value={singleDe}
                    onChange={(e) => setSingleDe(e.target.value)}
                    placeholder={isKr ? '독일어 뜻' : 'z. B. überwinden / bewältigen'}
                    className="w-full bg-card border border-border-card rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:border-celadon"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">
                    {isKr ? '영어 뜻 (English):' : 'Englische Übersetzung (English):'}
                  </label>
                  <input
                    type="text"
                    value={singleEn}
                    onChange={(e) => setSingleEn(e.target.value)}
                    placeholder="e.g. overcome / get over"
                    className="w-full bg-card border border-border-card rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:border-celadon"
                  />
                </div>
              </div>

              {/* Examples (Korean, German, English) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">
                    {t.vocabModal.exampleKorean}
                  </label>
                  <input
                    type="text"
                    value={singleExKr}
                    onChange={(e) => setSingleExKr(e.target.value)}
                    placeholder="어려움을 극복했어요."
                    className="w-full bg-card border border-border-card rounded-xl px-3 py-2 text-xs font-kr text-ink focus:outline-none focus:border-celadon"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">
                    {t.vocabModal.exampleGerman} (Deutsch)
                  </label>
                  <input
                    type="text"
                    value={singleExDe}
                    onChange={(e) => setSingleExDe(e.target.value)}
                    placeholder="Ich habe die Schwierigkeiten überwunden."
                    className="w-full bg-card border border-border-card rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-celadon"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">
                    {isKr ? '영어 예문 (English):' : 'Englischer Beispielsatz (English):'}
                  </label>
                  <input
                    type="text"
                    value={singleExEn}
                    onChange={(e) => setSingleExEn(e.target.value)}
                    placeholder="I overcame the difficulties."
                    className="w-full bg-card border border-border-card rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-celadon"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2 border-t border-border-card flex items-center justify-between">
                {customVocab.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowClearAllConfirm(true)}
                    className="text-xs text-muted hover:text-dancheong underline transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isKr ? `내 단어 모두 삭제 (${customVocab.length})` : `Eigene löschen (${customVocab.length})`}</span>
                  </button>
                ) : (
                  <span />
                )}

                <button
                  type="button"
                  onClick={handleSingleAdd}
                  disabled={syncLoading || !singleKr.trim() || (!singleDe.trim() && !singleEn.trim())}
                  className="px-5 py-2.5 rounded-xl bg-celadon hover:bg-celadon/90 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {syncLoading
                      ? 'Speichere...'
                      : isKr
                      ? '+ Firebase 클라우드 & 덱에 저장'
                      : '+ In Firebase Cloud & Deck speichern'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: BULK CSV / FILE / LIST IMPORT */}
          {/* ==================================================== */}
          {activeTab === 'import' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-surface rounded-xl border border-border-card text-xs text-muted leading-relaxed flex flex-col gap-1">
                <span className="font-semibold text-ink flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-obangBlue" />
                  <span>{isKr ? '앱 전체 적용 CSV / 파일 업로드' : 'Gilt für die gesamte App'}</span>
                </span>
                <p>
                  {isKr
                    ? 'CSV, TSV, JSON 또는 .md 파일을 업로드하세요. 파일과 단어 목록은 모든 사용자가 학습할 수 있도록 앱 전체에 저장되며, 영어 번역 컬럼도 지원됩니다. 학습 진도는 각 사용자별로 분리됩니다.'
                    : 'Lade CSV/JSON/MD-Dateien hoch oder füge Zeilen ein. Die Vokabeln stehen allen Nutzern der App zur Verfügung (auch mit englischer Übersetzung). Der Lernfortschritt bleibt für jeden Benutzer individuell.'}
                </p>
              </div>

              {/* Settings for bulk import */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">
                    {t.vocabModal.targetLevel}
                  </label>
                  <select
                    value={bulkLevel}
                    onChange={(e) => setBulkLevel(e.target.value as TopikLevel)}
                    className="w-full bg-card border border-border-card rounded-xl px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:border-celadon"
                  >
                    <option value="TOPIK I">TOPIK I (A1/A2)</option>
                    <option value="TOPIK II">TOPIK II (B1/B2)</option>
                    <option value="Drama">🎬 K-Drama Modus (Exklusiv)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">
                    {t.vocabModal.category}
                    {bulkLevel === 'Drama' && (
                      <span className="ml-1 text-[10px] text-muted font-normal">
                        ({isKr ? '드라마 모드 비활성화' : 'im Drama-Modus deaktiviert'})
                      </span>
                    )}
                  </label>
                  <select
                    value={bulkLevel === 'Drama' ? 'custom' : bulkCat}
                    disabled={bulkLevel === 'Drama'}
                    onChange={(e) => setBulkCat(e.target.value as VocabCategory)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs font-medium text-ink focus:outline-none transition ${
                      bulkLevel === 'Drama'
                        ? 'opacity-40 cursor-not-allowed bg-surface/80 border-dashed border-border-card text-muted select-none'
                        : 'bg-card border-border-card focus:border-celadon'
                    }`}
                  >
                    {bulkLevel === 'Drama' ? (
                      <option value="custom">🎬 {isKr ? '드라마 전용 (카테고리 제외)' : 'K-Drama (Keine Wortart)'}</option>
                    ) : (
                      <>
                        <option value="noun">{lang === 'kr' ? '명사 (Nomen)' : '명사 Nomen'}</option>
                        <option value="verb">{lang === 'kr' ? '동사 (Verben)' : '동사 Verben'}</option>
                        <option value="adjective">{lang === 'kr' ? '형용사 (Adjektive)' : '형용사 Adjektive'}</option>
                        <option value="adverb">{lang === 'kr' ? '부사 (Adverbien)' : '부사 Adverbien'}</option>
                        <option value="phrase">{lang === 'kr' ? '표현 (Ausdrücke)' : '표현 Ausdrücke'}</option>
                        <option value="grammar">{lang === 'kr' ? '문법 (Grammatik)' : '문법 Grammatik'}</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">
                    {bulkLevel === 'Drama'
                      ? isKr
                        ? '드라마 제목 (K-Drama)'
                        : 'K-Drama Serie / Titel'
                      : t.vocabModal.subcategoryName}
                  </label>
                  <input
                    type="text"
                    value={bulkSub}
                    onChange={(e) => setBulkSub(e.target.value)}
                    placeholder={
                      bulkLevel === 'Drama'
                        ? isKr
                          ? '예: 사랑의 불시착, 도깨비'
                          : 'z. B. Goblin, Crash Landing on You'
                        : isKr
                        ? '예: 4과'
                        : 'z. B. Lektion 4'
                    }
                    className="w-full bg-card border border-border-card rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-celadon"
                  />
                </div>
              </div>

              {bulkLevel === 'Drama' && (
                <div className="p-2.5 bg-obangBlue/10 border border-obangBlue/30 rounded-xl text-xs text-obangBlue flex items-center gap-2 font-medium animate-fadeIn">
                  <span className="text-base">📺</span>
                  <span>
                    {isKr
                      ? '드라마 모드 전용 업로드: 이 파일의 모든 단어는 일반 TOPIK 목록에 섞이지 않고, 오직 K-드라마 게임 모드에서만 실행됩니다.'
                      : 'Exklusiv für K-Drama Modus: Alle Vokabeln dieser Liste erscheinen nicht in den normalen TOPIK-Listen, sondern ausschließlich im Drama-Spielmodus!'}
                  </span>
                </div>
              )}

              {/* File Upload Zone with Drag & Drop */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".csv,.txt,.tsv,.json,.md"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 select-none ${
                  isDraggingFile
                    ? 'border-celadon bg-celadon/15 scale-[1.01] shadow-md'
                    : 'border-border-card hover:border-celadon bg-surface/50 hover:bg-surface'
                }`}
              >
                <UploadCloud
                  className={`w-7 h-7 transition-transform ${
                    isDraggingFile ? 'text-celadon scale-110 animate-bounce' : 'text-celadon'
                  }`}
                />
                <div className="text-xs font-bold text-ink">
                  {isDraggingFile ? (
                    <span className="text-celadon">
                      {isKr
                        ? '여기에 파일을 놓으세요 (Drag & Drop)...'
                        : 'Dateien jetzt hier loslassen (Drag & Drop)...'}
                    </span>
                  ) : bulkFileName ? (
                    <span className="text-celadon underline">{bulkFileName}</span>
                  ) : isKr ? (
                    '파일을 이곳으로 끌어다 놓거나 클릭하여 선택 (.csv, .md, .tsv, .txt, .json)'
                  ) : (
                    'Dateien hierher ziehen (Drag & Drop) oder klicken (.csv, .md, .tsv, .txt, .json)'
                  )}
                </div>
                <div className="text-[11px] text-muted">
                  {isKr
                    ? '여러 파일을 한 번에 끌어다 놓거나 아래 텍스트 상자에 붙여넣을 수 있습니다'
                    : 'Auch mehrere Dateien gleichzeitig möglich – oder Text direkt unten einfügen'}
                </div>
              </div>

              {/* Textarea for CSV / Text Paste */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                  <label className="text-[11px] font-semibold text-muted">
                    {t.vocabModal.inputData}
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-muted/70">{isKr ? '예시:' : 'Beispiele:'}</span>
                    <button
                      type="button"
                      onClick={() => insertSampleFormat('csv')}
                      className="text-celadon hover:underline font-semibold"
                    >
                      CSV / Liste
                    </button>
                    <span className="text-muted/40">·</span>
                    <button
                      type="button"
                      onClick={() => insertSampleFormat('md')}
                      className="text-celadon hover:underline font-semibold"
                    >
                      Markdown (.md) Tabelle
                    </button>
                  </div>
                </div>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={5}
                  placeholder={`Format 1 - CSV mit Spaltenüberschrift:\nKoreanisch;Deutsch;Englisch;Wortart;Unterkategorie\n극복하다;überwinden;overcome;verb;Alltag\n\nFormat 2 - Markdown (.md) mit # Unterkategorie:\n# Essen & Kultur\n| Korean | Deutsch | English | Wortart |\n| 김치 | Kimchi | kimchi | noun |`}
                  className="w-full bg-card border border-border-card rounded-xl p-3 text-xs font-mono text-ink focus:outline-none focus:border-celadon resize-none leading-relaxed"
                />
                <p className="text-[10px] text-muted mt-1 leading-normal">
                  <strong>Tipp für Unterkategorien:</strong> Nutze eine Spalte namens <code>Unterkategorie</code>, <code>Thema</code> oder <code>Kategorie</code> in deiner CSV, oder schreibe <code># Themenname</code> (Markdown-Überschrift) über einen Abschnitt. Fehlt beides, wird das Feld „Themenbereich / Lektion“ oben (bzw. der Dateiname) genutzt.
                </p>
              </div>

              {/* Live Recognition Preview (Vokabeln, Wortarten & Unterkategorien) */}
              {bulkPreviewItems.length > 0 && (
                <div className="p-3 rounded-xl bg-celadon/10 border border-celadon/30 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-ink flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-celadon" />
                      <span>
                        {bulkPreviewItems.length}{' '}
                        {isKr ? '개 단어 인식됨' : 'Vokabeln erkannt'}
                      </span>
                    </span>
                    {bulkLevel === 'Drama' ? (
                      <span className="text-[11px] text-obangBlue font-semibold flex items-center gap-1">
                        🎬{' '}
                        {isKr
                          ? '드라마 전용: 전체 개수에만 합산되며 품사 카테고리에 포함되지 않음'
                          : 'K-Drama Modus: Zählt nur zur Gesamtzahl (keine Wortart-Kategorien)'}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted font-medium flex flex-wrap gap-x-2">
                        <span>명사 Nomen: <strong>{bulkPreviewCounts.noun}</strong></span>
                        <span>· 동사 Verben: <strong>{bulkPreviewCounts.verb}</strong></span>
                        <span>· 형용사 Adjektive: <strong>{bulkPreviewCounts.adjective}</strong></span>
                        {bulkPreviewCounts.adverb > 0 && <span>· 부사 Adverbien: <strong>{bulkPreviewCounts.adverb}</strong></span>}
                        {bulkPreviewCounts.phrase > 0 && <span>· 표현 Ausdrücke: <strong>{bulkPreviewCounts.phrase}</strong></span>}
                        <span>· 문법 Grammatik: <strong>{bulkPreviewCounts.grammar}</strong></span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-celadon/20">
                    <span className="text-[11px] font-semibold text-muted mr-1">
                      {bulkLevel === 'Drama'
                        ? isKr
                          ? '인식된 K-드라마 시리즈:'
                          : 'Erkannte K-Drama Serien:'
                        : isKr
                        ? '인식된 세부 주제 (Unterkategorien):'
                        : 'Erkannte Unterkategorien:'}
                    </span>
                    {bulkPreviewSubcategories.map(([subName, count]) => (
                      <span
                        key={subName}
                        className="px-2 py-0.5 rounded-md bg-card border border-celadon/40 text-ink font-semibold text-[11px]"
                      >
                        {subName} <span className="text-celadon">({count})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Import Button */}
              <div className="pt-2 border-t border-border-card flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleBulkImportAndCloudSave}
                  disabled={syncLoading || !bulkText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-celadon hover:bg-celadon/90 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Database className="w-4 h-4" />
                  <span>
                    {syncLoading
                      ? 'Wird gespeichert...'
                      : isKr
                      ? 'Firebase에 저장 & 덱 가져오기'
                      : 'In Firebase Cloud speichern & importieren'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: FIREBASE CLOUD & SYNC */}
          {/* ==================================================== */}
          {activeTab === 'cloud' && (
            <div className="space-y-4">
              {/* Account Status Card */}
              {currentUser && (
                <div className="p-3 bg-card rounded-xl border border-border-card flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-celadon text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-ink truncate">
                        {currentUser.email}
                      </div>
                      <div className="text-[11px] text-celadon flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-celadon"></span>
                        <span>{isKr ? 'Firebase Cloud aktiv' : 'Firebase Cloud aktiv'}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 border border-border-card text-muted hover:text-ink transition flex items-center gap-1 text-xs shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{isKr ? '로그아웃' : 'Abmelden'}</span>
                  </button>
                </div>
              )}

              {/* Local stats */}
              <div className="p-3.5 bg-surface rounded-xl border border-border-card space-y-2">
                <h4 className="text-xs font-bold text-ink">
                  {isKr ? '현재 앱 내 데이터' : 'Aktuell in der App'}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-card p-2 rounded-lg border border-border-card">
                    <span className="text-muted block text-[11px]">
                      {isKr ? '사용자 Vokabeln' : 'Eigene Vokabeln'}
                    </span>
                    <span className="font-bold text-ink text-sm">
                      {customVocab.length} {isKr ? '개' : 'Karten'}
                    </span>
                  </div>
                  <div className="bg-card p-2 rounded-lg border border-border-card">
                    <span className="text-muted block text-[11px]">
                      {isKr ? 'SRS 학습 진행' : 'SRS Lernfortschritt'}
                    </span>
                    <span className="font-bold text-ink text-sm">
                      {Object.keys(srsMap).length} {isKr ? '개' : 'Karten'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cloud Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handlePushToCloud}
                  disabled={syncLoading || !currentUser}
                  className="p-3.5 rounded-xl bg-celadon hover:bg-celadon/90 text-white font-semibold text-xs shadow-sm transition flex flex-col items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <CloudUpload className="w-5 h-5" />
                  <span>{isKr ? '클라우드에 저장' : 'In Firebase sichern'}</span>
                  <span className="text-[10px] opacity-80 font-normal">
                    {isKr ? 'App → Firebase' : 'Upload zu hangukgo-36dfe'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handlePullFromCloud}
                  disabled={syncLoading || !currentUser}
                  className="p-3.5 rounded-xl bg-obangBlue hover:bg-obangBlue/90 text-white font-semibold text-xs shadow-sm transition flex flex-col items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <CloudDownload className="w-5 h-5" />
                  <span>{isKr ? '클라우드에서 불러오기' : 'Aus Firebase laden'}</span>
                  <span className="text-[10px] opacity-80 font-normal">
                    {isKr ? 'Firebase → App' : 'Download von hangukgo-36dfe'}
                  </span>
                </button>
              </div>

              {/* Saved Cloud Files List */}
              {currentUser && cloudFiles.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border-card">
                  <h4 className="text-xs font-bold text-ink flex items-center justify-between">
                    <span>{isKr ? 'Firebase에 저장된 파일 목록' : 'In Firebase gespeicherte CSV-Dateien'}</span>
                    <span className="text-muted text-[11px] font-normal">
                      {cloudFiles.length} {isKr ? '개 파일' : 'Dateien'}
                    </span>
                  </h4>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto">
                    {cloudFiles.map((file) => (
                      <div
                        key={file.id}
                        className="p-2.5 rounded-xl bg-card border border-border-card flex items-center justify-between text-xs gap-2"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-ink truncate flex items-center gap-1.5">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-celadon shrink-0" />
                            <span className="truncate">{file.fileName}</span>
                          </div>
                          <div className="text-[10px] text-muted">
                            {file.vocabCount} Vokabeln · {file.topikLevel} · {new Date(file.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleReparseCloudFile(file)}
                            disabled={syncLoading}
                            className="px-2 py-1 rounded-lg bg-celadon/15 text-celadon hover:bg-celadon/25 font-semibold text-[11px] transition"
                            title="Unterkategorien & Wortarten aus dieser Datei neu einlesen"
                          >
                            {isKr ? '재분석' : 'Neu zuordnen'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFileToDelete(file);
                              setDeleteAssociatedVocabs(true);
                            }}
                            className="p-1.5 rounded-lg text-muted hover:text-dancheong hover:bg-surface transition"
                            title={isKr ? 'Firebase에서 삭제' : 'Aus Firebase löschen'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 4: MANUAL JSON CODE */}
          {/* ==================================================== */}
          {activeTab === 'manual' && (
            <div className="space-y-3">
              <p className="text-xs text-muted">
                {t.syncModal.textareaPlaceholder}
              </p>

              <textarea
                value={syncCode}
                onChange={(e) => setSyncCode(e.target.value)}
                rows={6}
                className="w-full bg-card border border-border-card rounded-xl p-3 text-xs font-mono text-ink focus:outline-none focus:border-celadon resize-none"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3.5 py-2 rounded-xl bg-surface hover:bg-stone-200 dark:hover:bg-stone-700/60 text-ink text-xs font-semibold border border-border-card transition flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t.syncModal.copyCode}</span>
                </button>
                <button
                  type="button"
                  onClick={handleImportCode}
                  className="px-3.5 py-2 rounded-xl bg-celadon hover:bg-celadon/90 text-white text-xs font-semibold shadow-sm transition"
                >
                  {t.syncModal.loadProgress}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* NOTIFICATION FEEDBACK TOAST */}
        {feedback && (
          <div
            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 ${
              feedback.type === 'success'
                ? 'bg-celadon/15 text-celadon border border-celadon/30'
                : feedback.type === 'error'
                ? 'bg-dancheong/15 text-dancheong border border-dancheong/30'
                : 'bg-surface text-ink border border-border-card'
            }`}
          >
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="truncate">{feedback.message}</span>
          </div>
        )}

        {/* FILE DELETION CONFIRMATION OVERLAY (In-app, iframe safe, no window.confirm) */}
        {fileToDelete && (
          <div className="absolute inset-0 bg-ink/75 dark:bg-black/85 flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-hanji border border-border-card rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-dancheong/15 text-dancheong flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-ink">
                    {isKr ? 'Firebase 파일 삭제' : 'Datei aus Firebase löschen'}
                  </h4>
                  <p className="text-xs text-muted truncate mt-0.5 font-medium">
                    {fileToDelete.fileName}
                  </p>
                  <p className="text-[11px] text-muted opacity-80">
                    {fileToDelete.vocabCount} Vokabeln · {fileToDelete.topikLevel}
                  </p>
                </div>
              </div>

              {/* Checkbox option to also delete associated vocabs from deck and sharedVocab */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-card border border-border-card cursor-pointer hover:bg-surface transition">
                <input
                  type="checkbox"
                  checked={deleteAssociatedVocabs}
                  onChange={(e) => setDeleteAssociatedVocabs(e.target.checked)}
                  className="mt-0.5 rounded text-dancheong focus:ring-dancheong shrink-0"
                />
                <div className="text-xs space-y-0.5">
                  <span className="font-semibold text-ink block">
                    {isKr
                      ? '단어장의 단어도 함께 삭제'
                      : `Zugehörige Vokabeln (${fileToDelete.vocabCount}) entfernen`}
                  </span>
                  <span className="text-[11px] text-muted block leading-tight">
                    {isKr
                      ? 'Firebase 클라우드 및 현재 앱의 단어장에서 이 파일의 단어를 함께 삭제합니다.'
                      : 'Löscht alle importierten Wörter dieser Datei aus Firebase und deiner aktuellen Lernkartei.'}
                  </span>
                </div>
              </label>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setFileToDelete(null)}
                  disabled={deletingFile}
                  className="px-3.5 py-2 rounded-xl bg-card hover:bg-stone-200 dark:hover:bg-stone-700/60 border border-border-card text-muted hover:text-ink text-xs font-medium transition"
                >
                  {isKr ? '취소' : 'Abbrechen'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteFile}
                  disabled={deletingFile}
                  className="px-4 py-2 rounded-xl bg-dancheong hover:bg-dancheong/90 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {deletingFile ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {deletingFile
                      ? isKr
                        ? '삭제 중...'
                        : 'Löschen...'
                      : isKr
                      ? '삭제하기'
                      : 'Jetzt löschen'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CLEAR ALL VOCAB & CLOUD FILES CONFIRMATION OVERLAY */}
        {showClearAllConfirm && (
          <div className="absolute inset-0 bg-ink/75 dark:bg-black/85 flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-hanji border border-border-card rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-dancheong/15 text-dancheong flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-ink">
                    {isKr ? '모든 단어 및 파일 삭제' : 'Alle Vokabeln & Dateien löschen'}
                  </h4>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    {isKr
                      ? `모든 사용자 지정 단어(${customVocab.length}개)와 Firebase에 저장된 CSV 파일 목록을 완전히 삭제하시겠습니까?`
                      : `Möchtest du wirklich alle ${customVocab.length} eigenen Vokabeln sowie alle in Firebase gespeicherten CSV-Dateien löschen?`}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearAllConfirm(false)}
                  disabled={clearingAll}
                  className="px-3.5 py-2 rounded-xl bg-card hover:bg-stone-200 dark:hover:bg-stone-700/60 border border-border-card text-muted hover:text-ink text-xs font-medium transition"
                >
                  {isKr ? '취소' : 'Abbrechen'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClearAll}
                  disabled={clearingAll}
                  className="px-4 py-2 rounded-xl bg-dancheong hover:bg-dancheong/90 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {clearingAll ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {clearingAll
                      ? isKr
                        ? '삭제 중...'
                        : 'Lösche alles...'
                      : isKr
                      ? '전체 삭제'
                      : 'Alles unwiderruflich löschen'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
