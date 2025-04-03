<template>
  <div class="node-dropdown-content">
    <div class="add-node-search">
      <a-input-search
        v-model:value="searchQuery"
        placeholder="搜索节点、插件、工作流"
        @search="onSearch"
        @input="onSearchInput"
        size="large"
      />
    </div>
    
    <div v-if="loading" class="loading-container">
      <a-spin />
      <div class="loading-text">加载节点类型...</div>
    </div>
    
    <template v-else>
      <!-- 如果有搜索结果，显示搜索结果 -->
      <div v-if="searchQuery && filteredNodeTypes.length > 0" class="search-results">
        <div class="category-title">搜索结果</div>
        <div class="node-list">
          <div 
            v-for="nodeType in filteredNodeTypes" 
            :key="getNodeTypeKey(nodeType)"
            class="node-item" 
            @click="addNodeType(getNodeTypeKey(nodeType))"
          >
            <div :class="['node-icon', `node-icon-${nodeType.meta.category}`]">
              <ModuleIcon :icon="nodeType.meta.icon" :category="nodeType.meta.category" />
            </div>
            <div class="node-name">{{ nodeType.meta.title }}</div>
          </div>
        </div>
      </div>
      
      <!-- 如果有搜索但没有结果 -->
      <div v-else-if="searchQuery" class="no-results">
        <a-empty description="未找到匹配的节点类型" />
      </div>
      
      <!-- 显示所有分类的节点类型 -->
      <div v-else class="node-categories">
        <template v-for="(nodeTypes, category) in groupedNodeTypes" :key="category">
          <div class="category-title">{{ getCategoryTitle(category) }}</div>
          <div class="node-list">
            <div 
              v-for="nodeType in nodeTypes" 
              :key="getNodeTypeKey(nodeType)"
              class="node-item" 
              @click="addNodeType(getNodeTypeKey(nodeType))"
            >
              <div :class="['node-icon', `node-icon-${category}`]">
                <ModuleIcon :icon="nodeType.meta.icon" :category="category" />
              </div>
              <div class="node-name">{{ nodeType.meta.title }}</div>
            </div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useNodeTypes, loadNodeTypes } from '@/utils/nodeFactory'
import ModuleIcon from '@/components/common/ModuleIcon.vue'

// 定义暴露给父组件的事件
const emit = defineEmits(['select', 'search'])

// 搜索查询
const searchQuery = ref('')

// 加载节点类型
const { nodeTypes, loading } = useNodeTypes()

// 按分类分组的节点类型
const groupedNodeTypes = computed(() => {
  if (!nodeTypes.value || nodeTypes.value.length === 0) {
    return {}
  }
  
  const groups = {}
  nodeTypes.value.forEach(nodeType => {
    const category = nodeType.meta.category || 'default'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(nodeType)
  })
  
  return groups
})

// 搜索结果
const filteredNodeTypes = computed(() => {
  if (!searchQuery.value || !nodeTypes.value) {
    return []
  }
  
  const query = searchQuery.value.toLowerCase()
  return nodeTypes.value.filter(nodeType => {
    const title = nodeType.meta.title.toLowerCase()
    const desc = nodeType.meta.description.toLowerCase()
    const type = nodeType.module_type.toLowerCase()
    
    return title.includes(query) || 
           desc.includes(query) || 
           type.includes(query)
  })
})

// 获取分类显示名称
const getCategoryTitle = (category) => {
  const categoryMap = {
    'basic': '基础组件',
    'web': 'Web',
    'composite': '工作流',
    'session': '会话管理',
    'database': '数据库',
    'default': '其他'
  }
  
  return categoryMap[category] || category
}

// 搜索节点
const onSearch = (value) => {
  emit('search', value)
}

// 搜索输入
const onSearchInput = (e) => {
  searchQuery.value = e.target.value
}

// 获取节点类型的唯一键值
const getNodeTypeKey = (nodeType) => {
  // 如果是工作流节点，使用module_type和workflow_id的组合作为唯一标识符
  if (nodeType.module_type === 'workflow' && nodeType.workflow_id) {
    return `${nodeType.module_type}:${nodeType.workflow_id}`;
  }
  // 其他类型节点仍然使用module_type作为标识符
  return nodeType.module_type;
}

// 添加指定类型的节点
const addNodeType = (typeKey) => {
  emit('select', typeKey)
}

// 加载节点类型
onMounted(async () => {
  try {
    await loadNodeTypes()
  } catch (error) {
    console.error('加载节点类型失败:', error)
  }
})
</script>

<style scoped>
.node-dropdown-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
  padding: 20px;
  width: 580px;
  max-height: 70vh;
  overflow-y: auto;
}

.add-node-search {
  margin-bottom: 20px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-text {
  margin-top: 16px;
  color: #999;
}

.no-results {
  padding: 20px 0;
}

.node-categories {
  display: flex;
  flex-direction: column;
}

.category-title {
  font-weight: bold;
  margin: 12px 0 8px 0;
  color: #666;
  font-size: 14px;
}

.node-list {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.node-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  margin: 0 12px 12px 0;
  border-radius: 8px;
  cursor: pointer;
  background-color: #f5f5f5;
  transition: all 0.3s;
}

.node-item:hover {
  background-color: #e8e8e8;
  transform: translateY(-2px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.node-icon {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  color: #1890ff;
}

.node-name {
  font-size: 12px;
  color: #333;
  text-align: center;
}

.node-icon-ai {
  background-color: #e6f7ff;
  color: #1890ff;
}

.node-icon-web {
  background-color: #f0f5ff;
  color: #2f54eb;
}

.node-icon-plugin {
  background-color: #f6ffed;
  color: #52c41a;
}

.node-icon-composite {
  background-color: #fffbe6;
  color: #faad14;
}

.node-icon-if-else {
  background-color: #fff2f0;
  color: #ff4d4f;
}

.node-icon-loop {
  background-color: #f9f0ff;
  color: #722ed1;
}

.node-icon-code {
  background-color: #e6f7ff;
  color: #0073cf;
}

.node-icon-input {
  background-color: #e6fffb;
  color: #13c2c2;
}

.node-icon-output {
  background-color: #e6fffb;
  color: #13c2c2;
}

.node-icon-session {
  background-color: #fff0f6;
  color: #eb2f96;
}

.node-icon-database {
  background-color: #f4ffb8;
  color: #a0d911;
}

.search-results {
  margin-bottom: 20px;
}
</style> 