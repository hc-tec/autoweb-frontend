<template>
  <div class="workflow-editor">
    <workflow-editor
      :nodes="nodes"
      v-model:edges="edges"
      @nodeClick="onNodeClick"
      @edgeConnect="onEdgeConnect"
    />
    
    <!-- 属性面板抽屉 -->
    <a-drawer
      :visible="showProperties"
      :width="400"
      placement="right"
      :closable="true"
      @close="closePropertiesPanel"
      :title="selectedNodeTitle"
      :getContainer="false"
    >
      <node-properties-panel
        v-if="selectedNode"
        :node="selectedNode"
        :workflow-json="workflowJson"
        @update:node="updateNodeProperties"
      />
      <a-empty v-else description="选择一个节点来查看属性" />
    </a-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, shallowRef, onBeforeUnmount } from 'vue'
import { notification } from 'ant-design-vue'
import WorkflowEditor from '@/components/workflow/WorkflowEditor.vue'
import NodePropertiesPanel from '@/components/workflow/NodePropertiesPanel.vue'
import { loadWorkflowFromJson } from '@/utils/workflowUtils'
import '@/assets/workflow-styles.css'

// 工作流JSON数据
const workflowJson = shallowRef(null)
const nodes = ref([])
const edges = ref([])
const selectedNode = shallowRef(null)
const showProperties = ref(false)

// 计算属性获取选中节点标题，避免在模板中进行条件判断
const selectedNodeTitle = computed(() => 
  selectedNode.value ? '节点属性: ' + selectedNode.value.data.meta.title : '节点属性'
)

// 从JSON加载工作流
const loadWorkflow = async () => {
  try {
    const response = await fetch('/example/json_workflow.json')
    const workflow = await response.text()
    
    workflowJson.value = JSON.parse(workflow)
    
    // 解析JSON并转换为VueFlow节点和边
    const { nodes: flowNodes, edges: flowEdges } = loadWorkflowFromJson(workflowJson.value)
    
    // 定义边一次性，避免频繁创建对象
    const customEdges = [
      { 
        id: 'e1', 
        source: 'start_module', 
        target: 'read_web_content',
      },
      { 
        id: 'e2', 
        source: 'read_web_content', 
        target: 'generate_script',
      },
      { 
        id: 'e3', 
        source: 'generate_script', 
        target: 'if_else',
      },
    ];
    
    nodes.value = flowNodes;
    edges.value = customEdges;
    
    notification.success({
      message: '工作流加载成功',
      description: `已加载 ${flowNodes.length} 个节点和 ${customEdges.length} 条连接`
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
  selectedNode.value = node
  showProperties.value = true
}

// 关闭属性面板
const closePropertiesPanel = () => {
  showProperties.value = false
}

// 更新节点属性
const updateNodeProperties = (nodeId, properties) => {
  // 更新节点属性
  const nodeIndex = nodes.value.findIndex(node => node.id === nodeId)
  if (nodeIndex !== -1) {
    // 创建节点的浅拷贝
    const updatedNodes = [...nodes.value];
    updatedNodes[nodeIndex] = {
      ...updatedNodes[nodeIndex],
      data: {
        ...updatedNodes[nodeIndex].data,
        ...properties
      }
    }
    
    nodes.value = updatedNodes;
    
    // 更新工作流JSON数据
    if (workflowJson.value) {
      const moduleIndex = workflowJson.value.modules.findIndex(
        module => module.module_id === nodeId
      )
      if (moduleIndex !== -1) {
        // 创建模块的浅拷贝
        const updatedModules = [...workflowJson.value.modules];
        updatedModules[moduleIndex] = {
          ...updatedModules[moduleIndex],
          ...properties
        }
        
        workflowJson.value = {
          ...workflowJson.value,
          modules: updatedModules
        }
      }
    }
  }
}

// 连接边事件
const onEdgeConnect = (newEdge) => {
  console.log('New edge connected:', newEdge);
  // 已经在子组件中处理了添加到edges
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