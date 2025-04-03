# 通用组件文档

## ModuleIcon 组件

ModuleIcon 组件用于显示模块的图标，统一管理所有使用到的图标。该组件目前基于 Ant Design 图标库，将来可能支持更多类型的图标（如自定义图片）。

### 基本用法

```vue
<ModuleIcon icon="global" category="web" />
```

### 属性

| 属性名    | 类型    | 默认值     | 说明                                             |
|-----------|---------|------------|--------------------------------------------------|
| icon      | String  | ''         | 图标名称，对应 Ant Design 图标库中的图标名称（不含后缀） |
| type      | String  | 'outlined' | 图标类型，可选值：'outlined'、'filled'、'twotone'    |
| category  | String  | 'default'  | 模块类别，用于设置图标的背景颜色和前景色            |

### 类别样式

组件内置了以下几种类别样式：

- basic（基础类型）
- web（Web类型）
- ai（AI类型）
- plugin（插件类型）
- composite（组合类型）
- if-else（条件类型）
- loop（循环类型）
- code（代码类型）
- input（输入类型）
- output（输出类型）
- session（会话类型）
- database（数据库类型）

### 示例

```vue
<!-- 基础类型图标 -->
<ModuleIcon icon="database" category="basic" />

<!-- Web类型图标 -->
<ModuleIcon icon="global" category="web" />

<!-- 代码类型图标 -->
<ModuleIcon icon="code" category="code" />

<!-- 使用filled类型的图标 -->
<ModuleIcon icon="star" type="filled" category="basic" />
```

### 在nodeTypes.json中配置

在定义节点类型时，请在meta对象中设置icon属性：

```json
{
  "module_type": "OpenPageBlock",
  "is_composited": false,
  "meta": {
    "title": "打开网页",
    "description": "打开网页以获取网页内容",
    "category": "web",
    "icon": "global"
  },
  ...
}
```

图标名称应该与Ant Design图标库中的图标名称对应（不含后缀）。例如，使用"global"而不是"GlobalOutlined"。

### 常用图标列表

以下是一些常用的Ant Design图标：

| 功能/类型        | 图标名称           |
|-----------------|-------------------|
| 网页操作         | global, link      |
| 数据处理         | database, table   |
| 条件/分支        | fork, branches    |
| 循环            | sync, reload      |
| 代码            | code, console     |
| 输入/输出        | import, export    |
| 文件操作         | file, folder      |
| API调用          | api, cloud        |
| 用户交互         | user, team        |

完整的图标列表可以在[Ant Design图标库](https://ant.design/components/icon)中查看。 