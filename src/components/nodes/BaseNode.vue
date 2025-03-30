<template>
  <div
    class="autoweb-node"
    :class="[`node-type-${nodeCategory}`, { selected }]"
  >
    <div class="node-header">
      <div class="node-icon">
        <slot name="icon">⚙️</slot>
      </div>
      <div class="node-title">
        {{ title }}
        <span class="node-link-icon">
          <link-outlined />
        </span>
      </div>
      <div class="node-actions">
        <slot name="actions">
          <a-button type="text" size="small" class="action-button">
            <play-circle-outlined />
          </a-button>
          <a-button type="text" size="small" class="action-button">
            <more-outlined />
          </a-button>
        </slot>
      </div>
    </div>
    
    <div class="node-description" v-if="description">
      {{ description }}
    </div>
    
    <div class="node-content">
      <!-- 参数区域 - 横向布局 -->
      <div class="params-container">
        <!-- 输入参数区域 -->
        <div class="params-section input-section">
          <div class="param-header">输入</div>
          <div class="params-wrapper">
            <div v-for="input in inputs" :key="`input-${input.name}`" class="param-tag">
              {{ input.name }}
            </div>
            <div v-if="inputs.length === 0" class="param-empty">无输入</div>
          </div>
        </div>
        
        <!-- 输出参数区域 -->
        <div class="params-section output-section">
          <div class="param-header">输出</div>
          <div class="params-wrapper">
            <div v-for="output in outputs" :key="`output-${output.name}`" class="param-tag">
              {{ output.name }}
            </div>
            <div v-if="outputs.length === 0" class="param-empty">无输出</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 其他内容插槽 -->
    <slot></slot>
    
    <!-- 连接点插槽 -->
    <slot name="handles"></slot>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { LinkOutlined, PlayCircleOutlined, MoreOutlined } from '@ant-design/icons-vue'

// 定义props
const props = defineProps({
  id: {
    type: String,
    required: true
  },
  data: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  }
})

// 从data提取常用属性，作为计算属性
const title = computed(() => props.data.meta?.title || '未命名节点')
const description = computed(() => props.data.meta?.description || '')

// 优化1: 使用计算属性缓存输入和输出参数
const inputs = computed(() => {
  return props.data?.inputs?.input_defs || []
})

const outputs = computed(() => {
  return props.data?.outputs?.output_defs || []
})

// 计算节点类别
const nodeCategory = computed(() => {
  return 'default'
})
</script>

<style>
.autoweb-node {
  position: relative;
  border-radius: 8px;
  background-color: rgba(252, 252, 252, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #f0f0f7;
  min-width: 357px;
  max-width: 389px;   
  z-index: 1;
  display: flex;
  flex-direction: column;
  /* 添加尺寸变化的平滑过渡 */
  transition: width 0.3s ease, height 0.3s ease, transform 0.3s ease;
}

.autoweb-node.selected {
  box-shadow: 0 0 0 2px #6f5bd5;
  z-index: 2;
}

/* 针对嵌套节点取消最大宽度限制 */
.autoweb-node.node-type-composite {
  max-width: none;
}

.node-header {
  display: flex;
  align-items: center;
  padding: 25px 15px;
  background-color: #f9f8ff;
  justify-content: space-between;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.node-icon {
  font-size: 18px;
  margin-right: 10px;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e9e7ff;
}

.node-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  flex-grow: 1;
  display: flex;
  align-items: center;
}

.node-link-icon {
  font-size: 16px;
  margin-left: 6px;
  color: #6f5bd5;
}

.node-actions {
  display: flex;
  align-items: center;
}

.action-button {
  font-size: 16px;
  color: #6f5bd5;
  padding: 0 4px;
}

.node-description {
  padding: 8px 15px;
  font-size: 16px;
  color: #666;
}

/* 参数布局容器 */
.params-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 20px;
}

.params-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.param-header {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.params-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.param-tag {
  padding: 2px 10px;
  background-color: #f5f3ff;
  border-radius: 4px;
  font-size: 14px;
  color: #6f5bd5;
  white-space: nowrap;
}

.param-empty {
  color: #999;
  font-size: 14px;
  font-style: italic;
}
</style> 