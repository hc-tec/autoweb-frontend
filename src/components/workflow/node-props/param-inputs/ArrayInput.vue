<template>
  <div class="array-input">
    <div v-if="isLiteral" class="literal-input">
      <a-textarea
        size="small"
        :value="arrayDisplayValue"
        @blur="updateArrayValue"
        :placeholder="param.required ? '必填JSON数组' : '输入JSON数组'"
        class="array-textarea"
        :autoSize="{ minRows: 3, maxRows: 20 }"
      />
      <div class="textarea-actions">
        <reference-selector
          :currentNodeId="node.id"
          @select-reference="handleRefSelect"
        >
          <a-button type="text" size="small" class="ref-selector-trigger">
            <link-outlined class="link-icon" />
          </a-button>
        </reference-selector>
      </div>
    </div>
    
    <div v-else class="reference-value">
      <a-button type="text" class="clear-btn" @click="clearReference">
        <close-outlined />
      </a-button>
      <a-tag color="blue">
        <link-outlined class="link-icon" />
        {{ referenceDisplay }}</a-tag>
      
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { LinkOutlined, CloseOutlined } from '@ant-design/icons-vue';
import ReferenceSelector from '../ReferenceSelector.vue';
import { useNodeUpdater } from '@/composables/useNodeUpdater';

const props = defineProps({
  param: {
    type: Object,
    required: true
  },
  value: {
    type: [Object, Array, String, null],
    default: null
  },
  node: {
    type: Object,
    required: true
  }
});

// 获取节点更新器
const { updateNodeParam } = useNodeUpdater();

// 判断是否为字面值
const isLiteral = computed(() => {
  return !props.value || props.value.type !== 'reference';
});

// 获取显示值
const arrayDisplayValue = computed(() => {
  if (!props.value) {
    return '[]';
  }
  
  if (props.value.type === 'literal') {
    // 如果内容是字符串，尝试美化JSON
    if (typeof props.value.content === 'string') {
      try {
        const parsed = JSON.parse(props.value.content);
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        return props.value.content || '[]';
      }
    }
    // 如果是数组，直接美化
    if (Array.isArray(props.value.content)) {
      return JSON.stringify(props.value.content, null, 2);
    }
    return props.value.content || '[]';
  }
  
  return '[]';
});

// 引用显示
const referenceDisplay = computed(() => {
  if (props?.value?.type !== 'reference') {
    return '';
  }
  return `${props.value.content.nodeTitle} · ${props.value.content.moduleType}`;
});

// 更新数组值的方法
const updateArrayValue = (event) => {
  try {
    const value = event.target.value;
    let parsedValue;
    
    try {
      parsedValue = JSON.parse(value);
    } catch (e) {
      // 如果无法解析为JSON，则使用原始值
      parsedValue = value;
    }
    
    // 使用节点更新器更新参数
    updateNodeParam(props.node, props.param, {
      type: 'reference',
      content: parsedValue
    });
  } catch (e) {
    console.error('更新数组值错误:', e);
  }
};

// 处理引用选择
const handleRefSelect = (reference) => {
  // 使用节点更新器更新参数
  updateNodeParam(props.node, props.param, reference);
};

// 清除引用
const clearReference = () => {
  // 使用节点更新器更新参数
  updateNodeParam(props.node, props.param, {
    type: 'literal',
    content: []
  });
};
</script>

<style scoped>
.array-input {
  flex: 1;
  width: 100%;
}

.literal-input {
  display: flex;
  position: relative;
}

.array-textarea {
  width: 100%;
  flex: 1;
}

.textarea-actions {
  position: absolute;
  right: 8px;
  bottom: 8px;
  z-index: 10;
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