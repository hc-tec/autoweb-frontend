/**
 * 节点工厂工具类
 * 用于根据节点类型定义创建节点
 */

import { onMounted, ref } from 'vue'

// 用于存储所有节点类型定义的缓存
const nodeTypesCache = ref([])
// 节点类型定义是否已加载的标志
const nodeTypesLoaded = ref(false)
// 是否正在加载的标志
const loading = ref(false)

/**
 * 加载节点类型定义
 * @returns {Promise<Array>} 节点类型定义数组
 */
export async function loadNodeTypes() {
  if (nodeTypesLoaded.value) {
    return nodeTypesCache.value
  }

  if (loading.value) {
    // 如果正在加载，等待加载完成
    return new Promise((resolve) => {
      const checkLoaded = () => {
        if (nodeTypesLoaded.value) {
          resolve(nodeTypesCache.value)
        } else {
          setTimeout(checkLoaded, 100)
        }
      }
      checkLoaded()
    })
  }

  loading.value = true
  try {
    const response = await fetch('/nodeTypes.json')
    const data = await response.json()
    nodeTypesCache.value = data
    nodeTypesLoaded.value = true
    return data
  } catch (error) {
    console.error('加载节点类型定义失败:', error)
    throw error
  } finally {
    loading.value = false
  }
}

/**
 * 根据类型查找节点定义
 * @param {string} type 节点类型
 * @param {string} workflowId 工作流ID（可选）
 * @returns {Promise<Object|null>} 节点类型定义
 */
export async function findNodeTypeDefinition(type, workflowId) {
  const nodeTypes = await loadNodeTypes()
  
  // 如果提供了workflowId，说明是查找特定工作流节点
  if (workflowId) {
    return nodeTypes.find(nt => 
      nt.module_type === type && 
      nt.workflow_id === workflowId
    ) || null
  }
  
  // 普通查找
  return nodeTypes.find(nt => nt.module_type === type) || null
}

// 节点创建器 - 处理基本节点创建逻辑
class NodeBuilder {
  /**
   * 创建基础节点
   * @param {string} type 节点类型
   * @param {Object} position 节点位置
   * @param {Object} customData 自定义数据
   * @returns {Promise<Object>} 创建的节点
   */
  static async createBaseNode(type, position, customData = {}) {
    // 处理可能的workflow_id
    const workflowId = customData.workflow_id;
    
    // 使用工作流ID查找节点定义
    const nodeDef = await findNodeTypeDefinition(type, workflowId);
    
    if (!nodeDef) {
      throw new Error(`未找到类型为 ${type} ${workflowId ? `(工作流ID: ${workflowId})` : ''} 的节点定义`);
    }

    const nodeId = `${type}-${Date.now()}`;
    const nodeData = {
      module_id: nodeId,
      module_type: nodeDef.module_type,
      is_composited: nodeDef.is_composited,
      meta: { ...nodeDef.meta },
      inputs: JSON.parse(JSON.stringify(nodeDef.inputs)),
      outputs: JSON.parse(JSON.stringify(nodeDef.outputs)),
      position: { ...position },
      ...customData  // 确保customData在最后，以覆盖上面的默认值
    };

    // 对于workflow类型的节点，确保workflow_id存在
    if (nodeDef.module_type === 'workflow') {
      // 如果nodeDef中有workflow_id，优先使用它
      nodeData.workflow_id = nodeData.workflow_id || nodeDef.workflow_id;
      nodeData.is_workflow_node = true;
    }

    // 确定节点的视觉类型 - workflow类型节点也使用custom视图
    const nodeType = nodeDef.is_composited ? 'composite' : 'custom';

    return {
      id: nodeId,
      type: nodeType,
      position,
      expandParent: true,
      data: nodeData,
      nodeDef
    };
  }
}

// 插槽处理器 - 专门处理节点插槽相关逻辑
class SlotProcessor {
  /**
   * 处理节点插槽
   * @param {Object} node 主节点
   * @param {Object} nodeDef 节点定义
   * @returns {Object} 包含插槽节点和连接边的对象
   */
  static processNodeSlots(node, nodeDef) {
    if (!nodeDef || !nodeDef.slots) {
      return { slotNodes: [], edges: [] }
    }

    const slotNodes = []
    const edges = []
    const position = node.position
    const slotNames = Object.keys(nodeDef.slots)

    // 为节点添加插槽数据
    node.data.slots = {}
    slotNames.forEach(slotName => {
      node.data.slots[slotName] = this._createSlotData(slotName, nodeDef.slots[slotName])
    })

    // 创建插槽节点和连接边
    slotNames.forEach((slotName, index) => {
      const slotPosition = this._calculateSlotPosition(position, index, slotNames.length)
      const slotNode = this._createSlotNode(node, slotName, slotPosition)
      slotNodes.push(slotNode)

      const edge = this._createSlotEdge(node.id, slotNode.id, slotName)
      edges.push(edge)
    })

    return { slotNodes, edges }
  }

