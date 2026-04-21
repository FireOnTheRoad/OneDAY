<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    @click.self="close"
  >
    <div class="bg-surface dark:bg-slate-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden">
      <div class="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
        <h2 class="text-xl font-bold text-on-surface">{{ isEdit ? '编辑项目' : '新建项目' }}</h2>
        <button
          class="p-2 hover:bg-outline-variant/10 rounded-lg transition-colors"
          @click="close"
        >
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
        <div>
          <label class="block text-sm font-medium text-on-surface mb-2">
            项目名称 <span class="text-error">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            placeholder="输入项目名称"
            class="w-full px-4 py-2.5 bg-surface-variant dark:bg-slate-700 border border-outline-variant/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface placeholder:text-on-surface-variant/50"
            maxlength="50"
            @input="errors.name = null"
          >
          <p v-if="errors.name" class="text-error text-xs mt-1">{{ errors.name }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-on-surface mb-2">项目描述</label>
          <textarea
            v-model="form.description"
            placeholder="输入项目描述（可选）"
            class="w-full px-4 py-2.5 bg-surface-variant dark:bg-slate-700 border border-outline-variant/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface placeholder:text-on-surface-variant/50 resize-none"
            rows="3"
            maxlength="200"
          ></textarea>
          <p class="text-on-surface-variant text-xs mt-1">{{ form.description.length }}/200</p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-on-surface mb-2">开始日期</label>
            <input
              v-model="form.startDate"
              type="date"
              class="w-full px-4 py-2.5 bg-surface-variant dark:bg-slate-700 border border-outline-variant/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-on-surface mb-2">截止日期</label>
            <input
              v-model="form.dueDate"
              type="date"
              class="w-full px-4 py-2.5 bg-surface-variant dark:bg-slate-700 border border-outline-variant/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface"
            >
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-on-surface mb-2">优先级</label>
          <div class="flex gap-2">
            <button
              v-for="priority in ['high', 'medium', 'low']"
              :key="priority"
              @click="form.priority = priority"
              :class="[
                'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                form.priority === priority
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-variant dark:bg-slate-700 text-on-surface hover:bg-outline-variant/10'
              ]"
            >
              {{ priorityLabels[priority] }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-on-surface mb-2">标签</label>
          <div class="flex flex-wrap gap-2 mb-2">
            <span
              v-for="(tag, index) in form.tags"
              :key="index"
              class="inline-flex items-center gap-1 px-3 py-1.5 bg-tertiary-container text-on-tertiary-container rounded-md text-sm"
            >
              {{ tag }}
              <button
                @click="removeTag(index)"
                class="hover:text-on-tertiary-container/70"
              >
                <span class="material-symbols-outlined text-sm">close</span>
              </button>
            </span>
          </div>
          <div class="flex gap-2">
            <select
              v-model="selectedTag"
              @change="addTagFromSelect"
              class="flex-1 px-4 py-2 bg-surface-variant dark:bg-slate-700 border border-outline-variant/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface"
            >
              <option value="">选择预设标签</option>
              <option v-for="tag in presetTags" :key="tag" :value="tag">{{ tag }}</option>
            </select>
            <input
              v-model="customTag"
              placeholder="自定义标签"
              class="flex-1 px-4 py-2 bg-surface-variant dark:bg-slate-700 border border-outline-variant/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface placeholder:text-on-surface-variant/50"
              @keyup.enter="addCustomTag"
            >
            <button
              @click="addCustomTag"
              class="px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              <span class="material-symbols-outlined">add</span>
            </button>
          </div>
        </div>
      </div>

      <div class="px-6 py-4 bg-surface-variant/30 dark:bg-slate-700/50 flex justify-end gap-3">
        <button
          @click="close"
          class="px-6 py-2.5 rounded-lg font-medium text-on-surface hover:bg-outline-variant/10 transition-colors"
        >
          取消
        </button>
        <button
          @click="submit"
          :disabled="!isValid"
          :class="[
            'px-6 py-2.5 rounded-lg font-medium transition-all',
            isValid
              ? 'bg-primary text-on-primary hover:bg-primary/90 shadow-lg'
              : 'bg-outline-variant/30 text-on-surface-variant cursor-not-allowed'
          ]"
        >
          {{ isEdit ? '保存' : '创建' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  project: Object
})

const emit = defineEmits(['close', 'submit'])

const isEdit = computed(() => !!props.project)

const form = ref({
  name: '',
  description: '',
  startDate: '',
  dueDate: '',
  priority: 'medium',
  tags: []
})

const errors = ref({})
const selectedTag = ref('')
const customTag = ref('')

const priorityLabels = {
  high: '高',
  medium: '中',
  low: '低'
}

const presetTags = [
  '工作',
  '个人',
  '学习',
  '健康',
  '财务',
  '旅行',
  '家庭',
  '创意'
]

const isValid = computed(() => {
  return form.value.name.trim().length > 0
})

watch(() => props.project, (project) => {
  if (project) {
    form.value = {
      name: project.name || '',
      description: project.description || '',
      startDate: project.startDate || '',
      dueDate: project.dueDate || '',
      priority: project.priority || 'medium',
      tags: [...(project.tags || [])]
    }
  } else {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  form.value = {
    name: '',
    description: '',
    startDate: '',
    dueDate: '',
    priority: 'medium',
    tags: []
  }
  errors.value = {}
  selectedTag.value = ''
  customTag.value = ''
}

function removeTag(index) {
  form.value.tags.splice(index, 1)
}

function addTagFromSelect() {
  if (selectedTag.value && !form.value.tags.includes(selectedTag.value)) {
    form.value.tags.push(selectedTag.value)
  }
  selectedTag.value = ''
}

function addCustomTag() {
  const tag = customTag.value.trim()
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
  }
  customTag.value = ''
}

function validate() {
  errors.value = {}

  if (!form.value.name.trim()) {
    errors.value.name = '项目名称不能为空'
  }

  return Object.keys(errors.value).length === 0
}

function submit() {
  if (!validate()) return

  emit('submit', {
    ...form.value,
    ...(isEdit.value ? { id: props.project.id } : {})
  })

  close()
}

function close() {
  emit('close')
  resetForm()
}
</script>
