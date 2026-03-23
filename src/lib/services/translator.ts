import type { Language } from '$lib/types';

export interface TranslateOptions {
  text: string;
  sourceLang: Language;
  targetLang: Language;
  signal?: AbortSignal;
  onChunk: (translatedText: string, detectedLang: string) => void;
}

export interface TranslateResult {
  translatedText: string;
  detectedLang: string;
}

export async function translateText(options: TranslateOptions): Promise<TranslateResult> {
  const { text, sourceLang, targetLang, signal, onChunk } = options;

  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      sourceLang: sourceLang.code,
      targetLang: targetLang.label,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Translation failed (${response.status})`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullText = '';
  let detectedLang = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    fullText += chunk;

    // Parse detected language from the first line if auto-detect
    if (sourceLang.code === 'auto' && fullText.startsWith('Detected:')) {
      const newlineIdx = fullText.indexOf('\n');
      if (newlineIdx !== -1) {
        detectedLang = fullText.substring('Detected:'.length, newlineIdx).trim();
        onChunk(fullText.substring(newlineIdx + 1).replace(/^\n+/, ''), detectedLang);
      } else {
        onChunk('', detectedLang);
      }
    } else {
      onChunk(fullText, detectedLang);
    }
  }

  // Clean up final text
  let translatedText = fullText;
  if (sourceLang.code === 'auto' && fullText.startsWith('Detected:')) {
    const newlineIdx = fullText.indexOf('\n');
    if (newlineIdx !== -1) {
      if (!detectedLang) {
        detectedLang = fullText.substring('Detected:'.length, newlineIdx).trim();
      }
      translatedText = fullText.substring(newlineIdx + 1).replace(/^\n+/, '');
    }
  }

  return { translatedText, detectedLang };
}
