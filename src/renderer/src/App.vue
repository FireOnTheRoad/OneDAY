<template>
  <div class="bg-surface text-on-surface overflow-hidden h-screen flex flex-col relative">
    <div class="resize-edge resize-edge-top"></div>
    <div class="resize-edge resize-edge-bottom"></div>
    <div class="resize-edge resize-edge-left"></div>
    <div class="resize-edge resize-edge-right"></div>
    <div class="resize-edge resize-corner-tl"></div>
    <div class="resize-edge resize-corner-tr"></div>
    <div class="resize-edge resize-corner-bl"></div>
    <div class="resize-edge resize-corner-br"></div>

    <AppHeader @add-task="showAddModal = true" />
    <div class="flex flex-1 overflow-hidden">
      <SideNav />
      <main class="flex-1 flex overflow-hidden">
        <router-view />
      </main>
    </div>
    <AddTaskModal
      :visible="showAddModal"
      @close="showAddModal = false"
      @submit="handleAddTask"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import SideNav from './components/SideNav.vue'
import AddTaskModal from './components/AddTaskModal.vue'
import { useTaskStore } from './store/taskStore'

const store = useTaskStore()
const showAddModal = ref(false)

const MIN_WIDTH = 900
const MIN_HEIGHT = 600

async function handleAddTask(taskData) {
  await store.addTask(taskData)
  showAddModal.value = false
}

onMounted(() => {
  initResizeEdges()
})

function initResizeEdges() {
  const edges = [
    { cls: 'resize-edge-top', dir: 'n' },
    { cls: 'resize-edge-bottom', dir: 's' },
    { cls: 'resize-edge-left', dir: 'w' },
    { cls: 'resize-edge-right', dir: 'e' },
    { cls: 'resize-corner-tl', dir: 'nw' },
    { cls: 'resize-corner-tr', dir: 'ne' },
    { cls: 'resize-corner-bl', dir: 'sw' },
    { cls: 'resize-corner-br', dir: 'se' }
  ]

  for (const { cls, dir } of edges) {
    const el = document.querySelector(`.${cls}`)
    if (el) {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault()
        startResize(e, dir)
      })
    }
  }
}

function startResize(e, direction) {
  const startScreenX = e.screenX
  const startScreenY = e.screenY

  window.electronAPI.isMaximized().then((maximized) => {
    if (maximized) return

    window.electronAPI.getWindowBounds().then((bounds) => {
      if (!bounds) return

      const startBounds = { ...bounds }

      const handleMove = async (moveEvent) => {
        const dx = moveEvent.screenX - startScreenX
        const dy = moveEvent.screenY - startScreenY

        const newBounds = { ...startBounds }

        if (direction.includes('e')) {
          newBounds.width = Math.max(MIN_WIDTH, startBounds.width + dx)
        }
        if (direction.includes('s')) {
          newBounds.height = Math.max(MIN_HEIGHT, startBounds.height + dy)
        }
        if (direction.includes('w')) {
          const newWidth = Math.max(MIN_WIDTH, startBounds.width - dx)
          newBounds.x = startBounds.x + (startBounds.width - newWidth)
          newBounds.width = newWidth
        }
        if (direction.includes('n')) {
          const newHeight = Math.max(MIN_HEIGHT, startBounds.height - dy)
          newBounds.y = startBounds.y + (startBounds.height - newHeight)
          newBounds.height = newHeight
        }

        await window.electronAPI.setBounds(newBounds)
      }

      const handleUp = () => {
        document.removeEventListener('mousemove', handleMove)
        document.removeEventListener('mouseup', handleUp)
      }

      document.addEventListener('mousemove', handleMove)
      document.addEventListener('mouseup', handleUp)
    })
  })
}
</script>
