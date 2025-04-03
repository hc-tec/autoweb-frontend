/**
 * 引用处理工具库
 * 统一管理工作流中的引用处理逻辑
 */

/**
 * 检查值是否为引用类型
 * @param {any} value 要检查的值
 * @returns {boolean} 是否为引用类型
 */
export function isReferenceType(value) {
  // 进行更全面的检查
  if (!value || typeof value !== 'object') {
    return false;
  }
  
  // 检查type属性是否为reference或ref
  const hasRefType = value.type === 'reference' || value.type === 'ref';
  if (!hasRefType) {
    return false;
  }
  
  // 检查content属性是否存在
  if (!value.content) {
    return false;
  }
  
  return true;
}

/**
 * 统一引用类型为reference
 * @param {Object} reference 引用对象 
 * @returns {Object} 统一后的引用对象
 */
export function normalizeReference(reference) {
  if (!reference || typeof reference !== 'object') {
    return reference;
  }
  
  // 如果是ref类型，转换为reference类型
  if (reference.type === 'ref') {
    return {
      ...reference,
      type: 'reference'
    };
  }
  
  return reference;
}

/**
 * 格式化引用显示文本
 * @param {Object} reference 引用对象
 * @returns {string} 格式化后的显示文本
 */
export function formatReferenceDisplay(reference) {
  // 严格检查引用类型
  if (!isReferenceType(reference)) {
    return '';
  }
  
  const ref = reference.content || {};
  
  // 获取模块显示名称，优先使用nodeTitle
  const nodeTitle = ref.nodeTitle || ref.moduleID || '';
  
  // 添加模块类型前缀
  let moduleDisplay = '';
  if (nodeTitle) {
    moduleDisplay = nodeTitle
  }
  
  // 获取属性信息
  let varDisplay = '';
  if (ref.name) {
    varDisplay = ref.name;
    if (ref.property) {
      varDisplay += `.${ref.property}`;
    }
  }
  
  // 组合显示格式
  if (moduleDisplay && varDisplay) {
    return `${moduleDisplay} · ${varDisplay}`;
  } else if (moduleDisplay) {
    return moduleDisplay;
  } else if (varDisplay) {
    return varDisplay;
  }
  
  return '引用值';
} 