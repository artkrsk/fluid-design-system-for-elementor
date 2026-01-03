<script setup lang="ts">
const props = defineProps<{
  images: Array<{
    src: string
    alt: string
    caption?: string
  }>
}>()
</script>

<template>
  <div class="screenshot-gallery">
    <div
      v-for="(image, index) in images"
      :key="index"
      class="screenshot-item"
    >
      <img
        :src="image.src"
        :alt="image.alt"
        loading="lazy"
      />
      <p v-if="image.caption" class="screenshot-caption">
        {{ image.caption }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.screenshot-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}

.screenshot-item img {
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: zoom-in;
  transition: transform 0.2s ease;
}

.screenshot-item img:hover {
  transform: translateY(-2px);
}

.screenshot-caption {
  text-align: center;
  font-size: 0.9em;
  color: var(--vp-c-text-2);
  margin-top: 0.5rem;
}
</style>
