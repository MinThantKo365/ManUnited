<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

defineOptions({
  name: 'ThemeToggle',
})

const { theme, toggleTheme } = useTheme()

const isDark = () => theme.value === 'dark'
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :class="{ light: !isDark() }"
    :aria-label="isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="toggleTheme"
  >
    <span class="track">
      <span class="icon sun" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="4.25" stroke="currentColor" stroke-width="1.75" />
          <path
            d="M12 3v2M12 19v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M3 12h2M19 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
          />
        </svg>
      </span>
      <span class="icon moon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M20 14.5A7.5 7.5 0 0 1 9.5 4 6.5 6.5 0 1 0 20 14.5Z"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linejoin="round"
          />
        </svg>
      </span>
      <span class="thumb" />
    </span>
    <span class="label">{{ isDark() ? 'Light' : 'Dark' }}</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(0, 0, 0, 0.18);
  color: #ffffff;
  border-radius: 999px;
  padding: 0.28rem 0.55rem 0.28rem 0.3rem;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition:
    background-color 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.2s ease;
}

.theme-toggle:hover {
  background: rgba(0, 0, 0, 0.28);
  border-color: rgba(255, 255, 255, 0.45);
  transform: translateY(-1px);
}

.theme-toggle:active {
  transform: translateY(0);
}

.track {
  position: relative;
  width: 3.1rem;
  height: 1.65rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.22);
}

.icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.72);
  transition: color 0.25s ease, opacity 0.25s ease;
}

.icon svg {
  width: 0.95rem;
  height: 0.95rem;
}

.icon.sun {
  left: 0.34rem;
}

.icon.moon {
  right: 0.34rem;
}

.thumb {
  position: absolute;
  top: 0.16rem;
  left: 0.16rem;
  width: 1.33rem;
  height: 1.33rem;
  border-radius: 999px;
  background: linear-gradient(145deg, #ffffff, #f3f4f6);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-toggle.light .thumb {
  transform: translateX(1.45rem);
}

.theme-toggle.light .icon.sun {
  color: #f59e0b;
  opacity: 1;
}

.theme-toggle:not(.light) .icon.moon {
  color: #e2e8f0;
  opacity: 1;
}

.theme-toggle.light .icon.moon,
.theme-toggle:not(.light) .icon.sun {
  opacity: 0.45;
}

.label {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  min-width: 2.1rem;
  text-align: left;
}

@media (max-width: 899px) {
  .label {
    display: none;
  }

  .theme-toggle {
    padding: 0.28rem;
  }
}
</style>
