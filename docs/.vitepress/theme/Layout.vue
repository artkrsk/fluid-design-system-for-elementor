<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { onMounted, watch, nextTick, ref } from 'vue'
import { useRoute } from 'vitepress'
import mediumZoom from 'medium-zoom'

const { Layout } = DefaultTheme
const route = useRoute()

// Video lightbox state
const isVideoLightboxOpen = ref(false)
const currentVideoSrc = ref('')

const initZoom = () => {
  // Initialize medium-zoom for all images with data-zoomable attribute
  mediumZoom('[data-zoomable]', {
    background: 'var(--vp-c-bg)',
  })
}

const initVideoLightbox = () => {
  // Find all videos with data-lightbox attribute and add click handlers
  const videos = document.querySelectorAll('video[data-lightbox]')
  videos.forEach((video) => {
    const videoEl = video as HTMLVideoElement

    // Add pointer cursor
    videoEl.style.cursor = 'pointer'

    // Remove existing listener to avoid duplicates
    const newVideo = videoEl.cloneNode(true) as HTMLVideoElement
    videoEl.parentNode?.replaceChild(newVideo, videoEl)

    // Add click handler
    newVideo.addEventListener('click', (e) => {
      e.preventDefault()
      currentVideoSrc.value = newVideo.src
      isVideoLightboxOpen.value = true
    })
  })
}

const closeLightbox = () => {
  isVideoLightboxOpen.value = false
  currentVideoSrc.value = ''
}

const handleBackdropClick = (e: MouseEvent) => {
  if ((e.target as HTMLElement).classList.contains('video-lightbox-backdrop')) {
    closeLightbox()
  }
}

onMounted(() => {
  initZoom()
  initVideoLightbox()

  // Handle escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isVideoLightboxOpen.value) {
      closeLightbox()
    }
  })
})

// Re-initialize on route changes (for SPA navigation)
watch(
  () => route.path,
  () => nextTick(() => {
    initZoom()
    initVideoLightbox()
  })
)
</script>

<template>
  <Layout />

  <!-- Video Lightbox Modal -->
  <Transition name="lightbox-fade">
    <div
      v-if="isVideoLightboxOpen"
      class="video-lightbox-backdrop"
      @click="handleBackdropClick"
    >
      <button class="video-lightbox-close" @click="closeLightbox">×</button>
      <div class="video-lightbox-content">
        <video
          :src="currentVideoSrc"
          controls
          autoplay
          playsinline
          class="video-lightbox-video"
        >
          Your browser doesn't support HTML5 video.
        </video>
      </div>
    </div>
  </Transition>
</template>

<style>
.video-lightbox-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--vp-c-bg);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.video-lightbox-close {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: var(--vp-c-text-1);
  font-size: 3rem;
  line-height: 1;
  cursor: pointer;
  padding: 0.5rem;
  z-index: 10000;
  transition: opacity 0.2s;
}

.video-lightbox-close:hover {
  opacity: 0.7;
}

.video-lightbox-content {
  max-width: 90vw;
  max-height: 90vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-lightbox-video {
  max-width: 100%;
  max-height: 90vh;
  width: auto;
  height: auto;
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.lightbox-fade-enter-active,
.lightbox-fade-leave-active {
  transition: opacity 0.3s ease;
}

.lightbox-fade-enter-from,
.lightbox-fade-leave-to {
  opacity: 0;
}
</style>
