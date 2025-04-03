<template>
  <a-dropdown :open="visible" :trigger="['click']" overlayClassName="ref-selector-dropdown" @openChange="handleVisibleChange">
    <slot></slot>
    <template #overlay>
      <div class="ref-selector" @click.stop>
        <!-- 直接显示级联菜单，而不是显示cascader输入框 -->
        <div class="cascader-menus">
          <!-- 第一级菜单：模块列表 -->
          <div class="cascader-menu">
            <div class="menu-header">可引用模块</div>
            <div class="menu-items">
              <!-- 同层级上游节点 -->
              <div v-if="directUpstreamNodes.length > 0" class="node-group">
                <div class="group-title">同层级节点</div>
                <div
                  v-for="node in directUpstreamNodes"
                  :key="node.id"
                  class="cascader-item"
                  :class="{ 'active': currentNode === node.id }"
                  @click="selectNode(node.id)"
                >
                  <div class="item-icon">
                    <div class="node-icon" :style="{backgroundColor: getNodeColor(node)}">
                      {{ getNodeInitial(node) }}
                    </div>
                  </div>
                  <div class="item-content">
                    <div class="item-title">{{ node.data.meta?.title || node.data.module_id || node.id }}</div>
                    <div class="item-desc">{{ node.data.module_type || node.type }}</div>
                  </div>
                  <div class="item-expand-icon" v-if="getNodeOutputs(node).length > 0">
                    <right-outlined />
                  </div>
                </div>
              </div>
              
              <!-- 节点所在的父节点 -->
              <div v-if="getParentNode()" class="node-group">
                <div class="group-title">父节点</div>
                <div
                  class="cascader-item"
                  :class="{ 'active': currentNode === getParentNode()?.id }"
                  @click="selectNode(getParentNode()?.id)"
                >
                  <div class="item-icon">
                    <div class="node-icon" :style="{backgroundColor: getNodeColor(getParentNode())}">
                      {{ getNodeInitial(getParentNode()) }}
                    </div>
                  </div>
                  <div class="item-content">
                    <div class="item-title">{{ getParentNode()?.data.meta?.title || getParentNode()?.data.module_id || getParentNode()?.id }}</div>
                    <div class="item-desc">{{ getParentNode()?.data.module_type || getParentNode()?.type }}</div>
                  </div>
                  <div class="item-expand-icon" v-if="getNodeOutputs(getParentNode()).length > 0">
                    <right-outlined />
                  </div>
                </div>
              </div>
              
              <!-- 父节点的上游节点 -->
              <div v-if="getParentUpstreamNodes().length > 0" class="node-group">
                <div class="group-title">父节点上游</div>
                <div
                  v-for="node in getParentUpstreamNodes()"
                  :key="node.id"
                  class="cascader-item"
                  :class="{ 'active': currentNode === node.id }"
                  @click="selectNode(node.id)"
                >
                  <div class="item-icon">
                    <div class="node-icon" :style="{backgroundColor: getNodeColor(node)}">
                      {{ getNodeInitial(node) }}
                    </div>
                  </div>
                  <div class="item-content">
                    <div class="item-title">{{ node.data.meta?.title || node.data.module_id || node.id }}</div>
                    <div class="item-desc">{{ node.data.module_type || node.type }}</div>
                    <div v-if="getNodeSourcePath(node.id)" class="item-source">来源: {{ getNodeSourcePath(node.id) }}</div>
                  </div>
                  <div class="item-expand-icon" v-if="getNodeOutputs(node).length > 0">
                    <right-outlined />
                  </div>
                </div>
              </div>
              
              <!-- 所有其他可引用节点 -->
              <div v-if="getOtherReferenceNodes().length > 0" class="node-group">
                <div class="group-title">高层级引用</div>
                <div
                  v-for="node in getOtherReferenceNodes()"
                  :key="node.id"
                  class="cascader-item"
                  :class="{ 'active': currentNode === node.id }"
                  @click="selectNode(node.id)"
                >
                  <div class="item-icon">
                    <div class="node-icon" :style="{backgroundColor: getNodeColor(node)}">
                      {{ getNodeInitial(node) }}
                    </div>
                  </div>
                  <div class="item-content">
                    <div class="item-title">{{ node.data.meta?.title || node.data.module_id || node.id }}</div>
                    <div class="item-desc">{{ node.data.module_type || node.type }}</div>
                    <div class="item-source">来源: {{ getNodeSourcePath(node.id) }}</div>
                  </div>
                  <div class="item-expand-icon" v-if="getNodeOutputs(node).length > 0">
                    <right-outlined />
                  </div>
                </div>
              </div>
              
              <a-empty v-if="upstreamNodes.length === 0" description="没有可引用的上游模块" />
            </div>
          </div>
          
          <!-- 第二级菜单：输出参数列表 -->
          <div class="cascader-menu" v-if="currentNode">
            <div class="menu-header">输出参数</div>
            <div class="menu-items">
              <div
                v-for="output in currentNodeOutputs"
                :key="output.key"
                class="cascader-item"
                :class="{ 'active': currentOutput === output.key }"
                @click="selectOutput(output)"
              >
                <div class="item-content">
                  <div class="item-title">{{ output.title }}</div>
                  <div class="item-desc">{{ output.type }}</div>
                </div>
                <div v-if="isObjectOutput(output)">
                  <right-outlined class="item-expand-icon" />
                </div>
                <div v-else>
                  <check-outlined class="item-check" @click.stop="selectReference(output)" />
                </div>
              </div>
              <a-empty v-if="currentNodeOutputs.length === 0" description="没有输出参数" />
            </div>
          </div>
          
          <!-- 第三级菜单：对象属性列表 -->
          <div class="cascader-menu" v-if="currentOutput && selectedOutputProps.length > 0">
            <div class="menu-header">属性列表</div>
            <div class="menu-items">
              <div
                v-for="prop in selectedOutputProps"
                :key="prop.key"
                class="cascader-item"
                @click="selectProperty(prop)"
              >
                <div class="item-content">
                  <div class="item-title">{{ prop.title }}</div>
                  <div class="item-desc">{{ prop.type }}</div>
                </div>
                <div>
                  <check-outlined class="item-check" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </a-dropdown>
