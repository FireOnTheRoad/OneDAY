import { createRouter, createMemoryHistory } from 'vue-router'
import MyTasks from '../pages/MyTasks.vue'
import TodoItems from '../pages/TodoItems.vue'
import Calendar from '../pages/Calendar.vue'
import Projects from '../pages/Projects.vue'
import Schedule from '../pages/Schedule.vue'

const routes = [
  { path: '/', redirect: '/my-tasks' },
  { path: '/my-tasks', name: 'my-tasks', component: MyTasks, meta: { title: '我的任务' } },
  { path: '/todo-items', name: 'todo-items', component: TodoItems, meta: { title: '待办事项' } },
  { path: '/calendar', name: 'calendar', component: Calendar, meta: { title: '日历' } },
  { path: '/projects', name: 'projects', component: Projects, meta: { title: '项目' } },
  { path: '/schedule', name: 'schedule', component: Schedule, meta: { title: '日程' } }
]

const router = createRouter({
  history: createMemoryHistory(),
  routes
})

export default router
