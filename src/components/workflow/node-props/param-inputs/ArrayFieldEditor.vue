<template>
  <div class="array-field-editor">
    <div class="table-actions">
      <a-button type="primary" size="small" @click="addField">
        <plus-outlined /> {{ addButtonText }}
      </a-button>
    </div>
    
    <a-table
      v-if="fields.length > 0"
      :dataSource="fields"
      :columns="mergedColumns"
      size="small"
      :pagination="false"
      bordered
      class="field-table"
      
    >
      <template #bodyCell="{ column, record, index }">
        <!-- 动态渲染自定义列 -->
        <template v-for="col in customColumns" :key="col.key">
          <template v-if="column.key === col.key">
            <!-- 支持引用的字段使用ParamInput -->
            <param-input 
              v-if="col.supportReference"
              :value="record[col.key]"
              :placeholder="col.placeholder || ''"
              :column-key="col.key"
              :currentNodeId="currentNodeId"
              @update="handleParamInputUpdate($event, index)"
              @clear-reference="handleClearReference(index, col.key)"
            />
            <!-- 原有的不同类型的输入控件 -->
            <template v-else>
              <a-input 
                v-if="col.type === 'string'"
                v-model:value="record[col.key]" 
                size="small" 
                :placeholder="col.placeholder || ''" 
                @blur="onFieldChange"
              />
              <a-select
                v-else-if="col.type === 'select'"
                v-model:value="record[col.key]"
                size="small"
                style="width: 100%;"
                @change="onFieldChange"
              >
                <a-select-option 
                  v-for="option in col.options" 
                  :key="option.value" 
                  :value="option.value"
                >
                  {{ option.label }}
                </a-select-option>
              </a-select>
              <a-checkbox
                v-else-if="col.type === 'boolean'"
                v-model:checked="record[col.key]"
                @change="onFieldChange"
              />
            </template>
          </template>
        </template>
        
        <!-- 操作列 -->
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button size="small" danger @click="removeField(index)">
              <delete-outlined />
            </a-button>
          </a-space>
        </template>
      </template>
    </a-table>
    
    <!-- 空状态提示 -->
    <div v-if="fields.length === 0" class="empty-fields">
      <a-empty :description="emptyText" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import ParamInput from './ParamInput.vue';
import { isReferenceType, normalizeReference } from './referenceUtils';

const props = defineProps({
  value: {
    type: [Object, Array],
    default: () => ({ type: 'reference', content: [] })
  },
  // 自定义列定义
  columns: {
    type: Array,
    default: () => [
      { title: '字段名', dataIndex: 'name', key: 'name', type: 'string', placeholder: '字段名', width: '40%', supportReference: true },
      { title: 'XPath', dataIndex: 'xpath', key: 'xpath', type: 'string', placeholder: 'XPath', width: '50%', supportReference: true }
    ]
  },
  // 默认新字段模板
  defaultFieldTemplate: {
    type: Object,
    default: () => ({ name: '', xpath: '' })
  },
  // 添加按钮文字
  addButtonText: {
    type: String,
    default: '添加字段'
  },
  // 空状态文字
  emptyText: {
    type: String,
    default: '暂无数据'
  },
  // 当前节点ID (用于引用选择)
  currentNodeId: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update']);
console.log(props.value);

// 获取自定义列
const customColumns = computed(() => {
  return props.columns.filter(col => col.key !== 'action');
});

// 合并列定义（添加操作列）
const mergedColumns = computed(() => {
  return [
    ...props.columns,
    { title: '操作', key: 'action', width: '10%' }
  ];
});

// 本地字段数据
const fields = ref([]);

// 初始化和同步数据
onMounted(() => {
  initFieldsFromValue();
});

watch(() => props.value, () => {
  initFieldsFromValue();
}, { deep: true });

// 从传入的值初始化字段数组
const initFieldsFromValue = () => {
  if (props.value) {
    let content = props.value;
    
    // 处理包装在type/content中的数据结构
    if (props.value.content !== undefined) {
      content = props.value.content;
    }
    
    // 如果内容是字符串（JSON字符串），尝试解析
    if (typeof content === 'string' && content.trim()) {
      try {
        content = JSON.parse(content);
      } catch (e) {
        console.error('无法解析JSON字符串:', e);
        content = [];
      }
    }
    
    // 确保内容是数组
    if (Array.isArray(content)) {
      // 使用深拷贝确保数据独立
      fields.value = JSON.parse(JSON.stringify(content));
    } else {
      fields.value = [];
    }
  } else {
    fields.value = [];
  }
};

// 字段变更后更新
const onFieldChange = () => {
  updateParentValue();
};

// 处理参数输入更新 (带引用支持)
const handleParamInputUpdate = (data, index) => {
  if (!data || !data.columnKey) {
    return;
  }
  
  const { columnKey, ...value } = data;
  
  // 特殊处理引用类型的值
  if (isReferenceType(value)) {
    // 确保引用对象结构完整，统一使用reference类型
    const normalizedRef = {
      type: 'reference',
      content: value.content || {}
    };
    
    // 在更新字段值前，确保我们保留了所有必要的引用信息
    fields.value[index][columnKey] = normalizedRef;
  } else if (value.type === 'reference') {
    // 如果是reference类型，保存content值
    fields.value[index][columnKey] = value.content;
  } else {
    // 其他类型值直接设置
    fields.value[index][columnKey] = value;
  }
  
  // 触发更新
  updateParentValue();
};

// 清除引用
const handleClearReference = (index, columnKey) => {
  // 将字段值设置为空字符串
  fields.value[index][columnKey] = '';
  updateParentValue();
};

// 更新父组件的值
const updateParentValue = () => {


  fields.value.forEach((param) => {
    if (isReferenceType(param.default)) {
      // 统一转换为reference类型
      param.default = normalizeReference(param.default);
    }
  });

  // 使用深拷贝确保数据独立性
  const fieldsData = JSON.parse(JSON.stringify(fields.value));
  emit('update', fieldsData);
};

// 添加新字段
const addField = () => {
  // 使用深拷贝创建新字段，避免引用问题
  const newField = JSON.parse(JSON.stringify(props.defaultFieldTemplate));
  
  // 确保fields是数组
  if (!Array.isArray(fields.value)) {
    fields.value = [];
  }
  
  // 添加新字段
  fields.value.push(newField);
  
  // 立即触发更新，确保UI响应
  setTimeout(() => {
    updateParentValue();
  }, 0);
};

// 删除字段
const removeField = (index) => {
  // 确保索引有效
  if (index < 0 || index >= fields.value.length) {
    console.warn('删除字段失败：无效的索引', index);
    return;
  }
  
  // 删除指定索引的字段
  fields.value.splice(index, 1);
  
  // 立即触发更新，确保UI响应
  setTimeout(() => {
    updateParentValue();
  }, 0);
};
</script>

<style scoped>
.array-field-editor {
  width: 100%;
}

.table-actions {
  margin-bottom: 8px;
  display: flex;
  justify-content: flex-end;
}

.empty-fields {
  margin: 20px 0;
  text-align: center;
}

.field-table {
  margin-bottom: 10px;
}

:deep(.ant-table) {
  font-size: 12px;
}

:deep(.ant-table-tbody > tr > td) {
  padding: 6px 8px;
}


</style> 