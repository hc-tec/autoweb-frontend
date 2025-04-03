<template>
  <div class="code-node-io-config">
    <!-- 输入参数配置 -->
    <a-collapse v-model:activeKey="activeKeys" :bordered="false">
      <a-collapse-panel key="inputs" :header="inputHeaderTitle" class="param-panel">
        <params-array-editor
          :value="inputDefinitions"
          param-type="input"
          :current-node-id="node.id"
          @update="updateInputDefs"
        />
      </a-collapse-panel>
      
      <!-- 输出参数配置 -->
      <a-collapse-panel key="outputs" :header="outputHeaderTitle" class="param-panel">
        <params-array-editor
          :value="outputDefinitions"
          param-type="output"
          :needVaryValueInput="false"
          :current-node-id="node.id"
          @update="updateOutputDefs"
        />
      </a-collapse-panel>
    </a-collapse>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import ParamsArrayEditor from './ParamsArrayEditor.vue';
import { useNodeUpdater } from '@/composables/useNodeUpdater';

const props = defineProps({
  node: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update-node']);

// 控制面板展开状态
const activeKeys = ref(['inputs', 'outputs']);

// 深拷贝辅助函数
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

// 获取输入参数定义（使用深拷贝避免直接修改props）
const inputDefinitions = ref([]);
const outputDefinitions = ref([]);

// 标题行显示
const inputHeaderTitle = computed(() => {
  return `输入参数 (${inputDefinitions.value.length})`;
});

const outputHeaderTitle = computed(() => {
  return `输出参数 (${outputDefinitions.value.length})`;
});

// 获取节点更新器
const { updateNodeInputDefs } = useNodeUpdater();

// 监听节点变化，更新本地定义
watch(() => props.node, (newNode) => {
  if (newNode && newNode.data) {
    // 初始化输入定义
    if (newNode.data.inputs && newNode.data.inputs.input_defs) {
      inputDefinitions.value = deepClone(newNode.data.inputs.input_defs);
    } else {
      inputDefinitions.value = [];
    }
    
    // 初始化输出定义
    if (newNode.data.outputs && newNode.data.outputs.output_defs) {
      outputDefinitions.value = deepClone(newNode.data.outputs.output_defs);
    } else {
      outputDefinitions.value = [];
    }
  }
}, { immediate: true, deep: true });

// 更新输入配置
const updateInputDefs = (updatedDefs) => {
  
  // 确保数据有效
  if (!Array.isArray(updatedDefs)) {
    console.warn('CodeNodeIoConfig: 输入参数更新失败 - 无效的数据格式');
    return;
  }
  
  // 更新本地状态
  inputDefinitions.value = deepClone(updatedDefs);
  
  // 使用节点更新器更新输入定义
  updateNodeInputDefs(props.node, updatedDefs);
};

// 更新输出配置
const updateOutputDefs = (updatedDefs) => {
  
  // 确保数据有效
  if (!Array.isArray(updatedDefs)) {
    console.warn('CodeNodeIoConfig: 输出参数更新失败 - 无效的数据格式');
    return;
  }
  
  // 更新本地状态
  outputDefinitions.value = deepClone(updatedDefs);
  
  // 准备节点更新数据
  const updatedData = {
    outputs: {
      ...(props.node.data.outputs || {}),
      output_defs: deepClone(updatedDefs)
    }
  };
  
  // 使用节点更新函数更新节点
  emit('update-node', updatedData);
};
</script>

<style scoped>
.code-node-io-config {
  width: 100%;
}

.param-panel {
  background: white;
}

:deep(.ant-collapse-header) {
    padding: 8px 0;
  font-size: 14px;
  font-weight: 500;
}

:deep(.ant-collapse-content-box) {
    padding: 8px 0;
}
</style> 