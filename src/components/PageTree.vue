<script setup lang="ts">
import { computed } from 'vue'
import TreeItem from './TreeItem.vue'

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
  tree: TreeStructure
  path?: string
}

const props = defineProps<Props>()

// 排序函数：文件夹在前，页面在后，按名称排序
const sortedEntries = computed(() => {
  const entries = Object.entries(props.tree)

  return entries.sort(([nameA, itemA], [nameB, itemB]) => {
    // 先按类型排序：文件夹在前，页面在后
    if (itemA.type === 'folder' && itemB.type === 'page') return -1
    if (itemA.type === 'page' && itemB.type === 'folder') return 1

    // 同类型按名称排序
    return nameA.localeCompare(nameB)
  })
})
</script>

<style scoped>
.page-tree {
  @apply space-y-1;
}
</style>

<template>
  <div class="page-tree">
    <TreeItem
      v-for="[name, item] in sortedEntries"
      :key="name"
      :name="name"
      :item="item"
      :path="path"
    />
  </div>
</template>
