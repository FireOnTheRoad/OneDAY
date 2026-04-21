<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="handleClose"></div>

        <div class="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
          <div class="flex items-center justify-between p-6 border-b border-surface-container">
            <h2 class="text-xl font-extrabold text-on-surface headline">编辑任务</h2>
            <button
              class="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant"
              @click="handleClose"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form class="p-6 space-y-5" @submit.prevent="handleSubmit">
            <div>
              <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">任务名称 *</label>
              <input
                v-model="form.title"
                class="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary text-sm transition-all placeholder:text-on-surface-variant/50"
                placeholder="输入任务名称..."
                type="text"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">任务描述</label>
              <textarea
                v-model="form.description"
                class="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary text-sm transition-all placeholder:text-on-surface-variant/50 resize-none"
                placeholder="描述任务详情..."
                rows="3"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">优先级</label>
                <div class="flex gap-2">
                  <button
                    v-for="p in priorities"
                    :key="p.value"
                    type="button"
                    :class="[
                      'flex-1 py-2 rounded-lg text-xs font-bold transition-all border-2',
                      form.priority === p.value
                        ? p.activeClass
                        : 'border-transparent bg-surface-container-highest text-on-surface-variant hover:bg-surface-variant'
                    ]"
                    @click="form.priority = p.value"
                  >
                    {{ p.label }}
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">截止日期</label>
                <input
                  v-model="form.dueDate"
                  class="w-full px-4 py-2 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary text-sm transition-all"
                  type="date"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">所属项目</label>
              <select
                v-model="form.projectId"
                class="w-full px-4 py-2 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary text-sm transition-all"
              >
                <option value="">无项目</option>
                <option
                  v-for="project in projects"
                  :key="project.id"
                  :value="project.id"
                >
                  {{ project.name }}
                </option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">开始日期</label>
                <input
                  v-model="form.startDate"
                  class="w-full px-4 py-2 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary text-sm transition-all"
                  type="date"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">持续天数</label>
                <input
                  v-model="form.duration"
                  class="w-full px-4 py-2 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary text-sm transition-all"
                  type="number"
                  min="1"
                  placeholder="天数"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">预估工时</label>
              <input
                v-model="form.estimatedHours"
                class="w-full px-4 py-2 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary text-sm transition-all"
                type="number"
                min="0"
                step="0.5"
                placeholder="小时"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">标签</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="tag in availableTags"
                  :key="tag"
                  type="button"
                  :class="[
                    'px-3 py-1 rounded-full text-xs font-bold transition-all',
                    form.tags.includes(tag)
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
                  ]"
                  @click="toggleTag(tag)"
                >
                  {{ tag }}
                </button>
              </div>
            </div>

            <div v-if="errorMessage" class="p-3 bg-error-container/30 rounded-xl text-error text-sm font-medium">
              {{ errorMessage }}
            </div>

            <div class="flex gap-3 pt-2">
              <button
                type="button"
                class="flex-1 py-3 rounded-xl font-bold text-on-surface-variant bg-surface-container-high hover:bg-surface-variant transition-all"
                @click="handleClose"
              >
                取消
              </button>
              <button
                type="submit"
                class="flex-1 py-3 rounded-xl font-bold bg-primary text-on-primary hover:opacity-90 active:scale-95 transition-all shadow-sm"
                :disabled="!form.title.trim()"
              >
                保存修改
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useProjectStore } from '../store/projectStore'

const props = defineProps({
  visible: { type: Boolean, default: false },
  task: { type: Object, default: null }
})

const emit = defineEmits(['close', 'submit'])

const projectStore = useProjectStore()

const form = reactive({
  title: '',
  description: '',
  priority: 'medium',
  dueDate: '',
  startDate: '',
  duration: null,
  estimatedHours: null,
  tags: [],
  projectId: null
})

const errorMessage = ref('')
const projects = ref([])

const priorities = [
  { value: 'high', label: '高', activeClass: 'border-error bg-error-container text-on-error-container' },
  { value: 'medium', label: '中', activeClass: 'border-primary bg-primary-container text-on-primary-container' },
  { value: 'low', label: '低', activeClass: 'border-tertiary bg-tertiary-container text-on-tertiary-container' }
]

const availableTags = ['设计', '开发', '会议', '文档', '紧急', '待审核']

onMounted(async () => {
  await projectStore.loadProjects()
  projects.value = projectStore.state.projects
})

watch(() => props.task, (newTask) => {
  if (newTask) {
    form.title = newTask.title || ''
    form.description = newTask.description || ''
    form.priority = newTask.priority || 'medium'
    form.dueDate = newTask.dueDate || ''
    form.startDate = newTask.startDate || ''
    form.duration = newTask.duration || null
    form.estimatedHours = newTask.estimatedHours || null
    form.tags = [...(newTask.tags || [])]
    form.projectId = newTask.projectId || null
  }
}, { immediate: true })

function toggleTag(tag) {
  const index = form.tags.indexOf(tag)
  if (index === -1) {
    form.tags.push(tag)
  } else {
    form.tags.splice(index, 1)
  }
}

function handleClose() {
  errorMessage.value = ''
  emit('close')
}

function handleSubmit() {
  if (!form.title.trim()) {
    errorMessage.value = '请输入任务名称'
    return
  }

  emit('submit', {
    id: props.task?.id,
    title: form.title.trim(),
    description: form.description.trim(),
    priority: form.priority,
    dueDate: form.dueDate || null,
    startDate: form.startDate || null,
    duration: form.duration ? parseInt(form.duration) : null,
    estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : null,
    tags: [...form.tags],
    projectId: form.projectId
  })

  errorMessage.value = ''
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>