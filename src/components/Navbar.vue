<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ThemeToggle from '@/components/ThemeToggle.vue'

defineOptions({
  name: 'MainNavbar',
})

const route = useRoute()
const menuOpen = ref(false)
const isScrolled = ref(false)

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/fixtures', label: 'Fixtures' },
  { to: '/players', label: 'Players' },
  { to: '/league-live', label: 'Premier League' },
]

const handleScroll = () => {
  isScrolled.value = window.scrollY > 8
}

const closeMenu = () => {
  menuOpen.value = false
}

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  document.body.style.overflow = ''
})

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)

watch(menuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})
</script>

<template>
  <header :class="['navbar', { scrolled: isScrolled, 'menu-open': menuOpen }]">
    <div class="navbar-inner">
      <RouterLink to="/" class="brand" aria-label="Go to homepage" @click="closeMenu">
        <img
          class="crest-logo"
          src="/Manchester_United_FC_crest.svg.png"
          alt="Manchester United crest"
        />
        <div class="brand-copy">
          <h1>Manchester United</h1>
          <p>Official Dashboard</p>
        </div>
      </RouterLink>

      <nav class="desktop-nav" aria-label="Main navigation">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
        >
          {{ item.label }}
        </RouterLink>
        <ThemeToggle />
      </nav>

      <div class="mobile-actions">
        <ThemeToggle />
        <button
          class="menu-toggle"
          type="button"
          :aria-expanded="menuOpen"
          aria-controls="mobile-menu"
          aria-label="Toggle navigation menu"
          @click="menuOpen = !menuOpen"
        >
          <span class="menu-toggle-lines" :class="{ open: menuOpen }">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>
    </div>

    <Transition name="mobile-nav">
      <div v-if="menuOpen" id="mobile-menu" class="mobile-nav">
        <button class="mobile-backdrop" type="button" aria-label="Close menu" @click="closeMenu" />
        <div class="mobile-panel">
          <p class="mobile-panel-title">Menu</p>
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="mobile-link"
            @click="closeMenu"
          >
            {{ item.label }}
          </RouterLink>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 60;
  background: linear-gradient(135deg, #da020e 0%, #b80000 48%, #8f0000 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  transition:
    box-shadow 0.3s ease,
    border-color 0.3s ease;
}

.navbar::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 12% 0%, rgba(255, 255, 255, 0.18), transparent 42%),
    radial-gradient(circle at 88% 100%, rgba(0, 0, 0, 0.22), transparent 40%);
  pointer-events: none;
}

.navbar.scrolled {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.28);
  border-color: rgba(255, 255, 255, 0.2);
}

.navbar-inner {
  position: relative;
  z-index: 2;
  width: min(1180px, 100%);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.72rem 1rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  text-decoration: none;
  color: inherit;
  min-width: 0;
}

.crest-logo {
  width: 2.65rem;
  height: 2.65rem;
  object-fit: contain;
  display: block;
  flex-shrink: 0;
}

.brand-copy {
  min-width: 0;
}

h1 {
  font-size: clamp(0.9rem, 2.8vw, 1rem);
  font-weight: 800;
  line-height: 1.1;
  color: #ffffff;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brand-copy p {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.82);
  font-weight: 500;
}

.desktop-nav {
  display: none;
  align-items: center;
  gap: 0.35rem;
}

.nav-link {
  text-decoration: none;
  color: rgba(255, 255, 255, 0.92);
  font-weight: 600;
  font-size: 0.88rem;
  padding: 0.48rem 0.8rem;
  border-radius: 999px;
  border: 1px solid transparent;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.2);
}

.nav-link.router-link-exact-active {
  background: #ffffff;
  color: #b80000;
  border-color: #ffffff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16);
}

.mobile-actions {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.menu-toggle {
  width: 2.55rem;
  height: 2.55rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(0, 0, 0, 0.18);
  color: #ffffff;
  display: grid;
  place-items: center;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.menu-toggle:hover {
  background: rgba(0, 0, 0, 0.28);
  border-color: rgba(255, 255, 255, 0.42);
}

.menu-toggle-lines {
  width: 1.1rem;
  height: 0.85rem;
  position: relative;
  display: block;
}

.menu-toggle-lines span {
  position: absolute;
  left: 0;
  width: 100%;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
  transition:
    transform 0.25s ease,
    top 0.25s ease,
    opacity 0.2s ease;
}

.menu-toggle-lines span:nth-child(1) {
  top: 0;
}

.menu-toggle-lines span:nth-child(2) {
  top: 0.42rem;
}

.menu-toggle-lines span:nth-child(3) {
  top: 0.84rem;
}

.menu-toggle-lines.open span:nth-child(1) {
  top: 0.42rem;
  transform: rotate(45deg);
}

.menu-toggle-lines.open span:nth-child(2) {
  opacity: 0;
}

.menu-toggle-lines.open span:nth-child(3) {
  top: 0.42rem;
  transform: rotate(-45deg);
}

.mobile-nav {
  position: fixed;
  inset: 0;
  z-index: 1;
  display: grid;
  grid-template-rows: auto 1fr;
}

.mobile-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(3px);
  cursor: pointer;
}

.mobile-panel {
  position: relative;
  margin-top: calc(4.1rem + env(safe-area-inset-top, 0px));
  margin-inline: 0.75rem;
  padding: 0.85rem;
  border-radius: 1rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
  display: grid;
  gap: 0.35rem;
  max-height: calc(100vh - 5.5rem);
  overflow: auto;
}

.mobile-panel-title {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  padding: 0.2rem 0.55rem 0.45rem;
}

.mobile-link {
  text-decoration: none;
  color: var(--color-text);
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.72rem 0.8rem;
  border-radius: 0.75rem;
  border: 1px solid transparent;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.mobile-link:hover {
  background: var(--color-surface-elevated);
  border-color: var(--color-border);
}

.mobile-link.router-link-exact-active {
  background: rgba(199, 1, 1, 0.12);
  border-color: rgba(199, 1, 1, 0.35);
  color: var(--color-accent);
}

.mobile-nav-enter-active,
.mobile-nav-leave-active {
  transition: opacity 0.22s ease;
}

.mobile-nav-enter-active .mobile-panel,
.mobile-nav-leave-active .mobile-panel {
  transition: transform 0.24s ease, opacity 0.24s ease;
}

.mobile-nav-enter-from,
.mobile-nav-leave-to {
  opacity: 0;
}

.mobile-nav-enter-from .mobile-panel,
.mobile-nav-leave-to .mobile-panel {
  transform: translateY(-10px);
  opacity: 0;
}

@media (min-width: 900px) {
  .mobile-actions {
    display: none;
  }

  .desktop-nav {
    display: flex;
  }

  .navbar-inner {
    padding: 0.82rem 1.25rem;
  }
}

@media (max-width: 420px) {
  .brand-copy p {
    display: none;
  }
}
</style>
