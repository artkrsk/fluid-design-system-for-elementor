<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'

interface Props {
  src: string
  caption?: string
}

const props = defineProps<Props>()

const imageSrc = computed(() => {
  return withBase('/images/' + props.src)
})
</script>

<template>
  <figure class="captioned-image">
    <img :src="imageSrc" alt="" data-zoomable />
    <figcaption v-if="caption" v-html="caption"></figcaption>
  </figure>
</template>

<style scoped>
.captioned-image {
  display: block;
  margin: 2em 0 1em;
}

.captioned-image img {
  display: block;
  max-width: 100%;
  height: auto;
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.captioned-image img:hover {
  transform: scale(1.01);
}

.captioned-image figcaption {
  display: block;
  font-size: 85%;
  line-height: 1.5;
  font-style: italic;
  margin-top: 1em;
  color: var(--vp-c-text-2);
}
</style>
