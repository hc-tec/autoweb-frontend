<template>
  <a-drawer
    :visible="visible"
    :width="400"
    :closable="false"
    placement="right"
    :mask="false"
    class="node-properties-drawer"
    :destroy-on-close="false"
    @close="handleClose"
  >
    <!-- 节点头部 -->
    <node-header 
      :node="node" 
      @close="handleClose" 
    />
    
    <!-- 主要内容区域 -->
    <div class="drawer-content">
      <!-- 处理模式选择 -->
      <div class="mode-selector">
        <a-tabs v-model:value="activeMode" size="small">
          <a-tab-pane key="single" tab="单次" />
          <a-tab-pane key="batch" tab="批处理" />
        </a-tabs>
      </div>
      
      <!-- 参数内容 -->
      <div class="params-content">
        <!-- 输入参数部分 -->
        <input-params-section
          :node="node"
          @update-param="updateParamValue"
        />
        
        <!-- 输出参数部分 -->
        <output-params-section
          :node="node"
        />
      </div>
    </div>
  </a-drawer>
</template>

<script setup>
import { ref, watch } from 'vue';
import NodeHeader from './node-props/NodeHeader.vue';
import InputParamsSection from './node-props/InputParamsSection.vue';
import OutputParamsSection from './node-props/OutputParamsSection.vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  node: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'update-node']);

// 当前处理模式
const activeMode = ref('single');

// 关闭抽屉
const handleClose = () => {
  emit('close');
};

// 更新参数值
const updateParamValue = ({ paramName, value }) => {
  if (!props.node || !props.node.id) {
    return;
  }
  
  // 创建节点更新
  const updatedNode = { ...props.node };
  
  // 确保节点有 data 和 inputs 属性
  if (!updatedNode.data) {
    updatedNode.data = {};
  }
  
  if (!updatedNode.data.inputs) {
    updatedNode.data.inputs = {
      input_defs: [],
      input_parameters: []
    };
  }
  
  if (!updatedNode.data.inputs.input_parameters) {
    updatedNode.data.inputs.input_parameters = [];
  }
  
  // 查找现有参数或创建新参数
  const paramIndex = updatedNode.data.inputs.input_parameters.findIndex(p => p.name === paramName);
  
  if (paramIndex >= 0) {
    // 更新现有参数
    updatedNode.data.inputs.input_parameters[paramIndex] = {
      ...updatedNode.data.inputs.input_parameters[paramIndex],
      input: {
        type: getParamType(paramName, updatedNode),
        value: value
      }
    };
  } else {
    // 添加新参数
    updatedNode.data.inputs.input_parameters.push({
      name: paramName,
      input: {
        type: getParamType(paramName, updatedNode),
        value: value
      }
    });
  }
  
  // 触发节点更新事件
  emit('update-node', updatedNode);
};

// 获取参数类型的辅助函数
const getParamType = (paramName, node) => {
  if (!node.data || !node.data.inputs || !node.data.inputs.input_defs) {
    return 'any';
  }
  
  const paramDef = node.data.inputs.input_defs.find(def => def.name === paramName);
  return paramDef ? paramDef.type : 'any';
};
</script>

<style scoped>
.node-properties-drawer {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

:deep(.ant-drawer-body) {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0 20px 0;
}

.mode-selector {
  padding: 0 16px 16px;
  background-color: white;
  border-bottom: 1px solid #f0f0f0;
}

.params-content {
  padding: 0;
}
</style> 