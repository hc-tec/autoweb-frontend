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
  
  const allNodes = []
  const allEdges = []
  
  // 创建一个递归函数，确保能够处理嵌套节点中的子模块
  function processModules(modules, parentId = null) {
    modules.forEach((module) => {
      // 计算节点位置
      let posX, posY
      
      if (module.position) {
        // 使用模块中定义的位置
        posX = module.position.x
        posY = module.position.y
      }
      
      // 确定节点类型
      const nodeType = module.module_type === 'composite' ? 'composite' : 'custom'
      
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
      
      // 处理slots（如果有）
      if (module.slots && typeof module.slots === 'object') {
        // 遍历每个slot
        Object.entries(module.slots).forEach(([slotName, slotModule]) => {
          if (slotModule && slotModule.module_id) {
            // 递归处理slot模块
            processModules([slotModule])
            
            // 创建从父模块到slot模块的连接边
            const slotEdge = {
              id: `edge-${module.module_id}-to-${slotModule.module_id}`,
              source: module.module_id,
              target: slotModule.module_id,
              sourceHandle: `slot-${slotName}`, // 使用slot名称作为sourceHandle
              // 不指定targetHandle，默认连接到目标的输入端点
              data: { slotName }
            }
            
            allEdges.push(slotEdge)
          }
        })
      }
      
      // 处理composite模块中的modules数组
      if (module.module_type === 'composite' && module.modules && Array.isArray(module.modules)) {
        // 递归处理子模块
        processModules(module.modules, module.module_id)
      }
    })
  }
  
  // 处理所有顶层模块
  processModules(workflowJson.modules)
  
  return { nodes: allNodes, edges: allEdges }
}

/**
 * 将VueFlow节点和边转换回工作流JSON
 * 
 * @param {Object} flowData 包含nodes和edges的对象
 * @returns {Object} 工作流JSON数据
 */
export function saveWorkflowToJson(flowData) {
  const { nodes, edges } = flowData
  // 创建节点映射，用于快速查找
  const nodeMap = new Map()
  nodes.forEach(node => {
    nodeMap.set(node.id, node)
  })
  
  // 创建从源节点到目标节点的边映射
  const edgeMap = new Map()
  edges.forEach(edge => {
    if (!edgeMap.has(edge.source)) {
      edgeMap.set(edge.source, [])
    }
    edgeMap.get(edge.source).push(edge)
  })
  
  // 跟踪已处理的节点ID，避免重复处理
  const processedNodeIds = new Set()
  
  // 找出顶层节点（没有父节点的节点）
  const topLevelNodes = nodes.filter(node => !node.parentNode)
  
  // 提取模块数据
  function extractModuleData(node) {
    const { data, position } = node
    
    // 如果节点已处理过，避免重复处理
    if (processedNodeIds.has(node.id)) {
      console.warn(`节点 ${node.id} 已处理过，避免重复处理`)
      return null
    }
    
    // 将节点标记为已处理
    processedNodeIds.add(node.id)
    
    // 基本模块数据
    const moduleData = {
      module_id: data.module_id,
      module_type: data.module_type,
      meta: data.meta,
      inputs: data.inputs,
      outputs: data.outputs,
      position: {
        x: position.x,
        y: position.y
      }
    }
    
    // 处理slots（如果是custom类型节点并且有连接到slot的边）
    if (edgeMap.has(node.id)) {
      const slotEdges = edgeMap.get(node.id).filter(edge => 
        edge.sourceHandle && edge.sourceHandle.startsWith('slot-')
      )
      
      if (slotEdges.length > 0) {
        moduleData.slots = {}
        
        // 为每个slot边创建slot数据
        slotEdges.forEach(edge => {
          const slotName = edge.sourceHandle.replace('slot-', '')
          const targetNode = nodeMap.get(edge.target)
          
          if (targetNode) {
            // 递归提取slot模块数据
            const slotModuleData = extractModuleData(targetNode)
            if (slotModuleData) {
              moduleData.slots[slotName] = slotModuleData
            }
          }
        })
        
        // 如果没有有效的slot，删除slots字段
        if (Object.keys(moduleData.slots).length === 0) {
          delete moduleData.slots
        }
      }
    }
    
    // 处理composite模块中的子节点（作为modules数组保存）
    if (data.module_type === 'composite') {
      // 查找所有直接子节点（父节点为当前节点但不是通过slot连接的）
      const childNodes = nodes.filter(n => 
        n.parentNode === node.id && !processedNodeIds.has(n.id)
      )
      
      // 添加子节点到modules数组
      if (childNodes.length > 0) {
        moduleData.modules = []
        
        childNodes.forEach(childNode => {
          const childModuleData = extractModuleData(childNode)
          if (childModuleData) {
            moduleData.modules.push(childModuleData)
          }
        })
      } else {
        // 即使没有子节点，也保留空的modules数组
        moduleData.modules = []
      }
    }
    
    return moduleData
  }
  
  // 提取所有顶层模块数据
  const modules = []
  topLevelNodes.forEach(node => {
    // 确保节点还没被处理过（可能作为某个节点的slot）
    if (!processedNodeIds.has(node.id)) {
      const moduleData = extractModuleData(node)
      if (moduleData) {
        modules.push(moduleData)
      }
    }
  })
  
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
  
  // 递归检查模块及其子模块
  function validateModules(modules, path = '') {
    modules.forEach((module, index) => {
      const currentPath = path ? `${path} > 模块 #${index+1}` : `模块 #${index+1}`
      
      if (!module.module_id) {
        errors.push(`${currentPath} 缺少module_id`)
      }
      
      if (!module.module_type) {
        errors.push(`${currentPath} 缺少module_type`)
      }
      
      if (!module.meta || typeof module.meta !== 'object') {
        errors.push(`${currentPath} 缺少meta对象或格式不正确`)
      }
      
      // 如果是composite模块，检查其子模块
      if (module.module_type === 'composite' && module.modules && Array.isArray(module.modules)) {
        validateModules(module.modules, currentPath)
      }
      
      // 如果有slots，检查每个slot中的模块
      if (module.slots && typeof module.slots === 'object') {
        Object.entries(module.slots).forEach(([slotName, slotModule]) => {
          if (slotModule) {
            validateModules([slotModule], `${currentPath} > slot ${slotName}`)
          }
        })
      }
    })
  }
  
  // 检查顶层模块及其所有子模块
  validateModules(workflowJson.modules)
  
  return { 
    isValid: errors.length === 0,
    errors
  }
} 