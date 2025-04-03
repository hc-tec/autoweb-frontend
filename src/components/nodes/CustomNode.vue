<template>
  <BaseNode
    :id="id"
    :data="data"
    :selected="selected"
  >
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
      
      <!-- 如果有slots，为每个slot添加底部连接点 -->
      <template v-if="hasSlots">
        <Handle
          v-for="(slotName, index) in slotNames"
          :key="`slot-${slotName}`"
          type="source"
          :position="Position.Bottom"
          :id="`slot-${slotName}`"
          :style="getSlotHandleStyle(index, slotNames.length)"
          class="handle-slot"
        />
      </template>
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

// Vue Flow的hooks
const { getEdges } = useVueFlow();

// 检查是否有slots
const hasSlots = computed(() => {
  return props.data.slots && Object.keys(props.data.slots).length > 0;
});

// 获取所有slot名称
const slotNames = computed(() => {
  if (!hasSlots.value) return [];
  
  // 从slots对象中获取所有slot名称
  const names = Object.keys(props.data.slots || {});
  
  // 从边关系中查找slot名称
  if (names.length === 0) {
    const allEdges = getEdges.value;
    
    // 查找从当前节点出发、sourceHandle以"slot-"开头的所有边
    const slotEdges = allEdges.filter(edge => 
      edge.source === props.id && 
      edge.sourceHandle && 
      edge.sourceHandle.startsWith('slot-')
    );
    
    // 从sourceHandle提取slot名称
    return slotEdges.map(edge => edge.sourceHandle.replace('slot-', ''));
  }
  
  return names;
});

// 为每个slot计算handle位置
const getSlotHandleStyle = (index, total) => {
  const offset = (index + 1) / (total + 1) * 100;
  return {
    left: `${offset}%`,
    bottom: '-8px',
  };
};
</script>

<style>
.handle-slot {
  width: 12px;
  height: 12px;
  background-color: #6f5bd5;
  border: 2px solid white;
}
</style> 