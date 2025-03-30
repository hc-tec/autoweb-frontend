<template>
  <div class="workflow-editor-container">
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      fit-view-on-init
      :min-zoom="0.2"
      :max-zoom="4"
      :default-viewport="{ x: 0, y: 0, zoom: 1 }"
      :node-types="nodeTypes"
      :default-edge-options="defaultEdgeOptions"
      :apply-default="true"
      elevate-edges-on-select
      @nodeClick="onNodeClick"
      @connect="onConnect"
      class="workflow-vue-flow"
    >
      <template #node-custom="nodeProps">
        <CustomNode 
          :data="nodeProps.data" 
          :id="nodeProps.id" 
          :selected="nodeProps.selected"
        />
      </template>
      
      <template #node-composite="nodeProps">
        <CompositeNode 
          :data="nodeProps.data" 
          :id="nodeProps.id" 
          :selected="nodeProps.selected"
        />
      </template>
      
      <!-- 操作提示 -->
      <Panel position="bottom-right" class="workflow-tips">
        <a-tooltip title="按Delete键删除选中的节点和连接线">
          <a-tag color="blue">
            <delete-outlined /> Delete键可删除选中元素
          </a-tag>
        </a-tooltip>
      </Panel>
    </VueFlow>
    
    <!-- 使用新的控制栏组件 -->
    <WorkflowControlBar 
      @add-node="handleAddNode"
      @optimize-layout="autoLayout"
      @run-workflow="runWorkflow"
      @export-workflow="exportWorkflow"
    />
    
    <!-- 节点属性面板 -->
    <node-properties-panel
      v-if="selectedNode"
      :node="selectedNode"
      :visible="showProperties"
      @close="closePropertiesPanel"
      @update-node="updateNodeProperties"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, reactive, shallowRef, markRaw, onMounted, onBeforeUnmount } from 'vue'
