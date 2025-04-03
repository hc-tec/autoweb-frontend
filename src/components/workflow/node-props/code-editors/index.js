/**
 * 代码编辑器注册系统
 * 使用策略模式，避免大量if-else判断
 */
import CodeEditor from './CodeEditor.vue';

// 编辑器类型映射表
const editorRegistry = new Map();

/**
 * 默认Python代码编辑器配置
 */
const defaultPythonEditorConfig = {
  component: CodeEditor,
  props: {
    language: 'python',
    title: '代码',
    description: ''
  },
  getCodeValue: (value) => {
    if (!value || typeof value !== 'object') return '';
    return value.python_code || '';
  },
  setCodeValue: (value) => {
    return { python_code: value };
  }
};

/**
 * 注册新的代码编辑器
 * @param {string} type 编辑器类型
 * @param {Object} config 编辑器配置
 */
export function registerEditor(type, config) {
  editorRegistry.set(type, config);
}

/**
 * 获取编辑器配置
 * @param {string} type 编辑器类型
 * @returns {Object} 编辑器配置
 */
export function getEditorConfig(type) {
  return editorRegistry.get(type) || defaultPythonEditorConfig;
}

/**
 * 检查是否为代码编辑器类型
 * @param {string} type 编辑器类型
 * @returns {boolean} 是否为代码编辑器
 */
export function isCodeEditor(type) {
  return editorRegistry.has(type);
}

// 注册Python代码编辑器
registerEditor('python_code', defaultPythonEditorConfig);

// 这里可以注册更多编辑器类型，如JavaScript、SQL等
// 例如:
// registerEditor('javascript_code', { ... });

export default {
  CodeEditor,
  registerEditor,
  getEditorConfig,
  isCodeEditor
}; 