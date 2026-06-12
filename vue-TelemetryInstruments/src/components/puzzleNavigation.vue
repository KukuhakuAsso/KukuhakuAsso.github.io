<template>
    <div v-if="visible" class="puzzle-nav">
        <button class="nav-btn" :disabled="currentLevel <= 0" @click="$emit('navigate', currentLevel - 1)">
            ← 上一关
        </button>
        <span class="level-indicator">第 {{ currentLevel }} 关</span>
        <button class="nav-btn" :disabled="currentLevel >= maxLevel" @click="$emit('navigate', currentLevel + 1)">
            下一关 →
        </button>
    </div>
</template>

<script setup>
defineProps({
    currentLevel: {
        type: Number,
        required: true,
    },
    maxLevel: {
        type: Number,
        default: Infinity,  // 默认无限制（比如已通关）
    },
    visible: {
        type: Boolean,
        default: true,
    },
})

defineEmits(['navigate'])
</script>

<style scoped>
.puzzle-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin: 1.5rem 0 1rem;
}

.level-indicator {
    font-size: 0.95rem;
    color: var(--text);
    min-width: 60px;
    text-align: center;
}

.nav-btn {
    padding: 6px 14px;
    border: 1px solid var(--border);
    background: var(--social-bg);
    color: var(--text-h);
    border-radius: 6px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.25s;
    font-family: var(--sans);
}

.nav-btn:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
    box-shadow: var(--shadow);
}

.nav-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}
</style>
