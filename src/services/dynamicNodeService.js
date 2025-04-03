/**
 * 动态节点服务 - 用于处理动态节点的运行时逻辑
 */

/**
 * 处理动态输入节点的执行
 * 将所有输入参数直接映射到对应的输出
 * 
 * @param {Object} node - 动态输入节点数据
 * @param {Object} inputs - 节点输入参数值
 * @returns {Object} 节点的输出值
 */
export function executeDynamicInputNode(node, inputs) {
  console.log('执行动态输入节点:', node.module_id);
  
  // 获取所有输入参数
  const inputParameters = node.inputs?.input_parameters || [];
  const outputs = {};
  
  // 遍历所有输入参数，将它们直接映射到输出
  inputParameters.forEach(param => {
    const paramName = param.name;
    
    // 如果输入中有该参数的值，则使用输入值
    if (inputs && inputs[paramName] !== undefined) {
      outputs[paramName] = inputs[paramName];
    } 
    // 否则使用默认值
    else if (param.input && param.input.value) {
      // 处理字面量值的情况
      if (param.input.value.type === 'literal') {
        outputs[paramName] = param.input.value.content;
      } else {
        outputs[paramName] = param.input.value;
      }
    }
  });
  
  console.log('动态输入节点输出:', outputs);
  return outputs;
}

/**
 * 验证动态输入节点的输入参数
 * 
 * @param {Object} node - 动态输入节点数据
 * @param {Object} inputs - 节点输入参数值
 * @returns {Object} 验证结果 {valid: boolean, errors: Array}
 */
export function validateDynamicInputNode(node, inputs) {
  const inputDefs = node.inputs?.input_defs || [];
  const errors = [];
  
  // 验证必填参数
  inputDefs.forEach(def => {
    if (def.required && (!inputs || inputs[def.name] === undefined)) {
      errors.push(`参数 "${def.name}" 是必填的`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
} 