<template>
    <div class="home-container">
        <div class="content">
            <h1 class="title">🕵️ 侦探谜题</h1>
            <p class="subtitle">一串神秘的线索等待着你……</p>
            <button class="start-btn" @click="startGame">开始探索</button>
        </div>
        <div class="decoration">
            <!-- 可以放一些装饰性元素，如图标、线条等 -->
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

function startGame() {
    router.push('/puzzle/1')
}
</script>

<style scoped>
.home-container {
    min-height: 80vh;
    padding: 4rem 2rem 2rem 2rem;
    /* 顶部留出更多空间，内容偏上 */
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    /* 内容左对齐 */
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    position: relative;
    overflow: hidden;
}

.content {
    max-width: 600px;
    margin-top: 2rem;
    margin-left: 5vw;
    /* 不要完全贴边，稍微有点左侧距离 */
}

.title {
    font-size: 3rem;
    margin-bottom: 0.5rem;
    color: #2c3e50;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.subtitle {
    font-size: 1.3rem;
    color: #555;
    margin-bottom: 2rem;
    line-height: 1.6;
}

.start-btn {
    padding: 1rem 2.5rem;
    font-size: 1.2rem;
    background-color: #2c3e50;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    align-self: flex-start;
    /* 按钮不拉伸 */
}

.start-btn:hover {
    background-color: #1a252f;
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

/* 装饰性元素，让页面更生动 */
.decoration {
    position: absolute;
    right: 10%;
    bottom: 20%;
    display: flex;
    gap: 1rem;
}

.dot {
    width: 12px;
    height: 12px;
    background: rgba(44, 62, 80, 0.3);
    border-radius: 50%;
    animation: pulse 2s infinite alternate;
}

.dot:nth-child(2) {
    animation-delay: 0.5s;
}

.dot:nth-child(3) {
    animation-delay: 1s;
}

@keyframes pulse {
    from {
        transform: scale(1);
        opacity: 0.3;
    }

    to {
        transform: scale(1.5);
        opacity: 0.8;
    }
}

/* 响应式调整 */
@media (max-width: 600px) {
    .home-container {
        padding: 2rem 1rem;
        align-items: center;
    }

    .content {
        margin-left: 0;
        text-align: center;
    }

    .start-btn {
        align-self: center;
    }

    .decoration {
        display: none;
    }
}
</style>
