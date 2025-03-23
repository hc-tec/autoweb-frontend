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
      
      <Panel position="top-right" class="workflow-actions">
        <a-button-group>
          <a-button type="primary" @click="addNode">
            <template #icon><plus-outlined /></template>
            添加节点
          </a-button>
          <a-button type="primary" @click="addCompositeNode">
            <template #icon><folder-outlined /></template>
            添加嵌套节点
          </a-button>
          <a-button @click="autoLayout">
            <template #icon><apartment-outlined /></template>
            自动布局
          </a-button>
          <a-button @click="exportWorkflow">
            <template #icon><export-outlined /></template>
            导出
          </a-button>
        </a-button-group>
      </Panel>
    </VueFlow>
  </div>
</template>

<script setup>
import { ref, computed, watch, reactive, shallowRef, markRaw, onMounted } from 'vue'
import { VueFlow, Panel, useVueFlow } from '@vue-flow/core'
import { PlusOutlined, ApartmentOutlined, ExportOutlined, FolderOutlined } from '@ant-design/icons-vue'
import CustomNode from './CustomNode.vue'
import CompositeNode from './CompositeNode.vue'

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

const { onNodeClick, onEdgeClick, addEdges, addNodes, setNodes } = useVueFlow();

const emit = defineEmits(['nodeClick', 'edgeConnect', 'update:nodes', 'update:edges'])

// 创建本地响应式引用，用于v-model绑定
const nodes = ref(props.nodes);
const edges = ref(props.edges);

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
onNodeClick(() => {

})
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

// 添加普通节点
const addNode = () => {
  // 创建唯一ID
  const newNodeId = `node-${Date.now()}`
  
  // 确定新节点位置（相对于画布）
  const position = { x: 100, y: 100 }
  const existingNodes = nodes.value
  
  if (existingNodes.length > 0) {
    // 新节点放在最右侧节点的右边
    const rightmostNode = existingNodes.reduce((prev, current) => {
      return (prev.position.x > current.position.x) ? prev : current
    })
    position.x = rightmostNode.position.x + 30
    position.y = rightmostNode.position.y - 20
  }
  
  // 定义新节点数据
  const newNode = {
    id: newNodeId,
    type: 'custom',
    position,
    data: {
      module_id: newNodeId,
      module_type: 'custom',
      position, // 保存位置信息
      meta: {
        title: '自定义节点',
        description: '执行自定义操作',
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
  
  // 添加节点到流程图
  addNodes([newNode])
}

// 添加复合节点
const addCompositeNode = () => {
  // 创建唯一ID
  const newNodeId = `composite-${Date.now()}`
  
  // 确定新节点位置
  const position = { x: 100, y: 100 }
  const existingNodes = nodes.value
  
  if (existingNodes.length > 0) {
    // 新节点放在最右侧节点的右边
    const rightmostNode = existingNodes.reduce((prev, current) => {
      return (prev.position.x > current.position.x) ? prev : current
    })
    position.x = rightmostNode.position.x + 30
    position.y = rightmostNode.position.y - 20
  }
  
  
  // 创建新的复合节点
  const newNode = {
    id: newNodeId,
    type: 'composite',
    position,
    data: {
      module_id: newNodeId,
      module_type: 'composite',
      position, // 保存位置信息
      meta: {
        title: '嵌套节点',
        description: '可容纳子节点的嵌套容器',
        category: 'composite'
      },
      inputs: {
        input_defs: [
          {
            name: 'input-top',
            type: 'string',
            description: '顶部输入',
            required: true
          },
          {
            name: 'input-left',
            type: 'string',
            description: '左侧输入',
            required: true
          }
        ]
      },
      outputs: {
        output_defs: [
          {
            name: 'output',
            type: 'any',
            description: '处理结果输出'
          }
        ]
      },
      slots: [] // 初始化空的子节点列表
    }
  }
  
  // 添加节点到流程图
  addNodes([newNode])
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
</style> 