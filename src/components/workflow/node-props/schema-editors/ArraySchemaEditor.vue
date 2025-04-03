<template>
  <div class="array-schema-editor">
    <div class="param-table">
      <div class="param-row array-type-row">
        <div class="param-name-col">数组项类型:</div>
        <div class="param-type-col">
          <a-select 
            class="param-select"
            v-model:value="localArrayType"
            @change="handleTypeChange"
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
        <div class="param-actions-col"></div>
      </div>
      
      <!-- 如果数组项是对象类型，显示对象属性 -->
      <template v-if="localArrayType === 'object'">
        <div class="param-header array-object-header">
          <div class="param-name-col">对象属性名</div>
          <div class="param-type-col">属性类型</div>
          <div class="param-actions-col">操作</div>
        </div>
        
        <div v-if="!arrayObjectProperties.length" class="empty-row">
          <div class="empty-message">数组项对象当前没有属性</div>
        </div>
        
        <div 
          v-for="(prop, index) in arrayObjectProperties" 
          :key="index" 
          class="param-row array-object-row"
        >
          <div class="param-name-col">
            <div class="array-item-prefix">[].&nbsp;</div>
            <a-input 
              class="param-input"
              v-model:value="prop.name" 
              placeholder="属性名称"
              @change="updateArrayObjectProperty(index, 'name', prop.name)"
            />
          </div>
          <div class="param-type-col">
            <a-select 
              class="param-select"
              v-model:value="prop.type" 
              @change="updateArrayObjectProperty(index, 'type', prop.type)"
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
              <a-button 
                type="text" 
                danger 
                class="action-btn"
                @click="removeArrayObjectProperty(index)"
              >
                <template #icon><delete-outlined /></template>
              </a-button>
            </div>
          </div>
        </div>
        
        <div class="param-add-row">
          <a-button 
            type="dashed"
            class="add-array-property-btn" 
            @click="addArrayObjectProperty"
          >
            <template #icon><plus-outlined /></template>
            添加数组对象属性
          </a-button>
        </div>
      </template>
      
      <!-- 如果数组项是数组类型，显示简化的数组编辑器 -->
      <template v-if="localArrayType === 'array'">
        <div class="param-row array-nested-row">
          <div class="param-name-col">嵌套数组类型:</div>
          <div class="param-type-col">
            <a-select 
              class="param-select" 
              v-model:value="nestedArrayItemType"
              @change="updateNestedArrayType"
              size="middle"
              :dropdown-match-select-width="false"
            >
              <a-select-option value="string">str. String</a-select-option>
              <a-select-option value="integer">num. Number</a-select-option>
              <a-select-option value="boolean">bool. Boolean</a-select-option>
              <a-select-option value="object">{} Object</a-select-option>
              <a-select-option value="any">* Any</a-select-option>
            </a-select>
          </div>
          <div class="param-actions-col"></div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed, watch } from 'vue';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue';

const props = defineProps({
  arrayType: {
    type: String,
    required: true,
    default: 'string'
  },
  arraySchema: {
    type: Object,
    required: true,
    default: () => ({ type: 'string' })
  }
});

const emit = defineEmits(['update-type', 'update-schema']);

// 本地状态
const localArrayType = ref(props.arrayType);
const nestedArrayItemType = ref('string');

// 监听props变化，更新本地状态
watch(() => props.arrayType, (newType) => {
  localArrayType.value = newType;
}, { immediate: true });

watch(() => props.arraySchema, (newSchema) => {
  // 如果是嵌套数组，更新内部数组类型
  if (newSchema.type === 'array' && newSchema.items) {
    nestedArrayItemType.value = newSchema.items.type || 'string';
  }
}, { immediate: true, deep: true });

// 计算数组对象的属性列表
const arrayObjectProperties = computed(() => {
  if (props.arraySchema.type !== 'object' || !props.arraySchema.properties) {
    return [];
  }
  
  // 将对象属性转换为数组形式
  return Object.entries(props.arraySchema.properties).map(([name, prop]) => ({
    name,
    type: prop.type || 'any',
    description: prop.description || ''
  }));
});

