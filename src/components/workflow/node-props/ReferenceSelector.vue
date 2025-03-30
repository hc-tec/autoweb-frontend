<template>
  <a-dropdown :visible="visible" :trigger="['hover']" overlayClassName="ref-selector-dropdown" @visibleChange="handleVisibleChange">
    <slot></slot>
    <template #overlay>
      <div class="ref-selector" @click.stop>
        <div class="cascader-container">
          <!-- 第一列：模块列表 -->
          <div class="cascader-column">
            <div class="column-header">
              <span>选择上游模块</span>
            </div>
            <div class="column-content">
              <div 
                v-for="node in upstreamNodes" 
                :key="node.id" 
                class="cascader-item" 
                :class="{ 'active': hoveredNode && hoveredNode.id === node.id }"
                @mouseenter="hoverNode(node)"
                @click="selectNode(node)"
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
                <right-outlined class="item-arrow" />
              </div>
              <a-empty v-if="upstreamNodes.length === 0" description="没有可引用的上游模块" />
            </div>
          </div>
          
          <!-- 第二列：输出参数列表 -->
          <div class="cascader-column" v-if="hoveredNode">
            <div class="column-header">
              <span>{{ hoveredNode.data.meta?.title || hoveredNode.data.module_id }} 的输出</span>
            </div>
            <div class="column-content">
              <div 
                v-for="output in getNodeOutputs(hoveredNode)" 
                :key="output.name" 
                class="cascader-item"
                :class="{ 'active': hoveredOutput && hoveredOutput.name === output.name }"
                @mouseenter="hoverOutput(output)"
                @click="selectOutputItem(output)"
              >
                <div class="item-content">
                  <div class="item-title">{{ output.name }}</div>
                  <div class="item-desc">{{ output.type || 'any' }}</div>
                </div>
                <template v-if="isObjectType(output)">
                  <right-outlined class="item-arrow" />
                </template>
                <template v-else>
                  <check-outlined class="item-check" @click.stop="selectReference(hoveredNode, output)" />
                </template>
              </div>
              <a-empty v-if="getNodeOutputs(hoveredNode).length === 0" description="该模块没有输出参数" />
            </div>
          </div>
          
          <!-- 第三列：对象属性列表 -->
          <div class="cascader-column" v-if="hoveredNode && hoveredOutput && isObjectType(hoveredOutput)">
            <div class="column-header">
              <span>{{ hoveredOutput.name }} 的属性</span>
            </div>
            <div class="column-content">
              <div 
                v-for="prop in getObjectProperties(hoveredOutput)" 
                :key="prop.path" 
                class="cascader-item"
                @click="selectProperty(hoveredNode, hoveredOutput, prop)"
              >
                <div class="item-content">
                  <div class="item-title">{{ prop.name }}</div>
                  <div class="item-desc">{{ prop.type || 'any' }}</div>
                </div>
                <check-outlined class="item-check" />
              </div>
              <a-empty v-if="getObjectProperties(hoveredOutput).length === 0" description="无法检测对象属性" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </a-dropdown>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useVueFlow } from '@vue-flow/core';
import { LeftOutlined, RightOutlined, CheckOutlined } from '@ant-design/icons-vue';

