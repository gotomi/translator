<script lang="ts">
  import { sourceLanguages, targetLanguages } from '$lib/languages';
  import type { Language, TranslationEntry } from '$lib/types';
  import { debounce } from '$lib/utils/debounce';
  import { copyToClipboard } from '$lib/utils/clipboard';
  import { translateText } from '$lib/services/translator';

  import LanguageBar from '$lib/components/LanguageBar.svelte';
  import SourcePanel from '$lib/components/SourcePanel.svelte';
  import TargetPanel from '$lib/components/TargetPanel.svelte';
  import StreamingIndicator from '$lib/components/StreamingIndicator.svelte';
  import TranslationHistory from '$lib/components/TranslationHistory.svelte';

  const MAX_CHARS = 5000;
  const MAX_HISTORY = 5;

  let sourceText = $state('');
  let translatedText = $state('');
  let selectedSourceLang = $state<Language>(sourceLanguages[0]);
  let selectedTargetLang = $state<Language>(targetLanguages[1]);
  let isStreaming = $state(false);
  let error = $state('');
  let detectedLang = $state('');
  let history = $state<TranslationEntry[]>([]);
  let copied = $state(false);
  let abortController = $state<AbortController | null>(null);

  const isOverLimit = $derived(sourceText.length > MAX_CHARS);

  const debouncedTranslate = debounce(() => {
    if (sourceText.trim()) {
      translate();
    }
  }, 600);

  $effect(() => {
    sourceText;
    if (sourceText.trim()) {
      debouncedTranslate.call();
    } else {
      translatedText = '';
      detectedLang = '';
      error = '';
    }

    return () => {
      debouncedTranslate.cancel();
    };
  });

  async function translate() {
    if (!sourceText.trim() || isOverLimit) return;

    if (abortController) {
      abortController.abort();
    }

    abortController = new AbortController();
    isStreaming = true;
    error = '';
    translatedText = '';
    detectedLang = '';

    try {
      const result = await translateText({
        text: sourceText,
        sourceLang: selectedSourceLang,
        targetLang: selectedTargetLang,
        signal: abortController.signal,
        onChunk: (text, detected) => {
          translatedText = text;
          detectedLang = detected;
        },
      });

      translatedText = result.translatedText;
      detectedLang = result.detectedLang;

      // Save to history
      if (result.translatedText.trim()) {
        const entry: TranslationEntry = {
          id: crypto.randomUUID(),
          sourceLang: { ...selectedSourceLang },
          targetLang: { ...selectedTargetLang },
          sourceText: sourceText.slice(0, 80),
          translatedText: result.translatedText.slice(0, 80),
          detectedLang: result.detectedLang || undefined,
          timestamp: Date.now(),
        };
        history = [entry, ...history.slice(0, MAX_HISTORY - 1)];
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      error = err instanceof Error ? err.message : 'Translation failed';
    } finally {
      isStreaming = false;
      abortController = null;
    }
  }

  function swapLanguages() {
    if (selectedSourceLang.code === 'auto') return;

    const tempLang = selectedSourceLang;
    const tempText = sourceText;

    selectedSourceLang = selectedTargetLang;
    selectedTargetLang = tempLang;
    sourceText = translatedText;
    translatedText = tempText;
  }

  function clearInput() {
    debouncedTranslate.cancel();
    sourceText = '';
    translatedText = '';
    detectedLang = '';
    error = '';
  }

  async function handleCopy() {
    const success = await copyToClipboard(translatedText);
    if (success) {
      copied = true;
      setTimeout(() => (copied = false), 2000);
    }
  }

  function loadFromHistory(entry: TranslationEntry) {
    selectedSourceLang = entry.sourceLang;
    selectedTargetLang = entry.targetLang;
    sourceText = entry.sourceText;
  }
</script>

<svelte:head>
  <title>Translator — AI-Powered Translation</title>
</svelte:head>

<main class="app">
  <header class="app-header">
    <div class="logo">
      <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
      <h1>Translator</h1>
    </div>
    <p class="subtitle">AI-powered translation · 14 languages · Real-time streaming</p>
  </header>

  <section class="translator-container" aria-label="Translation interface">
    <LanguageBar
      {sourceLanguages}
      {targetLanguages}
      bind:selectedSourceLang
      bind:selectedTargetLang
      {detectedLang}
      onSwap={swapLanguages}
    />

    <div class="panels">
      <SourcePanel
        bind:sourceText
        maxChars={MAX_CHARS}
        {isStreaming}
        onTranslate={translate}
        onClear={clearInput}
      />

      <TargetPanel
        {translatedText}
        {isStreaming}
        {error}
        {copied}
        onCopy={handleCopy}
      />
    </div>

    {#if isStreaming}
      <StreamingIndicator />
    {/if}
  </section>

  <TranslationHistory
    {history}
    onLoadEntry={loadFromHistory}
  />
</main>

<style>
  :root {
    --bg-primary: #f8fafc;
    --bg-secondary: #f1f5f9;
    --bg-card: #ffffff;
    --bg-card-hover: #f8fafc;
    --bg-input: #ffffff;
    --border: #e2e8f0;
    --border-focus: #4f46e5;
    --text-primary: #0f172a;
    --text-secondary: #475569;
    --text-muted: #94a3b8;
    --accent: #4f46e5;
    --accent-hover: #4338ca;
    --accent-glow: rgba(79, 70, 229, 0.1);
    --danger: #ef4444;
    --success: #22c55e;
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.05);
    --shadow-glow: 0 0 30px rgba(79, 70, 229, 0.08);
    --transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .app {
    max-width: 960px;
    margin: 0 auto;
    padding: 32px 20px 64px;
    min-height: 100vh;
    color: var(--text-primary);
  }

  .app-header {
    text-align: center;
    margin-bottom: 36px;
  }

  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  .logo-icon {
    width: 32px;
    height: 32px;
    color: var(--accent);
  }

  .logo h1 {
    font-size: 1.75rem;
    font-weight: 700;
    background: linear-gradient(135deg, var(--accent), var(--accent-hover));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
  }

  .subtitle {
    font-size: 0.85rem;
    color: var(--text-muted);
    font-weight: 400;
    letter-spacing: 0.02em;
    margin: 0;
  }

  .translator-container {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card), var(--shadow-glow);
    overflow: hidden;
  }

  .panels {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 640px) {
    .app {
      padding: 20px 12px 48px;
    }

    .panels {
      grid-template-columns: 1fr;
    }

    .logo h1 {
      font-size: 1.3rem;
    }
  }
</style>
