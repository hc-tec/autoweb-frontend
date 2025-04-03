import { inject } from 'vue'

/**
 * 节点更新器组合式函数
 * 提供直接修改工作流节点数据的功能
 * 
 * @returns {Object} 节点更新相关方法
 */
export function useNodeUpdater() {
  // 注入根级提供的节点更新函数
  const updateNode = inject('updateNode')
  
  /**
   * 更新节点的部分数据
   * @param {String} nodeId 节点ID
   * @param {Object} updates 节点数据更新
   */
  const updateNodeData = (nodeId, updates) => {
    if (!nodeId) {
      console.error('更新节点失败: 未提供节点ID')
      return
    }
    
    console.log(`更新节点 ${nodeId}:`, updates)
    updateNode(nodeId, updates)
  }
  
  /**
   * 更新节点的输入参数
   * @param {Object} node 节点对象
   * @param {String} param 参数名
   * @param {any} value 参数值
   */
  const updateNodeParam = (node, param, value) => {
    const paramName = param.name;
    if (!node || !node.id) {
      console.error('更新参数失败: 未提供有效节点')
      return
    }
    
    // 获取当前输入参数
    const nodeInputs = node.data?.inputs || {}
    const inputParams = Array.isArray(nodeInputs.input_parameters) 
      ? [...nodeInputs.input_parameters] 
      : []
    
    // 查找或创建参数  
    const existingIndex = inputParams.findIndex(p => p.name === paramName)
    const paramValue = {
      name: paramName,
      input: { value, type: param.type }
    }
    
    // 更新或添加参数
    if (existingIndex >= 0) {
      inputParams[existingIndex] = paramValue
    } else {
      inputParams.push(paramValue)
    }
    
    // 更新节点
    updateNodeData(node.id, {
      inputs: {
        ...nodeInputs,
        input_parameters: inputParams
      }
    })
  }
  
  /**
   * 更新节点的代码内容
   * @param {Object} node 节点对象
   * @param {Object} codeValue 代码值
   */
  const updateNodeCode = (node, codeValue) => {
    if (!node || !node.id) {
      console.error('更新代码失败: 未提供有效节点')
      return
    }
    
    updateNodeData(node.id, { code: codeValue })
  }
  
  /**
   * 更新节点的输入定义和相应的参数
   * @param {Object} node 节点对象
   * @param {Array} inputDefs 输入定义数组
   */
  const updateNodeInputDefs = (node, inputDefs) => {
    if (!node || !node.id || !Array.isArray(inputDefs)) {
      console.error('更新输入定义失败: 参数无效')
      return
    }
    
    // 获取当前节点的input_parameters（如果有）
    const existingParams = node.data.inputs?.input_parameters || []
    
    // 保留匹配的参数，添加新参数
    const updatedParams = []
    inputDefs.forEach(def => {
      const existingParam = existingParams.find(p => p.name === def.name)
      updatedParams.push({
        name: def.name,
        input: {
          type: def.type,
          value: def.default || null
        }
      })
    })
    
    // 更新节点
    updateNodeData(node.id, {
      inputs: {
        ...(node.data.inputs || {}),
        input_defs: JSON.parse(JSON.stringify(inputDefs)),
        input_parameters: updatedParams
      }
    })
  }
  
  /**
   * 更新节点的元数据
   * @param {Object} node 节点对象
   * @param {Object} metaUpdates 元数据更新
   */
  const updateNodeMeta = (node, metaUpdates) => {
    if (!node || !node.id) {
      console.error('更新元数据失败: 未提供有效节点')
      return
    }
    
    updateNodeData(node.id, {
      meta: {
        ...(node.data.meta || {}),
        ...metaUpdates
      }
    })
  }
  
  /**
   * 更新节点的schema
   * @param {Object} node 节点对象
   * @param {Object} schemaUpdates schema更新
   */
  const updateNodeSchema = (node, schemaUpdates) => {
    if (!node || !node.id) {
      console.error('更新schema失败: 未提供有效节点')
      return
    }
    
    // 获取当前的schema
    const currentSchema = node.data.schema || {}
    
    // 特殊处理outputs字段，确保不会丢失其他输出参数的schema
    if (schemaUpdates.outputs) {
      // 确保outputs字段存在
      if (!currentSchema.outputs) {
        currentSchema.outputs = {}
      }
      
      // 合并outputs内容，而不是替换整个outputs对象
      Object.assign(currentSchema.outputs, schemaUpdates.outputs)
    } else {
      // 其他字段直接合并
      Object.assign(currentSchema, schemaUpdates)
    }
    
    // 更新节点
    updateNodeData(node.id, {
      schema: currentSchema
    })
    
    console.log('Schema成功更新', currentSchema)
  }
  
  return {
    updateNodeData,
    updateNodeParam,
    updateNodeCode,
    updateNodeInputDefs,
    updateNodeMeta,
    updateNodeSchema
  }
} 