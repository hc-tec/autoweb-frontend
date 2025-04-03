<template>
  <div class="simple-schema-editor">
    <div class="param-table">
      <div class="param-row">
        <div class="param-name-col">简单类型:</div>
        <div class="param-type-col">
          <a-select 
            class="param-select" 
            v-model:value="localType"
            @change="handleTypeChange"
            size="middle"
            :dropdown-match-select-width="false"
          >
            <a-select-option value="string">str. String</a-select-option>
            <a-select-option value="integer">num. Number</a-select-option>
            <a-select-option value="boolean">bool. Boolean</a-select-option>
            <a-select-option value="any">* Any</a-select-option>
          </a-select>
        </div>
        <div class="param-actions-col"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue';

const props = defineProps({
  type: {
    type: String,
    required: true,
    default: 'string'
  }
});

const emit = defineEmits(['update']);

// 本地状态
const localType = ref(props.type);

// 监听props变化
watch(() => props.type, (newType) => {
  localType.value = newType;
}, { immediate: true });

// 类型变更处理
const handleTypeChange = (newType) => {
  localType.value = newType;
  emit('update', newType);
};
</script>

<style scoped>
.simple-schema-editor {
  margin-bottom: 12px;
}

.param-table {
  width: 100%;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
}

.param-row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.param-name-col {
  flex: 3;
  display: flex;
  align-items: center;
}

.param-type-col {
  flex: 2;
  padding: 0 8px;
}

.param-actions-col {
  flex: 1;
  text-align: right;
}

.param-select {
  flex: 1;
  height: 30px;
  font-size: 12px;
}
</style> 