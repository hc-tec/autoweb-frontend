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
 * @returns {Promise<Object|null>} 节点类型定义
 */
export async function findNodeTypeDefinition(type) {
  const nodeTypes = await loadNodeTypes()
  return nodeTypes.find(nt => nt.type === type) || null
}

/**
 * 创建节点
 * @param {string} type 节点类型
 * @param {Object} position 节点位置
 * @param {Object} customData 自定义数据，用于覆盖默认值
 * @returns {Promise<Object>} 创建的节点
 */
export async function createNode(type, position = { x: 100, y: 100 }, customData = {}) {
  // 获取节点类型定义
  const nodeDef = await findNodeTypeDefinition(type)
  if (!nodeDef) {
    throw new Error(`未找到类型为 ${type} 的节点定义`)
  }

  // 创建唯一ID
  const nodeId = `${type}-${Date.now()}`
  
  // 构建节点数据
  const nodeData = {
    module_id: nodeId,
    module_type: nodeDef.module_type,
    is_composited: nodeDef.is_composited,
    meta: { ...nodeDef.meta },
    inputs: JSON.parse(JSON.stringify(nodeDef.inputs)),
    outputs: JSON.parse(JSON.stringify(nodeDef.outputs)),
    position: { ...position },
    ...customData
  }
  
  // 如果有插槽定义，添加插槽数据
  if (nodeDef.slots) {
    nodeData.slots = {}
    Object.keys(nodeDef.slots).forEach(slotName => {
      nodeData.slots[slotName] = {
        module_id: `slot-${slotName}-${Date.now()}`,
        module_type: 'slot',
        is_composited: true,
        meta: {
          title: nodeDef.slots[slotName].title,
          description: nodeDef.slots[slotName].description,
          category: 'slot'
        },
        inputs: {
          input_defs: []
        },
        outputs: {
          output_defs: []
        }
      }
    })
  }
  
  // 创建Vue Flow节点格式
  const node = {
    id: nodeId,
    type: nodeDef.is_composited ? 'composite' : 'custom',
    position,
    data: nodeData
  }
  
  return node
}

/**
 * 为一个节点创建插槽节点
 * @param {Object} parentNode 父节点
 * @param {string} slotName 插槽名称
 * @param {Object} position 节点位置
 * @returns {Object} 插槽节点
 */
export function createSlotNode(parentNode, slotName, position = { x: 100, y: 150 }) {
  if (!parentNode || !parentNode.data || !parentNode.data.slots || !parentNode.data.slots[slotName]) {
    throw new Error(`无效的父节点或插槽名称: ${slotName}`)
  }
  
  const slotData = parentNode.data.slots[slotName]
  const slotNodeId = slotData.module_id
  
  const slotNode = {
    id: slotNodeId,
    type: 'slot',
    position,
    data: {
      ...slotData,
      position
    }
  }
  
  return slotNode
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
 * 创建节点和它的插槽节点
 * @param {string} type 节点类型
 * @param {Object} position 节点位置
 * @param {Object} customData 自定义数据
 * @returns {Promise<Object>} 包含节点和边的对象 { node, slotNodes, edges }
 */
export async function createNodeWithSlots(type, position = { x: 100, y: 100 }, customData = {}) {
  // 创建主节点
  const node = await createNode(type, position, customData)
  const slotNodes = []
  const edges = []
  
  // 获取节点类型定义
  const nodeDef = await findNodeTypeDefinition(type)
  if (!nodeDef || !nodeDef.slots) {
    return { node, slotNodes, edges }
  }
  
  // 计算插槽节点位置
  const slotNames = Object.keys(nodeDef.slots)
  slotNames.forEach((slotName, index) => {
    // 计算插槽节点位置 - 如果有多个插槽，则水平排列
    const slotX = position.x + (index - slotNames.length / 2 + 0.5) * 150
    const slotY = position.y + 150
    
    const slotPosition = { x: slotX, y: slotY }
    
    // 创建插槽节点
    const slotNode = createSlotNode(node, slotName, slotPosition)
    slotNodes.push(slotNode)
    
    // 创建连接边
    const edge = createEdge(
      node.id, 
      slotNode.id, 
      `slot-${slotName}`, 
      null, 
      { slotName }
    )
    edges.push(edge)
  })
  
  return { node, slotNodes, edges }
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