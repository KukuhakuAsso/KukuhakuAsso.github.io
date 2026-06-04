<template>
    <audio ref="bgMusic" loop preload="auto">
        <source src="@/assets/bgm.mp3" type="audio/mpeg" />
        您的浏览器不支持 audio 元素。
    </audio>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const bgMusic = ref(null)
const isPlaying = ref(false)

const tryPlayMusic = async () => {
    if (!bgMusic.value) return
    try {
        await bgMusic.value.play()
        isPlaying.value = true
        document.removeEventListener('click', tryPlayMusic)
        document.removeEventListener('touchstart', tryPlayMusic)
    } catch (error) {
        console.warn('自动播放被浏览器拦截，等待用户点击页面交互：', error.message)
        isPlaying.value = false
    }
}

const togglePlay = () => {
    if (!bgMusic.value) return
    if (isPlaying.value) {
        bgMusic.value.pause()
        isPlaying.value = false
    } else {
        bgMusic.value.play()
        isPlaying.value = true
    }
}

onMounted(() => {
    tryPlayMusic()
    document.addEventListener('click', tryPlayMusic)
    document.addEventListener('touchstart', tryPlayMusic)
})

onUnmounted(() => {
    document.removeEventListener('click', tryPlayMusic)
    document.removeEventListener('touchstart', tryPlayMusic)
})

// 必须向外暴露出这两个属性/方法，供父组件 App.vue 追踪与控制
defineExpose({
    isPlaying,
    togglePlay
})
</script>
