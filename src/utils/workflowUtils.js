/**
 * 将工作流JSON数据转换为VueFlow节点和边
 * 
 * @param {Object} workflowJson 工作流JSON数据
 * @returns {Object} 包含nodes和edges的对象
 */
import { createEdge } from './nodeFactory';

export function loadWorkflowFromJson(workflowJson) {
  if (!workflowJson || !workflowJson.modules) {
    console.error('工作流JSON格式无效')
    return { nodes: [], edges: [] }
  }
  
  const allNodes = []
  const allEdges = []
  
  // 跟踪节点ID到节点对象的映射，方便后续查找和修改节点
  const nodeMap = new Map()
  
  // 记录slot连接信息，用于调试
  const slotConnections = []
  
  // 跟踪哪些节点是slot节点，避免它们参与顺序连接
  const slotNodeIds = new Set()
  
  // 创建一个递归函数，确保能够处理嵌套节点中的子模块
  function processModules(modules, parentId = null) {
    // 用于跟踪前一个处理的节点ID，以创建节点间的连接
    let previousNodeId = null;
    
    // 处理模块前先构建一个当前级别的正常节点列表（非slot节点）
    const currentLevelNodes = modules.filter(module => !slotNodeIds.has(module.module_id));
    
    // 先处理所有节点，创建节点对象
    modules.forEach((module) => {
      // 计算节点位置
      let posX, posY
      
      if (module.position) {
        // 使用模块中定义的位置
        posX = module.position.x
        posY = module.position.y
      }
      
      // 确定节点类型
      const nodeType = module.is_composited ? 'composite' : 'custom'
      
      // 确定节点分类
      const moduleCategory = module.meta?.category || 'default'
      
      // 创建节点
      const node = {
        id: module.module_id,
        type: nodeType,
        position: { x: posX, y: posY },
        className: `node-type-${moduleCategory}`,
        expandParent: true,
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
          },
          // 确保代码内容被正确传递
          code: module.code || (module.module_type === 'python_code' ? { python_code: '' } : undefined)
        }
      }
      
      // 设置父节点关系 - 只为常规子节点设置，不为插槽类节点设置
      if (parentId) {
        node.parentNode = parentId
        node.extent = 'parent'
      }
      
      // 添加节点到结果数组并保存到映射中
      allNodes.push(node)
      nodeMap.set(node.id, node)
      
      // 记录Python代码模块的代码内容
      if (module.module_type === 'python_code') {
        const codeLength = module.code?.python_code?.length || 0;
        console.log(`加载Python代码模块 ${module.module_id}，代码长度: ${codeLength}`);
      }
      
      // 处理slots（如果有）- 注意slots中的节点是独立节点，不是子节点
      if (module.slots && typeof module.slots === 'object') {
        // 遍历每个slot
        Object.entries(module.slots).forEach(([slotName, slotModule]) => {
          if (slotModule && slotModule.module_id) {
            console.log(`处理slot连接: ${module.module_id} 的 ${slotName} 插槽 -> ${slotModule.module_id}`);
            
            // 判断是否是特殊插槽类型
            const isSpecialSlot = 
              (module.module_type === 'loop' && slotName === 'body') || 
              (module.module_type === 'IfElseBlock' && (slotName === 'if' || slotName === 'else')) ||
              (module.module_type === 'selector' && slotName === 'default');
            
            // 将slot节点ID添加到集合中，避免它参与顺序连接
            slotNodeIds.add(slotModule.module_id);
            
            // 递归处理slot模块，但不传递parentId，因为插槽节点是独立节点
            // 特殊插槽（如循环体、条件分支）是顶层节点，不是子节点
            processModules([slotModule], isSpecialSlot ? null : parentId)
            
            // 记录slot连接信息
            slotConnections.push({
              source: module.module_id,
              target: slotModule.module_id,
              slotName: slotName,
              isSpecial: isSpecialSlot
            });
            
            // 创建从父模块到slot模块的连接边
            const slotEdge = createEdge(
              module.module_id,       // 源节点ID
              slotModule.module_id,   // 目标节点ID
              `slot-${slotName}`,     // 源节点连接点
              null,                   // 目标节点连接点（默认）
              { slotName }            // 边数据
            );
            
            allEdges.push(slotEdge)
          }
        })
      }
      
      // 处理composite模块中的modules数组
      if (module.is_composited && module.modules && Array.isArray(module.modules)) {
        // 递归处理子模块
        processModules(module.modules, module.module_id)
      }
    });
    
    // 处理完所有节点后，创建同级节点之间的顺序连接
    // 只处理当前层级的非slot节点
    for (let i = 0; i < currentLevelNodes.length - 1; i++) {
      const currentNode = currentLevelNodes[i];
      const nextNode = currentLevelNodes[i+1];
      
      // 确保两个节点都存在且都不是slot节点
      if (!slotNodeIds.has(currentNode.module_id) && !slotNodeIds.has(nextNode.module_id)) {
        const sequenceEdge = createEdge(
          currentNode.module_id,  // 源节点ID
          nextNode.module_id,     // 目标节点ID
          null,                   // 源节点连接点（默认）
          null,                   // 目标节点连接点（默认）
          {                       // 边数据
            isSequence: true,
            autoCreated: true
          }
        );
        
        console.log(`创建顺序连接: ${currentNode.module_id} -> ${nextNode.module_id}`);
        allEdges.push(sequenceEdge);
      }
    }
  }
  
  // 处理所有顶层模块
  processModules(workflowJson.modules)
  
  // 输出调试信息
  if (slotConnections.length > 0) {
    console.log(`工作流中共有 ${slotConnections.length} 个插槽连接:`);
    slotConnections.forEach(conn => {
      console.log(`${conn.source} 的 ${conn.slotName} 插槽 -> ${conn.target} ${conn.isSpecial ? '(特殊插槽节点)' : ''}`);
    });
  }
  
  const sequenceEdges = allEdges.filter(edge => edge.data?.isSequence);
  console.log(`工作流中自动创建 ${sequenceEdges.length} 个顺序连接`);
  
  return { nodes: allNodes, edges: allEdges }
}

