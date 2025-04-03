<template>
  <div class="node-detail-header">
    <div class="header-main">
      <div class="icon-container">
        <div class="node-icon">
          <ModuleIcon 
            :icon="nodeIcon" 
            :category="nodeCategory"
          />
        </div>
      </div>
      <div class="title-container">
        <!-- 标题编辑区域 -->
        <div class="node-title editable-field">
          <a-input
            v-if="titleEditing"
            v-model:value="editedTitle"
            size="small"
            @blur="saveTitleChanges"
            @pressEnter="saveTitleChanges"
            ref="titleInput"
          />
          <div v-else class="editable-text" @click="startTitleEdit">
            {{ title }}
            <edit-outlined class="edit-icon" />
          </div>
        </div>
        
        <!-- 描述编辑区域 -->
        <div class="node-desc editable-field">
          <a-textarea
            v-if="descEditing"
            v-model:value="editedDesc"
            size="small"
            :autoSize="{ minRows: 2, maxRows: 5 }"
            @blur="saveDescChanges"
            @pressEnter="saveDescChanges"
            ref="descInput"
          />
          <div v-else class="editable-text" @click="startDescEdit">
            {{ description }}
            <edit-outlined class="edit-icon" />
          </div>
        </div>
      </div>
    </div>
    <div class="header-actions">
      <a-tooltip title="查看示例">
        <a-button type="text" class="action-btn">
          <file-text-outlined />
        </a-button>
      </a-tooltip>
      <a-tooltip title="关闭">
        <a-button type="text" class="action-btn" @click="$emit('close')">
          <close-outlined />
        </a-button>
      </a-tooltip>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick } from 'vue';
import { CloseOutlined, FileTextOutlined, EditOutlined } from '@ant-design/icons-vue';
import ModuleIcon from '@/components/common/ModuleIcon.vue';
import { useNodeUpdater } from '@/composables/useNodeUpdater';

const props = defineProps({
  node: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'update-node']);

// 使用节点更新器
const { updateNodeMeta } = useNodeUpdater();

// 计算节点类型
const nodeType = computed(() => {
  return props.node?.data?.module_type || props.node?.type || 'default';
});

// 计算节点标题
const title = computed(() => {
  return props.node?.data?.meta?.title || props.node?.data?.module_id || '节点';
});

// 计算节点描述
const description = computed(() => {
  // 优先使用节点元数据中的描述
  if (props.node?.data?.meta?.description) {
    return props.node.data.meta.description;
  }
  
  return '处理数据节点';
});

// 计算节点图标
const nodeIcon = computed(() => {
  return props.node?.data?.meta?.icon || '';
});

// 计算节点类别
const nodeCategory = computed(() => {
  return props.node?.data?.meta?.category || 'default';
});

// 标题编辑状态
const titleEditing = ref(false);
const editedTitle = ref('');
const titleInput = ref(null);

// 描述编辑状态
const descEditing = ref(false);
const editedDesc = ref('');
const descInput = ref(null);

// 开始编辑标题
const startTitleEdit = () => {
  editedTitle.value = title.value;
  titleEditing.value = true;
  
  // 等待DOM更新后聚焦输入框
  nextTick(() => {
    if (titleInput.value) {
      titleInput.value.focus();
    }
  });
};

// 保存标题更改
const saveTitleChanges = () => {
  if (editedTitle.value.trim() === '') {
    editedTitle.value = title.value; // 恢复原标题
  }
  
  // 只有当标题实际发生变化时才更新
  if (editedTitle.value !== title.value) {
    updateNodeMeta(props.node, {
      title: editedTitle.value
    });
  }
  
  titleEditing.value = false;
};

// 开始编辑描述
const startDescEdit = () => {
  editedDesc.value = description.value;
  descEditing.value = true;
  
  // 等待DOM更新后聚焦输入框
  nextTick(() => {
    if (descInput.value) {
      descInput.value.focus();
    }
  });
};

// 保存描述更改
const saveDescChanges = () => {
  if (editedDesc.value.trim() === '') {
    editedDesc.value = description.value; // 恢复原描述
  }
  
  // 只有当描述实际发生变化时才更新
  if (editedDesc.value !== description.value) {
    updateNodeMeta(props.node, {
      description: editedDesc.value
    });
  }
  
  descEditing.value = false;
};
</script>

<style scoped>
.node-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.header-main {
  display: flex;
  align-items: flex-start;
  flex: 1;
}

.icon-container {
  margin-right: 12px;
}

.node-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0; /* 防止内容溢出 */
}

.node-title {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
  margin-bottom: 4px;
}

.node-desc {
  font-size: 12px;
  color: #888;
  line-height: 1.4;
}

.header-actions {
  display: flex;
  align-items: center;
  margin-left: 8px;
}

.action-btn {
  margin-left: 8px;
}

/* 可编辑字段样式 */
.editable-field {
  position: relative;
  width: 100%;
}

.editable-text {
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  position: relative;
  transition: background-color 0.3s;
}

.editable-text:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.edit-icon {
  visibility: hidden;
  font-size: 12px;
  margin-left: 4px;
  color: #1890ff;
}

.editable-text:hover .edit-icon {
  visibility: visible;
}

/* 确保输入框正确显示 */
.editable-field :deep(.ant-input), 
.editable-field :deep(.ant-input-textarea) {
  width: 100%;
}
</style> 