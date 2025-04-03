<template>
  <div class="string-input">
    <a-input
      v-if="isLiteral"
      size="small"
      :value="stringValue"
      @change="updateValue"
      :placeholder="param.required ? '必填' : '选填'"
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
    </a-input>
    
    <div v-else class="reference-value">
      <a-tag color="blue">
        <link-outlined class="link-icon" />
        {{ referenceDisplay }}</a-tag>
      <a-button type="text" class="clear-btn" @click="clearReference">
        <close-outlined />
      </a-button>
    </div>
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
    type: [Object, String, null],
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
  return !props.value || props.value.type !== 'reference';
});

// 获取字符串值
const stringValue = computed(() => {
  if (!props.value) return '';
  
  if (props.value.type === 'literal') {
    return props.value.content?.toString() || '';
  }
  
  return '';
});

// 引用显示
const referenceDisplay = computed(() => {
  console.log(props.value.type);
  if (props?.value.type !== 'reference') {
    return '';
  }
  console.log(props.value.content);
  return `${props.value.content.nodeTitle} · ${props.value.content.moduleType}`;
});

// 更新值的方法
const updateValue = (event) => {
  emit('update', {
    type: 'literal',
    content: event.target.value
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
    content: ''
  });
};
</script>

<style scoped>
.string-input {
  flex: 1;
  width: 100%;
}

.link-icon {
  color: #1890ff;
  font-size: 14px;
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