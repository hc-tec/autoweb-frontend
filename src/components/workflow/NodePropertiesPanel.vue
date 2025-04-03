<template>
  <a-drawer
    :open="visible"
    :width="500"
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
      @update-node="updateNodeData"
    />
    
    <!-- 主要内容区域 -->
    <div class="drawer-content">
      <!-- 处理模式选择 -->
      <div class="mode-selector">
        <a-segmented v-model:value="activeMode" :options="['单次', '批处理']" block >
        </a-segmented>
      </div>
      
      <!-- 参数内容 -->
      <div class="params-content">
        
        <!-- 代码模块专用输入配置 -->
        <template v-if="isPythonCodeNode">
          <code-node-io-config
            :node="node"
            @update-node="updateNodeData"
          />
        </template>
        
        <!-- 动态输入节点的特殊配置 -->
        <template v-else-if="isDynamicInputNode">
          <div class="dynamic-input-section">
            <a-collapse v-model:activeKey="activeDynamicPanel" :bordered="false">
              <a-collapse-panel key="dynamic" header="动态参数配置" class="param-panel">
                <fields-input
                  :param="dynamicFieldsParam"
                  :value="dynamicFieldsValue"
                  :fieldColumns="inputFieldColumns"
                  :currentNodeId="node.id"
                  @update="updateDynamicFields"
                />
              </a-collapse-panel>
            </a-collapse>
          </div>
        </template>

        <!-- 动态输出节点的特殊配置 -->
        <template v-else-if="isDynamicOutputNode">
          <div class="dynamic-output-section">
            <a-collapse v-model:activeKey="activeDynamicPanel" :bordered="false">
              <a-collapse-panel key="dynamic" header="动态输出配置" class="param-panel">
                <fields-input
                  :param="dynamicFieldsParam"
                  :value="dynamicFieldsValue"
                  :fieldColumns="outputFieldColumns"
                  :currentNodeId="node.id"
                  @update="updateDynamicFields"
                />
              </a-collapse-panel>
            </a-collapse>
          </div>
        </template>
        
        <!-- 普通节点的输入参数部分 -->
        <template v-else>
          <input-params-section
            :node="node"
            @update-param="updateParamValue"
          />
        </template>

        <!-- 代码编辑区域（仅针对python_code类型节点） -->
        <div v-if="isPythonCodeNode" class="main-section">
          <a-collapse v-model:activeKey="activeCodePanel" :bordered="false">
            <a-collapse-panel key="code" header="Python代码" class="code-panel">
              <code-editor
                :value="nodeCodeValue"
                language="python"
                :description="codeEditorDescription"
                :inputs="codeNodeInputs"
                :outputs="codeNodeOutputs"
                @update:value="handleCodeUpdate"
              />
            </a-collapse-panel>
          </a-collapse>
        </div>
        
        <!-- 普通节点的输出参数部分 -->
        <template v-if="!isPythonCodeNode && !isDynamicInputNode && !isDynamicOutputNode">
          <output-params-section
            :node="node"
          />
        </template>
      </div>
    </div>
  </a-drawer>
</template>

<script setup>
import { ref, computed, watch, inject } from 'vue';
import NodeHeader from './node-props/NodeHeader.vue';
import InputParamsSection from './node-props/InputParamsSection.vue';
import OutputParamsSection from './node-props/OutputParamsSection.vue';
import CodeEditor from './node-props/code-editors/CodeEditor.vue';
import CodeNodeIoConfig from './node-props/code-node/CodeNodeIoConfig.vue';
import { useNodeUpdater  } from '@/composables/useNodeUpdater';
import FieldsInput from './node-props/param-inputs/FieldsInput.vue';

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
const activeMode = ref('单次');
// 代码面板状态
const activeCodePanel = ref(['code']);

// 获取节点更新器
const { updateNodeCode: nodeCodeUpdater, updateNodeParam, updateNodeData: nodeDataUpdater } = useNodeUpdater();