// 处理数组项类型变更
const handleTypeChange = (newType) => {
  localArrayType.value = newType;
  emit('update-type', newType);
};

// 添加数组对象属性
const addArrayObjectProperty = () => {
  console.log('ArraySchemaEditor: 添加数组对象属性按钮被点击');
  
  try {
    // 确保schema已正确初始化
    const schema = JSON.parse(JSON.stringify(props.arraySchema)); // 深拷贝
    if (schema.type !== 'object') {
      schema.type = 'object';
    }
    
    if (!schema.properties) {
      schema.properties = {};
    }
    
    // 生成唯一的属性名
    let propName = 'property';
    let counter = 1;
    while (schema.properties[propName + counter]) {
      counter++;
    }
    propName = propName + counter;
    
    // 添加新属性
    schema.properties[propName] = {
      type: 'string',
      description: ''
    };
    
    console.log('ArraySchemaEditor: 新的schema', schema);
    
    // 更新schema
    emit('update-schema', schema);
    
    // 强制数据刷新
    localArrayType.value = 'object';
  } catch (error) {
    console.error('添加数组属性时出错:', error);
  }
};

// 更新数组对象属性
const updateArrayObjectProperty = (index, field, value) => {
  const properties = arrayObjectProperties.value;
  if (index < 0 || index >= properties.length) return;
  
  const property = properties[index];
  property[field] = value;
  
  // 重建properties对象
  const schema = { ...props.arraySchema };
  const newProperties = {};
  
  properties.forEach(prop => {
    if (prop.name) {
      newProperties[prop.name] = {
        type: prop.type || 'any',
        description: prop.description || ''
      };
    }
  });
  
  schema.properties = newProperties;
  
  // 更新schema
  emit('update-schema', schema);
};

// 删除数组对象属性
const removeArrayObjectProperty = (index) => {
  const properties = arrayObjectProperties.value;
  if (index < 0 || index >= properties.length) return;
  
  const propName = properties[index].name;
  const schema = { ...props.arraySchema };
  
  if (propName && schema.properties && schema.properties[propName]) {
    const newProperties = { ...schema.properties };
    delete newProperties[propName];
    schema.properties = newProperties;
    
    // 更新schema
    emit('update-schema', schema);
  }
};

// 更新嵌套数组类型
const updateNestedArrayType = () => {
  const schema = { ...props.arraySchema };
  
  // 确保schema是数组类型
  if (schema.type !== 'array') {
    schema.type = 'array';
  }
  
  // 更新items
  schema.items = { type: nestedArrayItemType.value };
  
  // 更新schema
  emit('update-schema', schema);
};
</script>

<style scoped>
.array-schema-editor {
  margin-bottom: 12px;
}

.param-table {
  width: 100%;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
}

.param-row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
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

.param-select {
  flex: 1;
  height: 30px;
  font-size: 12px;
}

.param-input {
  flex: 1;
  height: 30px;
  font-size: 12px;
  border-radius: 2px;
}

.array-type-row {
  padding: 8px 12px;
  background-color: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.array-object-header {
  padding: 8px 12px;
  background-color: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  font-size: 12px;
  color: #8c8c8c;
  display: flex;
}

.array-object-row {
  padding: 8px 12px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.array-nested-row {
  padding: 8px 12px;
  background-color: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.array-item-prefix {
  margin-right: 4px;
  font-size: 12px;
  color: #8c8c8c;
}

.empty-row {
  text-align: center;
  padding: 16px;
  color: #bfbfbf;
  font-size: 12px;
}

.param-add-row {
  padding: 8px 12px;
  background-color: #fff;
  text-align: center;
}

.add-array-property-btn {
  margin-top: 8px;
  height: 32px;
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
</style> 