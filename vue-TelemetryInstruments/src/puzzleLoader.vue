<template>
  <article>
    <h1>{{ title }}</h1>
    <!-- 谜题描述支持 HTML -->
    <div v-html="content"></div>

    <div style="margin-top: 2rem;">
      <input
        type="text"
        v-model.trim="answer"
        placeholder="输入答案"
        style="padding: 0.5rem; width: 260px;"
        @keyup.enter="checkAnswer"
      />
      <button
        @click="checkAnswer"
        :disabled="loading"
        style="padding: 0.5rem 1rem; margin-left: 0.5rem;"
      >
        {{ loading ? '验证中...' : '提交' }}
      </button>
      <p :style="{ color: isSuccess ? 'green' : 'red', marginTop: '0.5rem' }">
        {{ result }}
      </p>
    </div>

    <!-- 第六关通关结束图 -->
    <div v-if="endingImageUrl" class="ending">
      <img :src="endingImageUrl" alt="恭喜通关" style="max-width: 100%; border-radius: 8px;" />
    </div>
  </article>
</template>

<script setup>
import { ref } from 'vue'

// 父组件（或路由）传入的谜题数据
const props = defineProps({
  title: { type: String, required: true },
  content: { type: String, required: true },   // 谜题描述，可以是 HTML 字符串
  level: { type: [String, Number], required: true }
})

// 状态
const answer = ref('')
const result = ref('')
const loading = ref(false)
const isSuccess = ref(false)
const endingImageUrl = ref('')

// ********** 这里替换成你的真实云函数 URL **********
const apiUrl = 'https://1438673597-0z3hiqb0be.ap-shanghai.tencentscf.com'

async function checkAnswer() {
  const raw = answer.value.trim()
  if (!raw) {
    result.value = '请输入答案'
    return
  }

  loading.value = true
  result.value = ''
  isSuccess.value = false

  try {
    // 拼接请求 URL：level 和 answer 作为查询参数
    const url = `${apiUrl}?level=${encodeURIComponent(props.level)}&answer=${encodeURIComponent(raw)}`
    const response = await fetch(url)
    const data = await response.json()

    // 判断是否成功（有 downloadUrl 表示 1-5 关，或者 endingImageUrl 表示第 6 关）
    if (data.downloadUrl) {
      // 第 1~5 关：有文件下载
      result.value = data.message || '🎉 答案正确，正在下载...'
      isSuccess.value = true

      // 延迟 1 秒开始下载，让玩家看到成功提示
      setTimeout(() => {
        window.location.href = data.downloadUrl
      }, 1000)
    } else if (data.endingImageUrl) {
      // 第 6 关：无下载，显示结束图 + 播放音乐
      result.value = data.message || '🎉 恭喜通关！'
      isSuccess.value = true
      endingImageUrl.value = data.endingImageUrl

      // 播放音乐（如果返回了 musicUrl）
      if (data.musicUrl) {
        const audio = new Audio(data.musicUrl)
        audio.volume = 0.8
        audio.play().catch(() => {
          // 如果自动播放被浏览器阻止，可以静默失败
          console.log('自动播放被阻止，请点击页面任意位置后重试')
        })
      }
    } else {
      // 答案错误或其它情况
      result.value = data.message || '答案错误，请再试试。'
    }
  } catch (error) {
    result.value = '网络错误，请检查网络后重试'
    console.error('请求失败：', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.ending {
  margin-top: 30px;
  animation: fadeIn 1s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
