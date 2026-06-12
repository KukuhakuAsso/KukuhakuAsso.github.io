<template>
    <header class="app-header">
        <a :href="homeUrl" class="logo-group" title="返回首页">
            <span class="logo-text">空白组</span>
        </a>

        <div class="controls">
            <button class="icon-btn" @click="$emit('toggle-bgm')">
                {{ isBgmPlaying ? '🎵 BGM: 开' : '🔇 BGM: 关' }}
            </button>

            <!-- 音量控制：滑块 + 滚轮 -->
            <div class="volume-control" @wheel.prevent="onVolumeWheel">
                <input type="range" min="0" max="1" step="0.01" v-model="sliderVolume" class="volume-slider" />
            </div>

            <button class="icon-btn" @click="toggleDark()">
                {{ isDark ? '🌙 深色' : '🌞 浅色' }}
            </button>
        </div>
    </header>
</template>

<script setup>
import { inject, computed } from 'vue'
import { useDark, useToggle } from '@vueuse/core'

defineProps({
    isBgmPlaying: Boolean,
    isDark: Boolean
})
defineEmits(['toggle-bgm'])

// 注入全局状态和方法
const volume = inject('volume')
const isBgmPlaying = inject('isBgmPlaying')
const playBgm = inject('playBgm')

// 滑块绑定的计算属性
const sliderVolume = computed({
    get: () => isBgmPlaying.value ? volume.value : 0,
    set: (val) => {
        volume.value = val
        // 如果 BGM 处于关闭状态，且用户拖到了大于 0 的位置 → 自动开启并播放
        if (!isBgmPlaying.value && val > 0) {
            playBgm()
        }
    }
})

// 滚轮调节音量
function onVolumeWheel(e) {
    const delta = e.deltaY > 0 ? -0.05 : 0.05

    // 如果 BGM 处于关闭状态，滚轮改变了音量（>0） → 自动开启并播放
    if (!isBgmPlaying.value && delta > 0) {
        const newVal = Math.min(1, Math.max(0, 0 + delta))
        volume.value = Math.round(newVal * 100) / 100
        playBgm()
    }

    const newVal = Math.min(1, Math.max(0, volume.value + delta))
    volume.value = Math.round(newVal * 100) / 100


}

const toggleDark = useToggle(useDark({
    selector: 'html',
    attribute: 'class',
    valueDark: 'dark',
    valueLight: 'light',
    storageKey: null,
}))

const homeUrl = import.meta.env.VITE_HOME_URL || '/'
</script>

<style scoped>
.app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-bottom: 1px solid var(--border);
    background: var(--bg);
    transition: background 0.3s, border-color 0.3s;
}

.logo-group {
    text-decoration: none;
    cursor: pointer;
}

.logo-text {
    font-family: var(--heading);
    font-size: 22px;
    font-weight: bold;
    color: var(--text-h);
    transition: color 0.3s;
}

.logo-group:hover .logo-text {
    color: var(--accent);
}

.controls {
    display: flex;
    gap: 12px;
    align-items: center;
}

.icon-btn {
    padding: 6px 12px;
    border: 1px solid var(--border);
    background-color: var(--social-bg);
    color: var(--text-h);
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s;
    font-family: var(--sans);
}

.icon-btn:hover {
    box-shadow: var(--shadow);
    border-color: var(--accent-border);
    color: var(--accent);
}

.volume-control {
    display: flex;
    align-items: center;
}

.volume-slider {
    width: 100px;
    height: 24px;
    cursor: pointer;
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    margin: 0 4px;
}

.volume-slider::-webkit-slider-runnable-track {
    height: 4px;
    background: var(--border);
    border-radius: 2px;
}

.volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: var(--accent);
    border-radius: 50%;
    margin-top: -6px;
    cursor: pointer;
}

.volume-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: var(--accent);
    border-radius: 50%;
    border: none;
    cursor: pointer;
}
</style>
