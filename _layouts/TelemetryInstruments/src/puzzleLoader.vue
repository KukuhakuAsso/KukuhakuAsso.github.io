<template>
    <article>
        <h1>{{ title }}</h1>
        <div v-html="content"></div>

        <div style="margin-top: 2rem;">
            <input type="text" v-model.trim="answer" placeholder="输入答案" style="padding: 0.5rem; width: 200px;" />
            <button @click="checkAnswer" :disabled="loading" style="padding: 0.5rem 1rem;">
                {{ loading ? '验证中...' : '提交' }}
            </button>
            <p v-if="result" style="color: red; margin-top: 0.5rem;">
                {{ result }}
            </p>
        </div>
    </article>
</template>

<script setup>
import { ref } from 'vue'

// 接收父组件传入的谜题数据（对应 Jekyll 的 front matter 和内容）
const props = defineProps({
    title: { type: String, required: true },
    content: { type: String, required: true },  // HTML 字符串
    level: { type: [String, Number], required: true }
})

const answer = ref('')
const result = ref('')
const loading = ref(false)

// 替换为你实际的云函数触发地址
const apiUrl = 'https://your-cloud-function-url.com/verify'

async function checkAnswer() {
    const ans = answer.value
    if (!ans) {
        result.value = '请输入答案'
        return
    }

    loading.value = true
    result.value = ''

    try {
        const fullUrl = `${apiUrl}?level=${encodeURIComponent(props.level)}&answer=${encodeURIComponent(ans)}`
        const response = await fetch(fullUrl, { redirect: 'follow' })

        if (response.status === 403) {
            result.value = '答案错误，请再试试'
        } else if (response.redirected) {
            // 云函数返回 302 重定向到 COS 下载链接，浏览器直接跳转
            window.location.href = response.url
        } else {
            result.value = '发生未知错误，请稍后重试'
        }
    } catch (error) {
        result.value = '网络错误，请检查网络后重试'
    } finally {
        loading.value = false
    }
}
</script>
