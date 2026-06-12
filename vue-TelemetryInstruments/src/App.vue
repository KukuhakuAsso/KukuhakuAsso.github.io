<template>
  <div id="app" :class="{ dark: isDark }">
    <Header :is-bgm-playing="isBgmPlaying" :is-dark="isDark" @toggle-bgm="toggleBgm" />
    <AudioPlayer ref="audioPlayerRef" />
    <router-view />
  </div>
</template>

<script setup>
import { ref, onMounted, watchEffect, provide } from 'vue'
import Header from './components/header.vue'
import AudioPlayer from './components/audioPlayer.vue'

const volume = ref(0.75)               // 音量
const audioPlayerRef = ref(null)
const isBgmPlaying = ref(false)
const isDark = ref(false)

// 开启 BGM 并播放（供 Header 拖动滑块时调用）
function playBgm() {
  isBgmPlaying.value = true
  audioPlayerRef.value?.play()
}

// 切换 BGM 播放/暂停
function toggleBgm() {
  isBgmPlaying.value = !isBgmPlaying.value
  if (isBgmPlaying.value) {
    audioPlayerRef.value?.play()
  } else {
    audioPlayerRef.value?.pause()
  }
}

// 变更 BGM
function changeBgm(musicData) {
  audioPlayerRef.value?.changePlayMusic(musicData)
}

// 初始化夜间模式
onMounted(() => {
  const saved = localStorage.getItem('darkMode')
  if (saved === 'true' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
})

// 同步播放状态
watchEffect(() => {
  isBgmPlaying.value = audioPlayerRef.value?.isPlaying ?? false
})

// 依赖注入
provide('changeBgm', changeBgm)
provide('isBgmPlaying', isBgmPlaying)
provide('volume', volume)
provide('playBgm', playBgm)      // 让 Header 可以开启 BGM
</script>

