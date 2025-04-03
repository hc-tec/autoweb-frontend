<template>
  <div class="boolean-input">
    <div v-if="isLiteral" class="switch-container">
      <a-switch
        size="small"
        :checked="boolValue"
        @change="updateValue"
      />
    </div>
    <div v-else class="reference-value">
      <a-tag color="blue">{{ referenceDisplay }}</a-tag>
      <a-button type="text" class="clear-btn" @click="clearReference">
        <close-outlined />
      </a-button>
    </div>
    <reference-selector
      :currentNodeId="currentNodeId"
      @select-reference="handleRefSelect"
    >
      <a-button type="text" size="small" class="ref-selector-trigger">
        <link-outlined class="link-icon" />
      </a-button>
    </reference-selector>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { LinkOutlined, CloseOutlined } from '@ant-design/icons-vue';
import ReferenceSelector from '../ReferenceSelector.vue';

const props = defineProps({
  param: {
    type: Object,
    required: true
  },
  value: {
    type: [Object, Boolean, null],
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

// 判断是否为字面值
const isLiteral = computed(() => {
  return !props.value || props.value.type === 'literal';
});

// 获取布尔值
const boolValue = computed(() => {
  if (!props.value || props.value.type !== 'literal') {
    return false;
  }
  
  // 处理不同格式的内容
  if (typeof props.value.content === 'boolean') {
    return props.value.content;
  } else if (typeof props.value.content === 'string') {
    return props.value.content.toLowerCase() === 'true';
  }
  
  return Boolean(props.value.content);
});

// 引用显示
const referenceDisplay = computed(() => {
  if (!props.value || props.value.type !== 'reference') {
    return '';
  }
  return `${props.value.content.nodeTitle} · ${props.value.content.moduleType}`;
});

// 更新值的方法
const updateValue = (val) => {
  emit('update', {
    type: 'literal',
    content: val
  });
};

// 处理引用选择
const handleRefSelect = (reference) => {
  emit('update', reference);
};

// 清除引用
const clearReference = () => {
  emit('clear-reference');
  emit('update', {
    type: 'literal',
    content: false
  });
};
</script>

<style scoped>
.boolean-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.switch-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.value-label {
  font-family: monospace;
  color: #333;
}

.reference-value {
  display: flex;
  align-items: center;
  gap: 4px;
}

.clear-btn {
  padding: 0 4px;
  color: #999;
}

.clear-btn:hover {
  color: #f5222d;
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