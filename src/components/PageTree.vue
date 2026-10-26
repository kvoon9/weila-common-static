<script setup lang="ts">
import type { TreeStructure } from '~/shared/page-tree'
import { computed } from 'vue'
import TreeItem from './TreeItem.vue'

interface Props {
  tree: TreeStructure
  path?: string
}

const props = defineProps<Props>()

// 排序:目录在前、页面在后;同类型按展示文案排序
// (目录用汉化显示名,页面比文章标题;都按中文/英文的自然顺序)
const sortedEntries = computed(() => {
  return Object.entries(props.tree).sort(([nameA, a], [nameB, b]) => {
    if (a.type === 'folder' && b.type === 'page')
      return -1
    if (a.type === 'page' && b.type === 'folder')
      return 1

    const labelA = a.type === 'page' ? a.title : (a.label ?? nameA)
    const labelB = b.type === 'page' ? b.title : (b.label ?? nameB)
    return labelA.localeCompare(labelB, 'zh-Hans-CN')
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
