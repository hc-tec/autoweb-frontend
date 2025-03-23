<template>
  <BaseNode
    :id="id"
    :data="data"
    :selected="selected"
  >
    <!-- 图标插槽 -->
    <template #icon>
      {{ nodeIcon }}
    </template>
    
    <!-- 操作按钮插槽 -->
    <template #actions>
      <a-button type="text" size="small" class="action-button">
        <play-circle-outlined />
      </a-button>
      <a-button type="text" size="small" class="action-button">
        <more-outlined />
      </a-button>
    </template>
    
    <!-- 连接点插槽 -->
    <template #handles>
      <!-- 单一输入连接点 -->
      <Handle
        type="target"
        :position="Position.Left"
        id="input"
        
        class="handle-input"
      />
      
      <!-- 单一输出连接点 -->
      <Handle
        type="source"
        :position="Position.Right"
        id="output"
        
        class="handle-output"
      />
    </template>
  </BaseNode>
</template>

<script setup>
import { Handle } from '@vue-flow/core'
import { computed } from 'vue'
import { PlayCircleOutlined, MoreOutlined } from '@ant-design/icons-vue'
import BaseNode from './BaseNode.vue'
import { useVueFlow, Position } from '@vue-flow/core'

// 使用memo包装组件属性，只有在相关数据变化时才重新渲染
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

// 优化3: 缓存节点图标，减少每次渲染时的计算
const nodeIcon = computed(() => {
  const category = props.data.meta?.category || '';
  const type = props.data.module_type || '';
  
  // 根据分类返回图标
  switch (category) {
    case 'web':
      return '🌐';
    case 'ai':
      return '🧠';
    case 'audio':
      return '🔊';
    case 'start':
      return '🚀';
    default:
      // 如果没有分类，尝试根据类型判断
      if (type.includes('Page') || type.includes('Web')) {
        return '🌐';
      } else if (type.includes('Extract') || type.includes('Data')) {
        return '📊';
      } else if (type.includes('Click') || type.includes('Action')) {
        return '👆';
      }
      return '⚙️'; // 默认图标
  }
})
</script>

<style>
</style> 