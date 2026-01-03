<script setup lang="ts">
import { useData } from 'vitepress'

const { site } = useData()
</script>

<template>
  <span class="plugin-name">{{ site.title }}</span>
</template>

<style scoped>
.plugin-name {
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-brand-1);
  font-weight: 500;
}
</style>
