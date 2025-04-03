<template>
  <div class="node-schema-editor">
    <a-collapse v-model:activeKey="activeKeys" :bordered="false">
      <a-collapse-panel key="schema" header="输出数据结构定义" class="schema-panel">
        <div class="output-select">
          <a-space direction="vertical" style="width: 100%">
            <a-select
              v-model:value="selectedOutput"
              style="width: 100%"
              placeholder="选择输出参数"
              :options="outputOptions"
              @change="handleOutputChange"
              :allowClear="true"
            />
          </a-space>
        </div>
        
        <div v-if="selectedOutput" class="schema-edit-section">
          <!-- 使用SchemaEditor组件编辑所选输出的schema -->
          <schema-editor
            :value="currentSchema"
            :title="`${getOutputName(selectedOutput)}参数结构`"
            @update:value="updateOutputSchema"
          />
        </div>
        
        <div v-if="!selectedOutput" class="empty-placeholder">
          <a-empty 
            description="请选择一个输出参数来定义其数据结构" 
            :image="Empty.PRESENTED_IMAGE_SIMPLE"
          >
            <template #description>
              <span class="empty-text">请选择一个输出参数来定义其数据结构</span>
            </template>
          </a-empty>
        </div>
      </a-collapse-panel>
    </a-collapse>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, inject } from 'vue';
import SchemaEditor from './SchemaEditor.vue';
import { useNodeUpdater } from '@/composables/useNodeUpdater';
import { Empty } from 'ant-design-vue';

// 使用依赖注入获取selectedNode，而不是通过props
const selectedNode = inject('selectedNode');

// 展开状态
const activeKeys = ref(['schema']);
// 节点更新器
const { updateNodeData, updateNodeSchema } = useNodeUpdater();
// 当前选中的输出参数
const selectedOutput = ref('');

// 节点的输出参数选项
const outputOptions = computed(() => {
  if (!selectedNode.value?.data?.outputs?.output_defs) return [];
  
  return selectedNode.value.data.outputs.output_defs.map(output => ({
    value: output.name,
    label: `${output.name} (${output.type || 'any'})`,
    type: output.type || 'any',
    description: output.description || ''
  }));
});

// 获取输出参数名称
const getOutputName = (outputName) => {
  const output = outputOptions.value.find(opt => opt.value === outputName);
  return output ? output.value : outputName;
};

// 获取所选输出参数的当前schema
const currentSchema = computed(() => {
  if (!selectedOutput.value || !selectedNode.value?.data?.schema?.outputs) {
    
    // 如果节点没有schema或者未选择输出，则根据输出类型返回默认schema
    const outputType = outputOptions.value.find(opt => opt.value === selectedOutput.value)?.type;
    if (outputType === 'object') {
      return {
        type: 'object',
        properties: {}
      };
    } else if (outputType === 'array') {
      return {
        type: 'array',
        items: { type: 'any' }
      };
    } else if (outputType) {
      return { type: outputType };
    }
    return { type: 'any' };
  }
  
  // 返回节点schema中对应输出的schema
  return selectedNode.value.data.schema.outputs[selectedOutput.value] || { type: 'any' };
});

// 处理输出参数选择变化
const handleOutputChange = (value) => {
    console.log("selece", selectedNode.value);
  selectedOutput.value = value;
  
  // 如果没有现有schema，则根据选中的输出类型创建一个默认schema
  if (!selectedNode.value?.data?.schema?.outputs?.[value]) {
    const outputType = outputOptions.value.find(opt => opt.value === value)?.type;
    let defaultSchema;
    
    if (outputType === 'object') {
      defaultSchema = {
        type: 'object',
        properties: {}
      };
    } else if (outputType === 'array') {
      defaultSchema = {
        type: 'array',
        items: { type: 'any' }
      };
    } else {
      defaultSchema = { type: outputType || 'any' };
    }
    
    // 更新schema
    updateOutputSchema(defaultSchema);
  }
};

// 更新输出参数的schema
const updateOutputSchema = (schema) => {
  if (!selectedOutput.value) return;
  
  // 构建新的schema对象，确保outputs子对象存在
  const newSchema = {
    outputs: {
      ...(selectedNode.value?.data?.schema?.outputs || {}),
      [selectedOutput.value]: JSON.parse(JSON.stringify(schema))
    }
  };
  
  console.log('更新输出schema:', selectedOutput.value, schema);
  
  // 更新节点schema
  updateNodeSchema(selectedNode.value, newSchema);
  
  // 不要同时更新输出定义中的schema
  // updateOutputDefinition(selectedOutput.value, schema);
};

// 初始化：自动选择第一个可用的输出参数
onMounted(() => {
  if (outputOptions.value.length > 0 && !selectedOutput.value) {
    const firstObjectOrArray = outputOptions.value.find(opt => 
      opt.type === 'object' || opt.type === 'array'
    );
    
    if (firstObjectOrArray) {
      selectedOutput.value = firstObjectOrArray.value;
    } else if (outputOptions.value.length > 0) {
      selectedOutput.value = outputOptions.value[0].value;
    }
    
    // 如果有选中的输出但没有schema，初始化一个默认schema
    if (selectedOutput.value && !selectedNode.value?.data?.schema?.outputs?.[selectedOutput.value]) {
      handleOutputChange(selectedOutput.value);
    }
  }
});
</script>

<style scoped>
.node-schema-editor {
  margin-top: 16px;
  background-color: #fafafa;
  border-radius: 8px;
  overflow: hidden;
}

.schema-panel {
  background: white;
}

:deep(.ant-collapse-header) {
  padding: 12px 16px !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.ant-collapse-content-box) {
  padding: 16px !important;
}

.schema-description {
  margin-bottom: 20px;
}

:deep(.ant-alert-message) {
  font-weight: 500;
}

.alert-title {
  font-weight: 600;
  font-size: 14px;
}

.alert-description {
  font-size: 13px;
  line-height: 1.5;
}

.output-select {
  margin-bottom: 20px;
}

.output-label {
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 14px;
  color: #262626;
}

.schema-edit-section {
  margin-top: 16px;
  background-color: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.empty-placeholder {
  margin-top: 16px;
  text-align: center;
  padding: 40px 0;
  background-color: #fafafa;
  border-radius: 8px;
}

.empty-text {
  color: #999;
  font-size: 14px;
}
</style> 