</template>

<script setup>
import { ref, computed, inject } from 'vue';
import { useVueFlow } from '@vue-flow/core';
import { RightOutlined, CheckOutlined } from '@ant-design/icons-vue';

const props = defineProps({
  currentNodeId: {
    type: String,
    required: false,
    default: null
  }
});

const emit = defineEmits(['close', 'select-reference', 'visible-change']);

// 使用Vue Flow的API获取节点和边
const { getNodes, getEdges } = useVueFlow();
// 从依赖注入获取当前选中节点
const injectedSelectedNode = inject('selectedNode', null);

// 计算当前节点ID（优先使用props中的值，如果为null则使用注入的值）
const currentNodeId = computed(() => {
  return props.currentNodeId || (injectedSelectedNode.value ? injectedSelectedNode.value.id : null);
});

// 下拉菜单可见性控制
const visible = ref(false);

// 当前选中的节点和输出
const currentNode = ref(null);
const currentOutput = ref(null);

// 处理下拉菜单可见性变化
const handleVisibleChange = (v) => {
  visible.value = v;
  emit('visible-change', v);
  
  if (!v) {
    // 关闭时重置选择
    resetSelection();
  }
};

// 获取直接连接的上游节点
const directUpstreamNodes = computed(() => {
  console.log("directUpstreamNodes", currentNodeId.value);
  
  if (!currentNodeId.value) {
    return [];
  }
  
  const edges = getEdges.value;
  const nodes = getNodes.value;
  
  // 获取当前节点的直接上游节点（同一层级内的连接）
  const currentNode = nodes.find(node => node.id === currentNodeId.value);
  const parentId = currentNode?.parentNode;
  
  // 获取同一层级内的连接
  const incomingEdges = edges.filter(edge => 
    edge.target === currentNodeId.value && 
    // 确保源节点和目标节点在同一层级
    nodes.find(n => n.id === edge.source)?.parentNode === parentId
  );
  
  const sourceNodeIds = incomingEdges.map(edge => edge.source);
  return nodes.filter(node => sourceNodeIds.includes(node.id));
});

