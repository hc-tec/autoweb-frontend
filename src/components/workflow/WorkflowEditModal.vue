<template>
  <a-modal
    :open="visible"
    title="编辑工作流"
    :width="500"
    :footer="null"
    @cancel="handleCancel"
    centered
    class="workflow-edit-modal"
  >
    <div class="workflow-edit-content">
      <div class="workflow-icon">
        <ModuleIcon  />
      </div>
      
      <div class="workflow-form">
        <div class="form-item">
          <div class="form-label">
            工作流名称 <span class="required">*</span>
          </div>
          <a-input 
            v-model:value="formState.title" 
            placeholder="请输入工作流名称" 
            :maxlength="30"
            show-count
          />
        </div>
        
        <div class="form-item">
          <div class="form-label">
            工作流描述 <span class="required">*</span>
          </div>
          <a-textarea 
            v-model:value="formState.description" 
            placeholder="请输入工作流描述" 
            :maxlength="600"
            :auto-size="{ minRows: 4, maxRows: 6 }"
            show-count
          />
        </div>
      </div>
      
      <div class="workflow-actions">
        <a-button @click="handleCancel">取消</a-button>
        <a-button type="primary" @click="handleConfirm" :disabled="!isFormValid">确认</a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';

// 使用defineProps定义组件属性
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  }
});

// 使用defineEmits定义组件事件
const emit = defineEmits(['update:visible', 'confirm', 'cancel']);

// 表单状态
const formState = reactive({
  title: '',
  description: ''
});

// 监听props变化，更新表单
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    formState.title = props.title;
    formState.description = props.description;
  }
});

// 表单验证
const isFormValid = computed(() => {
  return formState.title.trim() !== '' && formState.description.trim() !== '';
});

// 取消
const handleCancel = () => {
  emit('update:visible', false);
  emit('cancel');
};

// 确认
const handleConfirm = () => {
  if (!isFormValid.value) return;
  
  emit('confirm', {
    title: formState.title.trim(),
    description: formState.description.trim()
  });
  
  emit('update:visible', false);
};
</script>

<style>
.workflow-edit-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.workflow-edit-modal .ant-modal-close {
    display: none;
}

.workflow-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.workflow-icon img {
  width: 80px;
  height: 80px;
}

.workflow-form {
  width: 100%;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  margin-bottom: 8px;
  font-weight: 500;
}

.required {
  color: #ff4d4f;
  margin-left: 2px;
}

.workflow-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  width: 100%;
  margin-top: 10px;
}
</style> 