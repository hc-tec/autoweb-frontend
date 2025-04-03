/**
 * 大模块（宏）工作流处理工具
 * 用于处理工作流中的大模块节点，获取真实工作流数据
 */

// 调试开关
const DEBUG_MACRO_MODULE = true;

/**
 * 记录调试日志
 * @param {string} message - 日志消息
 * @param {any} data - 附加数据
 */
function logDebug(message, data = null) {
  if (DEBUG_MACRO_MODULE) {
    console.log(`[宏模块] ${message}`, data !== null ? data : '');
  }
}

/**
 * 展开工作流中的大模块
 * @param {Object} workflowJson - 工作流JSON数据
 * @returns {Promise<Object>} - 展开后的工作流JSON数据
 */
export async function expandMacroModules(workflowJson) {
  // 如果没有传入工作流数据，直接返回
  if (!workflowJson || !workflowJson.modules) {
    console.warn('工作流数据不完整，无法展开大模块');
    return workflowJson;
  }

  logDebug('开始展开大模块，原始工作流数据:', workflowJson);

  // 深拷贝工作流数据，避免修改原始数据
  const expandedWorkflow = JSON.parse(JSON.stringify(workflowJson));

  try {
    // 递归处理所有模块，找到并展开workflow类型的节点
    expandedWorkflow.modules = await expandModulesRecursively(expandedWorkflow.modules);
    logDebug('大模块展开完成', expandedWorkflow);
  } catch (error) {
    console.error('展开大模块过程中发生错误:', error);
  }

  return expandedWorkflow;
}

/**
 * 递归处理模块列表，展开大模块
 * @param {Array} modules - 模块列表
 * @returns {Promise<Array>} - 展开后的模块列表
 */
async function expandModulesRecursively(modules) {
  if (!Array.isArray(modules)) {
    return modules;
  }

  // 创建新的模块数组，用于存储展开后的模块
  const expandedModules = [];

  // 处理每个模块
  for (const module of modules) {
    // 特殊处理DynamicInputNode类型的节点，确保输入参数直接映射到输出
    if (module.module_type === 'DynamicInputNode') {
      logDebug(`处理动态输入节点: ${module.meta?.title || module.module_id}`, module);
      
      // 确保输入定义和输出定义一致
      if (module.inputs && module.inputs.input_defs) {
        // 创建相同的输出定义
        if (!module.outputs) {
          module.outputs = {};
        }
        
        module.outputs.output_defs = JSON.parse(JSON.stringify(module.inputs.input_defs));
        
        logDebug(`动态输入节点处理完成，输出定义:`, module.outputs.output_defs);
      }
      
      // 添加处理后的动态输入节点
      expandedModules.push(module);
    }
    // 如果是workflow类型的节点，需要获取真实工作流数据
    else if (module.module_type === 'workflow' && module.workflow_id) {
      logDebug(`发现工作流节点: ${module.meta?.title || module.workflow_id}`, module);
      try {
        // 获取大模块的真实工作流
        const workflowModule = await fetchWorkflowById(module.workflow_id);
        
        if (workflowModule) {
          logDebug(`成功获取工作流 ${module.workflow_id} 的真实数据:`, workflowModule);
          
          // 保留原始模块的位置信息和元数据
          if (module.position) {
            workflowModule.position = module.position;
          }
          
          // 合并输入输出定义，确保与原始节点接口一致
          workflowModule.inputs = module.inputs;
          workflowModule.outputs = module.outputs;
          
          // 如果工作流模块没有module_id，使用原始模块的ID
          if (!workflowModule.module_id && module.module_id) {
            workflowModule.module_id = module.module_id;
          }
          
          // 添加展开后的模块
          expandedModules.push(workflowModule);
        } else {
          console.warn(`无法获取工作流 ${module.workflow_id} 的数据，使用原始模块`);
          expandedModules.push(module);
        }
      } catch (error) {
        console.error(`展开工作流 ${module.workflow_id} 失败:`, error);
        // 如果获取失败，保留原始模块
        expandedModules.push(module);
      }
    } else {
      // 递归处理非workflow节点的slot中的模块
      if (module.slots) {
        for (const slotName in module.slots) {
          if (Object.prototype.hasOwnProperty.call(module.slots, slotName)) {
            try {
              // 递归展开slot中的模块
              const expandedSlot = await expandModulesRecursively([module.slots[slotName]]);
              if (expandedSlot && expandedSlot.length > 0) {
                module.slots[slotName] = expandedSlot[0];
              }
            } catch (error) {
              console.error(`处理插槽 ${slotName} 时发生错误:`, error);
            }
          }
        }
      }
      
      // 添加处理后的非workflow节点
      expandedModules.push(module);
    }
  }

  return expandedModules;
}

/**
 * 获取指定ID的工作流数据
 * @param {string} workflowId - 工作流ID
 * @returns {Promise<Object|null>} - 工作流数据
 */
async function fetchWorkflowById(workflowId) {
  logDebug(`开始获取工作流数据: ${workflowId}`);
  try {
    // 从服务器获取工作流数据
    const response = await fetch(`/example/${workflowId}.json`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const workflowData = await response.json();
    logDebug(`成功获取工作流数据: ${workflowId}`, workflowData);
    return workflowData;
  } catch (error) {
    console.error(`获取工作流 ${workflowId} 失败:`, error);
    return null;
  }
} 