// 获取父节点和父节点的上游节点
const parentNodes = computed(() => {
  if (!currentNodeId.value) {
    return [];
  }
  
  const nodes = getNodes.value;
  const currentNode = nodes.find(node => node.id === currentNodeId.value);
  if (!currentNode || !currentNode.parentNode) return [];
  
  // 获取父节点
  const parentNode = nodes.find(node => node.id === currentNode.parentNode);
  if (!parentNode) return [];
  
  // 结果数组，先加入父节点本身
  const result = [parentNode];
  
  // 获取父节点的上游节点
  const parentUpstream = getNodeUpstreams(parentNode.id);
  result.push(...parentUpstream);
  
  return result;
});

// 获取嵌套层级上游可引用的节点
const parentUpstreamNodes = computed(() => {
  const allParentNodes = parentNodes.value;
  // 过滤出不是直接连接的节点
  return allParentNodes;
});

// 获取某个节点的所有上游节点 (包括同一层级和父层级的所有上游节点)
const getNodeUpstreams = (nodeId) => {
  const edges = getEdges.value;
  const nodes = getNodes.value;
  const targetNode = nodes.find(node => node.id === nodeId);
  if (!targetNode) return [];
  
  // 结果集合
  const resultSet = new Set();
  
  // 递归获取节点的所有可引用上游节点
  const collectNodeUpstreams = (nId, isRoot = false) => {
    const node = nodes.find(n => n.id === nId);
    if (!node) return;
    
    // 获取同层级直接连接的上游节点
    const parentId = node.parentNode;
    const incomingEdges = edges.filter(edge => 
      edge.target === nId && 
      // 确保源节点和目标节点在同一层级
      nodes.find(n => n.id === edge.source)?.parentNode === parentId
    );
    
    // 添加所有同层级上游节点
    for (const edge of incomingEdges) {
      const sourceNode = nodes.find(n => n.id === edge.source);
      if (sourceNode && !resultSet.has(sourceNode.id)) {
        // 如果不是根节点的话，添加上游节点
        if (!isRoot || sourceNode.id !== currentNodeId.value) {
          resultSet.add(sourceNode.id);
          // 递归收集该上游节点的上游节点
          collectNodeUpstreams(sourceNode.id);
        }
      }
    }
    
    // 如果有父节点，添加父节点并收集父节点的上游
    if (parentId) {
      const parentNode = nodes.find(n => n.id === parentId);
      if (parentNode && !resultSet.has(parentNode.id)) {
        resultSet.add(parentNode.id);
        // 继续递归查找父节点的上游节点
        collectNodeUpstreams(parentId);
      }
    }
  };
  
  // 从目标节点开始递归收集
  collectNodeUpstreams(nodeId, true);
  
  // 将Set转换为节点数组
  return Array.from(resultSet).map(id => nodes.find(n => n.id === id)).filter(Boolean);
};

// 获取所有上游节点（包括直接连接和父节点引用）
const upstreamNodes = computed(() => {
  if (!currentNodeId.value) {
    return [];
  }
  
  // 1. 直接连接的上游节点（同层级）
  const directNodes = directUpstreamNodes.value;
  
  // 2. 来自父节点的可引用节点
  const parentNodes = parentUpstreamNodes.value;
  
  // 合并结果，首先显示直接连接的节点，然后是父节点及其上游节点
  return [...directNodes, ...parentNodes];
});

// 获取节点首字母作为图标显示
const getNodeInitial = (node) => {
  const title = node.data.meta?.title || node.data.module_id || node.id;
  return title.charAt(0).toUpperCase();
};

// 获取节点颜色
const getNodeColor = (node) => {
  const nodeTypeColors = {
    'web': '#1890ff',
    'http': '#52c41a',
    'text': '#fa8c16',
    'parse': '#722ed1',
    'filter': '#eb2f96',
    'transform': '#13c2c2',
    'output': '#faad14',
    'custom': '#2f54eb'
  };
  
  const moduleType = node.data.module_type || node.type;
  return nodeTypeColors[moduleType] || '#1890ff';
};

