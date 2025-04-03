<template>
  <div class="object-input">
    <a-textarea
      size="small"
      :value="objectDisplayValue"
      @blur="updateObjectValue"
      :placeholder="param.required ? '必填JSON对象' : '输入JSON对象'"
      class="object-textarea"
      :autoSize="{ minRows: 3, maxRows: 6 }"
    >
      <template #suffix>
        <reference-selector
          :currentNodeId="currentNodeId"
          @select-reference="handleRefSelect"
        >
          <a-button type="text" size="small" class="ref-selector-trigger">
            <link-outlined class="link-icon" />
          </a-button>
        </reference-selector>
      </template>
    </a-textarea>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { LinkOutlined } from '@ant-design/icons-vue';
import ReferenceSelector from '../ReferenceSelector.vue';

const props = defineProps({
  param: {
    type: Object,
    required: true
  },
  value: {
    type: [Object, null],
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

// 获取对象显示值
const objectDisplayValue = computed(() => {
  if (!props.value || props.value.type !== 'literal') {
    return '{}';
  }
  
  try {
    // 如果内容是字符串，尝试美化JSON
    if (typeof props.value.content === 'string') {
      const parsed = JSON.parse(props.value.content);
      return JSON.stringify(parsed, null, 2);
    }
    // 如果是对象，直接美化
    if (typeof props.value.content === 'object' && props.value.content !== null) {
      return JSON.stringify(props.value.content, null, 2);
    }
    return props.value.content || '{}';
  } catch (e) {
    return props.value.content || '{}';
  }
});

// 更新对象值的方法
const updateObjectValue = (event) => {
  try {
    const value = event.target.value;
    const parsed = JSON.parse(value);
    emit('update', {
      type: 'literal',
      content: JSON.stringify(parsed)
    });
  } catch (e) {
    console.error('JSON解析错误:', e);
  }
};

// 处理引用选择
const handleRefSelect = (reference) => {
  emit('update', reference);
};
</script>

<style scoped>
.object-input {
  flex: 1;
  width: 100%;
}

.object-textarea {
  width: 100%;
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