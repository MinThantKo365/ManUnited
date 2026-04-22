<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import Navbar from './components/Navbar.vue'
import { useTheme } from './composables/useTheme'

const { initializeTheme } = useTheme()
const currentYear = new Date().getFullYear()

onMounted(() => {
  initializeTheme()
})
</script>
<style scoped>
.footer-link {
  color: #ffffff;
  text-decoration: none;
  font-weight: 600;
}

.footer-link a {
  color: #ffffff;
  text-decoration: none;
  font-weight: 600;
}
</style>
<template>
  <div class="app-shell">
    <Navbar />
    <main class="content">
      <RouterView v-slot="{ Component }">
        <Transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <footer class="site-footer">
      <p>Developed by <span class="footer-link"> <a href="https://github.com/MinThantKo365" target="_blank"
            rel="noopener noreferrer">MinThantKo365</a></span> </p>
    </footer>

  </div>

</template>
