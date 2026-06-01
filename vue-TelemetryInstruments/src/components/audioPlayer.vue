<template>
    <div class="page-container">
        <audio ref="bgMusic" loop preload="auto">
            <source src="@/assets/bgm.mp3" type="audio/mpeg" />
            您的浏览器不支持 audio 元素。
        </audio>

        <h1>音乐自动播放</h1>
        <p>点击页面的任意位置即可触发背景音乐。</p>

        <button @click="togglePlay">
            {{ isPlaying ? '🎵 暂停音乐' : '🔇 播放音乐' }}
        </button>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 获取 audio 元素的引用
const bgMusic = ref(null)
// 记录播放状态
const isPlaying = ref(false)

// 核心播放逻辑
const tryPlayMusic = async () => {
    if (!bgMusic.value) return

    try {
        // play() 返回一个 Promise
        await bgMusic.value.play()
        isPlaying.value = true

        // 播放成功后，代表用户已经授权，可以移除全局的点击监听了
        document.removeEventListener('click', tryPlayMusic)
        document.removeEventListener('touchstart', tryPlayMusic)

    } catch (error) {
        // 如果走到这里，说明被浏览器拦截了
        console.warn('自动播放被浏览器拦截，等待用户点击页面交互：', error.message)
        isPlaying.value = false
    }
}

// 手动切换播放/暂停
const togglePlay = () => {
    if (!bgMusic.value) return

    if (isPlaying.value) {
        bgMusic.value.pause()
        isPlaying.value = false
    } else {
        // 手动点击按钮触发的 play，浏览器绝对不会拦截
        bgMusic.value.play()
        isPlaying.value = true
    }
}

onMounted(() => {
    // 1. 页面挂载后，先尝试直接“霸王硬上弓”播放一次（碰碰运气，万一浏览器允许呢）
    tryPlayMusic()

    // 2. 如果第一步失败了，监听用户的全局点击/触摸事件。
    // 只要用户点了一下页面的任何地方，立刻触发播放。
    document.addEventListener('click', tryPlayMusic)
    document.addEventListener('touchstart', tryPlayMusic)
})

onUnmounted(() => {
    // 组件销毁时清理事件监听，防止内存泄漏
    document.removeEventListener('click', tryPlayMusic)
    document.removeEventListener('touchstart', tryPlayMusic)
})
</script>

<style scoped>
.page-container {
    padding: 20px;
    text-align: center;
}

button {
    margin-top: 20px;
    padding: 10px 20px;
    cursor: pointer;
}
</style>
