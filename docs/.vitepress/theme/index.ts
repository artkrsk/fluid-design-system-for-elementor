import DefaultTheme from 'vitepress/theme'
import CaptionedImage from './components/CaptionedImage.vue'
import CaptionedVideo from './components/CaptionedVideo.vue'
import PluginName from './components/PluginName.vue'
import ScreenshotGallery from './components/ScreenshotGallery.vue'
import VideoPlayer from './components/VideoPlayer.vue'
import Layout from './Layout.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    // Register global components
    app.component('CaptionedVideo', CaptionedVideo)
    app.component('CaptionedImage', CaptionedImage)
    app.component('PluginName', PluginName)
    app.component('VideoPlayer', VideoPlayer)
    app.component('ScreenshotGallery', ScreenshotGallery)
  }
}
