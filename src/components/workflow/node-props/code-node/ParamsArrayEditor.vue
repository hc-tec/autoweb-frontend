<!-- 用在code-node的输入输出参数编辑器 -->
<template>
  <div class="params-array-editor">
    <array-field-editor
      :value="paramDefinitions"
      :columns="paramColumns"
      :default-field-template="defaultParamTemplate"
      :add-button-text="addButtonText"
      :empty-text="emptyText"
      :current-node-id="currentNodeId"
      @update="updateParamDefinitions"
    />
    
    <!-- 调试区域 - 默认隐藏，需要时可以启用 -->
    <div class="debug-info" v-if="false">
      <div class="debug-title">{{ props.paramType === 'input' ? '输入参数' : '输出参数' }}调试信息</div>
      <div class="debug-section">
        <div class="section-title">当前参数定义:</div>
        <pre>{{ JSON.stringify(paramDefinitions, null, 2) }}</pre>
      </div>
      <div class="debug-section">
        <div class="section-title">传入值:</div>
        <pre>{{ JSON.stringify(props.value, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import ArrayFieldEditor from '../param-inputs/ArrayFieldEditor.vue';
import { isReferenceType, normalizeReference } from '../param-inputs/referenceUtils';

const props = defineProps({
  // 参数定义数组
  value: {
    type: Array,
    default: () => []
  },
  // 参数类型 'input' 或 'output'
  paramType: {
    type: String,
    default: 'input',
    validator: (value) => ['input', 'output'].includes(value)
  },
  needVaryValueInput: {
    type: Boolean,
    default: true
  },
  // 当前节点的ID (用于引用)
  currentNodeId: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update']);

// 按参数类型设置不同的按钮文本
const addButtonText = computed(() => {
  return props.paramType === 'input' ? '' : '';
});

// 空状态提示文本
const emptyText = computed(() => {
  return props.paramType === 'input' ? '暂无输入参数' : '暂无输出参数';
});

// 参数列定义
const paramColumns = computed(() => {
  // 基础列定义
  const columns = [
    { 
      title: '变量名', 
      dataIndex: 'name', 
      key: 'name', 
      type: 'string', 
      placeholder: '变量名', 
      width: '30%', 
      supportReference: false
    },
    { 
      title: '类型', 
      dataIndex: 'type', 
      key: 'type', 
      type: 'select',
      options: [
        { value: 'string', label: '字符串' },
        { value: 'integer', label: '数字' },
        { value: 'boolean', label: '布尔值' },
        { value: 'array', label: '数组' },
        { value: 'object', label: '对象' }
      ],
      width: '20%',
      supportReference: false
    }
  ];
  
  // 只对输入参数添加值列，并支持引用
  if (props.needVaryValueInput) {
    columns.push({
      title: '变量值', 
      dataIndex: 'default', 
      key: 'default', 
      type: 'string',
      placeholder: '变量值', 
      width: '50%',
      supportReference: true,
      ellipsis: true
    });
  }
  
  return columns;
});

// 默认参数模板
const defaultParamTemplate = computed(() => {
  const template = {
    name: props.paramType === 'input' ? `input${props.value?.length || 0}` : `key${props.value?.length || 0}`,
    type: 'string',
    // 保留描述字段但不显示在UI中，以维持兼容性
    description: props.paramType === 'input' ? '输入参数' : '输出参数'
  };
  
  
  if (props.paramType === 'input') {
    template.default = '';
    template.required = false;
  } else {
    // 保留必填属性但不显示在UI中
    template.required = false;
  }
  
  return template;
});

// 本地参数定义 - 使用ref，确保可修改
const paramDefinitions = ref([]);

// 初始化
onMounted(() => {
  // 强制初始化，确保能从props接收到初始值
  syncFromProps();
  
});

// 同步数据方法
const syncFromProps = () => {
  if (Array.isArray(props.value)) {
    // 使用深拷贝确保数据独立性
    paramDefinitions.value = JSON.parse(JSON.stringify(props.value || []));
    
    if (props.needVaryValueInput) {
      paramDefinitions.value.forEach((param) => {
        if (param.default === undefined) {
          param.default = '';
        } else if (isReferenceType(param.default)) {
          // 统一转换为reference类型
          param.default = normalizeReference(param.default);
        }
      });
    }
  } else {
    // 如果不是数组，初始化为空数组
    paramDefinitions.value = [];
  }
};

// 监听props.value变化
watch(() => props.value, (newValue) => {
  syncFromProps();
}, { deep: true, immediate: true });

// 更新参数定义
const updateParamDefinitions = (updatedParams) => {
  // 确保是数组
  if (!Array.isArray(updatedParams)) {
    return;
  }
  
  // 使用深拷贝确保数据独立性
  const params = JSON.parse(JSON.stringify(updatedParams));
  
  // 处理输入参数的引用和默认值
  if (props.paramType === 'input') {
    params.forEach((param) => {
      if (isReferenceType(param.default)) {
      }
    });
  }
  
  // 更新本地状态
  paramDefinitions.value = params;
  
  // 通知父组件更新 - 延迟执行确保DOM已更新
  setTimeout(() => {
    emit('update', params);
  }, 0);
};
</script>

<style scoped>
.params-array-editor {
  width: 100%;
}

.debug-info {
  margin-top: 10px;
  padding: 10px;
  background-color: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  max-height: 300px;
  overflow: auto;
}

.debug-title {
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 14px;
  color: #1890ff;
}

.debug-section {
  margin-bottom: 10px;
  padding: 5px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
}

.section-title {
  font-weight: bold;
  margin-bottom: 5px;
  color: #555;
}
</style> 