// 获取节点的输出参数
const getNodeOutputs = (node) => {
  if (!node || !node.data || !node.data.outputs || !node.data.outputs.output_defs) {
    return [];
  }
  
  // 返回节点的输出定义，并确保每个输出定义都包含schema（如果有的话）
  return node.data.outputs.output_defs.map(output => {
    // 如果输出已经有schema，保持原样
    if (output.schema) {
      return output;
    }
    
    // 尝试从节点的通用schema中获取
    if (node.data.schema && node.data.schema.outputs && node.data.schema.outputs[output.name]) {
      return {
        ...output,
        schema: node.data.schema.outputs[output.name]
      };
    }
    
    // 特殊处理：为循环节点的item输出添加schema（兼容旧数据）
    if (node.data.module_type === 'loop' && output.name === 'item') {
      // 尝试从node.data.schema获取自定义schema
      if (node.data.schema && node.data.schema.item) {
        return {
          ...output, 
          schema: node.data.schema.item
        };
      }
      
      // 默认schema为简单对象
      return {
        ...output,
        schema: {
          type: 'object',
          properties: {
            index: { type: 'integer', description: '当前索引' },
            value: { type: output.type === 'object' ? 'object' : 'any', description: '当前值' }
          }
        }
      };
    }
    
    return output;
  });
};

// 获取当前选中节点的对象
const currentNodeObject = computed(() => {
  return upstreamNodes.value.find(node => node.id === currentNode.value);
});

// 获取当前选中节点的所有输出参数
const currentNodeOutputs = computed(() => {
  const node = currentNodeObject.value;
  if (!node) return [];
  
  return getNodeOutputs(node).map(output => ({
    key: `${node.id}-${output.name}`,
    title: output.name,
    type: output.type || 'any',
    nodeId: node.id,
    outputName: output.name,
    isObject: output.type === 'object',
    isArray: output.type === 'array',
    schema: output.schema // 保留schema信息
  }));
});

// 获取选中输出参数的属性列表
const selectedOutputProps = computed(() => {
  if (!currentOutput.value) return [];
  
  const output = currentNodeOutputs.value.find(o => o.key === currentOutput.value);
  if (!output) return [];
  
  // 如果不是对象或数组类型，不显示属性
  if (!output.isObject && !output.isArray) return [];
  
  // 如果有schema属性，使用schema来确定属性
  if (output.schema) {
    // 处理对象类型
    if (output.isObject && output.schema.properties) {
      return Object.entries(output.schema.properties).map(([key, prop]) => ({
        key: `${output.key}-${key}`,
        title: key,
        type: prop.type || 'any',
        description: prop.description || '',
        nodeId: output.nodeId,
        outputName: output.outputName,
        propName: key,
        path: `${output.outputName}.${key}`,
        // 如果属性本身是对象或数组，添加它的schema以支持多级引用
        isNestedObject: prop.type === 'object' || prop.type === 'array',
        nestedSchema: prop
      }));
    }
    
    // 处理数组类型
    if (output.isArray && output.schema.items) {
      // 数组项的schema
      const itemsSchema = output.schema.items;
      
      // 如果数组项是对象类型
      if (itemsSchema.type === 'object' && itemsSchema.properties) {
        return [
          // 首先添加数组本身的引用
          {
            key: `${output.key}-array`,
            title: '整个数组',
            type: 'array',
            nodeId: output.nodeId,
            outputName: output.outputName,
            path: output.outputName,
            isArray: true
          },
          // 然后添加数组项的属性
          ...Object.entries(itemsSchema.properties).map(([key, prop]) => ({
            key: `${output.key}-item-${key}`,
            title: `[].${key}`,
            type: prop.type || 'any',
            description: prop.description || '',
            nodeId: output.nodeId,
            outputName: output.outputName,
            propName: key,
            path: `${output.outputName}[*].${key}`, // 使用[*]表示所有数组项
            isArrayItem: true,
            // 如果属性本身是对象或数组，添加它的schema以支持多级引用
            isNestedObject: prop.type === 'object' || prop.type === 'array',
            nestedSchema: prop
          }))
        ];
      } else {
        // 如果数组项是简单类型
        return [
          {
            key: `${output.key}-array`,
            title: '整个数组',
            type: 'array',
            nodeId: output.nodeId,
            outputName: output.outputName,
            path: output.outputName,
            isArray: true
          },
          {
            key: `${output.key}-item`,
            title: '[].值',
            type: itemsSchema.type || 'any',
            nodeId: output.nodeId,
            outputName: output.outputName,
            path: `${output.outputName}[*]`, // 使用[*]表示所有数组项
            isArrayItem: true
          }
        ];
      }
    }
    
    return [];
  }
  
  // 如果没有schema，使用默认属性
  return [
    { key: `${output.key}-id`, title: 'id', type: 'string', nodeId: output.nodeId, outputName: output.outputName, propName: 'id', path: `${output.outputName}.id` },
    { key: `${output.key}-name`, title: 'name', type: 'string', nodeId: output.nodeId, outputName: output.outputName, propName: 'name', path: `${output.outputName}.name` },
    { key: `${output.key}-value`, title: 'value', type: 'any', nodeId: output.nodeId, outputName: output.outputName, propName: 'value', path: `${output.outputName}.value` },
    { key: `${output.key}-data`, title: 'data', type: 'any', nodeId: output.nodeId, outputName: output.outputName, propName: 'data', path: `${output.outputName}.data` }
  ];
});

