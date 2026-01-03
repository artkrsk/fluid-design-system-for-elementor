<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  src: string
  poster?: string
  title?: string
}>()

const videoRef = ref<HTMLVideoElement>()
</script>

<template>
  <div class="video-player">
    <video
      ref="videoRef"
      :src="src"
      :poster="poster"
      controls
      :aria-label="title || 'Video tutorial'"
    >
      Your browser does not support video playback.
    </video>
    <p v-if="title" class="video-caption">{{ title }}</p>
  </div>
</template>

<style scoped>
.video-player {
  margin: 2rem 0;
}

.video-player video {
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.video-caption {
  text-align: center;
  font-size: 0.9em;
  color: var(--vp-c-text-2);
  margin-top: 0.5rem;
}
</style>
