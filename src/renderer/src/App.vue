<template>
  <div class="bg-surface text-on-surface overflow-hidden h-screen flex flex-col">
    <AppHeader />
    <div class="flex flex-1 overflow-hidden">
      <SideNav />
      <main class="flex-1 flex overflow-hidden">
        <TaskList />
        <ScheduleTracking />
      </main>
    </div>
  </div>
</template>

<script setup>
import AppHeader from './components/AppHeader.vue'
import SideNav from './components/SideNav.vue'
import TaskList from './components/TaskList.vue'
import ScheduleTracking from './components/ScheduleTracking.vue'
</script>
