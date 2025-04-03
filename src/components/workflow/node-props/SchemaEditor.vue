<template>
  <div class="schema-editor">
    <!-- 顶部标题和帮助信息 -->
    <div class="schema-header">
      <div class="schema-title">{{ title }}</div>
      <a-tooltip title="数据结构定义，用于描述复杂对象和数组的结构">
        <question-circle-outlined class="help-icon" />
      </a-tooltip>
    </div>
    
    <!-- 类型选择器 -->
    <div class="schema-type-selector">
      <a-radio-group v-model:value="schemaType" button-style="solid">
        <a-radio-button value="object">对象</a-radio-button>
        <a-radio-button value="array">数组</a-radio-button>
        <a-radio-button value="simple">简单类型</a-radio-button>
      </a-radio-group>
    </div>
    
    <!-- 对象类型编辑器 -->
    <div v-if="schemaType === 'object'" class="schema-object-editor">
      <object-schema-editor 
        :properties="objectProps" 
        @update="handleObjectUpdate"
        @add="addObjectProperty"
        @remove="removeObjectProperty"
      />
    </div>
    
    <!-- 数组类型编辑器 -->
    <div v-if="schemaType === 'array'" class="schema-array-editor">
      <array-schema-editor 
        :array-type="arrayType"
        :array-schema="arraySchema"
        @update-type="updateArrayType"
        @update-schema="updateArraySchema"
      />
    </div>
    
    <!-- 简单类型编辑器 -->
    <div v-if="schemaType === 'simple'" class="schema-simple-editor">
      <simple-schema-editor 
        :type="simpleType"
        @update="updateSimpleType"
      />
    </div>
    
    <!-- 模板选择器 -->
    <div class="schema-templates">
      <a-dropdown>
        <a-button type="primary" ghost>
          应用模板 <down-outlined />
        </a-button>
        <template #overlay>
          <a-menu @click="applyTemplate" class="template-menu">
            <a-menu-item key="nameValue">
              <code>{ name: string, value: any }</code>
              <div class="template-desc">名称-值对象</div>
            </a-menu-item>
            <a-menu-item key="idLabelValue">
              <code>{ id, label, value }</code>
              <div class="template-desc">ID-标签-值对象</div>
            </a-menu-item>
            <a-menu-item key="simpleList">
              <code>[ string ]</code>
              <div class="template-desc">简单字符串数组</div>
            </a-menu-item>
            <a-menu-item key="objectList">
              <code>[ { id, name, value } ]</code>
              <div class="template-desc">对象数组</div>
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
    
    <!-- JSON预览 -->
    <a-collapse class="schema-json-preview">
      <a-collapse-panel key="1" header="JSON预览">
        <pre>{{ schemaJson }}</pre>
      </a-collapse-panel>
    </a-collapse>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, defineProps, defineEmits } from 'vue';
import { QuestionCircleOutlined, DownOutlined } from '@ant-design/icons-vue';

// 导入子组件
import ObjectSchemaEditor from './schema-editors/ObjectSchemaEditor.vue';
import ArraySchemaEditor from './schema-editors/ArraySchemaEditor.vue';
import SimpleSchemaEditor from './schema-editors/SimpleSchemaEditor.vue';

const props = defineProps({
  value: {
    type: Object,
    required: false,
    default: () => ({ type: 'object', properties: {} })
  },
  title: {
    type: String,
    default: '数据结构'
  },
  initialType: {
    type: String,
    default: 'object'  // object, array, simple
  }
});

const emit = defineEmits(['update:value']);

// 基础状态 - 使用单一状态源
const schemaType = ref(props.initialType || 'object');

// 对象类型状态
const objectProps = ref([]);

// 数组类型状态
const arrayType = ref('string');
const arraySchema = ref({ type: 'string' });

// 简单类型状态
const simpleType = ref('string');

