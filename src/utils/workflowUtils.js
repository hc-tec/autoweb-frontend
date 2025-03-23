/**
 * 将工作流JSON数据转换为VueFlow节点和边
 * 
 * @param {Object} workflowJson 工作流JSON数据
 * @returns {Object} 包含nodes和edges的对象
 */
export function loadWorkflowFromJson(workflowJson) {
  if (!workflowJson || !workflowJson.modules) {
    console.error('工作流JSON格式无效')
    return { nodes: [], edges: [] }
  }
  
  // 创建一个递归函数，确保能够处理嵌套节点中的子模块
  function processModules(modules, allNodes = [], parentId = null) {
    modules.forEach((module, index) => {
      // 计算节点位置
      // 1. 如果模块有position属性，优先使用
      // 2. 如果是子节点，需要加上父节点的位置
      // 3. 如果都没有，则使用默认布局
      let posX, posY
      
      if (module.position) {
        // 使用模块中定义的位置
        posX = module.position.x
        posY = module.position.y
      }
      
      // 确定节点类型
      const hasChildren = module.slots && Array.isArray(module.slots) && module.slots.length > 0
      const nodeType = hasChildren || module.module_type === 'composite' ? 'composite' : 'custom'
      
      // 确定节点分类
      const moduleCategory = 'default'
      
      // 创建节点
      const node = {
        id: module.module_id,
        type: nodeType,
        position: { x: posX, y: posY },
        className: `node-type-${moduleCategory}`,
        expandParent: parentId !== null, // 子节点自动扩展父节点
        data: {
          ...module,
          // 确保节点有必要的数据结构
          module_id: module.module_id,
          module_type: module.module_type,
          meta: module.meta || {
            title: module.module_id,
            description: '',
            category: moduleCategory
          },
          inputs: module.inputs || {
            input_defs: [],
            input_parameters: []
          },
          outputs: module.outputs || {
            output_defs: []
          }
        }
      }
      
      // 设置父节点关系
      if (parentId) {
        node.parentNode = parentId
        node.extent = 'parent'
      }
      
      // 添加节点到结果数组
      allNodes.push(node)
      
      // 递归处理子模块
      if (hasChildren) {
        // 确保子模块中的每个模块都有module_id
        const childrenModules = module.slots.filter(slot => slot.module_id)
        if (childrenModules.length > 0) {
          // 将当前节点的位置传递给子节点处理函数
          processModules(childrenModules, allNodes, module.module_id)
        }
      }
    })
    
    return allNodes
  }
  
  // 处理所有模块
  const nodes = processModules(workflowJson.modules)
  
  // 创建边（连接关系）
  const edges = []
  
  return { nodes, edges }
}

/**
 * 将VueFlow节点和边转换回工作流JSON
 * 
 * @param {Array} nodes VueFlow节点数组
 * @param {Array} edges VueFlow边数组
 * @returns {Object} 工作流JSON数据
 */
export function saveWorkflowToJson(nodes, edges) {
  // 创建节点映射，用于快速查找
  const nodeMap = new Map()
  nodes.forEach(node => {
    nodeMap.set(node.id, node)
  })
  
  // 找出顶层节点（没有父节点的节点）
  const topLevelNodes = nodes.filter(node => !node.parentNode)
  
  // 提取模块数据，递归处理子节点
  function extractModuleData(node, parentPosition = { x: 0, y: 0 }) {
    const { data, position } = node
    
    // 基本模块数据
    const moduleData = {
      module_id: data.module_id,
      module_type: data.module_type,
      meta: data.meta,
      inputs: data.inputs,
      outputs: data.outputs
    }
    
    // 保存节点位置信息
    // 对于顶层节点，直接保存绝对位置
    // 对于子节点，保存相对于父节点的位置
    if (node.parentNode) {
      // 子节点，计算相对位置
      moduleData.position = {
        x: position.x - parentPosition.x,
        y: position.y - parentPosition.y
      }
    } else {
      // 顶层节点，保存绝对位置
      moduleData.position = {
        x: position.x,
        y: position.y
      }
    }
    
    // 如果是嵌套节点，添加特殊属性
    if (node.type === 'composite' || data.meta?.category === 'composite') {
      moduleData.width = node.style?.width || 400
      moduleData.height = node.style?.height || 300
      
      // 查找所有子节点
      const childNodes = nodes.filter(n => n.parentNode === node.id)
      
      // 如果有子节点，添加到slots字段
      if (childNodes.length > 0) {
        // 递归处理子节点时，传递当前节点的位置
        moduleData.slots = childNodes.map(childNode => 
          extractModuleData(childNode, position)
        )
      }
    }
    
    return moduleData
  }
  
  // 提取所有顶层模块数据
  const modules = topLevelNodes.map(node => extractModuleData(node))
  
  // 创建工作流JSON对象
  const workflowJson = {
    module_id: 'workflow_' + Date.now(),
    module_type: 'composite',
    meta: {
      title: '工作流',
      description: '自动生成的工作流',
      category: 'custom'
    },
    inputs: {
      input_defs: []
    },
    outputs: {
      output_defs: []
    },
    modules
  }
  
  return workflowJson
}

/**
 * 验证工作流JSON格式是否有效
 * 
 * @param {Object} workflowJson 工作流JSON数据
 * @returns {Object} 包含isValid和errors的对象
 */
export function validateWorkflowJson(workflowJson) {
  const errors = []
  
  // 检查基本结构
  if (!workflowJson) {
    errors.push('工作流JSON为空')
    return { isValid: false, errors }
  }
  
  if (!workflowJson.module_id) {
    errors.push('缺少module_id字段')
  }
  
  if (!workflowJson.module_type) {
    errors.push('缺少module_type字段')
  }
  
  if (!workflowJson.modules || !Array.isArray(workflowJson.modules)) {
    errors.push('缺少modules数组或格式不正确')
    return { isValid: false, errors }
  }
  
  // 检查每个模块
  workflowJson.modules.forEach((module, index) => {
    if (!module.module_id) {
      errors.push(`模块 #${index+1} 缺少module_id`)
    }
    
    if (!module.module_type) {
      errors.push(`模块 #${index+1} 缺少module_type`)
    }
    
    if (!module.meta || typeof module.meta !== 'object') {
      errors.push(`模块 #${index+1} 缺少meta对象或格式不正确`)
    }
  })
  
  return { 
    isValid: errors.length === 0,
    errors
  }
} 