<script setup lang="ts">
import { computed } from "vue";
import { withBase } from "vitepress";

interface Props {
  src: string;
  caption?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  autoplay: false,
  loop: false,
  muted: false,
});

const videoSrc = computed(() => {
  return withBase("/videos/" + props.src);
});
</script>

<template>
  <figure class="captioned-video">
    <video
      :src="videoSrc"
      controls
      :autoplay="autoplay"
      :loop="loop"
      :muted="muted"
      playsinline
      data-lightbox
    >
      Your browser doesn't support HTML5 video.
    </video>
    <figcaption v-if="caption" v-html="caption"></figcaption>
  </figure>
</template>

<style scoped>
.captioned-video {
  display: block;
  margin: 2em 0 1em;
}

.captioned-video video {
  display: block;
  width: 100%;
  max-width: 800px;
  height: auto;
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.captioned-video video:hover {
  transform: scale(1.01);
}

.captioned-video figcaption {
  display: block;
  font-size: 85%;
  line-height: 1.5;
  font-style: italic;
  margin-top: 1em;
  color: var(--vp-c-text-2);
}
</style>
