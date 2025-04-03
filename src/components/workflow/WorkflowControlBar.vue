<template>
  <div class="workflow-control-bar">
    <div class="control-bar-left">
      <div class="zoom-control">
        <a-dropdown>
          <a-button class="zoom-percentage">
            <span>{{ Math.round(zoom * 100) }}%</span>
            <down-outlined />
          </a-button>
          <template #overlay>
            <a-menu>
              <a-menu-item @click="setZoom(0.5)">50%</a-menu-item>
              <a-menu-item @click="setZoom(1)">100%</a-menu-item>
              <a-menu-item @click="setZoom(1.5)">150%</a-menu-item>
              <a-menu-item @click="setZoom(2)">200%</a-menu-item>
              <a-menu-item @click="fitView">适应视图</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
      
      <div class="tool-buttons">
        <a-tooltip title="注释">
          <a-button class="tool-button">
            <message-outlined />
          </a-button>
        </a-tooltip>
        
        <a-tooltip title="优化布局">
          <a-button class="tool-button" @click="optimizeLayout">
            <partition-outlined />
          </a-button>
        </a-tooltip>
        
        <a-tooltip title="缩略图">
          <a-button class="tool-button" @click="toggleMinimap">
            <appstore-outlined />
          </a-button>
        </a-tooltip>
      </div>
    </div>
    
    <div class="add-node-button">
      <a-dropdown 
        :trigger="['hover']" 
        :open="dropdownVisible" 
        :placement="'bottom'" 
        overlayClassName="node-dropdown"
        @openChange="handleDropdownVisibleChange">
        <a-button>
          <template #icon><plus-outlined /></template>
          添加节点
        </a-button>
        <template #overlay>
          <NodeSelector @select="handleNodeSelect" @search="handleNodeSearch" />
        </template>
      </a-dropdown>
    </div>
    
    <div class="control-bar-right">
      <a-tooltip title="搜索">
        <a-button class="tool-button">
          <search-outlined />
        </a-button>
      </a-tooltip>
      
      <a-tooltip title="导出">
        <a-button class="tool-button" @click="exportWorkflow">
          <export-outlined />
        </a-button>
      </a-tooltip>
      
      <a-button type="primary" @click="runWorkflow">
        <CaretRightOutlined />
        试运行
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import { 
  DownOutlined, 
  SearchOutlined, 
  PlusOutlined,
  MessageOutlined,
  AppstoreOutlined,
  PartitionOutlined,
  ExportOutlined,
  CodeOutlined,
  ForkOutlined,
  SyncOutlined,
  ImportOutlined,
  DatabaseOutlined,
  FileAddOutlined,
  DeleteOutlined,
  RobotOutlined,
  ApiOutlined,
  ShareAltOutlined,
  CaretRightOutlined
} from '@ant-design/icons-vue'
import NodeSelector from './NodeSelector.vue'

const emit = defineEmits(['addNode', 'optimizeLayout', 'runWorkflow', 'exportWorkflow'])

// Vue Flow API
const { fitView, zoomTo, getViewport } = useVueFlow()

// 当前缩放级别
const zoom = ref(1)
// 每次缩放更新后获取新的缩放值
const updateZoom = () => {
  zoom.value = getViewport().zoom
}

// 监听缩放变化
useVueFlow().onViewportChange(updateZoom)

// 计算缩放级别显示文字
const zoomLevel = computed(() => {
  if (zoom.value <= 0.5) return '0'
  if (zoom.value <= 1) return '1'
  if (zoom.value <= 1.5) return '2'
  return '3'
})

// 设置缩放级别
const setZoom = (level) => {
  zoomTo(level)
}

// 优化布局
const optimizeLayout = () => {
  emit('optimizeLayout')
}

// 运行工作流
const runWorkflow = () => {
  emit('runWorkflow')
}

// 切换缩略图
const toggleMinimap = () => {
  // 实现缩略图切换逻辑
}

// 添加节点相关
const dropdownVisible = ref(false)

// 显示添加节点弹窗
const showNodeDropdown = () => {
  dropdownVisible.value = true
}

// 隐藏添加节点弹窗
const hideNodeDropdown = () => {
  dropdownVisible.value = false
}

// 处理节点选择
const handleNodeSelect = (nodeType) => {
  addNodeType(nodeType);
  showNodeDropdown()
}

// 处理节点搜索
const handleNodeSearch = (value) => {
  console.log('节点搜索:', value);
  // 这里可以实现节点搜索逻辑
}

// 添加指定类型的节点
const addNodeType = (type) => {
  emit('addNode', type)
  dropdownVisible.value = false
}

// 导出工作流
const exportWorkflow = () => {
  emit('exportWorkflow')
}

// 处理下拉菜单可见性变化
const handleDropdownVisibleChange = (visible) => {
  if (visible) {
    showNodeDropdown()
  } else {
    hideNodeDropdown()
  }
}
</script>

<style scoped>
.workflow-control-bar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: white;
  border-radius: 8px;
  padding: 6px 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  min-width: 600px;
  z-index: 100;
  height: 44px;
}

.control-bar-left, .control-bar-right {
  display: flex;
  align-items: center;
}

.zoom-control {
  display: flex;
  align-items: center;
  margin-right: 8px;
}

.zoom-button {
  border-radius: 4px 0 0 4px;
  border-right: none;
  padding: 0 8px;
}

.zoom-percentage {
  border-radius: 0 4px 4px 0;
  padding: 0 8px;
}

.tool-buttons {
  display: flex;
  align-items: center;
  margin: 0 8px;
}

.tool-button {
  margin: 0 4px;
  border: none;
  background: transparent;
}

.add-node-button {
  margin: 0 8px;
}

/* 只保留这个样式，其它节点选择器相关样式已移至NodeSelector.vue */
.node-dropdown :deep(.ant-dropdown-menu) {
  padding: 0;
  background: transparent;
  box-shadow: none;
}
</style> 