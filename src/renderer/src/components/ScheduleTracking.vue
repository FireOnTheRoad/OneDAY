<template>
  <section class="w-1/2 h-full flex flex-col bg-surface-container-low">
    <div class="p-6 border-b border-surface-container bg-surface-container-lowest">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-extrabold text-on-surface headline">Schedule & Tracking</h2>
        <div class="flex items-center gap-2 bg-surface-container p-1 rounded-lg">
          <button
            v-for="tab in tabs"
            :key="tab"
            :class="[
              'px-3 py-1 text-xs font-bold rounded',
              tab === activeTab
                ? 'bg-surface-container-lowest shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            ]"
            @click="activeTab = tab"
          >
            {{ tab }}
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between bg-primary p-4 rounded-2xl text-on-primary shadow-lg shadow-primary/20">
        <div class="flex items-center gap-4">
          <button class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all active:scale-90">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">pause</span>
          </button>
          <div>
            <div class="text-[10px] uppercase tracking-widest font-bold opacity-80">Currently Tracking</div>
            <div class="font-bold text-lg">Finalize Design Proposals</div>
          </div>
        </div>
        <div class="text-3xl font-mono font-bold tracking-tighter">
          {{ timerDisplay }}
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-6">
      <div class="relative min-h-[800px]">
        <div class="absolute inset-0 flex flex-col">
          <div
            v-for="hour in timeSlots"
            :key="hour"
            class="h-20 border-b border-surface-container-highest flex items-start pt-2 px-2 text-[10px] font-bold text-on-surface-variant/40"
          >
            {{ hour }}
          </div>
        </div>

        <div
          v-for="event in scheduleEvents"
          :key="event.id"
          :class="[
            'absolute left-16 right-0 backdrop-blur-sm border-l-4 rounded-r-xl p-3 cursor-pointer transition-all group',
            event.bgClass,
            event.hoverClass
          ]"
          :style="{ top: event.top + 'px', height: event.height + 'px' }"
        >
          <div class="flex justify-between">
            <span :class="['text-[11px] font-bold uppercase', event.timeColor]">{{ event.timeRange }}</span>
            <span class="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
          </div>
          <div class="font-bold text-on-surface mt-1">{{ event.title }}</div>
          <div v-if="event.subtitle" :class="['text-[10px] font-medium', event.subtitleColor]">{{ event.subtitle }}</div>
        </div>

        <div class="absolute left-16 right-0 h-[2px] bg-error z-10 before:content-[''] before:absolute before:w-3 before:h-3 before:bg-error before:rounded-full before:-left-1.5 before:-top-[5px]" :style="{ top: currentTimeLineTop + 'px' }"></div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const activeTab = ref('Day')
const tabs = ['Day', 'Week']

const timerSeconds = ref(6128)
let timerInterval = null

const timerDisplay = computed(() => {
  const h = Math.floor(timerSeconds.value / 3600)
  const m = Math.floor((timerSeconds.value % 3600) / 60)
  const s = timerSeconds.value % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

onMounted(() => {
  timerInterval = setInterval(() => {
    timerSeconds.value++
  }, 1000)
})

onUnmounted(() => {
  clearInterval(timerInterval)
})

const timeSlots = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM'
]

const scheduleEvents = ref([
  {
    id: 1,
    top: 20,
    height: 160,
    timeRange: '9:15 - 11:15 AM',
    title: 'Focus Work: Wireframes',
    subtitle: 'Design Project',
    bgClass: 'bg-error-container/30 border-error',
    hoverClass: 'hover:bg-error-container/40',
    timeColor: 'text-error',
    subtitleColor: 'text-error/80'
  },
  {
    id: 2,
    top: 240,
    height: 80,
    timeRange: '12:00 - 1:00 PM',
    title: 'Lunch Break',
    subtitle: null,
    bgClass: 'bg-primary-container/20 border-primary',
    hoverClass: 'hover:bg-primary-container/30',
    timeColor: 'text-primary',
    subtitleColor: null
  },
  {
    id: 3,
    top: 400,
    height: 128,
    timeRange: '2:00 - 3:30 PM',
    title: 'Client Presentation',
    subtitle: 'Stakeholder Review',
    bgClass: 'bg-tertiary-container/20 border-tertiary',
    hoverClass: 'hover:bg-tertiary-container/30',
    timeColor: 'text-tertiary',
    subtitleColor: 'text-tertiary/80'
  }
])

const currentTimeLineTop = computed(() => 320)
</script>
