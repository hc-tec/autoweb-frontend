<template>
  <div class="node-properties-panel">
    <div class="properties-header">
      <div class="header-icon">{{ nodeIcon }}</div>
      <div class="header-title">{{ node.data.meta.title }}</div>
      <a-tooltip title="应用更改">
        <a-button type="primary" size="small" @click="applyChanges" class="apply-button">
          <check-outlined />
        </a-button>
      </a-tooltip>
    </div>
    
    <a-tabs default-active-key="basic" class="coze-tabs">
      <a-tab-pane key="basic" tab="基本信息">
        <a-form :model="formState" layout="vertical" class="coze-form">
          <a-form-item label="节点ID" name="module_id">
            <a-input v-model:value="formState.module_id" disabled />
          </a-form-item>
          
          <a-form-item label="节点类型" name="module_type">
            <a-input v-model:value="formState.module_type" disabled />
          </a-form-item>
          
          <a-form-item label="标题" name="title">
            <a-input v-model:value="formState.meta.title" />
          </a-form-item>
          
          <a-form-item label="描述" name="description">
            <a-textarea v-model:value="formState.meta.description" :rows="3" />
          </a-form-item>
          
          <a-form-item label="分类" name="category">
            <a-select v-model:value="formState.meta.category">
              <a-select-option value="web">Web</a-select-option>
              <a-select-option value="ai">AI</a-select-option>
              <a-select-option value="audio">音频</a-select-option>
              <a-select-option value="start">起始</a-select-option>
              <a-select-option value="custom">自定义</a-select-option>
              <a-select-option value="composite">嵌套容器</a-select-option>
            </a-select>
          </a-form-item>
          
          <!-- 如果是嵌套节点，添加特有属性 -->
          <template v-if="isCompositeNode">
            <a-divider orientation="left">嵌套节点设置</a-divider>
            
            <a-form-item label="子节点展示模式" name="childrenMode">
              <a-select v-model:value="childrenDisplayMode">
                <a-select-option value="free">自由布局</a-select-option>
                <a-select-option value="horizontal">水平布局</a-select-option>
                <a-select-option value="vertical">垂直布局</a-select-option>
              </a-select>
            </a-form-item>
          </template>
        </a-form>
      </a-tab-pane>
      
      <!-- 如果是嵌套节点，显示子节点管理面板 -->
      <a-tab-pane v-if="isCompositeNode" key="children" tab="子节点">
        <div class="children-manager">
          <div class="children-header">
            <div class="panel-title">子节点管理</div>
            <a-button type="primary" size="small" @click="addChildNode">
              <template #icon><plus-outlined /></template>
              添加子节点
            </a-button>
          </div>
          
          <a-empty v-if="childNodes.length === 0" description="暂无子节点" />
          
          <div v-else class="children-list">
            <div v-for="childNode in childNodes" :key="childNode.id" class="child-node-item">
              <div class="child-node-info">
                <div class="child-node-title">{{ childNode.data.meta.title }}</div>
                <div class="child-node-type">{{ childNode.data.module_type }}</div>
              </div>
              <div class="child-node-actions">
                <a-button type="text" size="small" @click="editChildNode(childNode)">
                  <template #icon><edit-outlined /></template>
                </a-button>
                <a-button type="text" size="small" danger @click="removeChildNode(childNode.id)">
                  <template #icon><delete-outlined /></template>
                </a-button>
              </div>
            </div>
          </div>
        </div>
      </a-tab-pane>
      
      <a-tab-pane key="inputs" tab="输入参数">
        <div v-if="formState.inputs.input_defs.length > 0" class="params-list">
          <div 
            v-for="(inputDef, index) in formState.inputs.input_defs" 
            :key="index"
            class="param-item"
          >
            <div class="param-header" @click="toggleExpand(inputDef)">
              <div class="param-name">{{ inputDef.name }}</div>
              <div class="param-type">{{ getTypeLabel(inputDef.type) }}</div>
              <down-outlined v-if="!inputDef.expanded" />
              <up-outlined v-else />
            </div>
            
            <div v-if="inputDef.expanded" class="param-details">
              <a-form layout="vertical" class="coze-form">
                <a-form-item label="名称">
                  <a-input v-model:value="inputDef.name" />
                </a-form-item>
                
                <a-form-item label="类型">
                  <a-select v-model:value="inputDef.type">
                    <a-select-option value="string">字符串</a-select-option>
                    <a-select-option value="number">数字</a-select-option>
                    <a-select-option value="boolean">布尔值</a-select-option>
                    <a-select-option value="array">数组</a-select-option>
                    <a-select-option value="object">对象</a-select-option>
                  </a-select>
                </a-form-item>
                
                <a-form-item label="描述">
                  <a-textarea v-model:value="inputDef.description" :rows="2" />
                </a-form-item>
                
                <a-form-item label="是否必需">
                  <a-switch v-model:checked="inputDef.required" />
                </a-form-item>
              </a-form>
              
              <!-- 如果有对应的参数值，显示编辑区 -->
              <template v-if="getInputParameter(inputDef.name)">
                <div class="param-value-section">参数值</div>
                <parameter-value-editor
                  :parameter="getInputParameter(inputDef.name)"
                  :parameter-def="inputDef"
                  @update:parameter="updateInputParameter"
                />
              </template>
            </div>
          </div>
        </div>
        <a-empty v-else description="暂无输入参数" />
      </a-tab-pane>
      
      <a-tab-pane key="outputs" tab="输出参数">
        <div v-if="formState.outputs.output_defs.length > 0" class="params-list">
          <div 
            v-for="(outputDef, index) in formState.outputs.output_defs" 
            :key="index"
            class="param-item"
          >
            <div class="param-header" @click="toggleExpand(outputDef)">
              <div class="param-name">{{ outputDef.name }}</div>
              <div class="param-type">{{ getTypeLabel(outputDef.type) }}</div>
              <down-outlined v-if="!outputDef.expanded" />
              <up-outlined v-else />
            </div>
            
            <div v-if="outputDef.expanded" class="param-details">
              <a-form layout="vertical" class="coze-form">
                <a-form-item label="名称">
                  <a-input v-model:value="outputDef.name" />
                </a-form-item>
                
                <a-form-item label="类型">
                  <a-select v-model:value="outputDef.type">
                    <a-select-option value="string">字符串</a-select-option>
                    <a-select-option value="number">数字</a-select-option>
                    <a-select-option value="boolean">布尔值</a-select-option>
                    <a-select-option value="array">数组</a-select-option>
                    <a-select-option value="object">对象</a-select-option>
                  </a-select>
                </a-form-item>
                
                <a-form-item label="描述">
                  <a-textarea v-model:value="outputDef.description" :rows="2" />
                </a-form-item>
              </a-form>
            </div>
          </div>
        </div>
        <a-empty v-else description="暂无输出参数" />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup>
