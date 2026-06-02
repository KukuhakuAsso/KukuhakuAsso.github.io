<template>
  <article>
    <h1>{{ title }}</h1>
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

    <!-- 第七关通关结束图 -->
    <div v-if="endingImageUrl" class="ending">
      <img :src="endingImageUrl" alt="恭喜通关" style="max-width: 100%; border-radius: 8px;" />
    </div>
  </article>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  content: { type: String, required: true },
  level: { type: [String, Number], required: true }
})

const answer = ref('')
const result = ref('')
const loading = ref(false)
const isSuccess = ref(false)
const endingImageUrl = ref('')

// 替换成你的云函数 URL
const apiUrl = 'https://你的函数ID.scf.地域.tencentcloudapi.com'

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
    const url = `${apiUrl}?level=${encodeURIComponent(props.level)}&answer=${encodeURIComponent(raw)}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.downloadUrl) {
      result.value = data.message || '🎉 答案正确，正在下载...'
      isSuccess.value = true
      setTimeout(() => {
        window.location.href = data.downloadUrl
      }, 1000)
    } else if (data.endingImageUrl) {
      result.value = data.message || '🎉 恭喜通关！'
      isSuccess.value = true
      endingImageUrl.value = data.endingImageUrl
      if (data.musicUrl) {
        const audio = new Audio(data.musicUrl)
        audio.volume = 0.8
        audio.play().catch(() => {})
      }
    } else {
      result.value = data.message || '答案错误，请再试试。'
    }
  } catch (error) {
    result.value = '网络错误，请检查网络后重试'
    console.error(error)
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