// 初始化状态 - 通过加载函数处理传入值
const loadSchema = (schema) => {
  if (!schema) return;
  
  // 根据schema类型设置状态
  if (schema.type === 'object') {
    schemaType.value = 'object';
    objectProps.value = Object.entries(schema.properties || {}).map(([name, prop]) => ({
      name,
      type: prop.type || 'any',
      description: prop.description || '',
      schema: (prop.type === 'object' || prop.type === 'array') ? prop : undefined
    }));
  } 
  else if (schema.type === 'array') {
    schemaType.value = 'array';
    const items = schema.items || { type: 'any' };
    arrayType.value = items.type || 'any';
    arraySchema.value = items;
  } 
  else {
    schemaType.value = 'simple';
    simpleType.value = schema.type || 'string';
  }
};

// 初始加载
onMounted(() => {
  // 加载初始值
  loadSchema(props.value);
  
  // 没有初始值时的默认处理
  if (!props.value || Object.keys(props.value).length === 0) {
    if (schemaType.value === 'object') {
      objectProps.value = [];
    } else if (schemaType.value === 'array') {
      arrayType.value = 'string';
      arraySchema.value = { type: 'string' };
    } else {
      simpleType.value = 'string';
    }
    updateSchema();
  }
});

// 监听输入值变化
watch(() => props.value, (newValue) => {
  // 只有当新值有效且不为空时才加载
  if (newValue && Object.keys(newValue).length > 0) {
    loadSchema(newValue);
  }
}, { deep: true });

// 子组件处理函数

// 对象相关
const handleObjectUpdate = (properties) => {
  console.log('SchemaEditor: 处理对象更新', properties);
  // 使用深拷贝确保引用更新
  objectProps.value = JSON.parse(JSON.stringify(properties));
  // 立即调用schema更新
  updateSchema();
};

const addObjectProperty = () => {
  console.log('SchemaEditor: 添加对象属性');
  if (!Array.isArray(objectProps.value)) {
    objectProps.value = [];
  }
  
  // 添加新属性
  const newProps = [...objectProps.value];
  newProps.push({
    name: '',
    type: 'string',
    description: ''
  });
  
  // 更新属性并触发schema更新
  objectProps.value = newProps;
  updateSchema();
};

const removeObjectProperty = (index) => {
  console.log('SchemaEditor: 删除对象属性', index);
  objectProps.value.splice(index, 1);
  updateSchema();
};

// 数组相关
const updateArrayType = (newType) => {
  console.log('SchemaEditor: 更新数组类型', newType);
  arrayType.value = newType;
  // 根据类型初始化schema
  if (newType === 'object') {
    // 检查是否已有配置
    if (arraySchema.value.type !== 'object' || !arraySchema.value.properties) {
      arraySchema.value = {
        type: 'object',
        properties: {
          id: { type: 'string', description: '唯一标识' }
        }
      };
    }
  } 
  else if (newType === 'array') {
    if (arraySchema.value.type !== 'array') {
      arraySchema.value = {
        type: 'array',
        items: { type: 'string' }
      };
    }
  } 
  else {
    arraySchema.value = { type: newType };
  }
  updateSchema();
};

const updateArraySchema = (newSchema) => {
  console.log('SchemaEditor: 更新数组Schema', newSchema);
  // 确保深拷贝以避免引用问题
  arraySchema.value = JSON.parse(JSON.stringify(newSchema));
  // 立即触发schema更新
  updateSchema();
  
};

// 简单类型
const updateSimpleType = (newType) => {
  simpleType.value = newType;
  updateSchema();
};

// 监听类型变化
watch(schemaType, (newType, oldType) => {
  // 用户手动切换类型
  if (oldType) {
    // 根据新类型设置默认值
    if (newType === 'object' && objectProps.value.length === 0) {
      objectProps.value = [];
    } 
    else if (newType === 'array') {
      if (arraySchema.value.type !== 'array' && arraySchema.value.type !== 'object') {
        arrayType.value = 'string';
        arraySchema.value = { type: 'string' };
      }
    } 
    else if (newType === 'simple') {
      simpleType.value = 'string';
    }
  }
  
  // 更新schema
  updateSchema();
});

