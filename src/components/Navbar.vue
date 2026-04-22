<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from '@/composables/useTheme'

defineOptions({
  name: 'MainNavbar',
})

const route = useRoute()
const menuOpen = ref(false)
const isScrolled = ref(false)
const { theme, toggleTheme } = useTheme()

const handleScroll = () => {
  isScrolled.value = window.scrollY > 8
}

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)
</script>

<template>
  <header :class="['navbar', { scrolled: isScrolled }]">
    <div class="navbar-inner">
      <RouterLink to="/" class="brand" aria-label="Go to homepage">
        <img class="crest-logo" src="/Manchester_United_FC_crest.svg.png" alt="Manchester United crest" />
        <div>
          <h1>Manchester United</h1>
          <p>Dashboard</p>
        </div>
      </RouterLink>

      <button class="menu-button" type="button" aria-label="Toggle menu" @click="menuOpen = !menuOpen">
        ☰
      </button>

      <nav :class="['menu', { open: menuOpen }]">
        <RouterLink to="/" class="nav-link">Home</RouterLink>
        <RouterLink to="/league-live" class="nav-link">League Live</RouterLink>
        <RouterLink to="/fixtures" class="nav-link">Fixtures</RouterLink>
        <RouterLink to="/players" class="nav-link">Players</RouterLink>
        <button class="theme-button" type="button" @click="toggleTheme">
          {{ theme === 'dark' ? 'Light' : 'Dark' }}
        </button>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 60;
  border-bottom: 1px solid transparent;
  background: #c70101;
  backdrop-filter: blur(10px);
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

[data-theme='light'] .navbar {
  background: #c70101;
}

.navbar.scrolled {
  border-color: var(--color-border);
  box-shadow: 0 6px 24px var(--shadow-color);
}

.navbar-inner {
  width: min(1180px, 100%);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.8rem 1rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  text-decoration: none;
  color: inherit;
}

.crest-logo {
  width: 2.4rem;
  height: 2.4rem;
  object-fit: contain;
  display: block;
}

h1 {
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.1;
  color: #ffffff;
}

p {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
}

.menu-button {
  border: 1px solid var(--color-border);
  background: var(--color-background-soft);
  color: var(--color-text);
  border-radius: 0.6rem;
  padding: 0.3rem 0.55rem;
  font-size: 1rem;
}

.menu {
  position: absolute;
  top: calc(100% + 0.35rem);
  right: 1rem;
  left: 1rem;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: 0.8rem;
  padding: 0.55rem;
  display: none;
  grid-template-columns: 1fr;
  gap: 0.45rem;
}

.menu.open {
  display: grid;
}

.nav-link {
  text-decoration: none;
  color: #ffffff;
  font-weight: 600;
  padding: 0.45rem 0.6rem;
  border-radius: 0.55rem;
}

.nav-link.router-link-exact-active {
  background: #ffffff;
  color: #c70101;
}

.theme-button {
  border: 1px solid var(--color-border);
  background: transparent;
  color: #ffffff;
  border-radius: 0.55rem;
  padding: 0.45rem 0.6rem;
}

@media (min-width: 900px) {
  .menu-button {
    display: none;
  }

  .menu {
    position: static;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    border: 0;
    background: transparent;
    padding: 0;
    gap: 0.45rem;
  }

  .nav-link {
    border: 1px solid transparent;
  }

  .nav-link:hover {
    border-color: var(--color-border-hover);
  }
}
</style>
