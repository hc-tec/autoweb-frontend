<template>
    <NodeResizer min-width="400" min-height="200" />
  <BaseNode
    :id="id"
    :data="data"
    :selected="selected"
    class="composite-node"
  >
    <!-- 图标插槽 -->
    <template #icon>
      <ModuleIcon icon="box-plot" category="composite" />
    </template>
    
    <!-- 操作按钮插槽 -->
    <template #actions>
      <a-button type="text" size="small" class="action-button">
        <more-outlined />
      </a-button>
    </template>
    
    <!-- 嵌套节点特有的子节点容器区域 -->
    <div class="composite-node-content">
      <div ref="nodeContainer" class="child-nodes-container">
        <div class="empty-container-hint">
          <ModuleIcon icon="block" category="composite" />
          <span>选中节点，点击下面"添加节点"按钮添加子节点</span>
        </div>
        <slot></slot>
      </div>
    </div>
    <!-- 连接点插槽 -->
    <template #handles>
      <!-- 三个端口：顶部、左侧和右侧 -->
      <Handle
        type="target"
        position="top"
        id="input-top"
        :style="{ left: '50%' }"
        class="handle-input"
      />
      
      <Handle
        type="target"
        position="left"
        id="input-left"
        :style="{ top: '50%' }"
        class="handle-input"
      />
      
      <Handle
        type="source"
        position="right"
        id="output"
        :style="{ top: '50%' }"
        class="handle-output"
      />
    </template>
  </BaseNode>
</template>

<script setup>
import { Handle, useNodesData, useNodeId } from '@vue-flow/core'
import { computed, onMounted, watch, ref, reactive } from 'vue'
import { MoreOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { useVueFlow } from '@vue-flow/core'
import BaseNode from './BaseNode.vue'
import { NodeResizer } from '@vue-flow/node-resizer'
import '@vue-flow/node-resizer/dist/style.css'
import ModuleIcon from '@/components/common/ModuleIcon.vue'
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

// 节点容器引用
const nodeContainer = ref(null)

// 使用Vue Flow提供的hooks
const {
  findNode,
  addNodes,
  updateNodeDimensions,
  onInit,
  onNodeDragStop,
  onNodesChange,
} = useVueFlow()

// 父节点尺寸
const parentDimensions = reactive({
    width: 400,
    height: 300
})
</script>

<style scoped>
/* 嵌套节点可以超过最大宽度限制，因为它需要容纳子节点 */
.composite-node {
  min-width: 400px;
  max-width: none;
  width: 100%;
  height: 100%;
  overflow: visible;
  transition: width 0.3s ease, height 0.3s ease;
}

/* 嵌套节点特有内容区样式 */
.composite-node-content {
  flex: 1;
  padding: 8px 15px 15px;
  min-height: 150px;
  position: relative;
  display: flex;
  flex-direction: column;
}

.child-nodes-container {
  width: 100%;
  height: 100%;
  min-height: 120px;
  position: relative;
  background-color: rgba(249, 248, 255, 0.5);
  border-radius: 6px;
  border: 1px dashed #d3c8fc;
  padding: 10px;
  flex: 1;
  overflow: visible;
}

.empty-container-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #9d8ec1;
  pointer-events: none;
}

.empty-container-hint span {
  font-size: 14px;
  white-space: nowrap;
}

/* 尺寸指示器 */
.resize-indicator {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background-color: rgba(249, 248, 255, 0.8);
  border: 1px solid #d3c8fc;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
  color: #9d8ec1;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.composite-node:hover .resize-indicator {
  opacity: 1;
}
</style> 