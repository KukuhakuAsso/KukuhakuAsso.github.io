<template>
    <header class="app-header">
        <a :href="homeUrl" class="logo-group" title="返回首页">
            <span class="logo-text">空白组</span>
        </a>

        <div class="controls">
            <button class="icon-btn" @click="$emit('toggle-bgm')">
                {{ isBgmPlaying ? '🎵 BGM: 开' : '🔇 BGM: 关' }}
            </button>
            <button class="icon-btn" @click="$emit('toggle-dark')">
                {{ isDark ? '🌙 夜间' : '🌞 浅色' }}
            </button>
        </div>
    </header>
</template>

<script setup>
import { computed } from 'vue'


// 接收来自 App.vue 的状态
defineProps({
    isBgmPlaying: {
        type: Boolean,
        required: true
    },
    isDark: {
        type: Boolean,
        required: true
    }
})

// 声明向外派发的事件
defineEmits(['toggle-bgm', 'toggle-dark'])

// 💡 动态获取环境变量，如果未定义则兜底到 "/"
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

/* 首页跳转样式 */
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

/* 右侧按钮组样式 */
.controls {
    display: flex;
    gap: 12px;
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
</style>