/**
 * 节点位置计算器 - 专门处理节点位置计算相关逻辑
 */
export class NodePositionCalculator {
  /**
   * 计算新节点的位置
   * @param {Array} existingNodes 现有节点列表
   * @param {Object} parentNode 父节点（如果有）
   * @returns {Object} 计算得到的位置 {x, y}
   */
  static calculateNodePosition(existingNodes, parentNode = null) {
    if (parentNode) {
      return this.calculatePositionInParent(existingNodes, parentNode)
    } else {
      return this.calculateTopLevelPosition(existingNodes)
    }
  }

  /**
   * 计算父节点内的位置
   * @private
   */
  static calculatePositionInParent(existingNodes, parentNode) {
    // 默认位置在父节点内部
    const position = { x: 100, y: 100 }
    
    // 检查父节点内是否已有其他子节点
    const childNodes = existingNodes.filter(node => node.parentNode === parentNode.id)
    if (childNodes.length > 0) {
      // 放在最后一个子节点的下方
      const lastChild = childNodes.reduce(
        (a, b) => a.position.y > b.position.y ? a : b
      )
      position.x = lastChild.position.x
      position.y = lastChild.position.y + 80
    }
    
    return position
  }

  /**
   * 计算顶层节点位置
   * @private
   */
  static calculateTopLevelPosition(existingNodes) {
    // 默认位置
    const position = { x: 100, y: 100 }
    
    // 如果有现有节点，放在最右侧节点的右边
    if (existingNodes.length > 0) {
      // 只考虑顶层节点
      const topLevelNodes = existingNodes.filter(node => !node.parentNode)
      
      if (topLevelNodes.length > 0) {
        // 找出最右侧节点
        const rightmostNode = topLevelNodes.reduce(
          (prev, current) => prev.position.x > current.position.x ? prev : current
        )
        
        position.x = rightmostNode.position.x + 150
        position.y = rightmostNode.position.y
      }
    }
    
    return position
  }
}

// 调试模式控制
let DEBUG_WORKFLOW_EXPORT = true;

/**
 * 设置工作流导出的调试模式
 * 
 * @param {boolean} enabled 是否启用调试模式
 */
