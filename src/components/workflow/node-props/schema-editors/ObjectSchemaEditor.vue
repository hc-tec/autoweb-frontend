<template>
  <div class="object-schema-editor">
    <div class="param-table">
      <div class="param-header">
        <div class="param-name-col">变量名</div>
        <div class="param-type-col">变量类型</div>
        <div class="param-actions-col">操作</div>
      </div>
      
      <div v-if="!properties.length" class="empty-row">
        <div class="empty-message">该对象当前没有属性</div>
      </div>
      
      <template v-for="(prop, index) in properties" :key="index">
        <div class="param-row">
          <div class="param-name-col">
            <a-input 
              class="param-input"
              v-model:value="prop.name" 
              placeholder="属性名称"
              @change="updateSchema"
            />
          </div>
          <div class="param-type-col">
            <a-select 
              class="param-select"
              v-model:value="prop.type" 
              @change="updateSchema"
              size="middle"
              :dropdown-match-select-width="false"
            >
              <a-select-option value="string">str. String</a-select-option>
              <a-select-option value="integer">num. Number</a-select-option>
              <a-select-option value="boolean">bool. Boolean</a-select-option>
              <a-select-option value="object">{} Object</a-select-option>
              <a-select-option value="array">[std] Array</a-select-option>
              <a-select-option value="any">* Any</a-select-option>
            </a-select>
          </div>
          <div class="param-actions-col">
            <div class="param-actions">
              <a-button type="text" class="action-btn">
                <template #icon><expand-outlined /></template>
              </a-button>
              <a-button 
                type="text" 
                danger 
                class="action-btn"
                @click="removeProperty(index)"
              >
                <template #icon><delete-outlined /></template>
              </a-button>
            </div>
          </div>
        </div>
        
        <!-- 嵌套属性 - 如果是对象类型，显示子属性 -->
        <template v-if="prop.type === 'object' && prop.schema && prop.schema.properties">
          <div 
            class="param-nested-row" 
            v-for="(nestedProp, nestedKey) in getNestedProperties(prop.schema)" 
            :key="nestedKey"
          >
            <div class="param-name-col">
              <div class="nested-name">
                <div class="nested-indent"></div>
                {{ nestedKey }}
              </div>
            </div>
            <div class="param-type-col">
              <div class="nested-type">{{ nestedProp.type }}</div>
            </div>
            <div class="param-actions-col">
              <div class="param-actions">
                <a-button type="text" class="action-btn">
                  <template #icon><expand-outlined /></template>
                </a-button>
                <a-button type="text" danger class="action-btn">
                  <template #icon><delete-outlined /></template>
                </a-button>
              </div>
            </div>
          </div>
        </template>
      </template>
    </div>
    
    <a-button 
      type="dashed" 
      class="add-property-btn" 
      @click="addProperty"
    >
      <template #icon><plus-outlined /></template>
      添加属性
    </a-button>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';
import { PlusOutlined, DeleteOutlined, ExpandOutlined } from '@ant-design/icons-vue';

const props = defineProps({
  properties: {
    type: Array,
    required: true,
    default: () => []
  }
});

const emit = defineEmits(['update', 'add', 'remove']);

// 添加新属性
const addProperty = () => {
  console.log('ObjectSchemaEditor: 添加属性按钮被点击');
  // 在触发事件前先执行添加操作
  const localProps = [...props.properties];
  localProps.push({
    name: 'output'+localProps.length,
    type: 'string',
    description: ''
  });
  
  // 先更新本地数据，再通知父组件
  emit('update', localProps);

};

// 删除属性
const removeProperty = (index) => {
  emit('remove', index);
};

// 更新schema
const updateSchema = () => {
  emit('update', props.properties);
};

// 获取嵌套属性工具函数
const getNestedProperties = (schema) => {
  if (!schema || !schema.properties) return {};
  return schema.properties;
};
</script>

<style scoped>
.object-schema-editor {
  margin-bottom: 12px;
}

.param-table {
  width: 100%;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  margin-bottom: 12px;
}

.param-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  font-size: 12px;
  color: #8c8c8c;
}

.param-name-col {
  flex: 3;
  display: flex;
  align-items: center;
}

.param-type-col {
  flex: 2;
  padding: 0 8px;
}

.param-actions-col {
  flex: 1;
  text-align: right;
}

.param-row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.param-row:last-child {
  border-bottom: none;
}

.param-row:hover {
  background-color: #fafafa;
}

.param-input {
  flex: 1;
  height: 30px;
  font-size: 12px;
  border-radius: 2px;
}

.param-select {
  flex: 1;
  height: 30px;
  font-size: 12px;
}

.param-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.action-btn {
  height: 24px;
  width: 24px;
  margin-left: 4px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background-color: #f5f5f5;
  border-radius: 2px;
}

.param-nested-row {
  display: flex;
  align-items: center;
  padding: 8px 12px 8px 32px;
  border-bottom: 1px solid #f0f0f0;
  background-color: rgba(250, 250, 250, 0.4);
}

.nested-name {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #595959;
}

.nested-indent {
  width: 20px;
  position: relative;
}

.nested-indent:before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 12px;
  height: 1px;
  background-color: #d9d9d9;
}

.nested-type {
  flex: 1;
  font-size: 12px;
  color: #8c8c8c;
}

.empty-row {
  text-align: center;
  padding: 16px;
  color: #bfbfbf;
  font-size: 12px;
}

.add-property-btn {
  margin-top: 8px;
  height: 32px;
}
</style> 