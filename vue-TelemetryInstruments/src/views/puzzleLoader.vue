<template>
  <article>
    <h1>{{ currentTitle }}</h1>

    <PuzzleNavigation :current-level="currentLevel" :max-level="maxUnlockedLevel" :visible="!gameCompleted"
      @navigate="goToLevel" />

    <div v-html="currentContent"></div>

    <!-- 线索图片展示与加载异常处理 -->
    <div v-if="clueImageUrl && !gameCompleted" class="clue-display">
      <img v-if="!clueImageError" :src="clueImageUrl" alt="线索图片" style="max-width: 100%; border-radius: 8px;"
        @error="clueImageError = true" />
      <div v-else class="clue-error">
        <p>⚠️ 线索图片加载失败，可能因缓存失效或网络问题。</p>
        <div class="clue-error-actions">
          <button class="nav-btn" @click="retryLoadClue">🔄 重新加载</button>
          <button class="nav-btn" :disabled="currentLevel <= 1" @click="goToLevel(currentLevel - 1)">
            ← 回上一关重新获取
          </button>
        </div>
      </div>
    </div>

    <!-- 答案输入区域 -->
    <div v-if="!gameCompleted" style="margin-top: 2rem;">
      <input type="text" v-model.trim="answer" placeholder="输入答案" style="padding: 0.5rem; width: 260px;"
        @keyup.enter="handleSubmit" />
      <button @click="handleSubmit" :disabled="loading" style="padding: 0.5rem 1rem; margin-left: 0.5rem;">
        {{ loading ? '验证中...' : '提交' }}
      </button>
      <p :style="{ color: isSuccess ? 'green' : 'red', marginTop: '0.5rem' }">
        {{ result }}
      </p>
    </div>

    <!-- 通关结局界面 -->
    <div v-if="gameCompleted" class="ending">
      <img v-if="endingImageUrl" :src="endingImageUrl" alt="恭喜通关" style="max-width: 100%; border-radius: 8px;" />
      <p v-else class="loading-text">正在从本地保险箱加载大结局真相...</p>
    </div>
  </article>
</template>

