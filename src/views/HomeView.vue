<script setup>
</script>

<template>
  <main>
    <a-card title="AutoWeb平台">
      <p>欢迎使用AutoWeb平台，一个可视化工作流自动化工具。</p>
      
      <a-divider />
      
      <a-space>
        <router-link to="/workflow-editor">
          <a-button type="primary">
            <template #icon><apartment-outlined /></template>
            打开工作流编辑器
          </a-button>
        </router-link>
        
        <!-- <router-link to="/about">
          <a-button>
            <template #icon><info-circle-outlined /></template>
            关于
          </a-button>
        </router-link> -->
      </a-space>
    </a-card>
  </main>
</template>

<script>
import { ApartmentOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'

export default {
  components: {
    ApartmentOutlined,
    InfoCircleOutlined
  }
}
</script>

<style scoped>
main {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 2rem;
}
</style>