// 判断是否为对象类型输出
const isObjectOutput = (output) => {
  return output && output.isObject;
};

// 选择节点
const selectNode = (nodeId) => {
  currentNode.value = nodeId;
  currentOutput.value = null;
};

// 选择输出
const selectOutput = (output) => {
  currentOutput.value = output.key;
  
  // 如果不是对象类型，直接选择引用
  if (!output.isObject) {
    selectReference(output);
  }
};

// 选择对象属性
const selectProperty = (prop) => {
  // 获取节点信息，包括类型
  const nodeInfo = getNodeInfo(prop.nodeId);
  
  // 构造引用对象
  const reference = {
    type: 'reference',
    content: {
      moduleID: prop.nodeId, // 模块ID，用于在引用管理中标识
      nodeTitle: nodeInfo.title, // 添加模块标题
      moduleType: nodeInfo.type, // 添加模块类型
      name: prop.outputName, // 输出参数名
      property: prop.propName, // 属性名
      path: prop.path, // 完整路径
      isArrayItem: !!prop.isArrayItem, // 是否是数组项
      isArray: !!prop.isArray, // 是否是数组
      source: 'block-output' // 引用来源
    }
  };
  
  emit('select-reference', reference);
  emit('close');
  visible.value = false;
  resetSelection();
};

// 选择引用
const selectReference = (output) => {
  // 获取节点信息，包括类型
  const nodeInfo = getNodeInfo(output.nodeId);
  
  // 构造引用对象
  const reference = {
    type: 'reference',
    content: {
      moduleID: output.nodeId, // 模块ID
      nodeTitle: nodeInfo.title, // 添加模块标题
      moduleType: nodeInfo.type, // 添加模块类型
      name: output.outputName, // 输出参数名
      path: output.path || output.outputName, // 完整路径
      isArrayItem: !!output.isArrayItem, // 是否是数组项
      isArray: !!output.isArray, // 是否是数组
      source: 'block-output' // 引用来源
    }
  };
  
  emit('select-reference', reference);
  emit('close');
  visible.value = false;
  resetSelection();
};

// 获取节点名称和类型信息
const getNodeInfo = (nodeId) => {
  const node = upstreamNodes.value.find(n => n.id === nodeId);
  if (node) {
    return {
      title: node.data?.meta?.title || node.data?.module_id || nodeId,
      type: node.data?.module_type || node.type || 'G'
    };
  }
  return { title: nodeId, type: 'G' };
};

// 重置选择
const resetSelection = () => {
  currentNode.value = null;
  currentOutput.value = null;
};

