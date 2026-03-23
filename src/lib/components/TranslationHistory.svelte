<script lang="ts">
  import type { TranslationEntry } from '$lib/types';

  interface Props {
    history: TranslationEntry[];
    onLoadEntry: (entry: TranslationEntry) => void;
  }

  let { history, onLoadEntry }: Props = $props();

  function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
</script>

{#if history.length > 0}
  <section class="history-section" aria-label="Translation history">
    <h2 class="history-title">Recent Translations</h2>
    <div class="history-list">
      {#each history as entry (entry.id)}
        <button class="history-item" onclick={() => onLoadEntry(entry)} aria-label="Load previous translation">
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

<style>
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
</style>
