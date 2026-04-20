<template>
  <div class="flex-1 flex overflow-hidden">
    <TaskList @editTask="handleEditTask" />
    <ScheduleTracking />
    <EditTaskModal
      :visible="showEditModal"
      :task="editingTask"
      @close="closeEditModal"
      @submit="handleUpdateTask"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TaskList from '../components/TaskList.vue'
import ScheduleTracking from '../components/ScheduleTracking.vue'
import EditTaskModal from '../components/EditTaskModal.vue'
import { useTaskStore } from '../store/taskStore'

const store = useTaskStore()
const showEditModal = ref(false)
const editingTask = ref(null)

function handleEditTask(task) {
  editingTask.value = task
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editingTask.value = null
}

async function handleUpdateTask(taskData) {
  await store.updateTask(taskData.id, taskData)
  closeEditModal()
}
</script>