import { VueFlow, Panel, useVueFlow } from '@vue-flow/core'
import { PlusOutlined, ApartmentOutlined, ExportOutlined, FolderOutlined, BranchesOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import CustomNode from '../nodes/CustomNode.vue'
import CompositeNode from '../nodes/CompositeNode.vue'
import WorkflowControlBar from './WorkflowControlBar.vue'
import NodePropertiesPanel from './NodePropertiesPanel.vue'
import { saveWorkflowToJson } from '@/utils/workflowUtils'
import { createNode, createNodeWithSlots, useNodeTypes } from '@/utils/nodeFactory'

const props = defineProps({
  nodes: {
    type: Array,
    required: true,
  },
  edges: {
    type: Array,
    required: true,
  }
})

const { onNodeClick: onVueFlowNodeClick, onEdgeClick, addEdges, addNodes, setNodes, removeNodes, removeEdges, getSelectedNodes, getSelectedEdges } = useVueFlow();
const emit = defineEmits(['nodeClick', 'edgeConnect', 'update:nodes', 'update:edges', 'elementsDeleted', 'updateNode'])

// 创建本地响应式引用，用于v-model绑定
const nodes = ref(props.nodes);
const edges = ref(props.edges);

// 节点属性面板相关状态
const selectedNode = ref(null);
const showProperties = ref(false);

// 监听props变化，同步到本地ref
watch(() => props.nodes, (newNodes) => {
  nodes.value = newNodes;
}, { deep: true });

watch(() => props.edges, (newEdges) => {
  edges.value = newEdges;
}, { deep: true });

// 优化1: 使用shallowRef和markRaw减少响应式追踪
const nodeTypes = shallowRef({
  custom: markRaw(CustomNode),
  composite: markRaw(CompositeNode),
})

// 边类型
const edgeTypes = shallowRef({

})

// 设置VueFlow的节点点击事件处理函数
onVueFlowNodeClick((e) => {  
  // 处理节点点击，显示属性面板
  selectedNode.value = e.node;
  showProperties.value = true;
  
  // 向父组件发射nodeClick事件
  emit('nodeClick', e.event, e.node)
})

// 关闭属性面板
const closePropertiesPanel = () => {
  showProperties.value = false;
  selectedNode.value = null;
}

// 更新节点属性
const updateNodeProperties = (updatedNode) => {
  // 更新节点
  const nodeIndex = nodes.value.findIndex(node => node.id === updatedNode.id);
  if (nodeIndex !== -1) {
    // 创建节点的副本并更新
    const updatedNodes = [...nodes.value];
    updatedNodes[nodeIndex] = updatedNode;
    nodes.value = updatedNodes;
    
    // 更新选中节点的引用
    selectedNode.value = updatedNode;
    
    // 发送节点更新事件
    emit('updateNode', updatedNode);
  }
}

// 默认边选项 - 使用shallowRef减少深层响应式
const defaultEdgeOptions = shallowRef({
  type: 'default',
  animated: false,
  style: {
    stroke: '#6f5bd5',
    strokeWidth: 3,
  },
  labelStyle: {
    fill: '#6f5bd5',
    fontWeight: 700,
  },
  markerEnd: {
    type: 'arrow',
    color: '#6f5bd5',
    width: 20,
    height: 20,
  },
})

// 节点连接逻辑
const onConnect = (connection) => {
  // 检查是否存在相同的连接，避免重复
  const existingEdge = edges.value.find(edge => 
    edge.source === connection.source && 
    edge.target === connection.target && 
    edge.sourceHandle === connection.sourceHandle && 
    edge.targetHandle === connection.targetHandle
  )
  
  if (existingEdge) {
    console.log('连接已存在，避免重复')
    return
  }
  
  // 创建新的连接边
  const newEdge = {
    id: `edge-${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}`,
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle,
    targetHandle: connection.targetHandle,
  }
  
  addEdges([newEdge])
}

// 处理添加节点事件
const handleAddNode = async (type) => {
  console.log('添加节点类型:', type)
  
  try {
    // 获取当前选中的节点
    const selectedNodes = getSelectedNodes.value
    const parentNode = selectedNodes.length === 1 && selectedNodes[0].data.is_composited 
      ? selectedNodes[0] 
      : null
    
    // 确定新节点位置
    let position = { x: 100, y: 100 }
    
    if (parentNode) {
      // 如果有选中的嵌套父节点，放置在其内部
      // 计算在父节点中的相对位置
      position = { x: 100, y: 100 } // 相对于父节点的位置
      
      // 检查父节点内是否已有其他子节点
      const childNodes = nodes.value.filter(node => node.parentNode === parentNode.id)
      if (childNodes.length > 0) {
        // 放在最后一个子节点的下方
        const lastChild = childNodes.reduce((a, b) => 
          a.position.y > b.position.y ? a : b
        )
        position.x = lastChild.position.x
        position.y = lastChild.position.y + 80
      }
    } else {
      // 没有选中嵌套节点，使用普通放置逻辑
      const existingNodes = nodes.value
      
      if (existingNodes.length > 0) {
        // 新节点放在最右侧节点的右边
        const rightmostNode = existingNodes.reduce((prev, current) => {
          // 只考虑顶层节点
          if (current.parentNode) return prev
          return (prev.position.x > current.position.x) ? prev : current
        }, existingNodes[0])
        
        if (!rightmostNode.parentNode) { // 确保是顶层节点
          position.x = rightmostNode.position.x + 150
          position.y = rightmostNode.position.y
        }
      }
    }
    
    // 判断是否是带插槽的节点类型
    const hasSlots = ['selector', 'loop'].includes(type)
    
    if (hasSlots) {
      // 创建带插槽的节点
      const { node, slotNodes, edges } = await createNodeWithSlots(type, position)
      
      // 如果有父节点，设置parentNode属性
      if (parentNode) {
        node.parentNode = parentNode.id
        node.extent = 'parent'
        slotNodes.forEach(slotNode => {
          slotNode.parentNode = parentNode.id
          slotNode.extent = 'parent'
        })
      }
      
      // 添加节点和边到流程图
      addNodes([node, ...slotNodes])
      addEdges(edges)
    } else {
      // 创建普通节点
      const node = await createNode(type, position)
      
      // 如果有父节点，设置parentNode属性
      if (parentNode) {
        node.parentNode = parentNode.id
        node.extent = 'parent' // 限制在父节点内
      }
      
      addNodes([node])
    }
  } catch (error) {
    console.error('创建节点失败:', error)
  }
}

// 自动调整节点布局
const autoLayout = () => {
  const updatedNodes = nodes.map(node => {
    // 只处理顶层节点
    if (!node.parentNode) {
      return node
    }
    return node
  })
  
  setNodes(updatedNodes)
}

// 导出流程为JSON
const exportWorkflow = () => {
  const jsonData = saveWorkflowToJson({
    nodes: nodes.value,
    edges: edges.value
  })
  
  console.log('导出流程数据:', jsonData)
  
  // 创建文件下载
  const dataStr = JSON.stringify(jsonData, null, 2)
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
  
  const exportFileDefaultName = `workflow-${Date.now()}.json`
  
  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
}

// 初始化时添加键盘事件监听
onMounted(() => {
  // 添加键盘事件监听器
  window.addEventListener('keydown', handleKeyDown)
})

// 组件卸载时移除事件监听
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

// 处理键盘事件
const handleKeyDown = (event) => {
  // 如果按下的是Delete键或Backspace键
  if (event.key === 'Delete' || event.key === 'Backspace') {
    deleteSelectedElements()
  }
}

// 删除选中的节点和边
const deleteSelectedElements = () => {
  const selectedNodes = getSelectedNodes.value
  const selectedEdges = getSelectedEdges.value
  
  if (selectedNodes.length === 0 && selectedEdges.length === 0) {
    return // 没有选中任何元素，不执行操作
  }
  
  // 收集要删除的节点ID和边ID
  const nodesToDelete = selectedNodes.map(node => node.id)
  const edgesToDelete = selectedEdges.map(edge => edge.id)
  
  // 执行删除操作
  removeNodes(nodesToDelete)
  removeEdges(edgesToDelete)

  // 如果有删除操作，触发事件通知父组件
  if (nodesToDelete.length > 0 || edgesToDelete.length > 0) {
    emit('elementsDeleted', { nodes: nodesToDelete, edges: edgesToDelete })
  }
}

// 运行工作流
const runWorkflow = () => {
  console.log('运行工作流')
  
  // 获取工作流数据
  const workflowData = saveWorkflowToJson({
    nodes: nodes.value,
    edges: edges.value
  })
  
  // 这里可以添加实际运行的逻辑
  console.log('工作流数据:', workflowData)
}
</script>

<style scoped>
.workflow-editor-container {
  width: 100%;
  height: 100%;
  overflow: visible;
  position: relative;
}

.workflow-vue-flow {
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* 操作面板样式 */
.workflow-actions {
  margin: 10px;
  display: flex;
  gap: 5px;
}

/* 抽屉面板的自定义样式 - 从WorkflowEditorView移动过来 */
:deep(.ant-drawer-title) {
  font-weight: 500;
  font-size: 16px;
}

:deep(.ant-drawer-header) {
  border-bottom: 1px solid #f0f0f0;
}

:deep(.ant-drawer-body) {
  padding: 16px;
}
</style> 