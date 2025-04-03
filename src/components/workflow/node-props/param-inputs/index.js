/**
 * 参数输入组件注册系统
 * 使用策略模式，避免大量if-else判断
 */

import StringInput from './StringInput.vue';
import NumberInput from './NumberInput.vue';
import BooleanInput from './BooleanInput.vue';
import ArrayInput from './ArrayInput.vue';
import ObjectInput from './ObjectInput.vue';
import FieldsInput from './FieldsInput.vue';

// 参数类型到组件的映射
const typeComponentMap = {
  // 基本类型
  string: StringInput,
  integer: NumberInput,
  boolean: BooleanInput,
  array: ArrayInput,
  object: ObjectInput,
  
  // 特殊类型
  fields: FieldsInput,
};

/**
 * 根据参数类型获取相应的输入组件
 * @param {Object} param 参数对象
 * @returns {Object} Vue组件
 */
export function getInputComponentForParam(param) {
  // 特殊处理fields参数
  if (param.name === 'fields' && param.type === 'array') {
    return typeComponentMap.fields;
  }
  
  // 使用参数类型获取对应组件
  const component = typeComponentMap[param.type];
  
  // 如果找不到对应组件，则根据类型返回兜底组件
  if (!component) {
    // 使用类型查找
    const type = param.type || 'string';
    
    // 匹配主要类型
    if (type.includes('int') || type.includes('float') || type.includes('integer')) {
      return typeComponentMap.integer;
    } else if (type.includes('bool')) {
      return typeComponentMap.boolean;
    } else if (type.includes('array') || type.includes('[]')) {
      return typeComponentMap.array;
    } else if (type.includes('object') || type.includes('json') || type.includes('map')) {
      return typeComponentMap.object;
    }
    
    // 默认返回字符串输入
    return typeComponentMap.string;
  }
  
  return component;
}

export default {
  install(app) {
    // 注册所有组件
    app.component('StringInput', StringInput);
    app.component('NumberInput', NumberInput);
    app.component('BooleanInput', BooleanInput);
    app.component('ArrayInput', ArrayInput);
    app.component('ObjectInput', ObjectInput);
    app.component('FieldsInput', FieldsInput);
  }
}; 