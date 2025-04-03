<template>
  <div class="module-icon" :class="[`icon-type-${category}`]">
    <component v-if="iconComponent" :is="iconComponent" />
    <span v-else class="fallback-icon">{{ fallbackIcon }}</span>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, onMounted } from 'vue';
import * as AntIcons from '@ant-design/icons-vue';

const props = defineProps({
  // 图标名称，对应Ant Design图标名称（不包含-outlined,-filled等后缀）
  icon: {
    type: String,
    default: ''
  },
  // 图标类型，默认是outlined
  type: {
    type: String,
    default: 'outlined',
    validator: (value) => ['outlined', 'filled', 'twotone'].includes(value)
  },
  // 模块类别，用于设置图标背景颜色
  category: {
    type: String,
    default: 'default'
  }
});

// 构建备用图标映射，确保每个类别都有一个合适的备用图标
const categoryFallbackMap = {
  default: '⚙️',
  basic: '📦',
  web: '🌐',
  ai: '🤖',
  plugin: '🔌',
  composite: '📑',
  'if-else': '🔀',
  loop: '🔄',
  code: '💻',
  input: '📥',
  output: '📤',
  session: '💬',
  database: '🗄️'
};

// 计算完整的图标名称
const fullIconName = computed(() => {
  if (!props.icon) return '';
  
  // 首字母大写
  const capitalizedIcon = props.icon.charAt(0).toUpperCase() + props.icon.slice(1);
  
  // 添加类型后缀
  const suffix = props.type.charAt(0).toUpperCase() + props.type.slice(1);
  return `${capitalizedIcon}${suffix}`;
});

// 获取图标组件
const iconComponent = computed(() => {
  if (!props.icon) return null;
  
  // 检查图标是否存在于Ant Design图标库中
  if (fullIconName.value in AntIcons) {
    return AntIcons[fullIconName.value];
  }
  
  console.warn(`图标 ${fullIconName.value} 在Ant Design图标库中不存在，使用备用图标`);
  return null;
});

// 计算备用图标
const fallbackIcon = computed(() => {
  return categoryFallbackMap[props.category] || categoryFallbackMap.default;
});

// 组件挂载后检查图标是否存在，输出警告日志
onMounted(() => {
  if (props.icon && !iconComponent.value) {
    console.warn(`模块图标警告: "${props.icon}" (${fullIconName.value}) 在Ant Design图标库中不存在，请检查拼写或选择其他图标`);
  }
});
</script>

<style scoped>
.module-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  font-size: 18px;
  background-color: #e9e7ff;
  color: #6f5bd5;
}

/* 基础类型图标样式 */
.icon-type-basic {
  background-color: #e9e7ff;
  color: #6f5bd5;
}

/* Web类型图标样式 */
.icon-type-web {
  background-color: #f0f5ff;
  color: #2f54eb;
}

/* AI类型图标样式 */
.icon-type-ai {
  background-color: #e6f7ff;
  color: #1890ff;
}

/* 插件类型图标样式 */
.icon-type-plugin {
  background-color: #f6ffed;
  color: #52c41a;
}

/* 组合类型图标样式 */
.icon-type-composite {
  background-color: #fffbe6;
  color: #faad14;
}

/* 条件类型图标样式 */
.icon-type-if-else {
  background-color: #fff2f0;
  color: #ff4d4f;
}

/* 循环类型图标样式 */
.icon-type-loop {
  background-color: #f9f0ff;
  color: #722ed1;
}

/* 代码类型图标样式 */
.icon-type-code {
  background-color: #e6f7ff;
  color: #0073cf;
}

/* 输入类型图标样式 */
.icon-type-input {
  background-color: #e6fffb;
  color: #13c2c2;
}

/* 输出类型图标样式 */
.icon-type-output {
  background-color: #e6fffb;
  color: #13c2c2;
}

/* 会话类型图标样式 */
.icon-type-session {
  background-color: #fff0f6;
  color: #eb2f96;
}

/* 数据库类型图标样式 */
.icon-type-database {
  background-color: #f4ffb8;
  color: #a0d911;
}

.fallback-icon {
  font-size: 16px;
}
</style> 