<template>
    <audio ref="bgMusic" loop preload="auto" crossorigin="anonymous"></audio>
</template>

<script setup>
import { ref, onMounted, onUnmounted, inject, watch, computed } from 'vue'
import defaultBgm from '@/assets/bgm.mp3'
import musicUrlMap from '@/config/musicList.js'
import { getObjectHash } from '@/utils/simpleHash.js'

const bgMusic = ref(null)
const currentBgm = ref(null)
const isPlaying = ref(false)
const currentBlobUrl = ref(null)
// 播放请求 id，确保异步加载的旧请求不会覆盖新的音乐
let audioRequestCounter = 0
let currentAudioRequestId = 0

// 注入全局状态
const volume = inject('volume')               // 用户设定的音量 (0~1)
const isBgmPlaying = inject('isBgmPlaying')  // BGM 开关状态

// 实际输出音量 = BGM 开 ? 用户音量 : 0
const actualVolume = computed(() => isBgmPlaying.value ? volume.value : 0)

// 同步实际音量到 <audio> 元素
watch(actualVolume, (val) => {
    if (bgMusic.value) bgMusic.value.volume = val
}, { immediate: true })

// ---------- 工具函数 ----------
function getMimeType(filename) {
    const ext = filename.split('.').pop().toLowerCase()
    if (ext === 'enc') {
        const parts = filename.split('.')
        const realExt = parts.length > 1 ? parts[parts.length - 2]?.toLowerCase() : ''
        const mimeMap = {
            mp3: 'audio/mpeg', flac: 'audio/flac', wav: 'audio/wav',
            ogg: 'audio/ogg', m4a: 'audio/mp4', aac: 'audio/aac'
        }
        return mimeMap[realExt] || 'audio/mpeg'
    }
    const mimeMap = {
        mp3: 'audio/mpeg', flac: 'audio/flac', wav: 'audio/wav',
        ogg: 'audio/ogg', m4a: 'audio/mp4', aac: 'audio/aac'
    }
    return mimeMap[ext] || 'audio/mpeg'
}

function revokeCurrentBlob() {
    if (currentBlobUrl.value) {
        URL.revokeObjectURL(currentBlobUrl.value)
        currentBlobUrl.value = null
    }
}

function playDefault() {
    const audioEl = bgMusic.value
    if (!audioEl) return

    if(currentBgm.value == 'default') return

    audioEl.pause()
    revokeCurrentBlob()
    audioEl.src = defaultBgm
    currentBgm.value = 'default'
    audioEl.load()
    audioEl.play().then(() => { isPlaying.value = true }).catch(() => { isPlaying.value = false })
}

const tryPlayMusic = async () => {
    if (!bgMusic.value) return
    try {
        await bgMusic.value.play()
        isPlaying.value = true
        document.removeEventListener('click', tryPlayMusic)
        document.removeEventListener('touchstart', tryPlayMusic)
    } catch (error) {
        console.warn('自动播放被拦截，等待用户交互：', error.message)
        isPlaying.value = false
    }
}

/**
 * 切换背景音乐（由外部调用）
 */
const changePlayMusic = async (musicData, requestId) => {

    // 如果外部没有传 requestId，则生成一个用于本次切换
    if (!requestId) {
        requestId = ++audioRequestCounter
    }
    currentAudioRequestId = requestId

    if (!musicData) {
        // 只有当请求仍然为最新时才执行默认播放
        if (requestId === currentAudioRequestId) playDefault()
        return
    }

    let { file, keyBase64, ivBase64, mimeType, musicId } = musicData

    // 如果提供了 musicId，则从映射表中查找文件 URL
    if (musicId && !file) {
        file = musicUrlMap[musicId]
        if (!file) {
            console.warn(`未找到 musicId: ${musicId}`)
            playDefault()
            return
        }
    }

    if (!file) {
        playDefault()
        return
    }

    if(currentBgm.value == musicId) return
    if(file && currentBgm.value == getObjectHash(file)) return

    const audioEl = bgMusic.value
    if (!audioEl) return

    revokeCurrentBlob()
    audioEl.pause()

    const isEncrypted = file.toLowerCase().endsWith('.enc')
      || (!!keyBase64 && (file.startsWith('blob:') || file.startsWith('http')))

    try {
        if (isEncrypted) {

            if (!keyBase64 || !ivBase64) {
                console.error('加密文件缺少 keyBase64 或 ivBase64')
                playDefault()
                return
            }

            const encUrl = (file.startsWith('/') || file.startsWith('http') || file.startsWith('blob:'))
                ? file
                : '/' + file.replace(/\\/g, '/')

            const encRes = await fetch(encUrl)
            if (!encRes.ok) throw new Error(`加密文件加载失败: ${encRes.status}`)
            const encryptedBuffer = await encRes.arrayBuffer()

            const rawKey = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0))
            const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0))
            const cryptoKey = await crypto.subtle.importKey(
                'raw', rawKey, { name: 'AES-CBC' }, false, ['decrypt']
            )
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-CBC', iv }, cryptoKey, encryptedBuffer
            )

            const finalMime = mimeType || getMimeType(file)
            const blob = new Blob([decrypted], { type: finalMime })
            // 在异步操作完成后判断请求是否仍为最新，过期则丢弃
            if (requestId !== currentAudioRequestId) {
                // 立即释放临时 blob
                URL.revokeObjectURL(URL.createObjectURL(blob))
                return
            }
            currentBlobUrl.value = URL.createObjectURL(blob)
            audioEl.src = currentBlobUrl.value
        } else {
            const isAbsoluteUrl = file.startsWith('/') ||
                file.startsWith('http') ||
                file.startsWith('blob:') ||
                file.startsWith('data:')
            const plainUrl = isAbsoluteUrl ? file : '/' + file.replace(/\\/g, '/')
            audioEl.src = plainUrl
        }

        // 同样，在设置状态前确认请求仍为最新
        if (requestId !== currentAudioRequestId) {
            return
        }
        currentBgm.value = musicId || getObjectHash(file)
        audioEl.load()
        // 如果当前处于播放状态，自动续播（根据 isPlaying 判断）
        if (isPlaying.value) {
            await audioEl.play()
            isPlaying.value = true
        } else {
            isPlaying.value = false
        }
    } catch (err) {
        console.error('音乐切换失败，回退到默认音乐：', err)
        if (requestId === currentAudioRequestId) playDefault()
    }
}

// 播放控制方法（供外部 toggleBgm 使用）
function play() {
    if (!bgMusic.value) return
    bgMusic.value.play().then(() => {
        isPlaying.value = true
    }).catch(() => {
        isPlaying.value = false
    })
}

function pause() {
    if (!bgMusic.value) return
    bgMusic.value.pause()
    isPlaying.value = false
}

function togglePlay() {
    if (isPlaying.value) {
        pause()
    } else {
        play()
    }
}

onMounted(() => {
    if (!bgMusic.value?.src) playDefault()
    tryPlayMusic()
    document.addEventListener('click', tryPlayMusic)
    document.addEventListener('touchstart', tryPlayMusic)
})

onUnmounted(() => {
    document.removeEventListener('click', tryPlayMusic)
    document.removeEventListener('touchstart', tryPlayMusic)
    revokeCurrentBlob()
})

defineExpose({
    isPlaying,
    play,
    pause,
    togglePlay,
    changePlayMusic,
    playDefault
})
</script>