import { ref, computed, watch, reactive, shallowRef } from 'vue'
import { message } from 'ant-design-vue'
import { CheckOutlined, DownOutlined, UpOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import ParameterValueEditor from './ParameterValueEditor.vue'
import { useVueFlow } from '@vue-flow/core'

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  workflowJson: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:node'])

// 使用shallowRef以减少深度响应性带来的性能开销
const formState = shallowRef(JSON.parse(JSON.stringify(props.node.data)))

// 修改watch以仅在节点ID变化时进行深拷贝，避免频繁的深拷贝操作
const currentNodeId = ref(props.node.id)

watch(() => props.node.id, (newId) => {
  if (newId !== currentNodeId.value) {
    currentNodeId.value = newId
    formState.value = JSON.parse(JSON.stringify(props.node.data))
  }
})

// 使用计算属性缓存JSON预览，避免频繁的JSON.stringify操作
const jsonPreview = computed(() => {
  return JSON.stringify(formState.value, null, 2)
})

// 优化参数查找 - 使用Map存储参数以提高查找性能 
const inputParamMap = computed(() => {
  const map = new Map()
  if (formState.value?.inputs?.input_parameters) {
    formState.value.inputs.input_parameters.forEach(param => {
      map.set(param.name, param)
    })
  }
  return map
})

// 获取输入参数的值 - 使用Map优化查找
const getInputParameter = (name) => {
  return inputParamMap.value.get(name)
}

// 更新参数值 - 使用更高效的方法
const updateInputParameter = (paramName, newValue) => {
  const param = inputParamMap.value.get(paramName)
  
  if (param) {
    // 仅更新实际变更的内容，而不是整个formState
    param.input.value.content = newValue
  }
}

// 添加输入参数定义
const addInputDefinition = () => {
  if (!formState.value.inputs.input_defs) return
  
  const newInputDef = {
    name: `input_${formState.value.inputs.input_defs.length + 1}`,
    type: 'string',
    description: '新输入参数',
    required: false
  }
  
  formState.value = {
    ...formState.value,
    inputs: {
      ...formState.value.inputs,
      input_defs: [...formState.value.inputs.input_defs, newInputDef],
      input_parameters: [...formState.value.inputs.input_parameters, {
        name: newInputDef.name,
        input: {
          type: 'string',
          value: {
            type: 'literal',
            content: ''
          }
        }
      }]
    }
  }
}

// 添加输出参数定义
const addOutputDefinition = () => {
  if (!formState.value.outputs.output_defs) return
  
  const newOutputDef = {
    name: `output_${formState.value.outputs.output_defs.length + 1}`,
    type: 'string',
    description: '新输出参数'
  }
  
  formState.value = {
    ...formState.value,
    outputs: {
      ...formState.value.outputs,
      output_defs: [...formState.value.outputs.output_defs, newOutputDef]
    }
  }
}

// 使用VueFlow的hooks
const { getNodes, addNodes, getNode, removeNodes, setNodes } = useVueFlow()

// 判断是否为嵌套节点
const isCompositeNode = computed(() => {
  return props.node.type === 'composite' || props.node.data.module_type === 'composite';
})

// 子节点显示模式
const childrenDisplayMode = ref('free');

// 获取当前节点的子节点
const childNodes = computed(() => {
  const allNodes = getNodes();
  return allNodes.filter(node => node.parentNode === props.node.id);
})

// 添加子节点
const addChildNode = () => {
  // 生成新的子节点ID
  const newNodeId = `child-${props.node.id}-${Date.now()}`;
  
  // 计算在父节点中的相对位置 - 基于当前子节点数量
  const childCount = childNodes.value.length;
  const posX = 50 + (childCount % 2) * 80;
  const posY = 50 + Math.floor(childCount / 2) * 60;
  
  // 创建新的子节点
  const newNode = {
    id: newNodeId,
    type: 'custom', // 使用普通节点类型
    position: { x: posX, y: posY }, // 相对于父节点的位置
    parentNode: props.node.id, // 重要：设置父节点ID
    extent: 'parent', // 限制在父节点内移动
    draggable: true, // 允许拖动
    selectable: true, // 允许选择
    data: {
      module_id: newNodeId,
      module_type: 'custom',
      meta: {
        title: `子节点 ${childCount + 1}`,
        description: '嵌套节点内的子节点',
        category: 'default'
      },
      inputs: {
        input_defs: [
          {
            name: 'input',
            type: 'string',
            description: '输入参数',
            required: true
          }
        ]
      },
      outputs: {
        output_defs: [
          {
            name: 'output',
            type: 'string',
            description: '输出结果'
          }
        ]
      }
    }
  };
  
  // 添加节点到工作流
  addNodes([newNode]);
  
  message.success('已添加子节点');
}

// 编辑子节点
const editChildNode = (childNode) => {
  // 这里可以打开一个对话框编辑子节点
  // 简单实现：直接让用户点击该节点
  message.info('请直接点击该子节点进行编辑');
}

// 删除子节点
const removeChildNode = (childNodeId) => {
  removeNodes([childNodeId]);
  message.success('已删除子节点');
}

// 应用更改时包含嵌套节点特有的属性
const applyChanges = () => {
  let updatedNodeData = {
    ...formState
  };
  
  // 如果是嵌套节点，更新样式信息
  if (isCompositeNode.value) {
    // 样式信息在Vue Flow节点上直接保存，不是data的一部分
    emit('update:node', props.node.id, updatedNodeData);
  } else {
    emit('update:node', props.node.id, updatedNodeData);
  }
  
  message.success('属性已更新');
}

// 节点图标
const nodeIcon = computed(() => {
  const category = props.node.data.meta?.category || '';
  const type = props.node.data.module_type || '';
  
  // 根据分类返回图标
  switch (category) {
    case 'web':
      return '🌐';
    case 'ai':
      return '🧠';
    case 'audio':
      return '🔊';
    case 'start':
      return '🚀';
    default:
      // 如果没有分类，尝试根据类型判断
      if (type.includes('Page') || type.includes('Web')) {
        return '🌐';
      } else if (type.includes('Extract') || type.includes('Data')) {
        return '📊';
      } else if (type.includes('Click') || type.includes('Action')) {
        return '👆';
      }
      return '⚙️'; // 默认图标
  }
})

// 切换参数展开/折叠状态
const toggleExpand = (param) => {
  if (param.expanded === undefined) {
    param.expanded = true;
  } else {
    param.expanded = !param.expanded;
  }
}

// 获取类型标签
const getTypeLabel = (type) => {
  const typeMap = {
    string: '字符串',
    number: '数字',
    boolean: '布尔值',
    array: '数组',
    object: '对象'
  }
  return typeMap[type] || type;
}
</script>

<style scoped>
.node-properties-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.properties-header {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: #f9f8ff;
  border-bottom: 1px solid #f0f0f7;
  margin-bottom: 8px;
}

.header-icon {
  font-size: 18px;
  background-color: #e9e7ff;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  flex-grow: 1;
}

.apply-button {
  background-color: #6f5bd5;
  border-color: #6f5bd5;
}

.coze-tabs :deep(.ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn) {
  color: #6f5bd5;
}

.coze-tabs :deep(.ant-tabs-ink-bar) {
  background-color: #6f5bd5;
}

.coze-form :deep(.ant-form-item-label > label) {
  color: #666;
  font-size: 13px;
}

.params-list {
  border: 1px solid #f0f0f7;
  border-radius: 8px;
  overflow: hidden;
}

.param-item {
  border-bottom: 1px solid #f0f0f7;
}

.param-item:last-child {
  border-bottom: none;
}

.param-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #f9f8ff;
  cursor: pointer;
}

