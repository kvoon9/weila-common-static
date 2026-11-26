<script setup lang="ts">
// 「复制 Markdown + 打开编辑器」联合按钮:主体复制当前语言的源码,
// 右侧箭头展开抽屉,提供「打开编辑器」入口(带 ?file= 深链)。
// 多语言页按 <html lang> 取当前语言;单语页传一个条目即可。
import { copyText } from '~/shared/copy'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

export interface CopySource {
  /** Markdown 源码 */
  markdown: string
  /** 编辑器里的文件 id,如 intl/ios/personal/privacy/zh-CN.md */
  editorPath: string
}

const props = defineProps<{ sources: Record<string, CopySource> }>()

const lang = ref('')
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

const currentEntry = computed<CopySource | null>(() => {
  const entry = props.sources[lang.value]
  if (entry) return entry
  return Object.values(props.sources)[0] ?? null
})

const editorHref = computed(() => {
  const base = import.meta.env.BASE_URL
  const path = currentEntry.value?.editorPath
  return path ? `${base}/editor/?file=${encodeURIComponent(path)}` : `${base}/editor/`
})

// <html lang> 由各页面的语言切换逻辑维护,这里跟随它取当前语言的源码
let langObserver: MutationObserver | undefined

async function copy() {
  const markdown = currentEntry.value?.markdown
  if (markdown == null) return

  if (await copyText(markdown)) {
    copied.value = true
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

function onDocClick(event: MouseEvent) {
  if (open.value && root.value && !root.value.contains(event.target as Node)) open.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}

onMounted(() => {
  lang.value = document.documentElement.lang
  langObserver = new MutationObserver(() => {
    lang.value = document.documentElement.lang
  })
  langObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })

  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  clearTimeout(copiedTimer)
  langObserver?.disconnect()
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div v-if="currentEntry" ref="root" class="copy-edit-group">
    <button type="button" class="copy-btn" :class="{ copied }" @click="copy">
      {{ copied ? '已复制' : '复制 Markdown' }}
    </button>

    <button
      type="button"
      class="menu-trigger"
      :aria-expanded="open"
      aria-haspopup="menu"
      aria-label="更多操作"
      @click="open = !open"
    >
      <svg class="chevron" :class="{ open }" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <path
          d="M2 3.5L5 6.5L8 3.5"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <div v-if="open" class="menu" role="menu">
      <a :href="editorHref" role="menuitem" class="menu-item" @click="open = false"> 打开编辑器 </a>
    </div>
  </div>
</template>

<style scoped>
.copy-edit-group {
  position: relative;
  display: inline-flex;
  overflow: visible;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  background: #fff;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.copy-btn {
  padding: 0.375rem 0.875rem;
  border: 0;
  border-right: 1px solid #e5e7eb;
  border-radius: 9999px 0 0 9999px;
  background: #fff;
  color: #4b5563;
  font-size: 0.875rem;
  line-height: 1.25rem;
  white-space: nowrap;
  cursor: pointer;
}

.copy-btn:hover {
  background: #f9fafb;
  color: #111827;
}

.copy-btn.copied {
  color: #059669;
}

.menu-trigger {
  display: flex;
  align-items: center;
  padding: 0 0.625rem;
  border: 0;
  border-radius: 0 9999px 9999px 0;
  background: #fff;
  color: #4b5563;
  cursor: pointer;
}

.menu-trigger:hover {
  background: #f9fafb;
  color: #111827;
}

.chevron {
  transition: transform 0.15s ease;
}

.chevron.open {
  transform: rotate(180deg);
}

/* 只在键盘操作时显示 focus 环,鼠标点开抽屉不画蓝圈 */
.copy-edit-group:has(:focus-visible) {
  outline: 2px solid #3b82f6;
  outline-offset: 1px;
}

.menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 60;
  padding: 0.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  background: #fff;
  box-shadow:
    0 10px 15px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -4px rgb(0 0 0 / 0.1);
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  color: #374151;
  font-size: 0.8125rem;
  line-height: 1.25rem;
  text-align: center;
  white-space: nowrap;
  text-decoration: none;
}

.menu-item:hover,
.menu-item:focus-visible {
  background: #f3f4f6;
  color: #111827;
  outline: none;
}
</style>
