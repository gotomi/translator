import type { Language } from './types';

export const sourceLanguages: Language[] = [
  { code: 'auto', label: 'Auto-detect' },
  { code: 'pl', label: 'Polish' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'German' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'nl', label: 'Dutch' },
  { code: 'ru', label: 'Russian' },
  { code: 'uk', label: 'Ukrainian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'zh', label: 'Chinese (Simplified)' },
  { code: 'ko', label: 'Korean' },
  { code: 'ar', label: 'Arabic' },
];

export const targetLanguages: Language[] = sourceLanguages.filter(
  (lang) => lang.code !== 'auto'
);
