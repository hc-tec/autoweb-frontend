/**
 * 图标工具函数
 * 用于辅助管理和显示 Ant Design 图标
 */
import * as AntIcons from '@ant-design/icons-vue';

/**
 * 检查图标是否存在于 Ant Design 图标库中
 * @param {string} iconName - 图标名称（不含后缀）
 * @param {string} [type='outlined'] - 图标类型 (outlined, filled, twotone)
 * @returns {boolean} 图标是否存在
 */
export function iconExists(iconName, type = 'outlined') {
  if (!iconName) return false;
  
  // 首字母大写
  const capitalizedIcon = iconName.charAt(0).toUpperCase() + iconName.slice(1);
  
  // 添加类型后缀
  const suffix = type.charAt(0).toUpperCase() + type.slice(1);
  const fullIconName = `${capitalizedIcon}${suffix}`;
  
  return fullIconName in AntIcons;
}

/**
 * 获取所有可用的 Ant Design 图标名称
 * @param {string} [type='outlined'] - 图标类型 (outlined, filled, twotone)
 * @returns {Array} 图标名称数组
 */
export function getAllIconNames(type = 'outlined') {
  const suffix = type.charAt(0).toUpperCase() + type.slice(1);
  
  return Object.keys(AntIcons)
    .filter(name => name.endsWith(suffix))
    .map(name => {
      // 移除后缀并转换首字母为小写
      const nameWithoutSuffix = name.substring(0, name.length - suffix.length);
      return nameWithoutSuffix.charAt(0).toLowerCase() + nameWithoutSuffix.slice(1);
    });
}

/**
 * 按类别获取推荐的图标
 * @returns {Object} 按类别分组的推荐图标
 */
export function getRecommendedIcons() {
  return {
    basic: ['appstore', 'block', 'build', 'tool', 'check', 'setting', 'app', 'api'],
    web: ['global', 'ie', 'chrome', 'wifi', 'cloud', 'link', 'disconnect', 'html5'],
    database: ['database', 'table', 'container', 'save', 'file', 'folder', 'hdd'],
    interaction: ['mouse', 'click', 'select', 'form', 'user', 'team', 'scan'],
    control: ['branches', 'fork', 'redo', 'rollback', 'sync', 'play', 'pause', 'stop'],
    data: ['bar-chart', 'pie-chart', 'line-chart', 'dot-chart', 'stock', 'rise', 'fall'],
    ai: ['robot', 'api', 'experiment', 'bulb', 'cluster', 'cloud-server', 'function'],
    code: ['code', 'console', 'snippets', 'terminal', 'bug', 'build', 'block'],
    session: ['message', 'comment', 'notification', 'sound', 'mail', 'phone']
  };
}

/**
 * 获取适合某个模块类型的推荐图标
 * @param {string} moduleType - 模块类型
 * @returns {Array} 推荐图标数组
 */
export function getIconsForModuleType(moduleType) {
  // 基于模块类型名称匹配适合的图标
  const lowerModuleType = moduleType.toLowerCase();
  
  // 特定模块类型的映射
  const specificMappings = {
    'openpageblock': ['ie', 'global', 'chrome', 'link'],
    'inputblock': ['form', 'edit', 'input', 'user'],
    'ifelseeblock': ['branches', 'fork', 'switcher', 'apartment'],
    'loop': ['redo', 'sync', 'reload', 'retweet'],
    'python_code': ['code', 'console', 'function', 'experiment'],
    'extractdatablock': ['select', 'filter', 'export', 'table'],
    'clickelementblock': ['mouse', 'click', 'select', 'highlight'],
    'createsessionblock': ['message', 'comment', 'team', 'usergroup-add'],
    'clearcontextblock': ['delete', 'clear', 'rest', 'stop'],
    'sqlblock': ['database', 'console', 'code', 'table'],
    'insertdatablock': ['file-add', 'plus', 'import', 'upload']
  };
  
  if (lowerModuleType in specificMappings) {
    return specificMappings[lowerModuleType];
  }
  
  // 通用匹配
  if (lowerModuleType.includes('session')) {
    return getRecommendedIcons().session;
  } else if (lowerModuleType.includes('data') || lowerModuleType.includes('sql')) {
    return getRecommendedIcons().database;
  } else if (lowerModuleType.includes('code') || lowerModuleType.includes('python')) {
    return getRecommendedIcons().code;
  } else if (lowerModuleType.includes('if') || lowerModuleType.includes('loop')) {
    return getRecommendedIcons().control;
  } else if (lowerModuleType.includes('web') || lowerModuleType.includes('page')) {
    return getRecommendedIcons().web;
  }
  
  // 默认返回基本图标
  return getRecommendedIcons().basic;
}

/**
 * 打印所有可用图标到控制台
 * 开发辅助函数
 */
export function logAvailableIcons() {
  console.log('=== 可用的Ant Design图标 ===');
  
  const outlinedIcons = getAllIconNames('outlined');
  const filledIcons = getAllIconNames('filled');
  const twoToneIcons = getAllIconNames('twotone');
  
  console.log(`共有 ${outlinedIcons.length} 个 Outlined 图标`);
  console.log(`共有 ${filledIcons.length} 个 Filled 图标`);
  console.log(`共有 ${twoToneIcons.length} 个 TwoTone 图标`);
  
  console.log('\n=== 常用图标分类 ===');
  const recommended = getRecommendedIcons();
  Object.keys(recommended).forEach(category => {
    console.log(`${category}: ${recommended[category].join(', ')}`);
  });
} 