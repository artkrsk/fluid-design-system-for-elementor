import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import PluginName from './components/PluginName.vue'
import VideoPlayer from './components/VideoPlayer.vue'
import ScreenshotGallery from './components/ScreenshotGallery.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    // Register global components
    app.component('PluginName', PluginName)
    app.component('VideoPlayer', VideoPlayer)
    app.component('ScreenshotGallery', ScreenshotGallery)
  }
}
