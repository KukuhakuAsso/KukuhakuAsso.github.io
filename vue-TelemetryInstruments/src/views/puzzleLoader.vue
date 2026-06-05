<template>
  <article>
    <h1>{{ currentTitle }}</h1>
    <div v-html="currentContent"></div>

    <div v-if="clueImageUrl" class="clue-display">
      <img :src="clueImageUrl" alt="线索图片" style="max-width: 100%; border-radius: 8px;" />
    </div>

    <div style="margin-top: 2rem;">
      <input type="text" v-model.trim="answer" placeholder="输入答案" style="padding: 0.5rem; width: 260px;"
        @keyup.enter="handleSubmit" />
      <button @click="handleSubmit" :disabled="loading" style="padding: 0.5rem 1rem; margin-left: 0.5rem;">
        {{ loading ? '验证中...' : '提交' }}
      </button>
      <p :style="{ color: isSuccess ? 'green' : 'red', marginTop: '0.5rem' }">
        {{ result }}
      </p>
    </div>

    <div v-if="endingImageUrl && gameCompleted" class="ending">
      <img :src="endingImageUrl" alt="恭喜通关" style="max-width: 100%; border-radius: 8px;" />
    </div>
  </article>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { validateAndNormalize } from '../utils/verifierGuard.js'
import { startGame, fetchPuzzle, checkAnswer } from '../utils/authFetch.js'
// 引入修改后的 IndexedDB 存储管理函数
import {
  getClueImageBlob,
  saveClueImageBlob,
  clearAllClueImages,
  getGameCompleted,
  getEndingImage,
  setGameCompleted
} from '../utils/storage.js'

const route = useRoute()
const router = useRouter()

const props = defineProps({
  level: { type: [String, Number], required: true }
})

// ---------- 全局累积状态 ----------
const collectedClues = ref([])
const gameCompleted = ref(false)
const endingImageUrl = ref('')

// ---------- 当前关卡状态 ----------
const currentTitle = ref('加载中...')
const currentContent = ref('<p>正在获取关卡信息...</p>')
const answer = ref('')
const result = ref('')
const loading = ref(false)
const isSuccess = ref(false)

// 当前关卡对应的线索图片 URL（可以是 ObjectURL 或 降级后的网络URL）
const clueImageUrl = ref('')
// 用于追踪创建的 ObjectURL，方便释放内存
let currentObjectURL = null

// ---------- 初始化与关卡切换 ----------
onMounted(async () => {
  const token = localStorage.getItem('game_token')
  if (!token) {
    await startGame()
  }

  // 恢复全局通关状态
  if (getGameCompleted()) {
    gameCompleted.value = true
    endingImageUrl.value = getEndingImage()
  }

  loadPuzzle(props.level)
  loadLocalClue(props.level)
})

watch(() => props.level, (newLevel) => {
  loadPuzzle(newLevel)
  loadLocalClue(newLevel)
})

// 组件销毁前释放 ObjectURL 内存
onBeforeUnmount(() => {
  revokeLocalObjectURL()
})

// 释放上一次生成的 ObjectURL 内存防止内存泄漏
function revokeLocalObjectURL() {
  if (currentObjectURL) {
    URL.revokeObjectURL(currentObjectURL)
    currentObjectURL = null
  }
}

// 从 IndexedDB 异步加载线索图片
async function loadLocalClue(level) {
  // 切换关卡前先清空并释放旧的 ObjectURL
  revokeLocalObjectURL()
  clueImageUrl.value = ''

  try {
    const cachedData = await getClueImageBlob(level)
    if (cachedData) {
      if (cachedData instanceof Blob) {
        // 如果是标准的 Blob 对象，转为浏览器可识别的 Object URL
        currentObjectURL = URL.createObjectURL(cachedData)
        clueImageUrl.value = currentObjectURL
      } else if (typeof cachedData === 'string') {
        // 如果是跨域失败降级保存的 URL 字符串，直接赋值
        clueImageUrl.value = cachedData
      }
    }
  } catch (error) {
    console.error('从 IndexedDB 读取缓存图片失败:', error)
  }
}

// 加载关卡数据
async function loadPuzzle(level) {
  try {
    const data = await fetchPuzzle(level)
    currentTitle.value = data.title
    currentContent.value = data.content
  } catch (e) {
    if (e.message === '无权限访问该关卡') {
      router.push('/puzzle/1')
    } else {
      currentTitle.value = '错误'
      currentContent.value = '<p>获取关卡数据失败，请刷新重试</p>'
    }
  }
}

// 缓存图片为 Blob 并保存到 IndexedDB，随后跳转下一关
async function cacheImageAndNavigate(url, nextLevel) {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error('图片请求失败')
    const blob = await response.blob()

    // 直接将二进制 Blob 存入 IndexedDB
    await saveClueImageBlob(nextLevel, blob)
  } catch (error) {
    console.warn('图片转存失败(可能存在跨域限制或网络问题)，降级保存原 URL:', error)
    // 降级：IndexedDB 允许直接存字符串，将带 token 的原链接存进去
    await saveClueImageBlob(nextLevel, url)
  } finally {
    // 统一在存完后进行路由跳转
    router.push(`/puzzle/${nextLevel}`)
  }
}

// ---------- 答案提交 ----------
async function handleSubmit() {
  const raw = validateAndNormalize(answer.value)
  if (!raw.valid) {
    result.value = raw.error
    return
  }
  const userAnswer = raw.normalized || answer.value.trim()
  if (!userAnswer) {
    result.value = '请输入答案'
    return
  }

  loading.value = true
  result.value = ''
  isSuccess.value = false

  try {
    const data = await checkAnswer(parseInt(props.level), userAnswer)

    result.value = data.message || (data.success ? '🎉 答案正确！正在加载...' : data.error || '答案错误，请再试试。')
    isSuccess.value = data.success

    if (data.success) {
      answer.value = ''
      const currentLevel = parseInt(props.level)

      if (data.endingImageUrl) {
        // 通关（第7关）- 调用 storage 持久化
        setGameCompleted(data.endingImageUrl)
        endingImageUrl.value = data.endingImageUrl
        gameCompleted.value = true

        if (data.musicUrl) {
          const audio = new Audio(data.musicUrl)
          audio.volume = 0.8
          audio.play().catch(() => { })
        }
      } else if (data.downloadUrl) {
        // 进入下一关逻辑
        const nextLevel = currentLevel + 1
        // 执行缓存并跳转（跳转逻辑已收敛到该函数内部）
        await cacheImageAndNavigate(data.downloadUrl, nextLevel)
      }
    }
  } catch (error) {
    console.error(error)
    result.value = '网络错误，请检查网络后重试'
  } finally {
    loading.value = false
  }
}
</script>
