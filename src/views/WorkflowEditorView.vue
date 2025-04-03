<template>
  <div class="workflow-editor">
    <workflow-editor ref="workflowEditor" />
  </div>
</template>

<script setup>
import { ref, onMounted, shallowRef } from 'vue'
import { notification } from 'ant-design-vue'
import WorkflowEditor from '@/components/workflow/WorkflowEditor.vue'
import { loadWorkflowFromJson } from '@/utils/workflowUtils'
import '@/assets/workflow-styles.css'

// 工作流编辑器引用
const workflowEditor = ref(null);

// 工作流JSON数据 - 仅用于初始加载和最终导出
const workflowJson = shallowRef(null);

// 从JSON加载工作流
const loadWorkflow = async () => {
  try {
    const response = await fetch('/example/json_workflow.json')
    const workflow = await response.text()
    
    workflowJson.value = JSON.parse(workflow)
    
    // 解析JSON并转换为VueFlow节点和边
    const { nodes: flowNodes, edges: flowEdges } = loadWorkflowFromJson(workflowJson.value)
    
    // 使用工作流编辑器组件的方法加载数据
    workflowEditor.value?.loadWorkflow(
      flowNodes, 
      flowEdges,
      workflowJson.value.meta || { 
        title: '未命名工作流', 
        description: '暂无描述' 
      }
    );
    
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