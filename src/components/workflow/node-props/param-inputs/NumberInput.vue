<template>
  <div class="number-input">
    <div class="number-input-container">
      <a-input-number
        size="small"
        :value="displayValue"
        @blur="updateValue"
        :placeholder="param.required ? '必填' : '输入或引用参数值'"
        class="param-input"
      />
      <reference-selector
        :currentNodeId="currentNodeId"
        @close="refSelectorVisible = false"
        @select-reference="handleRefSelect"
      >
        <a-button type="text" size="small" class="ref-selector-trigger">
          <link-outlined class="link-icon" />
        </a-button>
      </reference-selector>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { LinkOutlined } from '@ant-design/icons-vue';
import ReferenceSelector from '../ReferenceSelector.vue';

const props = defineProps({
  param: {
    type: Object,
    required: true
  },
  value: {
    type: [Object, Number, null],
    default: null
  },
  currentNodeId: {
    type: String,
    default: ''
  },
  nodeData: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['update', 'clear-reference']);

// 引用选择器状态
const refSelectorVisible = ref(false);

// 获取显示值
const displayValue = computed(() => {
  if (!props.value) return null;
  
  // 如果是常量类型
  if (props.value.type === 'literal') {
    const numValue = parseFloat(props.value.content);
    return isNaN(numValue) ? null : numValue;
  }
  
  // 如果是引用类型，返回null以显示空白
  if (props.value.type === 'ref') {
    return null;
  }
  
  // 返回原始值（向后兼容）
  const numValue = parseFloat(props.value);
  return isNaN(numValue) ? null : numValue;
});

// 更新值
const updateValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return;
  }
  
  emit('update', {
    type: 'literal',
    content: value
  });
};

// 处理引用选择
const handleRefSelect = (reference) => {
  emit('update', reference);
  refSelectorVisible.value = false;
};
</script>

<style scoped>
.number-input {
  flex: 1;
}

.number-input-container {
  display: flex;
  align-items: center;
}

.param-input {
  flex: 1;
  margin-right: 8px;
}

.link-icon {
  color: #1890ff;
  font-size: 14px;
}

.ref-selector-trigger {
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f5ff;
  border: 1px solid #d9e6ff;
  border-radius: 4px;
}

.ref-selector-trigger:hover {
  background-color: #e6f1ff;
  border-color: #91caff;
}
</style> 