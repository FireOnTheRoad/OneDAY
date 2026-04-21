<template>
  <div
    class="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm hover:shadow-lg hover:translate-y-[-2px] transition-all cursor-pointer border border-transparent hover:border-primary/20"
    @click="$emit('click', project.id)"
  >
    <div class="flex items-start justify-between mb-3">
      <div class="flex items-center gap-3">
        <h3 class="text-lg font-bold text-on-surface">{{ project.name }}</h3>
        <span
          :class="[
            'px-2 py-0.5 rounded-full text-xs font-medium',
            statusClasses[project.status] || statusClasses.active
          ]"
        >
          {{ statusLabels[project.status] }}
        </span>
      </div>
      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          class="p-1.5 hover:bg-outline-variant/10 rounded-lg transition-colors"
          @click.stop="$emit('edit', project)"
        >
          <span class="material-symbols-outlined text-lg">edit</span>
        </button>
        <button
          class="p-1.5 hover:bg-error/10 text-error rounded-lg transition-colors"
          @click.stop="$emit('delete', project)"
        >
          <span class="material-symbols-outlined text-lg">delete</span>
        </button>
      </div>
    </div>

    <p class="text-sm text-on-surface-variant mb-4 line-clamp-2">{{ project.description || '暂无描述' }}</p>

    <div class="mb-3">
      <div class="flex items-center justify-between text-xs text-on-surface-variant mb-1">
        <span>进度</span>
        <span>{{ progress.completionRate }}%</span>
      </div>
      <div class="h-2 bg-outline-variant/20 rounded-full overflow-hidden">
        <div
          class="h-full bg-primary rounded-full transition-all"
          :style="{ width: progress.completionRate + '%' }"
        ></div>
      </div>
    </div>

    <div class="flex items-center justify-between">
      <div class="flex flex-wrap gap-1">
        <span
          v-for="(tag, index) in visibleTags"
          :key="index"
          class="px-2 py-0.5 bg-tertiary-container text-on-tertiary-container text-xs rounded-md"
        >
          {{ tag }}
        </span>
        <span
          v-if="project.tags.length > 3"
          class="px-2 py-0.5 bg-outline-variant/10 text-on-surface-variant text-xs rounded-md"
        >
          +{{ project.tags.length - 3 }}
        </span>
      </div>
      <div class="flex items-center gap-2 text-xs text-on-surface-variant">
        <span
          :class="priorityClasses[project.priority]"
          class="material-symbols-outlined text-sm"
        >
          {{ priorityIcons[project.priority] }}
        </span>
        <span>{{ formattedUpdateTime }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  project: {
    type: Object,
    required: true
  },
  progress: {
    type: Object,
    default: () => ({ completionRate: 0 })
  }
})

defineEmits(['click', 'edit', 'delete'])

const statusLabels = {
  active: '进行中',
  paused: '已暂停',
  completed: '已完成',
  archived: '已归档'
}

const statusClasses = {
  active: 'bg-success/10 text-success',
  paused: 'bg-warning/10 text-warning',
  completed: 'bg-primary/10 text-primary',
  archived: 'bg-outline-variant/10 text-on-surface-variant'
}

const priorityIcons = {
  high: 'priority_high',
  medium: 'star',
  low: 'priority_low'
}

const priorityClasses = {
  high: 'text-error',
  medium: 'text-warning',
  low: 'text-success'
}

const visibleTags = computed(() => {
  return props.project.tags.slice(0, 3)
})

const formattedUpdateTime = computed(() => {
  if (!props.project.updatedAt) return ''
  const date = new Date(props.project.updatedAt)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
