<template>
  <component 
    v-if="resolvedComponent"
    :is="resolvedComponent"
    :param="param"
    :value="value"
    :node="node"
    @update="updateValue"
    @clear-reference="clearReference"
  />
  <div v-else class="fallback-input">
    <a-input
      size="small"
      :value="getDisplayValue"
      @blur="updateValue"
      :placeholder="param.required ? '必填' : '输入参数值'"
    />
  </div>
</template>

<script setup>
import { computed, markRaw, ref, defineAsyncComponent } from 'vue';
import { getInputComponentForParam } from './index.js';
import { useNodeUpdater } from '@/composables/useNodeUpdater';

const props = defineProps({
  param: {
    type: Object,
    required: true
  },
  value: {
    type: [Object, String, Number, Boolean, Array, null],
    default: null
  },
  node: {
    type: Object,
    required: true
  }
});

// 获取节点更新器
const { updateNodeParam } = useNodeUpdater();

// 动态导入组件
const asyncImport = (componentName) => {
  return defineAsyncComponent(() => import(`./${componentName}.vue`));
};

// 动态选择合适的输入组件
const resolvedComponent = computed(() => {
  try {
    // 使用getInputComponentForParam获取合适的组件
    const componentClass = getInputComponentForParam(props.param);
    if (!componentClass) {
      return null;
    }
    
    // 获取组件名称
    const componentName = componentClass.__name || componentClass.name;
    
    // 异步导入组件
    return markRaw(asyncImport(componentName));
  } catch (e) {
    console.error('组件加载错误:', e);
    return null;
  }
});

// 获取默认显示值（用于fallback）
const getDisplayValue = computed(() => {
  if (!props.value) return '';
  
  if (props.value.type === 'literal') {
    return props.value.content;
  }
  
  return props.value;
});

// 更新值
const updateValue = (value) => {
  // 直接使用节点更新器更新参数
  updateNodeParam(props.node, props.param, value);
};

// 清除引用
const clearReference = () => {
  updateValue(null);
};
</script>

<style scoped>
.fallback-input {
  flex: 1;
  display: flex;
}
</style> 