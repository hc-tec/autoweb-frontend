<template>
  <div class="workflow-header">
    <div class="workflow-info">
      <h1 class="workflow-title">{{ workflowData.title || '未命名工作流' }}</h1>
      <p class="workflow-description">{{ workflowData.description || '暂无描述' }}</p>
    </div>
    <a-button type="primary" @click="showEditModal">
      <edit-outlined /> 编辑
    </a-button>

    <!-- 工作流编辑弹窗 -->
    <workflow-edit-modal
      v-model:visible="editModalVisible"
      :workflow-title="workflowData.title"
      :workflow-description="workflowData.description"
      @confirm="updateWorkflowData"
    />
  </div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { EditOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import WorkflowEditModal from './WorkflowEditModal.vue';

// 使用inject获取和更新工作流元数据
const workflowData = inject('workflowData');
const updateWorkflowMeta = inject('updateWorkflowMeta');

// 编辑弹窗状态
const editModalVisible = ref(false);

// 显示编辑弹窗
const showEditModal = () => {
  editModalVisible.value = true;
};

// 更新工作流元数据
const updateWorkflowData = (newData) => {
  // 调用父组件提供的更新函数
  updateWorkflowMeta(newData);
  
  // 显示成功提示
  message.success('工作流信息已更新');
};
</script>

<style scoped>
.workflow-header {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: white;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 300px;
  max-width: 500px;
}

.workflow-info {
  flex: 1;
  margin-right: 16px;
}

.workflow-title {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  padding: 0;
  color: #333;
}

.workflow-description {
  font-size: 14px;
  margin: 4px 0 0 0;
  padding: 0;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}
</style> 