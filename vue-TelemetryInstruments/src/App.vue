<script setup>
import { ref, onMounted, watchEffect } from 'vue'
import Header from './components/header.vue' 
import AudioPlayer from './components/audioPlayer.vue'

// 引用全局唯一的 AudioPlayer 组件实例
const audioPlayerRef = ref(null)

// 全局状态
const isBgmPlaying = ref(false)
const isDark = ref(false)

// 初始化夜间模式（优先读取 localStorage，其次跟随系统偏好）
onMounted(() => {
  const saved = localStorage.getItem('darkMode')
  if (saved === 'true' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
})

// 实时响应：同步 AudioPlayer 内部的真实播放状态到全局变量
watchEffect(() => {
  isBgmPlaying.value = audioPlayerRef.value?.isPlaying ?? false
})

// 桥接方法：切换 BGM 播放状态
function toggleBgm() {
  audioPlayerRef.value?.togglePlay()
}

// 桥接方法：切换夜间模式
function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('darkMode', isDark.value.toString())
}
</script>

<template>
  <div id="app" :class="{ dark: isDark }">
    <Header :is-bgm-playing="isBgmPlaying" :is-dark="isDark" @toggle-bgm="toggleBgm" @toggle-dark="toggleDark" />

    <AudioPlayer ref="audioPlayerRef" />

    <router-view />
  </div>
</template>