const inputFieldColumns = ref([
  { title: '变量名', dataIndex: 'name', key: 'name', type: 'string', placeholder: '变量名', width: '20%', supportReference: false },
  { title: '类型', dataIndex: 'type', key: 'type', type: 'select', placeholder: '类型', options: [
    {label: "字符串", value: "string"},
    {label: "数字", value: "integer"},
    {label: "布尔值", value: "boolean"}, 
    {label: "数组", value: "array"},
    {label: "对象", value: "object"}
  ], width: '30%', supportReference: false },
  { title: '变量值', dataIndex: 'value', key: 'value', type: 'string', placeholder: '变量值', width: '50%', supportReference: false, ellipsis: true },
]);

const outputFieldColumns = ref([
  { title: '变量名', dataIndex: 'name', key: 'name', type: 'string', placeholder: '变量名', width: '20%', supportReference: false },
  { title: '类型', dataIndex: 'type', key: 'type', type: 'select', placeholder: '类型', options: [
    {label: "字符串", value: "string"},
    {label: "数字", value: "integer"},
    {label: "布尔值", value: "boolean"}, 
    {label: "数组", value: "array"},
    {label: "对象", value: "object"}
  ], width: '30%', supportReference: false },
  { title: '变量值', dataIndex: 'value', key: 'value', type: 'string', placeholder: '变量值', width: '50%', supportReference: true, ellipsis: true  },
]);

// 判断是否为Python代码节点
const isPythonCodeNode = computed(() => {
  return props.node?.data?.module_type === 'python_code';
});

// 判断是否为动态输入节点
const isDynamicInputNode = computed(() => {
  return props.node?.data?.module_type === 'DynamicInputNode';
});

// 判断是否为动态输出节点
const isDynamicOutputNode = computed(() => {
  return props.node?.data?.module_type === 'DynamicOutputNode';
});

// 代码编辑器描述
const codeEditorDescription = computed(() => {
  return '编写Python代码处理数据。您可以通过args.params访问输入参数，并返回一个包含输出字段的对象。';
});

// 获取代码节点输入参数定义
const codeNodeInputs = computed(() => {
  if (!isPythonCodeNode.value || !props.node?.data?.inputs?.input_defs) {
    return [];
  }
  return props.node.data.inputs.input_defs;
});

// 获取代码节点输出定义
const codeNodeOutputs = computed(() => {
  if (!isPythonCodeNode.value || !props.node?.data?.outputs?.output_defs) {
    return [];
  }
  return props.node.data.outputs.output_defs;
});

// 获取节点代码值
const nodeCodeValue = computed(() => {
  console.log('nodeCodeValue', props.node);
  
  if (!isPythonCodeNode.value || !props.node || !props.node.data) {
    return { python_code: '' };
  }
  
  // 如果节点存在但没有代码属性或代码为空，提供默认模板
  if (!props.node.data.code || !props.node.data.code.python_code) {
    return { 
      python_code: `# AutoWeb代码编辑，在这里，您可以通过 'args'  获取节点中的输入变量，并通过 'ret' 输出结果
# 'args' 和 'ret' 已经被正确地注入到环境中
# 下面是一个示例，首先获取节点的全部输入参数params，其次获取其中参数名为'input'的值：
# params = args.params; 
# input = params.input;
# 下面是一个示例，输出一个包含多种数据类型的 'ret' 对象：
# ret: Output =  { "name": '鼠鼠我呀', "hobbies": ["爱写代码"] };

async def main(args: Args) -> Output:
    params = args.params
    # 构建输出对象
    ret: Output = {
        "key0": params['input'] + params['input'], # 拼接两次入参 input 的值
        "key1": ["hello", "world"],  # 输出一个数组
        "key2": { # 输出一个Object 
            "key21": "hi"
        },
    }
    return ret
` 
    };
  }
  
  return props.node.data.code;
});

// 关闭抽屉
const handleClose = () => {

  emit('close');
};

