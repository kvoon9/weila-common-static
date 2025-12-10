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
  <div ref="dropdownRef" class="fixed top-4 right-4 z-50">
    <!-- 下拉按钮 -->
    <button
      type="button"
      class="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 hover:shadow-lg transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      @click="toggleDropdown"
      :aria-expanded="isOpen"
      aria-label="导航菜单"
    >
      <span class="text-lg">📄</span>
      <span class="font-medium text-gray-700">Docs</span>
      <span class="text-xs transition-transform duration-200" :style="{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }">▼</span>
    </button>

    <!-- 下拉菜单 -->
    <div
      v-if="isOpen"
      absolute right-0
      :style="{ animation: 'fade-in 0.2s ease-out' }"
    >
      <ul >
        <li
          v-for="item in navigation"
          :key="item.url"
          class="bg-neutral-50 border-b border-gray-100 last:border-b-0"
        >
          <a
            :href="`${base}${item.url}`"
            class="flex items-center gap-2 px-4 py-3 text-gray-700 no-underline transition-colors duration-150 hover:bg-gray-50 hover:text-gray-900 w-full text-left whitespace-nowrap"
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
</style>
