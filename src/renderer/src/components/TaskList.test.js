import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskList from './TaskList.vue'
import { useTaskStore } from '@/store/taskStore'

// 模拟useTaskStore
vi.mock('@/store/taskStore', () => {
  const state = {
    tasks: [],
    loading: false,
    error: null,
    initialized: true
  }
  
  return {
    useTaskStore: vi.fn(() => ({
      state: {
        get tasks() { return state.tasks },
        get loading() { return state.loading },
        get error() { return state.error },
        get initialized() { return state.initialized }
      },
      loadTasks: vi.fn()
    })),
    // 导出state以便测试中修改
    __state: state
  }
})

describe('TaskList 排序功能测试', () => {
  const { __state: state } = require('@/store/taskStore')
  
  beforeEach(() => {
    // 重置state
    state.tasks = []
    state.loading = false
  })
  
  it('应该正确按紧急程度排序任务', () => {
    // 准备测试数据
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const twoDaysLater = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    state.tasks = [
      { id: 1, title: '任务1', dueDate: twoDaysLater, status: 'pending', priority: 'medium' }, // 2天后
      { id: 2, title: '任务2', dueDate: twoDaysAgo, status: 'pending', priority: 'high' }, // 2天前（已过期）
      { id: 3, title: '任务3', dueDate: yesterday, status: 'pending', priority: 'low' }, // 1天前（已过期）
      { id: 4, title: '任务4', dueDate: tomorrow, status: 'pending', priority: 'high' }, // 1天后
      { id: 5, title: '任务5', dueDate: today, status: 'pending', priority: 'medium' }, // 今天
      { id: 6, title: '任务6', status: 'completed', priority: 'high' }, // 已完成
      { id: 7, title: '任务7', status: 'archived', priority: 'medium' }, // 已归档
      { id: 8, title: '任务8', status: 'pending', priority: 'low' } // 无截止日期
    ]
    
    const wrapper = mount(TaskList)
    
    // 检查排序结果
    const taskItems = wrapper.findAll('[data-testid="task-item"]')
    expect(taskItems.length).toBe(5) // 排除已完成和已归档的任务
    
    // 预期排序顺序：已过期（从远到近）→ 今天 → 未过期（从近到远）→ 无截止日期
    const expectedOrder = [
      '任务2', // 2天前
      '任务3', // 1天前
      '任务5', // 今天
      '任务4', // 1天后
      '任务8'  // 无截止日期
    ]
    
    taskItems.forEach((item, index) => {
      expect(item.text()).toContain(expectedOrder[index])
    })
  })
  
  it('应该显示无任务状态', () => {
    state.tasks = []
    
    const wrapper = mount(TaskList)
    
    expect(wrapper.text()).toContain('暂无待办事项')
  })
  
  it('应该正确处理只有过期任务的情况', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    state.tasks = [
      { id: 1, title: '任务1', dueDate: yesterday, status: 'pending', priority: 'medium' }, // 1天前
      { id: 2, title: '任务2', dueDate: twoDaysAgo, status: 'pending', priority: 'high' } // 2天前
    ]
    
    const wrapper = mount(TaskList)
    
    const taskItems = wrapper.findAll('[data-testid="task-item"]')
    expect(taskItems.length).toBe(2)
    
    // 预期排序顺序：过期时间从远到近
    expect(taskItems[0].text()).toContain('任务2') // 2天前
    expect(taskItems[1].text()).toContain('任务1') // 1天前
  })
  
  it('应该正确处理只有未过期任务的情况', () => {
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const twoDaysLater = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    state.tasks = [
      { id: 1, title: '任务1', dueDate: twoDaysLater, status: 'pending', priority: 'medium' }, // 2天后
      { id: 2, title: '任务2', dueDate: today, status: 'pending', priority: 'high' }, // 今天
      { id: 3, title: '任务3', dueDate: tomorrow, status: 'pending', priority: 'low' } // 1天后
    ]
    
    const wrapper = mount(TaskList)
    
    const taskItems = wrapper.findAll('[data-testid="task-item"]')
    expect(taskItems.length).toBe(3)
    
    // 预期排序顺序：截止时间从近到远
    expect(taskItems[0].text()).toContain('任务2') // 今天
    expect(taskItems[1].text()).toContain('任务3') // 1天后
    expect(taskItems[2].text()).toContain('任务1') // 2天后
  })
  
  it('应该正确处理加载状态', () => {
    state.loading = true
    
    const wrapper = mount(TaskList)
    
    expect(wrapper.find('.animate-spin').exists()).toBe(true)
  })
})