.param-header:hover {
  background-color: #f5f3ff;
}

.param-name {
  font-weight: 500;
  color: #333;
  flex-grow: 1;
}

.param-type {
  margin: 0 12px;
  background-color: #f1f0ff;
  color: #6f5bd5;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 12px;
}

.param-details {
  padding: 16px;
  background-color: white;
  border-top: 1px solid #f0f0f7;
}

.param-value-section {
  font-weight: 500;
  margin: 12px 0;
  color: #666;
  padding-bottom: 6px;
  border-bottom: 1px dashed #f0f0f7;
}

.children-manager {
  padding: 16px;
  border: 1px solid #f0f0f7;
  border-radius: 8px;
  overflow: hidden;
}

.children-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #f9f8ff;
  border-bottom: 1px solid #f0f0f7;
  margin-bottom: 8px;
}

.panel-title {
  font-size: 16px;
  font-weight: 500;
}

.children-list {
  padding: 16px;
}

.child-node-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f7;
}

.child-node-info {
  display: flex;
  align-items: center;
}

.child-node-title {
  font-weight: 500;
  color: #333;
  margin-right: 12px;
}

.child-node-type {
  background-color: #f1f0ff;
  color: #6f5bd5;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 12px;
}

.child-node-actions {
  display: flex;
  align-items: center;
}

.child-node-actions a {
  margin-left: 12px;
}
</style> 