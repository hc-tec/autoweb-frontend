<template>
  <div class="fields-input">
    <array-field-editor
      :value="value"
      :columns="fieldColumns"
      :default-field-template="defaultField"
      :current-node-id="currentNodeId"
      add-button-text="添加字段"
      empty-text="暂无提取字段"
      @update="updateFieldsValue"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import ArrayFieldEditor from './ArrayFieldEditor.vue';

const props = defineProps({
  param: {
    type: Object,
    required: true
  },
  value: {
    type: [Object, Array, null],
    default: null
  },
  currentNodeId: {
    type: String,
    default: ''
  },
  nodeData: {
    type: Object,
    default: () => ({})
  },
  fieldColumns: {
    type: Array,
    default: () => [
  { title: '变量名', dataIndex: 'name', key: 'name', type: 'string', placeholder: '变量名', width: '20%', supportReference: false },
  { title: '类型', dataIndex: 'type', key: 'type', type: 'select', placeholder: '类型', options: [
    {label: "字符串", value: "string"},
    {label: "数字", value: "integer"},
    {label: "布尔值", value: "boolean"}, 
    {label: "数组", value: "array"},
    {label: "对象", value: "object"}
  ], width: '20%', supportReference: false },
  { 
    title: 'XPath', 
    dataIndex: 'xpath', 
    key: 'xpath', 
    type: 'string', 
    placeholder: 'XPath', 
    width: '50%', 
    ellipsis: true, 
    supportReference: true 
  }
]
  }
});

const emit = defineEmits(['update', 'clear-reference']);

// 默认字段模板
const defaultField = {
  name: '',
  xpath: ''
};

// 更新字段值的方法
const updateFieldsValue = (newFields) => {
  // 确保格式正确
  emit('update', {
    type: 'reference',
    content: JSON.parse(JSON.stringify(newFields))
  });
};
</script>

<style scoped>
.fields-input {
  width: 100%;
}
</style> 