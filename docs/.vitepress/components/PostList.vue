<template>
    <div class="post-list">
        <a v-for="post in filteredPosts" :key="post.url" :href="post.url" class="post-item">
            <span class="date">{{ post.date }}</span>
            <span class="title">{{ post.title }}</span>
        </a>

        <div v-if="filteredPosts.length === 0" class="empty-tips">
            [ 档案库暂无该权限级别的记录... ]
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { data as allPosts } from './posts.data.mjs'

// 定义外部传入的参数，使用户可以指定要渲染的分类
const props = defineProps({
    category: {
        type: String,
        required: true
    }
})

// 根据 Markdown 传入的 category 动态过滤文章
const filteredPosts = computed(() => {
    return allPosts.filter(p => p.category === props.category)
})
</script>

<style scoped>

.post-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 24px;
}

.post-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    background-color: var(--vp-c-bg-soft);
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    text-decoration: none !important;
    transition: all 0.25s;
}

.post-item:hover {
    border-color: var(--vp-c-brand-1);
    background-color: var(--vp-c-bg-alt);
    transform: translateX(4px);
}

.date {
    font-family: monospace;
    color: var(--vp-c-text-2);
    font-size: 0.9em;
}

.title {
    font-weight: 600;
    color: var(--vp-c-text-1);
}

.empty-tips {
    color: var(--vp-c-text-3);
    font-style: italic;
    font-family: monospace;
    padding: 12px 0;
}
</style>
