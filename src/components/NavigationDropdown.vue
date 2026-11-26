<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { NavigationItem } from '~/shared/const'

interface Props {
  navigation: NavigationItem[]
}

const props = defineProps<Props>()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

function handleEscapeKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscapeKey)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscapeKey)
})

const base = import.meta.env.BASE_URL
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <!-- 下拉按钮(与复制/编辑器按钮同规格:2.25rem 高的胶囊) -->
    <button
      type="button"
      class="nav-trigger flex items-center gap-2 px-3 py-0 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 hover:shadow-lg transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 h-9 text-sm"
      @click="toggleDropdown"
      :aria-expanded="isOpen"
      aria-label="导航菜单"
    >
      <span class="text-gray-500 text-sm">📄</span>
      <span class="text-gray-600">Docs</span>
      <span
        class="text-gray-400 text-xs transition-transform duration-200"
        :style="{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }"
        >▼</span
      >
    </button>

    <!-- 下拉菜单 -->
    <div v-if="isOpen" absolute right-0 :style="{ animation: 'fade-in 0.2s ease-out' }">
      <ul>
        <li
          v-for="item in navigation"
          :key="item.url"
          class="nav-item bg-neutral-50 border-b border-gray-100 last:border-b-0"
        >
          <a
            :href="`${base}${item.url}`"
            class="nav-item-link flex items-center gap-2 px-4 py-3 text-gray-700 no-underline transition-colors duration-150 hover:bg-gray-50 hover:text-gray-900 w-full text-left whitespace-nowrap"
            @click="closeDropdown"
          >
            <span class="text-gray-400 text-sm">→</span>
            <span class="flex-1">{{ item.name }}</span>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<style>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 深色模式:文档页 body 由 github-markdown-css 切到暗色,Docs 菜单跟随 */
@media (prefers-color-scheme: dark) {
  .nav-trigger {
    background: #0d1117;
    border-color: #30363d;
  }

  .nav-trigger:hover {
    background: #161b22;
  }

  .nav-trigger .text-gray-600 {
    color: #c9d1d9;
  }

  .nav-item {
    background: #161b22;
    border-color: #21262d;
  }

  .nav-item-link {
    color: #c9d1d9;
  }

  .nav-item-link:hover {
    background: #21262d;
    color: #f0f6fc;
  }
}
</style>