// 更新schema
const updateSchema = () => {
  console.log('SchemaEditor: 开始更新schema');
  
  let newSchema;
  
  if (schemaType.value === 'object') {
    // 构建对象schema
    const properties = {};
    
    objectProps.value.forEach(prop => {
        properties[prop.name] = {
            type: prop.type,
            description: prop.description || ''
        };
        
        // 处理嵌套schema
        if ((prop.type === 'object' || prop.type === 'array') && prop.schema) {
            if (prop.type === 'object' && prop.schema.properties) {
            properties[prop.name].properties = prop.schema.properties;
            } else if (prop.type === 'array' && prop.schema.items) {
            properties[prop.name].items = prop.schema.items;
            }
        }
      
    });
    
    newSchema = {
      type: 'object',
      properties: properties
    };
  } 
  else if (schemaType.value === 'array') {
    newSchema = {
      type: 'array',
      items: arraySchema.value
    };
  } 
  else {
    newSchema = {
      type: simpleType.value
    };
  }
  
  console.log('SchemaEditor: 新生成的schema:', newSchema);
  
  // 发送更新事件
  emit('update:value', newSchema);
};

// 应用模板
const applyTemplate = (e) => {
  const key = e.key;
  
  if (key === 'nameValue') {
    schemaType.value = 'object';
    objectProps.value = [
      { name: 'name', type: 'string', description: '名称' },
      { name: 'value', type: 'any', description: '值' }
    ];
  } 
  else if (key === 'idLabelValue') {
    schemaType.value = 'object';
    objectProps.value = [
      { name: 'id', type: 'string', description: '唯一标识' },
      { name: 'label', type: 'string', description: '显示标签' },
      { name: 'value', type: 'any', description: '值' }
    ];
  } 
  else if (key === 'simpleList') {
    schemaType.value = 'array';
    arrayType.value = 'string';
    arraySchema.value = { type: 'string' };
  } 
  else if (key === 'objectList') {
    schemaType.value = 'array';
    arrayType.value = 'object';
    arraySchema.value = {
      type: 'object',
      properties: {
        id: { type: 'string', description: '唯一标识' },
        name: { type: 'string', description: '名称' },
        value: { type: 'any', description: '值' }
      }
    };
  }
  
  updateSchema();
};

// 计算属性 - Schema JSON预览
const schemaJson = computed(() => {
  let schema;
  
  if (schemaType.value === 'object') {
    // 构建对象schema
    const properties = {};
    objectProps.value.forEach(prop => {
      if (prop.name) {
        properties[prop.name] = {
          type: prop.type,
          ...(prop.description ? { description: prop.description } : {}),
          ...(prop.schema ? 
            (prop.type === 'object' ? { properties: prop.schema.properties } : 
             prop.type === 'array' ? { items: prop.schema.items } : {}) : {})
        };
      }
    });
    
    schema = {
      type: 'object',
      properties
    };
  } 
  else if (schemaType.value === 'array') {
    schema = {
      type: 'array',
      items: arraySchema.value
    };
  } 
  else {
    schema = {
      type: simpleType.value
    };
  }
  
  return JSON.stringify(schema, null, 2);
});
</script>

<style scoped>
.schema-editor {
  margin-bottom: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  background-color: #fff;
  padding: 16px;
}

.schema-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.schema-title {
  font-weight: 500;
  font-size: 14px;
  margin-right: 8px;
  color: #595959;
}

.help-icon {
  color: #1890ff;
  cursor: pointer;
}

.schema-type-selector {
  margin-bottom: 16px;
}

.schema-templates {
  margin-top: 24px;
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.schema-json-preview {
  margin-top: 24px;
  border-radius: 8px;
  overflow: hidden;
}

.schema-json-preview pre {
  background-color: #2b2b2b;
  color: #e6e6e6;
  padding: 12px;
  border-radius: 6px;
  overflow: auto;
  white-space: pre-wrap;
  max-height: 200px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}

.template-menu {
  width: 240px;
}

.template-desc {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
}
</style> 