  /**
   * 创建插槽数据
   * @private
   */
  static _createSlotData(slotName, slotDef) {
    // 确保插槽子模块的is_composited为true
    return {
      module_id: `slot-${slotName}-${Date.now()}`,
      module_type: 'slot', // 固定为slot类型
      is_composited: true, // 插槽模块始终为嵌套类型
      meta: {
        title: slotDef.meta?.title || `${slotName} 插槽`,
        description: slotDef.meta?.description || `${slotName} 插槽`,
        category: slotDef.meta?.category || 'slot'
      },
      inputs: slotDef.inputs || { input_defs: [] },
      outputs: slotDef.outputs || { output_defs: [] }
    }
  }

  /**
   * 计算插槽节点位置
   * @private
   */
  static _calculateSlotPosition(parentPosition, index, totalSlots) {
    const slotX = parentPosition.x + (index - totalSlots / 2 + 0.5) * 150
    const slotY = parentPosition.y + 150
    return { x: slotX, y: slotY }
  }

  /**
   * 创建插槽节点
   * @private
   */
  static _createSlotNode(parentNode, slotName, position) {
    if (!parentNode.data.slots[slotName]) {
      throw new Error(`插槽 ${slotName} 不存在于节点中`)
    }

    const slotData = parentNode.data.slots[slotName]
    // 创建插槽节点
    return {
      id: slotData.module_id,
      type: 'composite', // 插槽节点应该是嵌套类型
      position,
      expandParent: true,
      data: {
        ...slotData,
        position
      }
    }
  }

  /**
   * 创建插槽连接边
   * @private
   */
  static _createSlotEdge(sourceId, targetId, slotName) {
    return {
      id: `edge-${sourceId}-to-${targetId}`,
      source: sourceId,
      target: targetId,
      sourceHandle: `slot-${slotName}`,
      data: { slotName }
    }
  }
}

/**
 * 创建节点
 * @param {string} type 节点类型
 * @param {Object} position 节点位置
 * @param {Object} customData 自定义数据，用于覆盖默认值
 * @returns {Promise<Object>} 创建的节点
 */
export async function createNode(type, position = { x: 100, y: 100 }, customData = {}) {
  const { id, type: nodeType, position: nodePosition, data, nodeDef } = 
    await NodeBuilder.createBaseNode(type, position, customData)
  
  // 处理插槽（如果有）
  if (nodeDef.slots) {
    SlotProcessor.processNodeSlots({ id, data, position }, nodeDef)
  }
  
  // 创建Vue Flow节点格式
  return {
    id,
    type: nodeType, // 使用从节点定义中获取的类型
    position: nodePosition,
    expandParent: true,
    data
  }
}

/**
 * 创建节点和它的插槽节点
 * @param {string} type 节点类型
 * @param {Object} position 节点位置
 * @param {Object} customData 自定义数据
 * @returns {Promise<Object>} 包含节点和边的对象 { node, slotNodes, edges }
 */
export async function createNodeWithSlots(type, position = { x: 100, y: 100 }, customData = {}) {
  // 创建基础节点
  const { id, type: nodeType, position: nodePosition, data, nodeDef } = 
    await NodeBuilder.createBaseNode(type, position, customData)
  
  // 组装节点对象 - 使用正确的节点类型
  const node = {
    id,
    type: nodeType, // 使用从节点定义中获取的类型，而不是硬编码为"custom"
    position,
    expandParent: true,
    data
  }
  
  // 处理插槽
  const { slotNodes, edges } = SlotProcessor.processNodeSlots(node, nodeDef)
  
  return { node, slotNodes, edges }
}

/**
 * 创建节点之间的连接边
 * @param {string} sourceId 源节点ID
 * @param {string} targetId 目标节点ID
 * @param {string} sourceHandle 源节点连接点
 * @param {string} targetHandle 目标节点连接点
 * @param {Object} data 边数据
 * @returns {Object} 连接边
 */
export function createEdge(sourceId, targetId, sourceHandle = null, targetHandle = null, data = {}) {
  const edgeId = `edge-${sourceId}-${targetId}-${Date.now()}`
  
  const edge = {
    id: edgeId,
    source: sourceId,
    target: targetId,
    data: { ...data }
  }
  
  if (sourceHandle) {
    edge.sourceHandle = sourceHandle
  }
  
  if (targetHandle) {
    edge.targetHandle = targetHandle
  }
  
  return edge
}

/**
 * 使用组合式API的节点类型加载钩子
 * @returns {Object} 包含nodeTypes和loading状态的对象
 */
export function useNodeTypes() {
  onMounted(async () => {
    if (!nodeTypesLoaded.value) {
      await loadNodeTypes()
    }
  })
  
  return {
    nodeTypes: nodeTypesCache,
    loading
  }
}

/**
 * 获取节点类型分类
 * @returns {Promise<Object>} 按分类分组的节点类型
 */
export async function getNodeTypeCategories() {
  const nodeTypes = await loadNodeTypes()
  
  const categories = {}
  nodeTypes.forEach(nodeDef => {
    const category = nodeDef.meta.category || 'default'
    if (!categories[category]) {
      categories[category] = []
    }
    categories[category].push(nodeDef)
  })
  
  return categories
} 