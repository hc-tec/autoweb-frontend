# 参数输入系统

这个目录包含工作流编辑器中用于节点参数输入的组件。系统采用组件策略模式，为不同类型的参数提供专门的输入组件。

## 系统架构

整个参数输入系统采用了以下架构:

1. `ParamInput.vue` - 主参数输入组件，负责根据参数类型动态加载相应的子组件
2. `/param-inputs` - 参数输入组件目录
   - `index.js` - 组件注册与工厂函数
   - 各类型专用输入组件 - 如 `StringInput.vue`, `NumberInput.vue` 等

## 参数类型映射

系统会根据参数类型自动选择合适的输入组件:

| 参数类型      | 组件                | 说明                       |
|--------------|--------------------|-----------------------------|
| string       | StringInput        | 字符串输入                   |
| number       | NumberInput        | 数值输入                     |
| boolean      | BooleanInput       | 布尔值输入(开关)             |
| array        | ArrayInput         | 数组输入(JSON)               |
| object       | ObjectInput        | 对象输入(JSON)               |
| fields       | FieldsInput        | 字段数组专用输入              |

## 扩展方法

如果需要添加新的参数类型支持:

1. 在 `/param-inputs` 目录下创建新的输入组件
2. 在 `/param-inputs/index.js` 中导入并注册该组件
3. 更新 `typeComponentMap` 映射关系

## 参数输入组件规范

所有参数输入组件应遵循以下接口规范:

### Props

- `param: Object` - 参数定义
- `value: Any` - 参数当前值
- `currentNodeId: String` - 当前节点ID
- `nodeData: Object` - 节点数据对象

### 事件

- `@update` - 当参数值变更时触发
- `@clear-reference` - 当需要清除引用时触发

### 引用处理

所有输入组件均支持值引用功能，可通过 `ReferenceSelector` 组件选择其他节点的输出作为当前参数的值引用。 