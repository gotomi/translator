<script lang="ts">
  import { sourceLanguages, targetLanguages } from '$lib/languages';
  import type { Language, TranslationEntry } from '$lib/types';
  import { debounce } from '$lib/utils/debounce';
  import { copyToClipboard } from '$lib/utils/clipboard';

  const MAX_CHARS = 5000;
  const MAX_HISTORY = 5;

  let sourceText = $state('');
  let translatedText = $state('');
  let selectedSourceLang = $state<Language>(sourceLanguages[0]); // Auto-detect
  let selectedTargetLang = $state<Language>(targetLanguages[1]); // English
  let isStreaming = $state(false);
  let error = $state('');
  let detectedLang = $state('');
  let history = $state<TranslationEntry[]>([]);
  let copied = $state(false);
  let abortController = $state<AbortController | null>(null);

  const charCount = $derived(sourceText.length);
  const isOverLimit = $derived(charCount > MAX_CHARS);

  const debouncedTranslate = debounce(() => {
    if (sourceText.trim()) {
      translate();
    }
  }, 600);

  $effect(() => {
    // Track sourceText changes for debounced auto-translate
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

    // Cancel any in-flight request
    if (abortController) {
      abortController.abort();
    }

    abortController = new AbortController();
    isStreaming = true;
    error = '';
    translatedText = '';
    detectedLang = '';

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          sourceLang: selectedSourceLang.code,
          targetLang: selectedTargetLang.label,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Translation failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        // Parse detected language from the first line if auto-detect
        if (selectedSourceLang.code === 'auto' && fullText.startsWith('Detected:')) {
          const newlineIdx = fullText.indexOf('\n');
          if (newlineIdx !== -1) {
            detectedLang = fullText.substring('Detected:'.length, newlineIdx).trim();
            translatedText = fullText.substring(newlineIdx + 1).replace(/^\n+/, '');
          } else {
            translatedText = '';
          }
        } else {
          translatedText = fullText;
        }
      }

      // Clean up final text (strip Detected: header for display if auto-detect)
      if (selectedSourceLang.code === 'auto' && fullText.startsWith('Detected:')) {
        const newlineIdx = fullText.indexOf('\n');
        if (newlineIdx !== -1) {
          if (!detectedLang) {
            detectedLang = fullText.substring('Detected:'.length, newlineIdx).trim();
          }
          translatedText = fullText.substring(newlineIdx + 1).replace(/^\n+/, '');
        }
      }

      // Save to history
      if (translatedText.trim()) {
        const entry: TranslationEntry = {
          id: crypto.randomUUID(),
          sourceLang: { ...selectedSourceLang },
          targetLang: { ...selectedTargetLang },
          sourceText: sourceText.slice(0, 80),
          translatedText: translatedText.slice(0, 80),
          detectedLang: detectedLang || undefined,
          timestamp: Date.now(),
        };
        history = [entry, ...history.slice(0, MAX_HISTORY - 1)];
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Silently ignore aborted requests
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

  function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
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
    <!-- Language Selectors Row -->
    <div class="language-bar">
      <div class="lang-select-wrapper">
        <label for="source-lang" class="sr-only">Source language</label>
        <select
          id="source-lang"
          class="lang-select"
          bind:value={selectedSourceLang}
          aria-label="Source language"
        >
          {#each sourceLanguages as lang}
            <option value={lang}>{lang.label}</option>
          {/each}
        </select>
        {#if detectedLang}
          <span class="detected-badge">Detected: {detectedLang}</span>
        {/if}
      </div>

      <button
        class="swap-btn"
        onclick={swapLanguages}
        disabled={selectedSourceLang.code === 'auto'}
        aria-label="Swap languages"
        title={selectedSourceLang.code === 'auto' ? 'Cannot swap with Auto-detect' : 'Swap languages'}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
          <path d="M7 16l-4-4m0 0l4-4m-4 4h18M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </button>

      <div class="lang-select-wrapper">
        <label for="target-lang" class="sr-only">Target language</label>
        <select
          id="target-lang"
          class="lang-select"
          bind:value={selectedTargetLang}
          aria-label="Target language"
        >
          {#each targetLanguages as lang}
            <option value={lang}>{lang.label}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Translation Panels -->
    <div class="panels">
      <!-- Source Panel -->
      <div class="panel source-panel">
        <div class="panel-content">
          <textarea
            class="text-area"
            bind:value={sourceText}
            placeholder="Enter text to translate..."
            maxlength={MAX_CHARS}
            aria-label="Source text input"
            rows="8"
          ></textarea>
        </div>
        <div class="panel-footer">
          <span class="char-count" class:over-limit={isOverLimit}>
            {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
          <div class="panel-actions">
            {#if sourceText}
              <button class="icon-btn" onclick={clearInput} aria-label="Clear input" title="Clear">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            {/if}
            <button
              class="translate-btn"
              onclick={translate}
              disabled={!sourceText.trim() || isStreaming || isOverLimit}
              aria-label="Translate"
            >
              Translate
            </button>
          </div>
        </div>
      </div>

      <!-- Target Panel -->
      <div class="panel target-panel">
        <div class="panel-content">
          {#if isStreaming}
            <div class="streaming-output">
              <p class="translated-text">{translatedText}<span class="cursor-blink">|</span></p>
            </div>
          {:else if error}
            <div class="error-message" role="alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4m0 4h.01" />
              </svg>
              <p>{error}</p>
            </div>
          {:else if translatedText}
            <p class="translated-text">{translatedText}</p>
          {:else}
            <p class="placeholder-text">Translation will appear here...</p>
          {/if}
        </div>
        <div class="panel-footer">
          <span></span>
          <div class="panel-actions">
            {#if translatedText && !isStreaming}
              <button
                class="icon-btn"
                onclick={handleCopy}
                aria-label="Copy translation"
                title="Copy to clipboard"
              >
                {#if copied}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                {:else}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                {/if}
              </button>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- Streaming indicator bar -->
    {#if isStreaming}
      <div class="streaming-bar" aria-live="polite" aria-label="Translating">
        <div class="streaming-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
        <span class="streaming-label">Translating...</span>
      </div>
    {/if}
  </section>

  <!-- Translation History -->
  {#if history.length > 0}
    <section class="history-section" aria-label="Translation history">
      <h2 class="history-title">Recent Translations</h2>
      <div class="history-list">
        {#each history as entry (entry.id)}
          <button class="history-item" onclick={() => loadFromHistory(entry)} aria-label="Load previous translation">
            <div class="history-langs">
              <span class="history-lang">{entry.detectedLang ?? entry.sourceLang.label}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <path d="M5 12h14m-7-7l7 7-7 7" />
              </svg>
              <span class="history-lang">{entry.targetLang.label}</span>
              <span class="history-time">{formatTime(entry.timestamp)}</span>
            </div>
            <p class="history-snippet">{entry.sourceText}{entry.sourceText.length >= 80 ? '…' : ''}</p>
          </button>
        {/each}
      </div>
    </section>
  {/if}
</main>

<style>
  /* ====== VARIABLES ====== */
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
    --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.05); /* Lighter shadow */
    --shadow-glow: 0 0 30px rgba(79, 70, 229, 0.08);
    --transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* ====== LAYOUT ====== */
  .app {
    max-width: 960px;
    margin: 0 auto;
    padding: 32px 20px 64px;
    min-height: 100vh;
    color: var(--text-primary);
  }

  /* ====== HEADER ====== */
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

  /* ====== TRANSLATOR CONTAINER ====== */
  .translator-container {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card), var(--shadow-glow);
    overflow: hidden;
  }

  /* ====== LANGUAGE BAR ====== */
  .language-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px 20px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
  }

  .lang-select-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .lang-select {
    width: 100%;
    padding: 10px 14px;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: border-color var(--transition);
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    padding-right: 32px;
  }

  .lang-select:hover,
  .lang-select:focus {
    border-color: var(--border-focus);
    outline: none;
  }

  .lang-select option {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  .detected-badge {
    white-space: nowrap;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--accent-hover);
    background: var(--accent-glow);
    padding: 4px 10px;
    border-radius: 20px;
    border: 1px solid rgba(99, 102, 241, 0.2);
  }

  .swap-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--border);
    border-radius: 50%;
    background: var(--bg-input);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--transition);
    flex-shrink: 0;
  }

  .swap-btn:hover:not(:disabled) {
    background: var(--accent-glow);
    border-color: var(--accent);
    color: var(--accent-hover);
    transform: rotate(180deg);
  }

  .swap-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  /* ====== PANELS ====== */
  .panels {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .panel {
    display: flex;
    flex-direction: column;
  }

  .source-panel {
    border-right: 1px solid var(--border);
  }

  .panel-content {
    padding: 16px 20px;
    flex: 1;
    min-height: 200px;
  }

  .text-area {
    width: 100%;
    min-height: 180px;
    background: transparent;
    border: none;
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
    font-size: 1rem;
    line-height: 1.6;
    resize: vertical;
    outline: none;
  }

  .text-area::placeholder {
    color: var(--text-muted);
  }

  .translated-text {
    font-size: 1rem;
    line-height: 1.6;
    color: var(--text-primary);
    white-space: pre-wrap;
    word-wrap: break-word;
    margin: 0;
  }

  .placeholder-text {
    color: var(--text-muted);
    font-size: 1rem;
    font-style: italic;
    margin: 0;
  }

  /* ====== PANEL FOOTER ====== */
  .panel-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-top: 1px solid var(--border);
    background: var(--bg-secondary);
  }

  .char-count {
    font-size: 0.8rem;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }

  .char-count.over-limit {
    color: var(--danger);
    font-weight: 600;
  }

  .panel-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--transition);
  }

  .icon-btn:hover {
    background: var(--accent-glow);
    border-color: var(--accent);
    color: var(--accent-hover);
  }

  .translate-btn {
    padding: 8px 20px;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: var(--radius-sm);
    font-family: 'Inter', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition);
  }

  .translate-btn:hover:not(:disabled) {
    background: var(--accent-hover);
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
  }

  .translate-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ====== STREAMING ====== */
  .streaming-output {
    position: relative;
  }

  .cursor-blink {
    animation: blink 1s step-end infinite;
    color: var(--accent);
    font-weight: 300;
  }

  @keyframes blink {
    50% { opacity: 0; }
  }

  .streaming-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 10px;
    background: linear-gradient(135deg, var(--accent-glow), transparent);
    border-top: 1px solid rgba(99, 102, 241, 0.15);
  }

  .streaming-dots {
    display: flex;
    gap: 4px;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
    animation: dotPulse 1.4s ease-in-out infinite;
  }

  .dot:nth-child(2) { animation-delay: 0.2s; }
  .dot:nth-child(3) { animation-delay: 0.4s; }

  @keyframes dotPulse {
    0%, 80%, 100% {
      transform: scale(0.6);
      opacity: 0.4;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .streaming-label {
    font-size: 0.8rem;
    color: var(--accent-hover);
    font-weight: 500;
  }

  /* ====== ERROR ====== */
  .error-message {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 14px 16px;
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: var(--radius-sm);
    color: #fca5a5;
  }

  .error-message svg {
    flex-shrink: 0;
    margin-top: 1px;
    color: var(--danger);
  }

  .error-message p {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  /* ====== HISTORY ====== */
  .history-section {
    margin-top: 32px;
  }

  .history-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 0 0 16px;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .history-item {
    display: block;
    width: 100%;
    text-align: left;
    padding: 14px 18px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition);
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
  }

  .history-item:hover {
    background: var(--bg-card-hover);
    border-color: var(--accent);
    box-shadow: var(--shadow-glow);
  }

  .history-langs {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .history-lang {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--accent-hover);
  }

  .history-langs svg {
    color: var(--text-muted);
  }

  .history-time {
    margin-left: auto;
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .history-snippet {
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.4;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ====== ACCESSIBILITY ====== */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  /* ====== RESPONSIVE ====== */
  @media (max-width: 640px) {
    .app {
      padding: 20px 12px 48px;
    }

    .language-bar {
      flex-direction: column;
      gap: 10px;
    }

    .lang-select-wrapper {
      width: 100%;
    }

    .swap-btn {
      transform: rotate(90deg);
    }

    .swap-btn:hover:not(:disabled) {
      transform: rotate(270deg);
    }

    .panels {
      grid-template-columns: 1fr;
    }

    .source-panel {
      border-right: none;
      border-bottom: 1px solid var(--border);
    }

    .logo h1 {
      font-size: 1.3rem;
    }
  }
</style>
