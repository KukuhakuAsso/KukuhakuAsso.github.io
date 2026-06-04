<template>
  <article>
    <h1>{{ currentTitle }}</h1>
    <div v-html="currentContent"></div>

    <div style="margin-top: 2rem;">
      <input type="text" v-model.trim="answer" placeholder="输入答案" style="padding: 0.5rem; width: 260px;"
        @keyup.enter="checkAnswer" />
      <button @click="checkAnswer" :disabled="loading" style="padding: 0.5rem 1rem; margin-left: 0.5rem;">
        {{ loading ? '验证中...' : '提交' }}
      </button>
      <p :style="{ color: isSuccess ? 'green' : 'red', marginTop: '0.5rem' }">
        {{ result }}
      </p>
    </div>

    <!-- 通关结束后，弹窗关闭后仍可看到通关图（保留原有展示） -->
    <div v-if="endingImageUrl && gameCompleted" class="ending">
      <img :src="endingImageUrl" alt="恭喜通关" style="max-width: 100%; border-radius: 8px;" />
    </div>

    <!-- 图片弹窗组件 -->
    <ImageView :visible="showImageView" :image-url="currentImageUrl" :title="imageViewTitle" :show-next="showNextButton"
      @close="closeImageView" @next="goToNextLevel" />
  </article>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'                // 新增：路由跳转
import { validateAndNormalize } from '../utils/verifierGuard.js'
import ImageView from './imageView.vue'

const router = useRouter()                           // 新增：路由实例
const apiUrl = import.meta.env.VITE_API_BASE

const props = defineProps({
  level: { type: [String, Number], required: true }
})

// ---------- 弹窗控制 ----------
const showImageView = ref(false)
const currentImageUrl = ref('')
const imageViewTitle = ref('')
const showNextButton = ref(false)

// ---------- 全局累积状态 ----------
const collectedClues = ref([])      // 已获得的所有线索图片 URL
const endingMessage = ref('')       // 通关文字信息
const gameCompleted = ref(false)    // 是否已通关

// ---------- 当前关卡状态 ----------
const answer = ref('')
const result = ref('')
const loading = ref(false)
const isSuccess = ref(false)
const endingImageUrl = ref('')

// 关卡数据
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

// ---------- 方法 ----------
function closeImageView() {
  showImageView.value = false
}

function goToNextLevel() {
  const currentLevel = parseInt(props.level)
  if (currentLevel < 7 && !gameCompleted.value) {
    router.push({ path: `/puzzle/${currentLevel + 1}` })
  }
  showImageView.value = false
}

async function checkAnswer() {
  const raw = validateAndNormalize(answer.value)

  if (!raw.valid) {
    result.value = raw.error
    return
  }

  const raw_data = raw.normalized
  if (!raw_data) {
    result.value = '请输入答案'
    return
  }
  console.log('用户输入:', raw_data)

  // 每次提交前关闭旧的弹窗，避免残留
  showImageView.value = false
  loading.value = true
  result.value = ''
  isSuccess.value = false

  try {
    const url = `${apiUrl}?level=${encodeURIComponent(props.level)}&answer=${encodeURIComponent(raw_data)}`
    console.log('实际请求URL:', url)
    const response = await fetch(url)
    const data = await response.json()

    if (data.downloadUrl) {
      // 获得新线索图片
      result.value = data.message || '🎉 答案正确！'
      isSuccess.value = true
      collectedClues.value.push(data.downloadUrl)

      currentImageUrl.value = data.downloadUrl
      imageViewTitle.value = '🎁 新线索'
      showNextButton.value = parseInt(props.level) < 7   // 最后一关不显示“进入下一关”
      showImageView.value = true
    }
    else if (data.endingImageUrl) {
      // 通关结局
      result.value = data.message || '🎉 恭喜通关！'
      isSuccess.value = true
      endingImageUrl.value = data.endingImageUrl
      endingMessage.value = data.message || ''
      gameCompleted.value = true

      currentImageUrl.value = data.endingImageUrl
      imageViewTitle.value = '🏆 通关'
      showNextButton.value = false
      showImageView.value = true

      // 播放音乐（如果提供）
      if (data.musicUrl) {
        const audio = new Audio(data.musicUrl)
        audio.volume = 0.8
        audio.play().catch(() => { })
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
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
