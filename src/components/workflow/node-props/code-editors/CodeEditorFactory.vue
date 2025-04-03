<template>
  <component 
    :is="editorComponent" 
    v-bind="editorProps"
    :value="value"
    @update:value="updateValue"
    @close="$emit('close')"
  />
</template>

<script setup>
import { computed } from 'vue';
import { getEditorConfig } from './index.js';

const props = defineProps({
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
  }
});

const emit = defineEmits(['update:value', 'close']);

// 根据类型获取编辑器配置
const editorConfig = computed(() => getEditorConfig(props.type));

// 编辑器组件
const editorComponent = computed(() => editorConfig.value.component);

// 合并基础属性和自定义属性
const editorProps = computed(() => {
  return {
    ...editorConfig.value.props,
    inputs: props.inputs,
    outputs: props.outputs
  };
});

// 更新值
const updateValue = (value) => {
  if (editorConfig.value.setCodeValue) {
    const processedValue = editorConfig.value.setCodeValue(value);
    emit('update:value', processedValue);
  } else {
    emit('update:value', value);
  }
};
</script> 