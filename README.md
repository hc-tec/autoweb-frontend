# AutoWeb Frontend 项目

## 项目概述

AutoWeb Frontend 是一个基于 Vue 的低代码工作流可视化编辑器，用于创建、编辑和管理自动化工作流。该项目采用现代化的组件架构和状态管理方式，提供直观的拖拽式节点编辑、参数配置、节点连接等功能，支持复杂工作流的可视化构建。

## 技术栈

- **前端框架**: Vue 3 + Composition API
- **UI 组件库**: Ant Design Vue
- **工作流引擎**: Vue Flow
- **构建工具**: Vite
- **状态管理**: Vue Composition API + 响应式系统

## 项目架构

```
src/
├── assets/                # 静态资源
│   ├── icons/             # SVG图标
│   └── workflow-styles.css # 工作流全局样式
├── components/
│   ├── nodes/             # 节点相关组件
│   │   ├── BaseNode.vue   # 节点基础组件
│   │   ├── CustomNode.vue # 自定义节点组件
│   │   └── CompositeNode.vue # 复合节点组件
│   │
│   └── workflow/          # 工作流相关组件
│       ├── NodePropertiesPanel.vue # 节点属性面板
│       ├── WorkflowControlBar.vue  # 工作流控制栏
│       ├── WorkflowEditor.vue      # 工作流编辑器主组件
│       ├── NodeSelector.vue        # 节点选择器
│       └── node-props/             # 节点属性相关组件
│           ├── NodeHeader.vue           # 节点头部组件
│           ├── InputParamsSection.vue   # 输入参数区域
│           ├── OutputParamsSection.vue  # 输出参数区域
│           ├── ParamInput.vue           # 参数输入组件
│           └── ReferenceSelector.vue    # 参数引用选择器
│
├── utils/                 # 工具函数
│   ├── nodeFactory.js     # 节点创建工厂
│   └── workflowUtils.js   # 工作流工具函数
│
└── views/                 # 视图组件
    └── WorkflowEditorView.vue # 工作流编辑视图
```

## 核心功能与技术特点

### 1. 响应式工作流编辑

- **基于 Vue Flow 的工作流图**: 使用 Vue Flow 实现节点拖拽、连线和交互功能
- **自定义节点渲染**: 支持普通节点和复合节点两种类型，提供自定义样式和交互
- **响应式数据流**: 使用 Vue 3 的 Composition API 实现流畅的状态同步和更新

### 2. 组件化的节点属性编辑

- **抽屉式属性面板**: 提供节点属性的实时编辑功能
- **参数自动验证**: 根据参数类型提供相应的输入控件和验证
- **模块化组件设计**: 将属性面板拆分为多个功能组件，实现高内聚低耦合

### 3. 高级参数引用机制

- **参数级联选择器**: 实现节点间参数引用的可视化选择
- **上下文感知**: 自动识别上游节点及其输出参数
- **对象属性探索**: 支持对复杂对象参数的属性访问

### 4. JSON 工作流序列化

- **双向转换**: 支持工作流与 JSON 配置的双向转换
- **节点位置保存**: 保存节点在画布中的位置信息
- **连接关系记录**: 准确记录节点间的连接关系和参数引用

### 5. 交互优化

- **即时反馈**: 节点选中、连线、删除等操作提供即时可视反馈
- **快捷键支持**: 支持 Delete 键删除选中元素
- **画布空白区域点击**: 点击空白区域自动关闭属性面板
- **新增节点自动选中**: 新增节点后自动选中并打开属性面板

## 技术亮点

### 1. Vue Flow 集成与扩展

项目深度集成了 Vue Flow 库，并通过 `useVueFlow` Composable 实现了组件间的状态共享：

```javascript
const { getNodes, getEdges, onNodeClick, onPaneClick } = useVueFlow();
```

### 2. 组合式 API 设计模式

采用 Vue 3 的 Composition API，使用函数式编程风格组织代码，提高了代码可读性和可维护性：

```javascript
// 组合式API与响应式状态
const selectedNode = ref(null);
const showProperties = ref(false);

// 计算属性
const nodeType = computed(() => {
  return props.node?.data?.module_type || 'default';
});
```

### 3. 节点工厂模式

使用工厂模式创建不同类型的节点，实现节点创建逻辑的封装和复用：

```javascript
// 节点工厂创建节点
const node = await createNode(type, position);
```

### 4. 事件驱动架构

采用事件驱动模式，通过事件处理节点交互、属性更新等操作：

```javascript
// 事件驱动的状态更新
emit('update-node', updatedNode);
```

### 5. 自适应布局

实现节点的自动布局和自适应调整，提高可用性：

```javascript
// 自适应视图
fitView({
  padding: 0.2,
  includeHiddenNodes: false,
  nodes: [addedNode]
});
```

## 如何扩展

项目设计了良好的扩展接口，支持以下扩展方式：

1. **添加新节点类型**: 在 nodeFactory.js 中注册新节点类型
2. **自定义节点外观**: 扩展 BaseNode.vue 或创建新的节点组件
3. **扩展属性面板**: 在 node-props 目录下添加新的属性编辑组件
4. **增强工作流功能**: 通过扩展 WorkflowEditor.vue 添加新功能

## 总结

AutoWeb Frontend 项目采用现代化的 Vue 3 技术栈和组件化架构，实现了一个功能完善、交互流畅的工作流可视化编辑器。通过组合式 API、事件驱动架构和工厂模式等技术设计，使代码具有高度可维护性和可扩展性。项目整体结构清晰，组件划分合理，为复杂工作流的可视化构建提供了强大而灵活的解决方案。
