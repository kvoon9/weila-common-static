<script setup lang="ts">
import { ref, computed } from 'vue'
import PageTree from './PageTree.vue'

interface PageItem {
  type: 'page'
  path: string
}

interface FolderItem {
  type: 'folder'
  children: TreeStructure
}

type TreeStructure = Record<string, PageItem | FolderItem>

interface Props {
  name: string
  item: PageItem | FolderItem
  path?: string
}

const props = defineProps<Props>()

const isOpen = ref(true)

const currentPath = computed(() => {
  return props.path ? `${props.path}/${props.name}` : props.name
})

function toggleFolder(event: Event) {
  // 阻止默认行为，让我们自己控制展开/折叠
  event.preventDefault()
  isOpen.value = !isOpen.value
}

function getItemCount(tree: TreeStructure): number {
  return Object.keys(tree).length
}

const base = import.meta.env.BASE_URL
</script>


<template>
  <div class="tree-item">
    <!-- 页面项 -->
    <div v-if="item.type === 'page'" class="page-item">
      <a
        :href="`${base}/${item.path}`"
        class="page-link"
      >
        <span class="page-icon">📄</span>
        {{ name }} {{ `${base}/${item.path}` }}
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
          <span class="folder-count">
            ({{ getItemCount(item.children) }})
          </span>
        </summary>
        <div class="folder-content">
          <PageTree
            :tree="item.children"
            :path="currentPath"
          />
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
  @apply block px-3 py-2 text-gray-700 no-underline rounded border border-transparent
         transition-all duration-200 hover:bg-gray-100 hover:text-gray-900
         flex items-center gap-2;
}

.page-icon {
  @apply text-base;
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
  @apply flex-1;
}

.folder-count {
  @apply text-gray-500 text-sm;
}

.folder-content {
  @apply ml-6 border-l-2 border-gray-200 pl-4 my-1;
}
</style>
