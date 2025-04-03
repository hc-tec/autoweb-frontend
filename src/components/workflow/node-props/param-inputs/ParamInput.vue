<template>
  <div class="param-input">
    <!-- 字面值输入 -->
    <a-input
      v-if="isLiteral"
      size="small"
      :value="inputValue"
      @change="updateValue"
      :placeholder="placeholder || ''"
    >
      <template #suffix>
        <reference-selector
          :currentNodeId="currentNodeId"
          @select-reference="handleRefSelect"
        >
          <a-button type="text" size="small" class="ref-selector-trigger" title="选择引用">
            <link-outlined class="link-icon" />
          </a-button>
        </reference-selector>
      </template>
    </a-input>
    
    <!-- 引用值显示 -->
    <div v-else class="reference-value">
      <a-button type="text" class="clear-btn" title="清除引用" @click="clearReference">
        <close-outlined />
      </a-button>
      <a-tag color="blue" class="reference-tag" title="引用值">
        <link-outlined class="reference-icon" />
        <span class="reference-text">{{ referenceDisplay }}</span>
      </a-tag>
      
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { LinkOutlined, CloseOutlined } from '@ant-design/icons-vue';
import ReferenceSelector from '../ReferenceSelector.vue';
import { isReferenceType, normalizeReference, formatReferenceDisplay } from './referenceUtils';

const props = defineProps({
  value: {
    type: [Object, String, Number, Boolean, null],
    default: null
  },
  placeholder: {
    type: String,
    default: ''
  },
  currentNodeId: {
    type: String,
    default: ''
  },
  columnKey: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['update', 'clear-reference']);

// 判断是否为字面值
const isLiteral = computed(() => {
  // 修复判断逻辑，确保能正确区分引用类型和普通值
  if (!props.value) return true;
  
  if (typeof props.value === 'object') {
    // 检查是否有type和content属性，如果有，可能是引用类型
    if (props.value.type === 'reference' || props.value.type === 'ref') {
      if (props.value.content) {
        return false; // 这是引用类型
      }
    }
  }
  
  return true; // 默认为字面值
});

// 获取输入值 - 用于普通输入框
const inputValue = computed(() => {
  if (!props.value) return '';
  
  if (typeof props.value === 'object' && props.value.type === 'literal') {
    return props.value.content?.toString() || '';
  }
  
  if (typeof props.value !== 'object') {
    return props.value.toString();
  }
  
  return '';
});

// 引用显示文本 - 用于引用标签
const referenceDisplay = computed(() => {
    // console.log("referenceDisplay", props.value);
    
  // 使用已定义的判断方法，不使用不存在的isReferenceValue
  if (isLiteral.value) {
    return '引用值';
  }
  
  // 直接从props.value中获取显示信息
  const value = props.value;
  if (!value || !value.content) {
    return '引用值';
  }
  
  // 直接构造显示文本，确保一定有内容显示
  const content = value.content;
  const moduleTitle = content.nodeTitle || content.moduleID || '';
  const paramName = content.name || '';
  const propName = content.property ? `.${content.property}` : '';
  
  // 添加类型前缀
  const typePrefix = content.moduleType ? content.moduleType.charAt(0).toUpperCase() : 'G';
  
  // 拼接完整显示文本
  if (moduleTitle && paramName) {
    return `${moduleTitle} · ${paramName}${propName}`;
  } else if (moduleTitle) {
    return `${moduleTitle}`;
  } else if (paramName) {
    return paramName + propName;
  }
  
  return '引用值';
});

// 更新普通值
const updateValue = (event) => {
  emit('update', {
    type: 'literal',
    content: event.target.value,
    columnKey: props.columnKey
  });
};

// 处理引用选择
const handleRefSelect = (reference) => {
  
  // 确保是reference类型
  const normalizedRef = normalizeReference(reference);
  
  // 添加columnKey并发送更新
  const refData = {
    ...normalizedRef,
    columnKey: props.columnKey
  };
  
  emit('update', refData);
};

// 清除引用
const clearReference = () => {
  emit('clear-reference');
  emit('update', {
    type: 'literal',
    content: '',
    columnKey: props.columnKey
  });
};
</script>

<style scoped>
.param-input {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  display: flex;
}

.link-icon {
  color: #1890ff;
  font-size: 14px;
}

.reference-value {
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  width: 100%;
  overflow: hidden;
}

.reference-icon {
  margin-right: 4px;
  color: #1890ff;
  flex-shrink: 0;
  font-size: 16px;
}

.reference-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  min-width: 0;
  font-weight: 500;
}

.clear-btn {
  padding: 0 4px;
  width: 28px;
  height: 28px;
  color: #999;
  flex-shrink: 0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.clear-btn:hover {
  color: #f5222d;
  background-color: #fff0f0;
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