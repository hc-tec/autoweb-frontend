<template>
  <div class="workflow-editor-container">
    <!-- 使用独立的工作流头部组件 -->
    <workflow-header />

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
      @paneClick="onPaneClick"
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
import { ref, computed, watch, reactive, shallowRef, markRaw, onMounted, onBeforeUnmount, provide } from 'vue'
import { VueFlow, Panel, useVueFlow } from '@vue-flow/core'
import { PlusOutlined, ApartmentOutlined, ExportOutlined, FolderOutlined, BranchesOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import CustomNode from '../nodes/CustomNode.vue'
import CompositeNode from '../nodes/CompositeNode.vue'
import WorkflowControlBar from './WorkflowControlBar.vue'
import NodePropertiesPanel from './NodePropertiesPanel.vue'
import WorkflowHeader from './WorkflowHeader.vue'
import { saveWorkflowToJson } from '@/utils/workflowUtils'
import { createNode, createNodeWithSlots, useNodeTypes } from '@/utils/nodeFactory'
import { NodePositionCalculator } from '@/utils/workflowUtils'
import { expandMacroModules } from '@/utils/macroModuleUtils'
import { message } from 'ant-design-vue'

// 使用useVueFlow组合式API获取流程图功能
const { 
  onNodeClick: onVueFlowNodeClick, 
  onEdgeClick, 
  addEdges, 
  addNodes, 
  setNodes, 
  removeNodes, 
  removeEdges, 
  getSelectedNodes, 
  getSelectedEdges, 
  addSelectedNodes, 
  fitView, 
  onPaneClick: onVueFlowPaneClick, 
  addSelectedEdges 
} = useVueFlow();

// 创建工作流状态
const nodes = ref([]);
const edges = ref([]);
const workflowData = reactive({
  title: '未命名工作流',
  description: '暂无描述'
});

// 为WorkflowHeader组件提供工作流数据和更新方法
provide('workflowData', workflowData);
provide('updateWorkflowMeta', updateWorkflowMeta);

// 节点属性面板相关状态
const selectedNode = ref(null);
const showProperties = ref(false);

// 优化1: 使用shallowRef和markRaw减少响应式追踪
const nodeTypes = shallowRef({
  custom: markRaw(CustomNode),
  composite: markRaw(CompositeNode),
})

// 边类型
const edgeTypes = shallowRef({})

// 设置VueFlow的节点点击事件处理函数
onVueFlowNodeClick((e) => {  
  // 处理节点点击，显示属性面板
  selectedNode.value = e.node;
  showProperties.value = true;
})

// 监听画布点击事件
onVueFlowPaneClick(() => {
  // 当点击画布空白区域时，关闭属性面板
  closePropertiesPanel();
})

// 关闭属性面板
const closePropertiesPanel = () => {
  showProperties.value = false;
  selectedNode.value = null;
}

// 更新节点属性
const updateNodeProperties = (nodeId, nodeProperty) => {
  try {
    // 使用VueFlow的setNodes方法更新节点
    setNodes((nds) => {
      return nds.map(node => {
        if (node.id === nodeId) {
          // 合并新属性,保留原有位置等信息
          Object.assign(node.data, nodeProperty)
        }
        return node
      });
    });
    
    // 更新选中节点状态（如果当前选中的是被更新的节点）
    if (selectedNode.value && selectedNode.value.id === nodeId.id) {
      // 注意：这里使用节点引用而非直接替换，避免选中状态丢失
      selectedNode.value = {
        ...selectedNode.value,
        data: {
          ...selectedNode.value.data,
          ...nodeId.data
        }
      };
    }
  } catch (error) {
    console.error('节点更新失败:', error);
  }  
}

// 提供节点更新函数给子孙组件
provide('updateNode', updateNodeProperties);

// 提供当前选中节点给子孙组件
provide('selectedNode', selectedNode);

// 更新工作流元数据
function updateWorkflowMeta(newMeta) {
  Object.assign(workflowData, newMeta);
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
const handleAddNode = async (typeKey) => {
  console.log('添加节点类型:', typeKey)
  
  try {
    // 解析类型键值
    // 如果类型键包含冒号，说明是复合键（module_type:workflow_id）
    let moduleType = typeKey;
    let customData = {};
    
    if (typeKey.includes(':')) {
      const [type, id] = typeKey.split(':');
      moduleType = type;
      // 对于工作流类型节点，添加workflow_id
      if (type === 'workflow' && id) {
        customData.workflow_id = id;
      }
    }
    
    // 获取当前选中的节点
    const selectedNodes = getSelectedNodes.value
    const parentNode = selectedNodes.length === 1 && selectedNodes[0].data.is_composited 
      ? selectedNodes[0] 
      : null
    
    // 计算新节点位置
    const position = NodePositionCalculator.calculateNodePosition(
      nodes.value,
      parentNode
    )
    
    // 判断是否是带插槽的节点类型
    const hasSlots = await hasNodeSlots(moduleType)
    
    let addedNode = null; // 用于存储添加的节点
    
    if (hasSlots) {
      // 创建带插槽的节点
      const result = await createNodeWithSlots(moduleType, position, customData)
      
      // 设置父节点属性（如果有）
      if (parentNode) {
        setParentNodeProperties(result.node, parentNode.id)
        result.slotNodes.forEach(slotNode => {
          setParentNodeProperties(slotNode, parentNode.id)
        })
      }
      
      // 添加节点和边到流程图
      addNodes([result.node, ...result.slotNodes])
      addEdges(result.edges)
      
      addedNode = result.node;
    } else {
      // 创建普通节点
      const node = await createNode(moduleType, position, customData)
      
      // 如果有父节点，设置parentNode属性
      if (parentNode) {
        setParentNodeProperties(node, parentNode.id)
      }
      
      // 添加节点到流程图
      addNodes([node])
      addedNode = node;
    }
    
    // 选中新节点并确保其可见
    if (addedNode) {
      selectNodeAndMakeVisible(addedNode)
    }
  } catch (error) {
    console.error('创建节点失败:', error)
  }
}

// 检查节点类型是否有插槽
const hasNodeSlots = async (type) => {
  // 如果类型是复合键，提取实际的module_type
  const moduleType = type.includes(':') ? type.split(':')[0] : type;
  
  const predefinedSlotTypes = ['selector', 'loop', 'IfElseBlock']
  if (predefinedSlotTypes.includes(moduleType)) return true
  
  // 也可以通过节点定义检查
  const { findNodeTypeDefinition } = await import('@/utils/nodeFactory')
  const nodeDef = await findNodeTypeDefinition(moduleType)
  return nodeDef && nodeDef.slots && Object.keys(nodeDef.slots).length > 0
}

// 设置父节点属性
const setParentNodeProperties = (node, parentId) => {
  node.parentNode = parentId
  node.extent = 'parent'
  return node
}

// 选中节点并确保其可见
const selectNodeAndMakeVisible = (node) => {
  // 等待下一个事件循环，确保节点已经添加到Vue Flow中
  setTimeout(() => {
    // 选中节点
    selectNode(node)
    
    // 确保节点在视图中可见
    fitView({
      padding: 0.2,
      includeHiddenNodes: false,
      nodes: [node]
    })
  }, 10)
}

// 选中节点的辅助函数
const selectNode = (node) => {
  // 在Vue Flow中设置节点为选中状态
  addSelectedNodes([node]);
}

// 自动调整节点布局
const autoLayout = () => {
  const updatedNodes = nodes.value.map(node => {
    // 只处理顶层节点
    if (!node.parentNode) {
      return node
    }
    return node
  })
  
  setNodes(updatedNodes)
}

// 导出流程为JSON
const exportWorkflow = async () => {
  console.log("exportWorkflow", nodes.value);
    
  // 从Vue Flow获取当前工作流数据
  const currentWorkflow = {
    nodes: nodes.value,
    edges: edges.value,
    workflowMeta: workflowData
  };
  
  try {
    // 导出为JSON（不展开大模块）
    const workflowJson = await saveWorkflowToJson(currentWorkflow);
    
    // 下载文件
    const jsonData = JSON.stringify(workflowJson, null, 2);
        
    // 创建文件下载
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonData)
    
    // 使用工作流标题作为文件名
    const exportFileName = `${workflowData.title || 'workflow'}-${Date.now()}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileName)
    linkElement.click()

    message.success('工作流导出成功');
  } catch (error) {
    console.error('导出工作流失败:', error);
    message.error('导出工作流失败，请查看控制台了解详情');
  }
}

// 运行工作流
const runWorkflow = async () => {
  try {
    // 显示加载状态
    message.loading('正在准备工作流...', 0);
    
    // 获取工作流数据
    const workflowJson = await saveWorkflowToJson({
      nodes: nodes.value,
      edges: edges.value,
      workflowMeta: workflowData
    });
    
    // 展开大模块 - 这一步是必要的
    const expandedWorkflow = await expandMacroModules(workflowJson);
    
    // 隐藏加载状态
    message.destroy();
    
    // 这里可以添加实际运行的逻辑
    console.log('准备运行展开后的工作流:', expandedWorkflow);
    message.success('工作流准备完成');
    
    // 格式化展开后的JSON并下载
    const jsonData = JSON.stringify(expandedWorkflow, null, 2);
    
    // 创建文件下载
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonData);
    const runFilename = `${workflowData.title || 'workflow'}-run-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', runFilename);
    linkElement.click();
  } catch (error) {
    message.destroy();
    console.error('运行工作流失败:', error);
    message.error('运行工作流失败，请查看控制台了解详情');
  }
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
  if (event.key === 'Delete') {
    deleteSelectedElements()
  }
  
  // 如果按下的是Alt+A组合键，选中所有节点和边  
  if (event.key === 'a' && event.ctrlKey) {
    event.preventDefault(); // 阻止默认行为
    selectAllElements();
  }
}

// 选中所有节点和边
const selectAllElements = () => {
  // 获取所有节点和边
  const allNodes = nodes.value;
  const allEdges = edges.value;
  
  if (allNodes.length === 0 && allEdges.length === 0) {
    return; // 没有节点和边，不执行操作
  }
  
  // 选中所有节点和边
  addSelectedNodes(allNodes);
  addSelectedEdges(allEdges);
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
}

// 暴露需要给父组件的方法和属性
defineExpose({
  nodes,
  edges,
  workflowData,
  loadWorkflow: (flowNodes, flowEdges, meta) => {
    // 设置基本工作流数据
    nodes.value = flowNodes;
    edges.value = flowEdges;
    if (meta) {
      Object.assign(workflowData, meta);
    }
  }
});
</script>

<style>
.workflow-editor-container {
  position: relative;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.workflow-vue-flow {
  height: 100%;
  width: 100%;
  flex: 1;
}

.workflow-tips {
  margin: 0 10px 10px 0;
}

/* 抽屉面板的自定义样式 */
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

.flow-wrapper {
  height: 100%;
  width: 100%;
  overflow: visible;
}
</style> 