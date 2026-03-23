<script lang="ts">
  interface Props {
    sourceText: string;
    maxChars: number;
    isStreaming: boolean;
    onTranslate: () => void;
    onClear: () => void;
  }

  let {
    sourceText = $bindable(),
    maxChars,
    isStreaming,
    onTranslate,
    onClear,
  }: Props = $props();

  const charCount = $derived(sourceText.length);
  const isOverLimit = $derived(charCount > maxChars);
</script>

<div class="panel source-panel">
  <div class="panel-content">
    <textarea
      class="text-area"
      bind:value={sourceText}
      placeholder="Enter text to translate..."
      maxlength={maxChars}
      aria-label="Source text input"
      rows="8"
    ></textarea>
  </div>
  <div class="panel-footer">
    <span class="char-count" class:over-limit={isOverLimit}>
      {charCount.toLocaleString()} / {maxChars.toLocaleString()}
    </span>
    <div class="panel-actions">
      {#if sourceText}
        <button class="icon-btn" onclick={onClear} aria-label="Clear input" title="Clear">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      {/if}
      <button
        class="translate-btn"
        onclick={onTranslate}
        disabled={!sourceText.trim() || isStreaming || isOverLimit}
        aria-label="Translate"
      >
        Translate
      </button>
    </div>
  </div>
</div>

<style>
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

  @media (max-width: 640px) {
    .source-panel {
      border-right: none;
      border-bottom: 1px solid var(--border);
    }
  }
</style>
