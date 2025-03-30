<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
  <a-config-provider
    :theme="{
      token: {
        colorPrimary: '#00b96b',
      },
    }"
  >
    <a-button />
  </a-config-provider>
</template>

<style scoped>

</style>
