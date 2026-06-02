<template>
  <article>
    <h1>{{ currentTitle }}</h1>
    <div v-html="currentContent"></div>

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
import { ref, computed } from 'vue'

const props = defineProps({
  level: { type: [String, Number], required: true }
})

// 状态
const answer = ref('')
const result = ref('')
const loading = ref(false)
const isSuccess = ref(false)
const endingImageUrl = ref('')

// ********** 替换成你的云函数 URL **********
const apiUrl = 'https://1438673597-gggz8ep6r6.ap-shanghai.tencentscf.com'

// 所有关卡的标题和描述（你可以随时修改文案）
const puzzleData = {
  1: {
    title: '一切的开始',
    content: '<p>欢迎，侦探。请输入起始指令来获得第一条线索。</p>'
  },
  2: {
    title: '谜题一',
    content: '<p>你打开 TI01，看到一幅星图……<br>（此处替换为你的谜题描述）</p>'
  },
  3: {
    title: '谜题二',
    content: '<p>TI02 中夹着一张旧报纸……</p>'
  },
  4: {
    title: '谜题三',
    content: '<p>TI03 显示了一段摩斯码……</p>'
  },
  5: {
    title: '谜题四',
    content: '<p>TI04 是一串化学元素符号……</p>'
  },
  6: {
    title: '谜题五',
    content: '<p>TI05 是一张褪色的照片……</p>'
  },
  7: {
    title: '最终谜题',
    content: '<p>你已经接近真相。输入最后的答案，揭开一切。</p>'
  }
}

const currentTitle = computed(() => puzzleData[props.level]?.title || '未知关卡')
const currentContent = computed(() => puzzleData[props.level]?.content || '<p>关卡数据缺失</p>')

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
      // 第1~6关：自动下载文件
      result.value = data.message || '🎉 答案正确，正在下载...'
      isSuccess.value = true
      setTimeout(() => {
        window.location.href = data.downloadUrl
      }, 1000)
    } else if (data.endingImageUrl) {
      // 第7关：显示结束图 + 播放音乐
      result.value = data.message || '🎉 恭喜通关！'
      isSuccess.value = true
      endingImageUrl.value = data.endingImageUrl
      if (data.musicUrl) {
        const audio = new Audio(data.musicUrl)
        audio.volume = 0.8
        audio.play().catch(() => {})
      }
    } else {
      // 答案错误
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
