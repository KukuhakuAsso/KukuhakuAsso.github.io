// composables/useEncryptedAudio.js
import { ref, onBeforeUnmount } from "vue";
import { authFetch } from "./authFetch.js";

export function useEncryptedAudio() {
    const audioSrc = ref("");
    const loading = ref(false);
    let currentBlobUrl = null;
    let rawKey = null;
    let iv = null;

    // 安全地清除敏感数据
    function clear() {
        if (currentBlobUrl) {
            URL.revokeObjectURL(currentBlobUrl);
            currentBlobUrl = null;
        }
        audioSrc.value = "";
    }

    // 加载并解密播放
    async function load({ encFileUrl, musicId }) {
        loading.value = true;
        clear();

        try {
            // 1. 并行：拉取加密文件 + 请求密钥（提高速度）
            const [encRes, keyRes] = await Promise.all([
                fetch(encFileUrl),
                authFetch(`/api/get-audio-key?id=${musicId}`),
            ]);

            if (!encRes.ok || !keyRes.ok) throw new Error("资源或密钥获取失败");

            const encryptedBuffer = await encRes.arrayBuffer();
            const { keyBase64, ivBase64 } = await keyRes.json();

            // 2. 将密钥和 IV 转换为 CryptoKey / Uint8Array
            rawKey = Uint8Array.from(atob(keyBase64), (c) =>
                c.charCodeAt(0),
            );
            iv = Uint8Array.from(atob(ivBase64), (c) => c.charCodeAt(0));

            const cryptoKey = await crypto.subtle.importKey(
                "raw",
                rawKey,
                { name: "AES-CBC" },
                false,
                ["decrypt"],
            );

            // 3. 解密
            const decrypted = await crypto.subtle.decrypt(
                { name: "AES-CBC", iv },
                cryptoKey,
                encryptedBuffer,
            );

            // 4. 生成 Blob URL（根据原音频类型设置 MIME）
            const blob = new Blob([decrypted], { type: "audio/mpeg" });
            currentBlobUrl = URL.createObjectURL(blob);
            audioSrc.value = currentBlobUrl;
        } catch (err) {
            console.error("解密失败", err);
            // 可通知用户无权限或文件损坏
        } finally {
            loading.value = false;
            // 清理密钥原始数据（虽不能100%保证内存擦除，但尽早解除引用）
            rawKey?.fill(0);
            iv?.fill(0);
        }
    }

    // 组件卸载时清理
    onBeforeUnmount(clear);

    return { audioSrc, loading, load };
}
