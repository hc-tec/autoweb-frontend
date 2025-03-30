<template>
  <div class="param-value">
    <!-- 参数类型标签 -->
    <div class="param-type">{{ param.type || 'any' }}.</div>
    
    <!-- 字符串类型参数 -->
    <template v-if="param.type === 'string' || param.type === 'str'">
      <div v-if="isReference" class="input-with-ref">
        <div class="ref-badge">
          <left-circle-filled />
        </div>
        <a-input
          size="small"
          :value="getDisplayValue"
          readonly
          class="ref-input"
          :bordered="true"
        >
          <template #suffix>
            <a-button type="text" size="small" class="clear-btn" @click="$emit('clear-reference')">
              <close-outlined />
            </a-button>
            <a-divider type="vertical" />
            <reference-selector
              :currentNodeId="currentNodeId"
              @close="refSelectorVisible = false"
              @select-reference="handleRefSelect"
            >
              <a-button type="text" size="small" class="ref-selector-trigger">
                <link-outlined class="link-icon" />
              </a-button>
            </reference-selector>
          </template>
        </a-input>
      </div>
      <div v-else class="normal-input">
        <a-input
          size="small"
          :value="getDisplayValue"
          @change="updateValue"
          :placeholder="param.required ? '必填' : '输入或引用参数值'"
          class="param-input"
        >
          <template #suffix>
            <reference-selector
              :currentNodeId="currentNodeId"
              @close="refSelectorVisible = false"
              @select-reference="handleRefSelect"
            >
              <a-button type="text" size="small" class="ref-selector-trigger">
                <link-outlined class="link-icon" />
              </a-button>
            </reference-selector>
          </template>
        </a-input>
      </div>
    </template>
    
    <!-- 布尔类型参数 -->
    <template v-else-if="param.type === 'boolean' || param.type === 'bool'">
      <div class="switch-container">
        <a-switch
          size="small"
          :checked="!!getDisplayValue"
          @change="updateValue"
        />
        <a-dropdown>
          <a-button type="text" size="small">
            <down-outlined />
          </a-button>
          <template #overlay>
            <a-menu>
              <a-menu-item key="true" @click="updateLiteralValue(true)">True</a-menu-item>
              <a-menu-item key="false" @click="updateLiteralValue(false)">False</a-menu-item>
              <a-menu-divider />
              <a-menu-item key="ref">
                <reference-selector
                  :currentNodeId="currentNodeId"
                  @close="refSelectorVisible = false"
                  @select-reference="handleRefSelect"
                >
                  <div class="ref-menu-item">
                    <link-outlined class="link-icon" /> 引用值
                  </div>
                </reference-selector>
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </template>
    
    <!-- 数字类型参数 -->
    <template v-else-if="param.type === 'number' || param.type === 'integer' || param.type === 'int'">
      <div class="number-input-container">
        <a-input-number
          size="small"
          :value="getDisplayValue"
          @change="updateValue"
          :placeholder="param.required ? '必填' : '输入或引用参数值'"
          class="param-input"
        />
        <reference-selector
          :currentNodeId="currentNodeId"
          @close="refSelectorVisible = false"
          @select-reference="handleRefSelect"
        >
          <a-button type="text" size="small" class="ref-selector-trigger">
            <link-outlined class="link-icon" />
          </a-button>
        </reference-selector>
      </div>
    </template>
    
    <!-- 其他类型参数 -->
    <template v-else>
      <a-input
        size="small"
        :value="getDisplayValue"
        @change="updateValue"
        :placeholder="param.required ? '必填' : '输入或引用参数值'"
        class="param-input"
      >
        <template #suffix>
          <reference-selector
            :currentNodeId="currentNodeId"
            @close="refSelectorVisible = false"
            @select-reference="handleRefSelect"
          >
            <a-button type="text" size="small" class="ref-selector-trigger">
              <link-outlined class="link-icon" />
            </a-button>
          </reference-selector>
        </template>
      </a-input>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useVueFlow } from '@vue-flow/core';
import {
  CloseOutlined,
  DownOutlined,
  LinkOutlined,
  LeftCircleFilled
} from '@ant-design/icons-vue';
import ReferenceSelector from './ReferenceSelector.vue';

const props = defineProps({
  param: {
    type: Object,
    required: true
  },
  value: {
    type: [Object, String, Number, Boolean, null],
    default: null
  },
  currentNodeId: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update', 'show-ref-selector', 'clear-reference']);

// 使用Vue Flow API获取节点
const { getNodes } = useVueFlow();

// 引用选择器状态
const refSelectorVisible = ref(false);

// 判断是否为引用类型
const isReference = computed(() => {
  return props.value && props.value.type === 'ref';
});

// 获取显示值
const getDisplayValue = computed(() => {
  if (!props.value) return '';
  
  // 如果是引用类型
  if (props.value.type === 'ref' && props.value.content) {
    const { moduleID, name, property } = props.value.content;
    
    // 获取引用源模块的名称
    const sourceNode = getNodes.value.find(node => node.id === moduleID);
    const sourceName = sourceNode?.data?.meta?.title || moduleID;
    
    // 显示引用路径
    let displayText = `${sourceName} > ${name}`;
    if (property) {
      displayText += ` > ${property}`;
    }
    return displayText;
  }
  
  // 如果是常量类型
  if (props.value.type === 'literal') {
    return props.value.content;
  }
  
  // 返回原始值（向后兼容）
  return props.value || '';
});

// 更新值（从文本输入）
const updateValue = (event) => {
  const value = event?.target ? event.target.value : event;
  updateLiteralValue(value);
};

// 更新常量值
const updateLiteralValue = (content) => {
  emit('update', {
    type: 'literal',
    content
  });
};

// 处理引用选择
const handleRefSelect = (reference) => {
  emit('update', reference);
  refSelectorVisible.value = false;
};
</script>

<style scoped>
.param-value {
  flex: 2;
  display: flex;
  align-items: center;
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

.input-with-ref {
  flex: 1;
  position: relative;
}

.normal-input {
  flex: 1;
  display: flex;
}

.ref-badge {
  position: absolute;
  left: -10px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  color: #1890ff;
  font-size: 18px;
}

.ref-input {
  padding-left: 16px !important;
}

.clear-btn {
  height: auto;
  padding: 0 2px;
}

.link-icon {
  color: #1890ff;
  font-size: 14px;
}

.param-input {
  width: 100%;
}

/* 开关容器 */
.switch-container {
  flex: 1;
  display: flex;
  align-items: center;
}

/* 数字输入容器 */
.number-input-container {
  flex: 1;
  display: flex;
  align-items: center;
}

.number-input-container .param-input {
  margin-right: 8px;
}

/* 引用选择触发按钮样式 */
.ref-selector-trigger {
  padding: 0 4px;
  margin-left: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f5ff;
  border: 1px solid #d9e6ff;
  border-radius: 4px;
}

.ref-selector-trigger:hover {
  background-color: #e6f1ff;
  border-color: #91caff;
}

.ref-selector-trigger .link-icon {
  color: #1890ff;
  font-size: 16px;
}

.ref-menu-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 自定义下拉菜单样式 */
:deep(.ref-selector-dropdown) {
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
</style> 