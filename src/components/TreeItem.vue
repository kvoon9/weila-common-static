<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PageNode, TreeNode, TreeStructure } from '~/shared/page-tree'
import PageTree from './PageTree.vue'

interface Props {
  name: string
  item: TreeNode
  path?: string
}

const props = defineProps<Props>()

const isOpen = ref(true)

const currentPath = computed(() => {
  return props.path ? `${props.path}/${props.name}` : props.name
})

const page = computed(() => props.item.type === 'page' ? props.item as PageNode : null)

/** 语言徽标:多语言文档显示其实际存在的语言,单语页不显示 */
const langBadges = computed(() => page.value?.langs ?? [])

function toggleFolder(event: Event) {
  // 阻止默认行为,让我们自己控制展开/折叠
  event.preventDefault()
  isOpen.value = !isOpen.value
}

const base = import.meta.env.BASE_URL
</script>

<template>
  <div class="tree-item">
    <!-- 页面项:文案用文章标题 -->
    <div v-if="page" class="page-item">
      <a :href="`${base}/${page.path}`" class="page-link">
        <span class="page-title">{{ page.title }}</span>
        <span v-if="langBadges.length" class="lang-badges">
          <span v-for="lang in langBadges" :key="lang" class="lang-badge">{{ lang }}</span>
        </span>
      </a>
    </div>

    <!-- 文件夹项 -->
    <div v-else-if="item.type === 'folder'" class="folder-item">
      <details :open="isOpen" class="folder-details">
        <summary class="folder-summary" @click="toggleFolder">
          <span class="folder-icon">
            {{ isOpen ? '📂' : '📁' }}
          </span>
          <span class="folder-name">{{ name }}</span>
          <span v-if="item.count" class="folder-count">{{ item.count }}</span>
        </summary>
        <div class="folder-content">
          <PageTree :tree="item.children" :path="currentPath" />
        </div>
      </details>
    </div>
  </div>
</template>

<style scoped>
.tree-item {
  @apply my-1;
}

.page-item {
  @apply ml-4;
}

.page-link {
  @apply px-3 py-2 text-gray-700 no-underline rounded border border-transparent
         transition-all duration-200 hover:bg-gray-100 hover:text-gray-900
         flex items-center gap-3;
}

.page-title {
  @apply flex-1 min-w-0 truncate;
}

.lang-badges {
  @apply flex shrink-0 items-center gap-1 whitespace-nowrap;
}

.lang-badge {
  @apply px-1.5 py-0.5 text-gray-400 text-xs leading-none rounded
         bg-gray-50 border border-gray-200;
}

.folder-details {
  @apply my-1;
}

.folder-summary {
  @apply cursor-pointer px-3 py-2 rounded flex items-center gap-2
         font-medium hover:bg-gray-100 transition-colors duration-200
         select-none;
  list-style: none;
}

.folder-summary::-webkit-details-marker {
  display: none;
}

.folder-icon {
  @apply text-base;
}

.folder-name {
  @apply shrink-0;
}

.folder-count {
  @apply shrink-0 px-1.5 py-0.5 text-gray-400 text-xs leading-none rounded bg-gray-100;
}

.folder-content {
  @apply ml-6 border-l-2 border-gray-200 pl-4 my-1;
}
</style>
