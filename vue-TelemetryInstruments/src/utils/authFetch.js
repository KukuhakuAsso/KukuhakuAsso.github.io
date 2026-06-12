const apiBase = import.meta.env.VITE_API_BASE || '';

// 获取存储的 token
function getToken() {
    return localStorage.getItem("game_token");
}

// 带认证的 fetch
export async function authFetch(url, options = {}) {
    const token = getToken();
    const headers = {
        ...options.headers,
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
    };
    const res = await fetch(`${apiBase}${url}`, { ...options, headers });
    return res;
}

// 开始新游戏
export async function startGame() {

    const res = await fetch(`${apiBase}/api/game/start`, { method: "POST" });
    const data = await res.json();
    if (data.token) {
        localStorage.setItem("game_token", data.token);
    }
    return data;
}

// 获取关卡数据
export async function fetchPuzzle(level) {
    const res = await authFetch(`/api/puzzle/${level}`);
    if (res.status === 403) {
        throw new Error("无权限访问该关卡");
    }
    return res.json();
}

// 重新获取关卡数据
export async function refetchPuzzle(level,lastLevel ,lastAnswer) {

}

// 提交答案
export async function checkAnswer(level, answer) {
    const res = await authFetch("/api/check", {
        method: "POST",
        body: JSON.stringify({ level, answer }),
    });
    const data = await res.json();
    if (data.success && data.token) {
        localStorage.setItem("game_token", data.token);
    }
    return data;
}


