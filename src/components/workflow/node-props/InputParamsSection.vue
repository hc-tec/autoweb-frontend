<template>
  <div class="input-params-section">
    <a-collapse v-model:activeKey="activeKeys" :bordered="false">
      <a-collapse-panel key="inputs" :header="headerTitle" class="param-panel">
        <div class="param-list">
          <div v-for="param in inputDefinitions" :key="param.name" class="param-row">
            <div class="param-header">
              <a-tooltip :title="param.description" placement="top">
                <div class="param-name">
                  {{ param.name }}
                  <span v-if="isParamRequired(param)" class="required-mark">*</span>
                </div>
              </a-tooltip>
            </div>
            
            <!-- 参数输入组件 -->
            <param-input
              :param="param"
              :value="getParamValue(param.name)"
              :current-node-id="nodeId"
              @update="(value) => updateParamValue(param.name, value)"
              @clear-reference="() => clearReference(param.name)"
            />
          </div>
        </div>
      </a-collapse-panel>
    </a-collapse>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import ParamInput from './ParamInput.vue';

const props = defineProps({
  node: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update-param']);

// 展开状态
const activeKeys = ref(['inputs']);

// 获取节点ID
const nodeId = computed(() => props.node?.id || '');

// 输入定义
const inputDefinitions = computed(() => {
  if (!props.node || !props.node.data || !props.node.data.inputs || !props.node.data.inputs.input_defs) {
    return [];
  }
  return props.node.data.inputs.input_defs;
});

// 标题行显示
const headerTitle = computed(() => {
  return `入参 (${inputDefinitions.value.length})`;
});

// 判断参数是否必填
const isParamRequired = (param) => {
  return param.required === true;
};

// 获取参数值
const getParamValue = (paramName) => {
  if (!props.node || !props.node.data || !props.node.data.inputs || !props.node.data.inputs.input_parameters) {
    return null;
  }
  
  // 在input_parameters中查找对应名称的参数
  const paramInfo = props.node.data.inputs.input_parameters.find(p => p.name === paramName);
  if (!paramInfo || !paramInfo.input || !paramInfo.input.value) {
    return null;
  }
  
  return paramInfo.input.value;
};

// 更新参数值
const updateParamValue = (paramName, value) => {
  emit('update-param', { paramName, value });
};

// 清除引用
const clearReference = (paramName) => {
  updateParamValue(paramName, null);
};
</script>

<style scoped>

.param-panel {
  background: white;
}

:deep(.ant-collapse-header) {
  padding: 8px 16px !important;
  font-size: 14px;
  font-weight: 500;
}

:deep(.ant-collapse-content-box) {
  padding: 0 !important;
}

.param-list {
  position: relative;
}

.param-row {
  display: flex;
  padding: 8px 16px;
  align-items: center;
}

.param-row:last-child {
  border-bottom: none;
}

.param-header {
  flex: 1;
  display: flex;
  align-items: center;
}

.param-name {
  font-size: 14px;
  color: #333;
  cursor: default;
  display: flex;
  align-items: center;
}

.required-mark {
  color: #ff4d4f;
  margin-left: 4px;
}
</style> 