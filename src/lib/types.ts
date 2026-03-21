export interface Language {
  code: string;
  label: string;
}

export interface TranslationEntry {
  id: string;
  sourceLang: Language;
  targetLang: Language;
  sourceText: string;
  translatedText: string;
  detectedLang?: string;
  timestamp: number;
}

export interface TranslateRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
}