<script setup>
import { inject, ref, onMounted, watch, onBeforeUnmount, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { validateAndNormalize } from '../utils/verifierGuard.js'
import { startGame, fetchPuzzle, checkAnswer } from '../utils/authFetch.js'
import PuzzleNavigation from '@/components/puzzleNavigation.vue'
import {
  getClueImageBlob,
  saveClueImageBlob,
  getGameCompleted,
  getEndingImage,
  setGameCompleted
} from '../utils/storage.js'

const route = useRoute()
const router = useRouter()

const props = defineProps({
  level: { type: [String, Number], required: true }
})

const currentLevel = computed(() => parseInt(props.level))

// ==================== 全局累积状态 ====================
const gameCompleted = ref(false)
const endingImageUrl = ref('')
const maxUnlockedLevel = ref(
  parseInt(localStorage.getItem('puzzle_max_unlocked')) || 0
)

// ==================== 当前关卡状态 ====================
const currentTitle = ref('加载中...')
const currentContent = ref('<p>正在获取关卡信息...</p>')
const answer = ref('')
const result = ref('')
const loading = ref(false)
const isSuccess = ref(false)

// 当前关卡对应的线索图片 URL（Blob 或远程地址）
const clueImageUrl = ref('')
const clueImageError = ref(false)

// 内存中的 ObjectURL，用于手动释放
let currentObjectURL = null
let endingObjectURL = null

// 注入的背景音乐切换方法
const changeBgm = inject('changeBgm', null)

// ==================== 工具函数 ====================
function goToLevel(level) {
  if (level < 1) return
  router.push(`/puzzle/${level}`)
}

function updateMaxLevel(level) {
  if (level > maxUnlockedLevel.value) {
    maxUnlockedLevel.value = level
    localStorage.setItem('puzzle_max_unlocked', level)
  }
}

function revokeLocalObjectURL() {
  if (currentObjectURL) {
    URL.revokeObjectURL(currentObjectURL)
    currentObjectURL = null
  }
}

// 安全调用背景音乐切换
async function switchBgm(bgmConfig) {
  if (!changeBgm || !bgmConfig) return
  try {
    await changeBgm(bgmConfig) // 假设 changeBgm 接受 { key, decryptKey } 或直接是 url
  } catch (e) {
    console.warn('切换背景音乐失败:', e)
  }
}

// ==================== 生命周期与监听 ====================
onMounted(async () => {
  const token = localStorage.getItem('game_token')
  if (!token) {
    await startGame()
  }

  // 恢复全局通关状态
  if (getGameCompleted()) {
    gameCompleted.value = true
    await loadEndingAssets()
    return
  }

  // 初始化第一关
  await loadPuzzle(props.level)
  await loadLocalClue(props.level)
})

watch(() => props.level, async (newLevel) => {
  if (!gameCompleted.value) {
    await loadPuzzle(newLevel)
    await loadLocalClue(newLevel)
  }
})

onBeforeUnmount(() => {
  revokeLocalObjectURL()
  if (endingObjectURL) {
    URL.revokeObjectURL(endingObjectURL)
    endingObjectURL = null
  }
})

// ==================== 关卡数据与音乐加载 ====================
async function loadPuzzle(level) {
  try {
    const data = await fetchPuzzle(level)
    currentTitle.value = data.title
    currentContent.value = data.content
    updateMaxLevel(level)

    // 【核心优化】根据后端返回的 bgm 参数切换背景音乐
    if (data.bgm) {
      await switchBgm(data.bgm)
    }
  } catch (e) {
    if (e.message === '无权限访问该关卡') {
      router.push('/puzzle/0')
    } else {
      currentTitle.value = '错误'
      currentContent.value = '<p>获取关卡数据失败，请刷新重试</p>'
    }
  }
}

// ==================== 线索图片缓存与恢复 ====================
async function loadLocalClue(level) {
  revokeLocalObjectURL()
  clueImageUrl.value = ''
  clueImageError.value = false

  try {
    const cached = await getClueImageBlob(level)
    if (!cached) return

    if (cached instanceof Blob) {
      currentObjectURL = URL.createObjectURL(cached)
      clueImageUrl.value = currentObjectURL
    } else if (typeof cached === 'string') {
      // 降级：存储的是原始 URL
      clueImageUrl.value = cached
    }
  } catch (error) {
    console.error('从 IndexedDB 读取缓存图片失败:', error)
  }
}

async function retryLoadClue() {
  clueImageError.value = false
  await nextTick()
  await loadLocalClue(props.level)
}

// ==================== 图片预缓存逻辑 ====================
async function cacheImageAndNavigate(url, backendHash, nextLevel) {
  try {
    const cached = await getClueImageBlob(nextLevel)
    const localHash = localStorage.getItem(`clue_hash_${nextLevel}`)

    if (cached instanceof Blob && localHash === backendHash) {
      // 缓存命中，直接跳转
      router.push(`/puzzle/${nextLevel}`)
      result.value = ''
      return
    }

    const response = await fetch(url)
    if (!response.ok) throw new Error('图片下载失败')
    const blob = await response.blob()
    await saveClueImageBlob(nextLevel, blob)
    if (backendHash) localStorage.setItem(`clue_hash_${nextLevel}`, backendHash)
  } catch (error) {
    console.warn('图片预缓存失败，降级保存原始 URL:', error)
    const existing = await getClueImageBlob(nextLevel)
    if (!existing) await saveClueImageBlob(nextLevel, url)
    localStorage.removeItem(`clue_hash_${nextLevel}`)
  } finally {
    router.push(`/puzzle/${nextLevel}`)
    result.value = ''
  }
}

// ==================== 通关结局资源缓存 ====================
async function cacheEndingAssets(url, backendHash) {
  try {
    const cached = await getClueImageBlob('ending')
    const localHash = localStorage.getItem('clue_hash_ending')

    if (cached instanceof Blob && localHash === backendHash) return

    const response = await fetch(url)
    if (response.ok) {
      const blob = await response.blob()
      await saveClueImageBlob('ending', blob)
      if (backendHash) {
        localStorage.setItem('clue_hash_ending', backendHash)
      }
    }
  } catch (e) {
    console.warn('缓存结局图片失败:', e)
  }
}

async function loadEndingAssets() {
  try {
    const cached = await getClueImageBlob('ending')
    if (cached instanceof Blob) {
      if (endingObjectURL) URL.revokeObjectURL(endingObjectURL)
      endingObjectURL = URL.createObjectURL(cached)
      endingImageUrl.value = endingObjectURL
    } else {
      endingImageUrl.value = getEndingImage()
    }
  } catch (e) {
    endingImageUrl.value = getEndingImage()
  }
}

// ==================== 答案提交与流程控制 ====================
async function handleSubmit() {
  const raw = validateAndNormalize(answer.value)
  if (!raw.valid) { result.value = raw.error; return }
  const userAnswer = raw.normalized || answer.value.trim()
  if (!userAnswer) { result.value = '请输入答案'; return }

  loading.value = true
  result.value = ''
  isSuccess.value = false

  try {
    const data = await checkAnswer(parseInt(props.level), userAnswer)

    result.value = data.message || (data.success ? '🎉 答案正确！正在加载...' : data.error || '答案错误，请再试试。')
    isSuccess.value = data.success

    if (!data.success) return

    answer.value = ''
    const currentLevelNum = parseInt(props.level)

    // ---------- 通关结局 ----------
    if (data.endingImageUrl) {
      result.value = '🎉 正在解锁最终真相...'

      // 缓存结局图片
      await cacheEndingAssets(data.endingImageUrl, data.endingImageHash)
      setGameCompleted(data.endingImageUrl)
      gameCompleted.value = true
      await loadEndingAssets()

      // 播放结局专属音乐（一次性音效，不影响背景音乐）
      if (data.endingMusicUrl) {
        const audio = new Audio(data.endingMusicUrl)
        audio.volume = 0.8
        audio.play().catch(() => console.log('浏览器阻止了自动播放'))
      }
      return
    }

    // ---------- 普通关卡：解锁下一关并预缓存线索图 ----------
    if (data.clueFileUrl) {
      const nextLevel = currentLevelNum + 1
      updateMaxLevel(nextLevel)

      // 如果后端返回了下一关的 BGM 参数，可提前切换背景音乐
      if (data.nextBgm) {
        await switchBgm(data.nextBgm)
      }

      // 缓存线索图并跳转
      await cacheImageAndNavigate(data.clueFileUrl, data.clueFileHash, nextLevel)
    }
  } catch (error) {
    console.error('答案提交异常:', error)
    result.value = '网络错误，请检查网络后重试'
  } finally {
    loading.value = false
  }
}

</script>

<style scoped>
.clue-error {
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 0.5rem;
  text-align: center;
  color: var(--text);
}

.clue-error p {
  margin: 0 0 0.75rem;
}

.clue-error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.clue-error .nav-btn {
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
</style>
