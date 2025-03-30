<template>
  <div class="workflow-editor">
    <workflow-editor
      :nodes="nodes"
      v-model:edges="edges"
      @nodeClick="onNodeClick"
      @edgeConnect="onEdgeConnect"
      @elementsDeleted="onElementsDeleted"
      @updateNode="onUpdateNode"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, shallowRef } from 'vue'
import { notification } from 'ant-design-vue'
import WorkflowEditor from '@/components/workflow/WorkflowEditor.vue'
import { loadWorkflowFromJson } from '@/utils/workflowUtils'
import '@/assets/workflow-styles.css'

// 工作流JSON数据
const workflowJson = shallowRef(null)
const nodes = ref([])
const edges = ref([])

// 从JSON加载工作流
const loadWorkflow = async () => {
  try {
    const response = await fetch('/example/json_workflow.json')
    const workflow = await response.text()
    
    workflowJson.value = JSON.parse(workflow)
    
    // 解析JSON并转换为VueFlow节点和边
    const { nodes: flowNodes, edges: flowEdges } = loadWorkflowFromJson(workflowJson.value)
    
    nodes.value = flowNodes;
    edges.value = flowEdges;
    
    notification.success({
      message: '工作流加载成功',
      description: `已加载 ${flowNodes.length} 个节点和 ${flowEdges.length} 条连接`
    });
  } catch (error) {
    console.error('加载工作流失败', error);
    notification.error({
      message: '加载工作流失败',
      description: error.message
    });
  }
}

// 节点点击事件
const onNodeClick = (event, node) => {
  console.log('节点点击:', node);
}

// 连接边事件
const onEdgeConnect = (newEdge) => {
  console.log('New edge connected:', newEdge);
  // 已经在子组件中处理了添加到edges
}

// 元素删除事件
const onElementsDeleted = (deletedElements) => {
  console.log('元素删除:', deletedElements);
  
  // 更新工作流JSON
  if (workflowJson.value) {
    // 处理删除的节点
    if (deletedElements.nodes.length > 0) {
      const updatedModules = workflowJson.value.modules.filter(
        module => !deletedElements.nodes.some(node => node.id === module.module_id)
      );
      
      workflowJson.value = {
        ...workflowJson.value,
        modules: updatedModules
      };
    }
    
    // 处理删除的边
    if (deletedElements.edges.length > 0) {
      // 根据你的数据结构来更新连接信息
    }
  }
}

// 处理节点更新事件
const onUpdateNode = (updatedNode) => {
  // 更新工作流JSON
  if (workflowJson.value && workflowJson.value.modules) {
    const moduleIndex = workflowJson.value.modules.findIndex(
      module => module.module_id === updatedNode.id
    );
    
    if (moduleIndex !== -1) {
      const updatedModules = [...workflowJson.value.modules];
      // 将节点数据转换为工作流模块格式
      updatedModules[moduleIndex] = {
        ...updatedModules[moduleIndex],
        ...convertNodeToModule(updatedNode)
      };
      
      workflowJson.value = {
        ...workflowJson.value,
        modules: updatedModules
      };
    }
  }
}

// 将节点数据转换为工作流模块格式的辅助函数
const convertNodeToModule = (node) => {
  // 根据你的具体数据结构进行转换
  // 这里是一个示例实现
  return {
    module_id: node.id,
    ...node.data
  };
}

onMounted(() => {
  loadWorkflow()
})
</script>

<style>
.workflow-editor {
  height: 100vh;
  width: 100%;
  overflow: visible;
  position: relative;
  background-color: #fafafa;
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