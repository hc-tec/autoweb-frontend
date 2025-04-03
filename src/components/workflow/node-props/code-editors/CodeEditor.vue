<template>
  <div class="code-editor-container">

    <!-- 代码编辑区域 -->
    <div class="editor-main">
      <div class="code-actions">
        <div class="save-indicator" :class="{ 'unsaved': !isSaved }">
          <div class="indicator-dot" :title="isSaved ? '已保存' : '未保存'"></div>
        </div>
        <a-button type="link" @click="saveCode" class="save-btn">
          <save-outlined /> 保存 (Ctrl+S)
        </a-button>
        <a-button type="link" @click="openInIDE">
          <code-outlined /> 在IDE中编辑
        </a-button>
      </div>
      <div ref="monacoContainer" class="monaco-container"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import * as monaco from 'monaco-editor';
import { CaretRightOutlined, CloseOutlined, EllipsisOutlined, CodeOutlined, SaveOutlined } from '@ant-design/icons-vue';

const props = defineProps({
  value: {
    type: [String, Object],
    default: ''
  },
  language: {
    type: String,
    default: 'python'
  },
  title: {
    type: String,
    default: '代码编辑器'
  },
  description: {
    type: String,
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

// 编辑器实例
let editor = null;
const monacoContainer = ref(null);

// 保存状态
const isSaved = ref(true);
const currentValue = ref('');

// 获取代码内容
const getCodeValue = () => {
  if (typeof props.value === 'object' && props.value !== null) {
    if (props.language === 'python' && props.value.python_code !== undefined) {
      return props.value.python_code;
    }
    return JSON.stringify(props.value, null, 2);
  }
  return props.value || '';
};

// 初始化编辑器
const initMonaco = () => {
  if (!monacoContainer.value) return;
  
  // 获取初始代码
  const modelValue = getCodeValue();
  currentValue.value = modelValue;
  
  // 创建编辑器实例
  editor = monaco.editor.create(monacoContainer.value, {
    value: modelValue,
    language: props.language,
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: {
      enabled: false
    },
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    fontFamily: 'Consolas, "Courier New", monospace',
    fontSize: 14,
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'on'
  });
  
  // 监听内容变化，但不立即更新，仅标记为未保存
  editor.onDidChangeModelContent(() => {
    isSaved.value = false;
  });
  
  // 监听失去焦点事件
  editor.onDidBlurEditorWidget(() => {
    if (!isSaved.value) {
      saveCode();
    }
  });
  
  // 添加键盘快捷键
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    saveCode();
  });
};

// 保存代码
const saveCode = () => {
  if (!editor) return;
  
  const value = editor.getValue();
  currentValue.value = value;
  
  if (props.language === 'python') {
    emit('update:value', { python_code: value });
  } else {
    emit('update:value', value);
  }
  
  isSaved.value = true;
};

// 在IDE中打开编辑
const openInIDE = () => {
  // 这里可以实现IDE集成功能
  console.log('在IDE中打开编辑');
};

// 监听值和输入输出参数变化
watch([() => props.value, () => props.inputs, () => props.outputs], () => {
  if (editor) {
    const newValue = getCodeValue();
    
    // 只有在props值与当前编辑器内容不同时才更新编辑器内容
    if (newValue !== currentValue.value) {
      editor.setValue(newValue);
      currentValue.value = newValue;
      isSaved.value = true;
    }
  }
}, { deep: true });

// 生命周期钩子
onMounted(() => {
  initMonaco();
});

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose();
    editor = null;
  }
});
</script>

<style scoped>
.code-editor-container {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e8e8e8;
  background-color: #fff;
  height: 100%;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f9f9f9;
  border-bottom: 1px solid #e8e8e8;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
}

.action-btn {
  margin-left: 8px;
}

.editor-description {
  padding: 8px 16px;
  font-size: 14px;
  color: #666;
  border-bottom: 1px solid #f0f0f0;
}

.editor-inputs, .editor-outputs {
  border-bottom: 1px solid #f0f0f0;
}

.inputs-container, .outputs-container {
  padding: 8px 16px;
}

.input-row, .output-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px dashed #f0f0f0;
}

.input-row:last-child, .output-row:last-child {
  border-bottom: none;
}

.param-name {
  font-weight: 500;
  flex: 1;
}

.param-type {
  color: #888;
  flex: 1;
}

.param-desc {
  color: #888;
  flex: 2;
}

.required {
  color: #ff4d4f;
  margin-left: 2px;
}

.editor-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.monaco-container {
  height: 300px;
  width: 100%;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
}

.code-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 8px;
}

.save-indicator {
  margin-right: 12px;
  display: flex;
  align-items: center;
}

.indicator-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #52c41a;
  transition: background-color 0.3s ease;
}

.unsaved .indicator-dot {
  background-color: #f5222d;
  animation: pulse 2s infinite;
}

.save-btn {
  margin-right: 12px;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(245, 34, 45, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(245, 34, 45, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(245, 34, 45, 0);
  }
}

:deep(.ant-collapse) {
  background: transparent;
}

:deep(.ant-collapse-header) {
  padding: 8px 0;
  font-weight: 500;
}

:deep(.ant-collapse-content-box) {
  padding: 0 !important;
}
</style> 