// 获取节点的来源路径
const getNodeSourcePath = (nodeId) => {
  const nodes = getNodes.value;
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return '';
  
  // 如果节点是当前节点的直接上游，不显示来源
  const isDirectUpstream = directUpstreamNodes.value.some(n => n.id === nodeId);
  if (isDirectUpstream) return '';
  
  // 获取节点所在层级（父节点链）
  const getParentChain = (nId) => {
    const result = [];
    let current = nodes.find(n => n.id === nId);
    
    while (current && current.parentNode) {
      const parent = nodes.find(n => n.id === current.parentNode);
      if (parent) {
        result.unshift({
          id: parent.id,
          name: parent.data.meta?.title || parent.data.module_id || parent.id
        });
      }
      current = parent;
    }
    
    return result;
  };
  
  // 获取节点和当前节点的父节点链
  const nodeParentChain = getParentChain(nodeId);
  const currentParentChain = getParentChain(currentNodeId.value);
  
  // 查找共同祖先节点的索引
  let commonAncestorIndex = -1;
  for (let i = 0; i < Math.min(nodeParentChain.length, currentParentChain.length); i++) {
    if (nodeParentChain[i].id === currentParentChain[i].id) {
      commonAncestorIndex = i;
    } else {
      break;
    }
  }
  
  // 构建清晰的路径文本
  let pathText = '';
  
  // 如果有共同祖先
  if (commonAncestorIndex >= 0) {
    // 从共同祖先到节点的路径
    const specificPath = nodeParentChain.slice(commonAncestorIndex + 1);
    
    if (specificPath.length > 0) {
      // 显示从共同祖先到节点的路径
      const pathNames = specificPath.map(p => p.name);
      const sourceName = node.data.meta?.title || node.data.module_id || node.id;
      
      if (pathNames.length > 0) {
        pathText = `${pathNames.join(' → ')} → ${sourceName}`;
      } else {
        // 如果节点是父节点的直接上游
        const parentNodeId = currentParentChain[commonAncestorIndex]?.id;
        const edges = getEdges.value;
        const isParentUpstream = edges.some(e => 
          e.target === parentNodeId && e.source === nodeId
        );
        
        if (isParentUpstream) {
          pathText = `父节点的上游`;
        } else {
          pathText = `父节点 ${currentParentChain[commonAncestorIndex]?.name || ''}`;
        }
      }
    }
  }
  
  return pathText;
};

// 获取当前节点的父节点
const getParentNode = () => {
  const nodes = getNodes.value;
  const currentNode = nodes.find(node => node.id === currentNodeId.value);
  if (!currentNode || !currentNode.parentNode) return null;
  
  return nodes.find(node => node.id === currentNode.parentNode);
};

// 获取父节点的直接上游节点
const getParentUpstreamNodes = () => {
  const parentNode = getParentNode();
  if (!parentNode) return [];
  
  const edges = getEdges.value;
  const nodes = getNodes.value;
  
  // 获取父节点所在层级
  const parentOfParent = parentNode.parentNode;
  
  // 获取同层级的连接
  const incomingEdges = edges.filter(edge => 
    edge.target === parentNode.id && 
    nodes.find(n => n.id === edge.source)?.parentNode === parentOfParent
  );
  
  const sourceNodeIds = incomingEdges.map(edge => edge.source);
  return nodes.filter(node => sourceNodeIds.includes(node.id));
};

// 获取其他高层级引用节点
const getOtherReferenceNodes = () => {
  // 所有可引用节点
  const all = upstreamNodes.value;
  // 直接上游节点
  const direct = directUpstreamNodes.value;
  // 父节点
  const parent = getParentNode() ? [getParentNode()] : [];
  // 父节点的上游节点
  const parentUpstream = getParentUpstreamNodes();
  
  // 已经分类的节点ID集合
  const categorizedIds = new Set([
    ...direct.map(n => n.id),
    ...parent.map(n => n.id),
    ...parentUpstream.map(n => n.id)
  ]);
  
  // 过滤出未分类的节点
  return all.filter(node => !categorizedIds.has(node.id));
};
</script>

<style scoped>
.ref-selector {
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.cascader-menus {
  display: flex;
}

.cascader-menu {
  min-width: 180px;
  border-right: 1px solid #f0f0f0;
  height: 300px;
  display: flex;
  flex-direction: column;
}

.cascader-menu:last-child {
  border-right: none;
}

.menu-header {
  padding: 10px 12px;
  font-weight: 500;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.menu-items {
  flex: 1;
  overflow-y: auto;
}

.cascader-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f5f5f5;
}

.cascader-item.active {
  background-color: #e6f7ff;
  font-weight: 500;
}

.cascader-item:hover {
  background-color: #f5f5f5;
}

.item-icon {
  margin-right: 10px;
}

.node-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.item-content {
  flex: 1;
  overflow: hidden;
}

.item-title {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-desc {
  font-size: 12px;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-expand-icon {
  margin-left: 6px;
  color: #8c8c8c;
}

.item-check {
  margin-left: 6px;
  color: #1890ff;
}

.item-source {
  font-size: 11px;
  color: #1890ff;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.ant-dropdown-trigger) {
  cursor: pointer;
}

.node-group {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 4px;
  margin-bottom: 4px;
}

.node-group:last-child {
  border-bottom: none;
}

.group-title {
  padding: 6px 12px;
  font-size: 12px;
  color: #666;
  background-color: #f9f9f9;
  font-weight: 500;
}
</style> 