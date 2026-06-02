<!-- docs/.vitepress/components/HiddenText.vue -->
<template>
    <span class="arg-hidden-text" title="这是一段被隐藏的电波...">
        <!-- slot 会把你在 Markdown 里写的文字自动嵌进来 -->
        <slot></slot>
    </span>
</template>

<style scoped>
.arg-hidden-text {
    /* 使用透明色完美融入任何背景（包括卡片、引用框等） */
    color: transparent;
    /* 鼠标悬浮时变为文本光标，给敏锐的玩家一点点暗示 */
    cursor: text;
    /* 禁止文本的任何默认阴影或下划线暴露行踪 */
    text-shadow: none;
}

/* 当玩家用鼠标高亮选中这段文字时触发的样式 */
.arg-hidden-text::selection,
.arg-hidden-text *::selection {
    /* 背景色变成 VitePress 主题的强调色（通常是紫色/蓝色） */
    background-color: var(--vp-c-brand-1);
    /* 文字变成主背景色，产生强烈的反差可见效果 */
    color: var(--vp-c-bg);
}
</style>
