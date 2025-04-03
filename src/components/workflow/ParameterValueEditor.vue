<template>
  <div class="parameter-value-editor">
    <div v-if="parameterType === 'string'" class="coze-input-wrapper">
      <a-input
        v-model:value="localValue"
        placeholder="输入字符串值"
        @change="updateValue"
        class="coze-input"
      />
    </div>
    
    <div v-else-if="parameterType === 'integer'" class="coze-input-wrapper">
      <a-input-number
        v-model:value="localValue"
        style="width: 100%"
        @change="updateValue"
        class="coze-input"
      />
    </div>
    
    <div v-else-if="parameterType === 'boolean'" class="coze-switch-wrapper">
      <span class="switch-label">{{ localValue ? '是' : '否' }}</span>
      <a-switch
        v-model:checked="localValue"
        @change="updateValue"
        class="coze-switch"
      />
    </div>
    
    <div v-else-if="parameterType === 'array'" class="coze-button-wrapper">
      <a-button @click="openArrayEditor" class="coze-edit-button">
        <edit-outlined /> 编辑数组
      </a-button>
      
      <a-modal
        v-model:visible="arrayEditorVisible"
        title="编辑数组值"
        @ok="handleArrayEditorOk"
        :width="700"
        class="coze-modal"
      >
        <a-alert message="数组值可以采用JSON格式编辑" type="info" show-icon style="margin-bottom: 16px" />
        <a-textarea
          v-model:value="arrayEditorValue"
          :rows="10"
          placeholder="输入JSON格式的数组，例如: [1, 2, 3]"
          class="coze-textarea"
        />
      </a-modal>
    </div>
    
    <div v-else-if="parameterType === 'object'" class="coze-button-wrapper">
      <a-button @click="openObjectEditor" class="coze-edit-button">
        <edit-outlined /> 编辑对象
      </a-button>
      
      <a-modal
        v-model:visible="objectEditorVisible"
        title="编辑对象值"
        @ok="handleObjectEditorOk"
        :width="700"
        class="coze-modal"
      >
        <a-alert message="对象值可以采用JSON格式编辑" type="info" show-icon style="margin-bottom: 16px" />
        <a-textarea
          v-model:value="objectEditorValue"
          :rows="10"
          placeholder="输入JSON格式的对象，例如: { 'key': 'value' }"
          class="coze-textarea"
        />
      </a-modal>
    </div>
    
    <div v-else class="unknown-type-message">
      不支持的参数类型: {{ parameterType }}
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { message } from 'ant-design-vue'
import { EditOutlined } from '@ant-design/icons-vue'

const props = defineProps({
  parameter: {
    type: Object,
    required: true
  },
  parameterType: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:value'])

// 获取当前参数值
const getValue = () => {
  if (props.parameter && props.parameter.input && props.parameter.input.value) {
    return props.parameter.input.value.content
  }
  
  // 根据类型返回默认值
  switch (props.parameterType) {
    case 'string': return ''
    case 'integer': return 0
    case 'boolean': return false
    case 'array': return []
    case 'object': return {}
    default: return null
  }
}

// 本地值
const localValue = ref(getValue())

// 监听参数变化
watch(() => props.parameter, () => {
  localValue.value = getValue()
}, { deep: true })

// 更新值
const updateValue = () => {
  emit('update:value', props.parameter.name, localValue.value)
}

// 数组编辑器
const arrayEditorVisible = ref(false)
const arrayEditorValue = ref('')

const openArrayEditor = () => {
  try {
    const value = getValue()
    arrayEditorValue.value = JSON.stringify(value, null, 2)
    arrayEditorVisible.value = true
  } catch (error) {
    arrayEditorValue.value = '[]'
    arrayEditorVisible.value = true
  }
}

const handleArrayEditorOk = () => {
  try {
    const parsedValue = JSON.parse(arrayEditorValue.value)
    if (!Array.isArray(parsedValue)) {
      throw new Error('输入值必须是有效的数组')
    }
    
    localValue.value = parsedValue
    updateValue()
    arrayEditorVisible.value = false
  } catch (error) {
    message.error('请输入有效的JSON数组格式')
  }
}

// 对象编辑器
const objectEditorVisible = ref(false)
const objectEditorValue = ref('')

const openObjectEditor = () => {
  try {
    const value = getValue()
    objectEditorValue.value = JSON.stringify(value, null, 2)
    objectEditorVisible.value = true
  } catch (error) {
    objectEditorValue.value = '{}'
    objectEditorVisible.value = true
  }
}

const handleObjectEditorOk = () => {
  try {
    const parsedValue = JSON.parse(objectEditorValue.value)
    if (typeof parsedValue !== 'object' || Array.isArray(parsedValue) || parsedValue === null) {
      throw new Error('输入值必须是有效的对象')
    }
    
    localValue.value = parsedValue
    updateValue()
    objectEditorVisible.value = false
  } catch (error) {
    message.error('请输入有效的JSON对象格式')
  }
}
</script>

<style scoped>
.parameter-value-editor {
  margin-bottom: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.coze-input-wrapper {
  margin-bottom: 4px;
}

.coze-input {
  border-radius: 4px;
  border-color: #e9e7ff;
}

.coze-input:focus, 
.coze-input:hover {
  border-color: #6f5bd5;
}

.coze-switch-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.switch-label {
  color: #666;
}

.coze-switch {
  background-color: #6f5bd5;
}

.coze-button-wrapper {
  margin-top: 4px;
}

.coze-edit-button {
  width: 100%;
  border-color: #e9e7ff;
  color: #6f5bd5;
}

.coze-edit-button:hover {
  border-color: #6f5bd5;
  color: #6f5bd5;
  background-color: #f9f8ff;
}

.coze-modal :deep(.ant-modal-content) {
  border-radius: 8px;
}

.coze-modal :deep(.ant-modal-header) {
  border-radius: 8px 8px 0 0;
  background-color: #f9f8ff;
}

.coze-modal :deep(.ant-modal-title) {
  color: #6f5bd5;
}

.coze-textarea {
  border-color: #e9e7ff;
  border-radius: 4px;
}

.coze-textarea:focus, 
.coze-textarea:hover {
  border-color: #6f5bd5;
}

.unknown-type-message {
  padding: 8px;
  color: #ff4d4f;
  background-color: #fff2f0;
  border-radius: 4px;
  border: 1px solid #ffccc7;
}
</style> 