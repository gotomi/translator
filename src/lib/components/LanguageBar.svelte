<script lang="ts">
  import type { Language } from '$lib/types';

  interface Props {
    sourceLanguages: Language[];
    targetLanguages: Language[];
    selectedSourceLang: Language;
    selectedTargetLang: Language;
    detectedLang: string;
    onSwap: () => void;
  }

  let {
    sourceLanguages,
    targetLanguages,
    selectedSourceLang = $bindable(),
    selectedTargetLang = $bindable(),
    detectedLang,
    onSwap,
  }: Props = $props();
</script>

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
    onclick={onSwap}
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

<style>
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
</style>
