import { computed, ref } from 'vue'

type ThemeMode = 'dark' | 'light'

const THEME_KEY = 'manu-theme-mode'
const theme = ref<ThemeMode>('dark')
const initialized = ref(false)

const applyTheme = (mode: ThemeMode) => {
  theme.value = mode
  document.documentElement.setAttribute('data-theme', mode)
  localStorage.setItem(THEME_KEY, mode)
}

const initializeTheme = () => {
  if (initialized.value) return
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'dark' || stored === 'light') {
    applyTheme(stored)
  } else {
    applyTheme('dark')
  }
  initialized.value = true
}

const toggleTheme = () => {
  applyTheme(theme.value === 'dark' ? 'light' : 'dark')
}

export const useTheme = () => ({
  theme: computed(() => theme.value),
  initializeTheme,
  toggleTheme,
})