export function setWorkflowDebugMode(enabled = true) {
  DEBUG_WORKFLOW_EXPORT = enabled;
  console.log(`工作流导出调试模式: ${enabled ? '已启用' : '已禁用'}`);
}

/**
 * 将VueFlow节点和边转换回工作流JSON
 * 
 * @param {Object} flowData 包含nodes和edges的对象
 * @returns {Object} 工作流JSON数据
 */
export function saveWorkflowToJson(flowData) {
  
  const { nodes, edges, workflowMeta } = flowData
  
  // 日志控制开关使用全局变量
  const DEBUG_LOGS = DEBUG_WORKFLOW_EXPORT;
  
  // 记录日志
  const logDebug = (message, data = null) => {
    if (DEBUG_LOGS) {
      console.log(`[工作流导出] ${message}`, data ? data : '');
    }
  };
  
  // 创建节点映射，用于快速查找
  const nodeMap = new Map()
  nodes.forEach(node => {
    nodeMap.set(node.id, node)
  })
  
  logDebug(`处理总计 ${nodes.length} 个节点`);
  
  // 创建从源节点到目标节点的边映射
  const edgeMap = new Map()
  edges.forEach(edge => {
    if (!edgeMap.has(edge.source)) {
      edgeMap.set(edge.source, [])
    }
    edgeMap.get(edge.source).push(edge)
  })
  
  // 创建父子节点映射
  const parentChildMap = new Map()
  nodes.forEach(node => {
    if (node.parentNode) {
      if (!parentChildMap.has(node.parentNode)) {
        parentChildMap.set(node.parentNode, [])
      }
      parentChildMap.get(node.parentNode).push(node.id)
    }
  })
  
  // 创建节点间slot引用映射 (用于跟踪composite节点的slot)
  const slotMap = new Map()
  edges.forEach(edge => {
    if (edge.sourceHandle && edge.sourceHandle.startsWith('slot-')) {
      const slotName = edge.sourceHandle.replace('slot-', '')
      slotMap.set(edge.target, {
        parentId: edge.source,
        slotName: slotName
      })
    }
  })
  
  // 跟踪已处理的节点ID，避免重复处理
  const processedNodeIds = new Set()
  
  // 预处理特殊节点关系 - 为循环、条件分支等特殊节点建立强制性的slot关系
  const forcedSlotMap = new Map();
  
  // 首先找出所有特殊节点类型(循环、条件分支等)
  nodes.forEach(node => {
    if (node.data && (
        node.data.module_type === 'loop' || 
        node.data.module_type === 'IfElseBlock' || 
        node.data.module_type === 'selector'
      )) {
      
      // 查找直接子节点中的composite节点
      const childrenIds = parentChildMap.get(node.id) || [];
      childrenIds.forEach(childId => {
        const childNode = nodeMap.get(childId);
        if (childNode && childNode.data && childNode.data.is_composited) {
          // 根据特殊节点类型决定默认slot名
          let slotName = 'body'; // 循环节点默认用body
          if (node.data.module_type === 'IfElseBlock') {
            // 对于条件分支，查看其y坐标判断是if还是else分支
            slotName = (childNode.position.y > node.position.y) ? 'else' : 'if';
          }
          
          // 强制建立slot关系，覆盖可能存在的现有关系
          forcedSlotMap.set(childId, {
            parentId: node.id,
            slotName: slotName,
            forced: true
          });
          
          logDebug(`强制设置节点 ${childId} 为节点 ${node.id} 的 ${slotName} 插槽`);
        }
      });
    }
  });
  
  // 修改主提取函数，考虑强制性slot关系
  function extractModuleData(node) {
    const { data, position } = node
    
    // 如果节点已处理过，避免重复处理
    if (processedNodeIds.has(node.id)) {
      logDebug(`节点 ${node.id} 已处理过，避免重复处理`);
      return null
    }
    
    // 检查该节点是否已被强制归属为某个节点的slot
    if (forcedSlotMap.has(node.id)) {
      const forcedSlot = forcedSlotMap.get(node.id);
      logDebug(`节点 ${node.id} 已被强制归属为节点 ${forcedSlot.parentId} 的 ${forcedSlot.slotName} 插槽`);
      // 如果是强制归属的slot节点，在其父节点处理时会被处理，这里跳过
      if (!processedNodeIds.has(forcedSlot.parentId)) {
        logDebug(`跳过处理节点 ${node.id}，将在处理其父节点 ${forcedSlot.parentId} 时处理`);
        return null;
      }
    }
    
    logDebug(`处理节点: ${node.id} (${data.module_type}), 是否复合节点: ${data.is_composited ? '是' : '否'}`);
    
    // 将节点标记为已处理
    processedNodeIds.add(node.id)
    
    // 基本模块数据
    const moduleData = JSON.parse(JSON.stringify(node.data));

    let hasSlots = false;
    moduleData.slots = {}
    
    // 1. 处理显式slot连接
    if (edgeMap.has(node.id)) {
      const slotEdges = edgeMap.get(node.id).filter(edge => 
        edge.sourceHandle && edge.sourceHandle.startsWith('slot-')
      )
      
      if (slotEdges.length > 0) {
        logDebug(`节点 ${node.id} 有 ${slotEdges.length} 个slot连接`);
        hasSlots = true;
        
        // 为每个slot边创建slot数据
        slotEdges.forEach(edge => {
          const slotName = edge.sourceHandle.replace('slot-', '')
          const targetNode = nodeMap.get(edge.target)
          
          if (targetNode) {
            logDebug(`处理slot: ${slotName} -> 节点 ${targetNode.id}`);
            // 递归提取slot模块数据
            const slotModuleData = extractModuleData(targetNode)
            if (slotModuleData) {
              moduleData.slots[slotName] = slotModuleData
              
              // 递归处理嵌套slot
              collectNestedSlotNodes(targetNode, slotModuleData)
            }
          }
        })
      }
    }
    
    // 2. 处理强制slot归属关系
    if (parentChildMap.has(node.id)) {
      const childNodeIds = parentChildMap.get(node.id);
      
      childNodeIds.forEach(childId => {
        // 仅处理被强制归属为该节点slot的子节点
        if (forcedSlotMap.has(childId) && forcedSlotMap.get(childId).parentId === node.id) {
          const slotInfo = forcedSlotMap.get(childId);
          const childNode = nodeMap.get(childId);
          
          if (childNode && !processedNodeIds.has(childId)) {
            logDebug(`处理强制slot: ${slotInfo.slotName} -> 节点 ${childId}`);
            hasSlots = true;
            
            // 递归提取子模块数据
            const childModuleData = extractModuleData(childNode);
            if (childModuleData) {
              moduleData.slots[slotInfo.slotName] = childModuleData;
              
              // 递归处理嵌套slot
              collectNestedSlotNodes(childNode, childModuleData);
            }
          }
        }
      });
    }
    
    // 如果没有slots，删除slots字段
    if (!hasSlots) {
      delete moduleData.slots;
    }
    
    // 处理composite模块中的子节点（作为modules数组保存）
    if (data.is_composited) {
      // 查找所有直接子节点（排除已处理和被强制归属为slot的节点）
      const childNodes = nodes.filter(n => 
        n.parentNode === node.id && 
        !processedNodeIds.has(n.id) && 
        !(forcedSlotMap.has(n.id) && forcedSlotMap.get(n.id).parentId === node.id) &&
        !(slotMap.has(n.id) && slotMap.get(n.id).parentId === node.id)
      )
      
      logDebug(`复合节点 ${node.id} 有 ${childNodes.length} 个直接子节点`);
      
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
  
  // 简化收集嵌套节点函数，主要处理显式slot连接
  function collectNestedSlotNodes(parentNode, parentModuleData) {
    logDebug(`检查节点 ${parentNode.id} 的嵌套slot`);
    
    // 检查该节点是否有作为slot连接到其他节点的子节点
    if (edgeMap.has(parentNode.id)) {
      const slotEdges = edgeMap.get(parentNode.id).filter(edge => 
        edge.sourceHandle && edge.sourceHandle.startsWith('slot-')
      )
      
      if (slotEdges.length > 0) {
        logDebug(`节点 ${parentNode.id} 有 ${slotEdges.length} 个嵌套slot连接`);
        
        if (!parentModuleData.slots) {
          parentModuleData.slots = {}
        }
        
        slotEdges.forEach(edge => {
          const slotName = edge.sourceHandle.replace('slot-', '')
          const targetNode = nodeMap.get(edge.target)
          
          if (targetNode && !processedNodeIds.has(targetNode.id)) {
            logDebug(`处理嵌套slot: ${slotName} -> 节点 ${targetNode.id}`);
            // 递归提取slot模块数据
            const slotModuleData = extractModuleData(targetNode)
            if (slotModuleData) {
              parentModuleData.slots[slotName] = slotModuleData
              
              // 递归处理该slot节点的嵌套slot
              collectNestedSlotNodes(targetNode, slotModuleData) 
            }
          }
        })
      }
    }
    
    // 处理强制slot归属关系（递归处理子节点的嵌套场景）
    if (parentChildMap.has(parentNode.id)) {
      const childNodeIds = parentChildMap.get(parentNode.id);
      
      childNodeIds.forEach(childId => {
        // 仅处理被强制归属为该节点slot的子节点
        if (forcedSlotMap.has(childId) && 
            forcedSlotMap.get(childId).parentId === parentNode.id &&
            !processedNodeIds.has(childId)) {
          
          const slotInfo = forcedSlotMap.get(childId);
          const childNode = nodeMap.get(childId);
          
          if (childNode) {
            logDebug(`处理嵌套强制slot: ${slotInfo.slotName} -> 节点 ${childId}`);
            
            if (!parentModuleData.slots) {
              parentModuleData.slots = {};
            }
            
            // 递归提取子模块数据
            const childModuleData = extractModuleData(childNode);
            if (childModuleData) {
              parentModuleData.slots[slotInfo.slotName] = childModuleData;
              
              // 递归处理嵌套slot
              collectNestedSlotNodes(childNode, childModuleData);
            }
          }
        }
      });
    }
  }
  
  // 提取所有顶层模块数据
  const modules = []
  nodes.forEach(node => {
    // 确保节点还没被处理过（可能作为某个节点的slot）
    if (!processedNodeIds.has(node.id)) {
      logDebug(`处理顶层节点: ${node.id}`);
      const moduleData = extractModuleData(node)
      if (moduleData) {
        modules.push(moduleData)
      }
    }
  })
  
  logDebug(`工作流导出完成，共 ${modules.length} 个顶层模块（排序前）`);
  
  // 按执行顺序排序模块
  const sortedModules = sortModulesByExecutionOrder(modules, edges);
  logDebug(`顶层模块排序完成，共 ${sortedModules.length} 个模块`);
  
  // 创建工作流JSON对象
  const workflowJson = {
    version: '1.0.0',
    module_id: 'workflow_'+Date.now(),
    module_type: 'workflow',
    is_composited: false,
    modules: sortedModules,
    meta: workflowMeta || {
      title: '你的简单成名作',
      description: '又一个伟大的作品'
    },
    inputs: {
      input_defs: {},
      input_parameters: {},
    },
    outputs: {
      output_defs: {}
    }
  }

  
  

  // 是否存在输入输出节点
  const inputNode = workflowJson.modules.find(module => module.module_type === "DynamicInputNode")
  const outputNode = workflowJson.modules.find(module => module.module_type === 'DynamicOutputNode')

  if (inputNode) {
    workflowJson.inputs.input_defs = inputNode.inputs.input_defs;
    workflowJson.inputs.input_parameters = inputNode.inputs.input_parameters;
  }

  if (outputNode) {
    workflowJson.outputs.output_defs = outputNode.outputs.output_defs
  }
  
  return workflowJson
}

/**
 * 打印嵌套结构 - 辅助函数，帮助开发者验证嵌套节点结构是否正确
 * 
 * @param {Object} workflowJson 工作流JSON数据
 */
function printNestedStructure(workflowJson) {
  console.log('==== 嵌套结构检查 ====');
  
  function printModule(module, level = 0, path = '') {
    const indent = '  '.repeat(level);
    const currentPath = path ? `${path} > ${module.module_id}` : module.module_id;
    
    console.log(`${indent}模块: ${module.module_id} (${module.module_type})`);
    
    // 打印slots
    if (module.slots && typeof module.slots === 'object') {
      console.log(`${indent}  插槽:`);
      Object.entries(module.slots).forEach(([slotName, slotModule]) => {
        console.log(`${indent}    [${slotName}]:`);
        printModule(slotModule, level + 3, currentPath);
      });
    }
    
    // 打印子模块
    if (module.modules && Array.isArray(module.modules) && module.modules.length > 0) {
      console.log(`${indent}  子模块:`);
      module.modules.forEach(childModule => {
        printModule(childModule, level + 2, currentPath);
      });
    }
  }
  
  // 打印所有顶层模块
  workflowJson.modules.forEach(module => {
    printModule(module);
    console.log('-------------------');
  });
  
  console.log('==== 嵌套结构检查完成 ====');
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
      if (module.is_composited && module.modules && Array.isArray(module.modules)) {
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

/**
 * 按执行顺序排序模块 - 使用增强型拓扑排序算法
 * 
 * @param {Array} modules 模块数组
 * @param {Array} edges 边数组
 * @returns {Array} 排序后的模块数组
 */
function sortModulesByExecutionOrder(modules, edges) {
  if (!modules || modules.length <= 1) {
    return modules; // 如果没有模块或只有一个模块，不需要排序
  }
  
  // 如果开启调试，打印排序前的顺序
  if (DEBUG_WORKFLOW_EXPORT) {
    console.log('排序前的节点顺序:');
    modules.forEach((module, index) => {
      console.log(`  ${index}. ${module.module_id} (${module.module_type})`);
    });
  }
  
  // 创建模块ID到模块对象的映射
  const moduleMap = new Map();
  modules.forEach(module => {
    moduleMap.set(module.module_id, module);
  });
  
  // 创建节点的邻接列表 (表示执行顺序: source -> target)
  const adjacencyList = new Map();
  modules.forEach(module => {
    adjacencyList.set(module.module_id, new Set());
  });
  
  // 创建入度表 (记录每个节点有多少个前置节点)
  const inDegree = new Map();
  modules.forEach(module => {
    inDegree.set(module.module_id, 0);
  });
  
  // 记录模块间的依赖关系
  const dependencyInfo = [];
  
  // 根据边信息构建邻接列表和入度表
  // 考虑所有类型的边 - 移除了过滤slot边的逻辑
  edges.forEach(edge => {
    const source = edge.source;
    const target = edge.target;
    
    // 确保源节点和目标节点都在当前处理的模块中
    if (moduleMap.has(source) && moduleMap.has(target)) {
      const edgeType = edge.sourceHandle && edge.sourceHandle.startsWith('slot-') 
        ? `slot(${edge.sourceHandle.replace('slot-', '')})` 
        : 'direct';
      
      // 添加到邻接列表
      if (adjacencyList.has(source)) {
        adjacencyList.get(source).add(target);
      }
      
      // 增加目标节点的入度
      inDegree.set(target, (inDegree.get(target) || 0) + 1);
      
      // 记录依赖信息用于调试
      dependencyInfo.push({
        source,
        target,
        type: edgeType
      });
    }
  });
  
  // 打印依赖关系用于调试
  if (DEBUG_WORKFLOW_EXPORT) {
    console.log('节点依赖关系:');
    dependencyInfo.forEach(dep => {
      console.log(`  ${dep.source} -> ${dep.target} [${dep.type}]`);
    });
  }
  
  // 使用Kahn算法进行拓扑排序
  const result = [];
  
  // 初始队列包含所有入度为0的节点
  const queue = [];
  const zeroDegreeModules = [];
  for (const [nodeId, degree] of inDegree.entries()) {
    if (degree === 0) {
      queue.push(nodeId);
      zeroDegreeModules.push(moduleMap.get(nodeId));
    }
  }
  
  // 如果存在多个入度为0的节点，根据它们在原始数组中的顺序排序
  // 这保证了没有依赖关系的节点也能按原始顺序排列
  if (zeroDegreeModules.length > 1) {
    const originalOrder = new Map();
    modules.forEach((module, index) => {
      originalOrder.set(module.module_id, index);
    });
    
    // 根据原始顺序排序队列
    queue.sort((a, b) => originalOrder.get(a) - originalOrder.get(b));
  }
  
  // 处理队列中的所有节点
  while (queue.length > 0) {
    const currentId = queue.shift();
    
    // 添加当前节点到结果
    if (moduleMap.has(currentId)) {
      result.push(moduleMap.get(currentId));
    }
    
    // 减少所有相邻节点的入度
    if (adjacencyList.has(currentId)) {
      // 将当前节点的所有邻居转换为数组，根据原始顺序排序
      const neighbors = Array.from(adjacencyList.get(currentId));
      const originalOrder = new Map();
      modules.forEach((module, index) => {
        originalOrder.set(module.module_id, index);
      });
      
      // 排序邻居，确保处理顺序遵循原始顺序
      neighbors.sort((a, b) => originalOrder.get(a) - originalOrder.get(b));
      
      // 处理每个邻居
      for (const neighbor of neighbors) {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        
        // 如果入度变为0，加入队列
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }
  }
  
  // 检查是否所有节点都已处理 (如果有环，结果长度会小于原始长度)
  if (result.length < modules.length) {
    console.warn(`工作流中存在循环依赖，无法完全使用拓扑排序。已排序 ${result.length}/${modules.length} 个节点`);
    
    // 处理循环依赖 - 找出所有尚未处理的节点
    const remainingModules = [];
    const sortedIds = new Set(result.map(m => m.module_id));
    
    modules.forEach(module => {
      if (!sortedIds.has(module.module_id)) {
        remainingModules.push(module);
      }
    });
    
    // 打印剩余未处理节点，帮助调试
    if (DEBUG_WORKFLOW_EXPORT) {
      console.log('存在循环依赖的节点:');
      remainingModules.forEach(module => {
        console.log(`  ${module.module_id} (${module.module_type})`);
      });
    }
    
    // 对于剩余节点，按照入度从小到大排序，尽量遵循依赖关系
    remainingModules.sort((a, b) => {
      return (inDegree.get(a.module_id) || 0) - (inDegree.get(b.module_id) || 0);
    });
    
    // 将剩余节点添加到结果中
    result.push(...remainingModules);
  }
  
  // 对每个模块内的子模块也进行排序（递归处理）
  result.forEach(module => {
    if (module.modules && Array.isArray(module.modules) && module.modules.length > 1) {
      // 为子模块创建节点ID对应关系
      const childModuleMap = new Map();
      module.modules.forEach(childModule => {
        childModuleMap.set(childModule.module_id, childModule);
      });
      
      // 找出该模块内部的所有边
      const innerEdges = edges.filter(edge => {
        return childModuleMap.has(edge.source) && childModuleMap.has(edge.target);
      });
      
      // 递归排序子模块
      module.modules = sortModulesByExecutionOrder(module.modules, innerEdges);
    }
    
    // 处理slots中的模块
    if (module.slots && typeof module.slots === 'object') {
      Object.entries(module.slots).forEach(([slotName, slotModule]) => {
        // 如果slot模块有子模块，也需要排序
        if (slotModule && slotModule.modules && Array.isArray(slotModule.modules) && slotModule.modules.length > 1) {
          // 为子模块创建节点ID对应关系
          const slotChildModuleMap = new Map();
          slotModule.modules.forEach(childModule => {
            slotChildModuleMap.set(childModule.module_id, childModule);
          });
          
          // 找出该模块内部的所有边
          const slotInnerEdges = edges.filter(edge => {
            return slotChildModuleMap.has(edge.source) && slotChildModuleMap.has(edge.target);
          });
          
          // 递归排序子模块
          slotModule.modules = sortModulesByExecutionOrder(slotModule.modules, slotInnerEdges);
        }
      });
    }
  });
  
  // 如果开启调试，打印排序后的顺序
  if (DEBUG_WORKFLOW_EXPORT) {
    console.log('排序后的节点顺序:');
    result.forEach((module, index) => {
      console.log(`  ${index}. ${module.module_id} (${module.module_type})`);
    });
  }
  
  return result;
} 