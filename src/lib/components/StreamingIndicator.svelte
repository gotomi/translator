<div class="streaming-bar" aria-live="polite" aria-label="Translating">
  <div class="streaming-dots">
    <span class="dot"></span>
    <span class="dot"></span>
    <span class="dot"></span>
  </div>
  <span class="streaming-label">Translating...</span>
</div>

<style>
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
</style>
