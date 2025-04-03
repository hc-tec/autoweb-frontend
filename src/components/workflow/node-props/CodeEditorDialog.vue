<template>
  <a-modal
    :visible="modelValue"
    :title="title"
    width="900px"
    :footer="null"
    destroyOnClose
    class="code-editor-modal"
    :maskClosable="false"
    @cancel="handleClose"
  >
    <div class="code-editor-wrapper">
      <code-editor-factory
        :type="type"
        :value="value"
        :inputs="inputs"
        :outputs="outputs"
        @update:value="updateValue"
        @close="handleClose"
      />
    </div>
  </a-modal>
</template>

<script setup>
import { computed } from 'vue';
import CodeEditorFactory from './code-editors/CodeEditorFactory.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    required: true
  },
  value: {
    type: [String, Object],
    default: ''
  },
  inputs: {
    type: Array,
    default: () => []
  },
  outputs: {
    type: Array,
    default: () => []
  },
  title: {
    type: String,
    default: '代码编辑器'
  }
});

const emit = defineEmits(['update:modelValue', 'update:value']);

// 更新值
const updateValue = (value) => {
  emit('update:value', value);
};

// 关闭对话框
const handleClose = () => {
  emit('update:modelValue', false);
};
</script>

<style scoped>
.code-editor-modal {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.code-editor-wrapper {
  height: 600px;
  overflow: auto;
}

:deep(.ant-modal-content) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

:deep(.ant-modal-body) {
  flex: 1;
  overflow: auto;
  padding: 0;
  display: flex;
  flex-direction: column;
}
</style> 