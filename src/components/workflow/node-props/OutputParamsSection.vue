<template>
  <div class="output-params-section">
    <a-collapse v-model:activeKey="activeKeys" :bordered="false">
      <a-collapse-panel key="outputs" :header="headerTitle" class="param-panel">
        <div class="param-list">
          <div v-for="param in outputDefinitions" :key="param.name" class="param-row">
            <div class="param-header">
              <a-tooltip :title="param.description" placement="top">
                <div class="param-name">{{ param.name }}</div>
              </a-tooltip>
            </div>
            
            <div class="param-value">
              <div class="param-type">{{ param.type || 'any' }}.</div>
              
              <!-- 对象类型参数展示 -->
              <template v-if="param.type === 'object' && param.name === 'data'">
                <div class="expandable-param">
                  <a-button type="text" size="small" class="expand-btn">
                    <expand-outlined />
                  </a-button>
                  <div class="object-preview">可展开的数据对象</div>
                </div>
              </template>
              
              <!-- 其他类型参数 -->
              <template v-else>
                <div class="output-display">{{ param.type || 'any' }}</div>
              </template>
            </div>
          </div>
        </div>
      </a-collapse-panel>
    </a-collapse>
    
    <!-- 通用schema编辑器 - 对所有有输出的节点显示 -->
    <node-schema-editor 
      v-if="hasOutputs"
      :node="props.node"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ExpandOutlined } from '@ant-design/icons-vue';
import NodeSchemaEditor from './NodeSchemaEditor.vue';

const props = defineProps({
  node: {
    type: Object,
    required: true
  }
});

// 展开状态
const activeKeys = ref(['outputs']);

// 输出定义
const outputDefinitions = computed(() => {
  if (!props.node || !props.node.data || !props.node.data.outputs || !props.node.data.outputs.output_defs) {
    return [];
  }
  return props.node.data.outputs.output_defs;
});

// 标题行显示
const headerTitle = computed(() => {
  return `输出 (${outputDefinitions.value.length})`;
});

// 判断节点是否有输出
const hasOutputs = computed(() => {
  return outputDefinitions.value.length > 0;
});
</script>

<style scoped>

.param-panel {
  background: white;
}

:deep(.ant-collapse-header) {
  padding: 8px 0;
  font-size: 14px;
  font-weight: 500;
}

:deep(.ant-collapse-content-box) {
  padding: 0 !important;
}

.param-list {
  position: relative;
}

.param-row {
  display: flex;
  padding: 8px 0;
  align-items: flex-start;
}

.param-row:last-child {
  border-bottom: none;
}

.param-header {
  flex: 1;
  display: flex;
  align-items: center;
}

.param-name {
  font-size: 14px;
  color: #333;
}

.param-value {
  flex: 2;
  display: flex;
  align-items: flex-start;
}

.param-type {
  min-width: 36px;
  font-size: 12px;
  color: #666;
  background-color: #f5f5f5;
  border-radius: 2px;
  padding: 2px 4px;
  margin-right: 8px;
  text-align: center;
}

.expandable-param {
  display: flex;
  align-items: center;
  margin-left: 4px;
}

.expand-btn {
  padding: 0;
  margin-right: 8px;
}

.object-preview {
  color: #888;
  font-size: 12px;
}

.output-display {
  color: #888;
  font-size: 12px;
}
</style> 