// 更新节点整体数据
const updateNodeData = (updatedNodeData) => {
  
  if (!props.node || !props.node.id) {
    console.warn('节点更新失败，节点不存在');
    return;
  }
  
  const updatedNode = {
    id: props.node.id,
    type: props.node.type,
    position: props.node.position,
    data: {
      ...props.node.data,
      ...updatedNodeData
    }
  };
  Object.assign(updatedNode, updatedNodeData);
  
  emit('update-node', updatedNode);
};

// 更新节点代码
const handleCodeUpdate = (codeValue) => {
  if (!props.node || !props.node.id) {
    console.warn('代码更新失败，节点不存在');
    return;
  }

  // 使用节点更新器更新代码
  nodeCodeUpdater(props.node, codeValue);
};

// 更新参数值
const updateParamValue = ({ param, value }) => {
  if (!props.node || !props.node.id) {
    console.warn('节点更新失败，节点不存在');
    return;
  }

  // 使用节点更新器更新参数  
  updateNodeParam(props.node, param, value);
};

// 动态输入节点相关
const activeDynamicPanel = ref(['dynamic']);

// 动态字段参数配置
const dynamicFieldsParam = computed(() => {
  return {
    name: 'fields',
    type: 'array',
    description: '动态输入字段列表',
    required: false
  };
});

// 动态字段值
const dynamicFieldsValue = computed(() => {
  // 从节点数据中获取输入定义
  const inputDefs = props.node?.data?.inputs?.input_defs || [];
  const inputParameters = props.node?.data?.inputs?.input_parameters || []; 
  console.log('dynamicFieldsValue', inputParameters);
  
  // 将输入定义转换为字段格式
  return {
    type: 'literal',
    content: inputDefs.map(def => ({
      name: def.name,
      type: def.type || 'string',
      value: inputParameters.find(param => param.name === def.name)?.input?.value?.content || ''
    }))
  };
});

// 更新动态字段
const updateDynamicFields = (updatedFields) => {
  if (!props.node || !props.node.id) {
    console.warn('节点更新失败，节点不存在');
    return;
  }
  
  // 从更新的字段内容中提取参数定义
  const fieldsContent = updatedFields.content || [];
  
  // 构建输入定义
  const inputDefs = fieldsContent.map(field => ({
    name: field.name,
    type: field.type || 'string',
    description: '',
    required: false
  }));
  
  // 构建输入参数
  const inputParameters = inputDefs.map(def => ({
    name: def.name,
    input: {
      type: def.type,
      value: {
        type: 'literal',
        content: fieldsContent.find(field => field.name === def.name)?.value || getDefaultValueByType(def.type)
      }
    }
  }));
  
  // 构建输出定义 - 与输入相同
  const outputDefs = inputDefs.map(def => ({
    name: def.name,
    type: def.type,
    description: def.description
  }));
  
  // 更新节点
  const updatedData = {
      ...props.node.data,
      inputs: {
        input_defs: inputDefs,
        input_parameters: inputParameters
      },
      outputs: {
        output_defs: outputDefs
      }
    }
  console.log('updateDynamicFields', updatedData);
  
  nodeDataUpdater(props.node.id, updatedData);
};

// 根据类型获取默认值
const getDefaultValueByType = (type) => {
  switch (type) {
    case 'string': return '';
    case 'integer': return 0;
    case 'boolean': return false;
    case 'array': return [];
    case 'object': return {};
    default: return '';
  }
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
}

.params-content {
  padding: 0;
}

.main-section {
  margin: 0 0 16px 0;
}

.code-panel {
  background: white;
}

:deep(.monaco-container) {
  height: 300px;
  min-height: 300px;
}

:deep(.ant-collapse-header) {
  padding: 8px 0 !important;
  font-size: 14px;
  font-weight: 500;
}

:deep(.ant-collapse-content-box) {
  padding: 0 !important;
}
:deep(.ant-collapse-borderless) {
  background-color: #fff;
}
</style> 