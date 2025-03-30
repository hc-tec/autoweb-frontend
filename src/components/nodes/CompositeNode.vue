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
      <BoxPlotOutlined />
    </template>
    
    <!-- 操作按钮插槽 -->
    <template #actions>
      <a-button type="text" size="small" class="action-button" @click="addChildNode">
        <plus-outlined />
      </a-button>
      <a-button type="text" size="small" class="action-button">
        <more-outlined />
      </a-button>
    </template>
    
    <!-- 嵌套节点特有的子节点容器区域 -->
    <div class="composite-node-content">
      <div ref="nodeContainer" class="child-nodes-container">
        <div class="empty-container-hint">
          <BlockOutlined />
          <span>点击"+"按钮添加子节点</span>
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
import { MoreOutlined, PlusOutlined, BoxPlotOutlined, BlockOutlined } from '@ant-design/icons-vue'
import { useVueFlow } from '@vue-flow/core'
import BaseNode from './BaseNode.vue'
import { NodeResizer } from '@vue-flow/node-resizer'
import '@vue-flow/node-resizer/dist/style.css'
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

// 添加子节点的方法
const addChildNode = (event) => {
  // 获取当前节点
  const parentNode = findNode(props.id)
  if (!parentNode) return
  
  event.stopPropagation()
  
  // 计算新节点位置
  let posX, posY

  posX = parentNode.dimensions.width
  posY = parentNode.dimensions.height - 200
  
  // 生成唯一ID
  const newNodeId = `child-${props.id}-${Date.now()}`
  
  // 创建新节点
  const newNode = {
    id: newNodeId,
    type: 'custom',
    position: { x: posX, y: posY },
    parentNode: props.id,
    expandParent: true,
    extent: 'parent',
    data: {
      module_id: newNodeId,
      module_type: 'custom',
      // 保存相对于父节点的位置信息
      position: { x: posX, y: posY },
      meta: {
        title: '选择器',
        description: '判断条件分支',
        category: 'default'
      },
      inputs: {
        input_defs: [
          {
            name: 'input',
            type: 'string',
            description: '输入参数',
            required: true
          }
        ]
      },
      outputs: {
        output_defs: [
          {
            name: 'output',
            type: 'string',
            description: '输出结果'
          }
        ]
      }
    }
  }
  
  // 添加节点
  addNodes([newNode])
}
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