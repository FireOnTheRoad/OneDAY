<template>
  <section class="w-1/2 h-full overflow-y-auto px-8 py-8 bg-surface border-r border-surface-container">
    <div class="flex justify-between items-end mb-8">
      <div>
        <h2 class="text-3xl font-extrabold text-on-surface headline tracking-tight">专注流</h2>
        <p class="text-on-surface-variant font-medium text-sm mt-1">你今天有 4 个优先任务。</p>
      </div>
      <div class="flex gap-2">
        <button class="p-2 bg-surface-container-high rounded-lg hover:bg-surface-variant transition-colors">
          <span class="material-symbols-outlined">filter_list</span>
        </button>
        <button class="p-2 bg-surface-container-high rounded-lg hover:bg-surface-variant transition-colors">
          <span class="material-symbols-outlined">sort</span>
        </button>
      </div>
    </div>

    <div class="space-y-4">
      <div
        v-for="task in tasks"
        :key="task.id"
        :class="[
          'group relative bg-surface-container-lowest p-5 rounded-2xl shadow-sm border-l-4 hover:shadow-md transition-all',
          task.borderColor
        ]"
      >
        <div class="flex justify-between items-start mb-2">
          <div class="flex items-center gap-3">
            <span
              :class="['material-symbols-outlined', task.iconColor]"
              :style="task.iconFill ? 'font-variation-settings: \'FILL\' 1;' : ''"
            >{{ task.icon }}</span>
            <h3 :class="['font-bold text-on-surface', task.completed ? 'line-through opacity-60' : '']">{{ task.title }}</h3>
          </div>
          <span
            v-if="task.badge"
            :class="['text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider', task.badgeClass]"
          >{{ task.badge }}</span>
        </div>

        <p v-if="task.description" class="text-on-surface-variant text-sm line-clamp-2">{{ task.description }}</p>

        <div class="mt-4 flex items-center justify-between">
          <div class="flex items-center gap-4 text-xs text-on-surface-variant">
            <div v-if="task.time" class="flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">{{ task.timeIcon }}</span>
              <span>{{ task.time }}</span>
            </div>
            <div v-if="task.comments" class="flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">chat_bubble_outline</span>
              <span>{{ task.comments }}</span>
            </div>
          </div>
          <div v-if="task.avatars && task.avatars.length" class="flex -space-x-2">
            <img
              v-for="(avatar, idx) in task.avatars"
              :key="idx"
              class="w-6 h-6 rounded-full border-2 border-surface-container-lowest"
              :alt="avatar.alt"
              :src="avatar.src"
            />
            <div
              v-if="task.extraCount"
              class="w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center text-[8px] font-bold border-2 border-surface-container-lowest"
            >+{{ task.extraCount }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const tasks = ref([
  {
    id: 1,
    icon: 'priority_high',
    iconColor: 'text-error',
    iconFill: false,
    title: '确定设计方案',
    description: '审核所有线框图，完成建筑任务项目的高保真原型。客户期望今日下班前交付文件。',
    borderColor: 'border-error',
    badge: '已逾期',
    badgeClass: 'bg-error-container text-on-error-container',
    time: '今天 10:00',
    timeIcon: 'event',
    comments: 12,
    avatars: [
      {
        alt: '微笑女性头像',
        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDn8Wb2eDUJP7siAedzlFZ9HMdYSdvuPY551gG0RFY1qEV2Z83bjouE_yakOnIp0HZjG--rWvLapqzv-fvJE_fMH-2yUFaS93SYE18zmBl3UPgpjU4H2yt-Z7NXUuj3XXvGLq73_hl1siYSVnlQO3JghMe-eb4CSeZFcrmnNYxLQ5gedVS60vIWjsTu3pH7R7RqkAvEKBDNf2o9eKAXzVNyloFUMlBTxkjstbysBCerY2CRnmEH4mgUfKVlWNfZOn3Tyd2MBh3icKou'
      },
      {
        alt: '戴眼镜男性头像',
        src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAB0Shf1GcQzHWl1Awe-W0J_9CXMGQPrsDRjh3Kkdb95keU-SGXNjJpQ5TobKWMpmIh1ew-Z5fbK3wL9yntZ-QzjYbkYnsAyi9ZtYIslat5E2eujsZBFZ30hVlkSF9YkgcnGBWvZThoc4NJclOPpZa3xiz21uB5XsgIvQsV7m83-giO_t3ou-ZIhq-dcAzqmvraIhhqFZRFdL63ppFUnkF7cfCJ5VPO3sN7vP6TDmJhdv9PZe1DDawBsS_j5CsqWWwL1EBMNn0saRPH'
      }
    ],
    extraCount: 0,
    completed: false
  },
  {
    id: 2,
    icon: 'schedule',
    iconColor: 'text-primary',
    iconFill: false,
    title: '每周团队同步会',
    description: '讨论冲刺进展、阻碍事项以及第二季度路线图的即将里程碑。',
    borderColor: 'border-primary',
    badge: '2小时后到期',
    badgeClass: 'bg-primary-container text-on-primary-container',
    time: '今天 14:00',
    timeIcon: 'event',
    comments: null,
    avatars: [],
    extraCount: 8,
    completed: false
  },
  {
    id: 3,
    icon: 'check_circle',
    iconColor: 'text-tertiary',
    iconFill: true,
    title: '更新设计系统',
    description: null,
    borderColor: 'border-tertiary-container',
    badge: '已完成',
    badgeClass: 'bg-tertiary-fixed text-on-tertiary-fixed',
    time: '已计时: 4小时20分',
    timeIcon: 'timer',
    comments: null,
    avatars: [],
    extraCount: 0,
    completed: true
  },
  {
    id: 4,
    icon: 'radio_button_unchecked',
    iconColor: 'text-on-surface-variant',
    iconFill: false,
    title: '审核数据分析看板',
    description: null,
    borderColor: 'border-slate-300',
    badge: null,
    badgeClass: '',
    time: '明天 09:00',
    timeIcon: 'event',
    comments: null,
    avatars: [],
    extraCount: 0,
    completed: false
  }
])
</script>
