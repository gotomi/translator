<script lang="ts">
  interface Props {
    translatedText: string;
    isStreaming: boolean;
    error: string;
    copied: boolean;
    onCopy: () => void;
  }

  let {
    translatedText,
    isStreaming,
    error,
    copied,
    onCopy,
  }: Props = $props();
</script>

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
          onclick={onCopy}
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

<style>
  .panel {
    display: flex;
    flex-direction: column;
  }

  .panel-content {
    padding: 16px 20px;
    flex: 1;
    min-height: 200px;
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

  .panel-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-top: 1px solid var(--border);
    background: var(--bg-secondary);
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
</style>
