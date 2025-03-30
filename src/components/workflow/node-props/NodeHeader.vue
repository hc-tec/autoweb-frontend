<template>
  <div class="node-detail-header">
    <div class="header-main">
      <div class="icon-container">
        <div class="node-icon">
          <img 
            
            :alt="`${nodeType} icon`"
            v-if="nodeType"
          />
        </div>
      </div>
      <div class="title-container">
        <div class="node-title">{{ title }}</div>
        <div class="node-desc">{{ description }}</div>
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
import { computed } from 'vue';
import { CloseOutlined, FileTextOutlined } from '@ant-design/icons-vue';

const props = defineProps({
  node: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close']);

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
  
  return descMap[nodeType.value] || '处理数据节点';
});
</script>

<style scoped>
.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.header-main {
  display: flex;
  align-items: center;
}

.icon-container {
  margin-right: 12px;
}

.node-icon {
  width: 36px;
  height: 36px;
  background-color: #1890ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.node-icon img {
  width: 20px;
  height: 20px;
}

.title-container {
  display: flex;
  flex-direction: column;
}

.node-title {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
}

.node-desc {
  font-size: 12px;
  color: #888;
  line-height: 1.4;
}

.header-actions {
  display: flex;
  align-items: center;
}

.action-btn {
  margin-left: 8px;
}
</style> 