const props = defineProps({
  currentNodeId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['close', 'select-reference', 'visible-change']);

// 使用Vue Flow的API获取节点和边
const { findNode, getNodes, getEdges } = useVueFlow();

// 状态管理 - 悬停状态
const hoveredNode = ref(null);
const hoveredOutput = ref(null);
const selectedNode = ref(null);
const selectedOutput = ref(null);

// 下拉菜单可见性控制
const visible = ref(false);

// 处理下拉菜单可见性变化
const handleVisibleChange = (v) => {
  visible.value = v;
  emit('visible-change', v);
  
  if (!v) {
    resetSelection();
  }
};

// 获取上游节点
const upstreamNodes = computed(() => {
  if (!props.currentNodeId) {
    return [];
  }
  
  const edges = getEdges.value;
  const nodes = getNodes.value;
  
  // 查找连接到当前节点的所有边
  const incomingEdges = edges.filter(edge => edge.target === props.currentNodeId);
  
  // 获取这些边的源节点
  const nodeIds = incomingEdges.map(edge => edge.source);
  
  // 从节点列表中获取这些节点
  return nodes.filter(node => nodeIds.includes(node.id));
});

// 鼠标悬停在节点上
const hoverNode = (node) => {
  hoveredNode.value = node;
};

// 鼠标悬停在输出上
const hoverOutput = (output) => {
  hoveredOutput.value = output;
};

// 获取节点的输出参数
const getNodeOutputs = (node) => {
  if (!node || !node.data || !node.data.outputs || !node.data.outputs.output_defs) {
    return [];
  }
  return node.data.outputs.output_defs;
};

// 获取对象的属性
const getObjectProperties = (output) => {
  if (!output || output.type !== 'object') {
    return [];
  }
  
  // 如果有schema属性，使用schema来确定属性
  if (output.schema) {
    return Object.entries(output.schema).map(([key, value]) => ({
      name: key,
      type: value.type || 'any',
      path: `${output.name}.${key}`
    }));
  }
  
  // 默认的一些通用对象属性
  return [
    { name: 'id', type: 'string', path: `${output.name}.id` },
    { name: 'name', type: 'string', path: `${output.name}.name` },
    { name: 'value', type: 'any', path: `${output.name}.value` },
    { name: 'data', type: 'any', path: `${output.name}.data` }
  ];
};

// 获取节点首字母作为图标显示
const getNodeInitial = (node) => {
  const title = node.data.meta?.title || node.data.module_id || node.id;
  return title.charAt(0).toUpperCase();
}

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

// 判断是否为对象类型
const isObjectType = (output) => {
  return output && output.type === 'object';
};

// 选择节点（点击）
const selectNode = (node) => {
  selectedNode.value = node;
  hoveredNode.value = node;
};

// 选择输出项（点击）
const selectOutputItem = (output) => {
  selectedOutput.value = output;
  hoveredOutput.value = output;
  
  // 如果不是对象类型，直接选择为引用
  if (!isObjectType(output)) {
    selectReference(hoveredNode.value, output);
  }
};

// 选择对象属性
const selectProperty = (node, output, prop) => {
  const reference = {
    type: 'ref',
    content: {
      moduleID: node.id,
      name: output.name,
      property: prop.name,
      path: prop.path,
      source: 'block-output'
    }
  };
  
  emit('select-reference', reference);
  emit('close');
  visible.value = false;
  resetSelection();
};

// 选择引用
const selectReference = (node, output) => {
  const reference = {
    type: 'ref',
    content: {
      moduleID: node.id,
      name: output.name,
      source: 'block-output'
    }
  };
  
  emit('select-reference', reference);
  emit('close');
  visible.value = false;
  resetSelection();
};

// 重置选择
const resetSelection = () => {
  hoveredNode.value = null;
  hoveredOutput.value = null;
  selectedNode.value = null;
  selectedOutput.value = null;
};
</script>

<style scoped>
.ref-selector {
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.cascader-container {
  display: flex;
  min-height: 200px;
  max-height: 400px;
}

.cascader-column {
  display: flex;
  flex-direction: column;
  min-width: 180px;
  border-right: 1px solid #f0f0f0;
}

.cascader-column:last-child {
  border-right: none;
}

.column-header {
  padding: 10px 12px;
  font-weight: 500;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.column-content {
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

.cascader-item:hover, .cascader-item.active {
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

.item-arrow {
  margin-left: 6px;
  color: #8c8c8c;
}

.item-check {
  margin-left: 6px;
  color: #1890ff;
}

:deep(.ant-dropdown-trigger) {
  cursor: pointer;
}
</style> 