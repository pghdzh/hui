<template>
    <div class="chat-page">
        <div class="chat-container">
            <!-- 统计面板（放在聊天容器顶部） -->
            <div class="stats-panel">
                <div class="stat-item">
                    总对话次数：<span>{{ stats.totalChats }}</span>
                </div>
                <div class="stat-item">
                    首次使用：<span>{{
                        new Date(stats.firstTimestamp).toISOString().slice(0, 10)
                    }}</span>
                </div>
                <div class="stat-item">
                    活跃天数：<span>{{ stats.activeDates.length }}</span> 天
                </div>
                <div class="stat-item">
                    今日对话：<span>{{
                        stats.dailyChats[new Date().toISOString().slice(0, 10)] || 0
                    }}</span>
                    次
                </div>
                <button class="detail-btn" @click="showModal = true">全部</button>
            </div>

            <div class="messages" ref="msgList">
                <transition-group name="msg" tag="div">
                    <div v-for="(msg, i) in chatLog" :key="i" :class="['message', msg.role, { error: msg.isError }]">
                        <!-- 如果是 user 显示文字头像，bot 不显示头像 -->
                        <div v-if="msg.role === 'user'" class="avatar user">
                            {{ oc.name ? oc.name.charAt(0) : '我' }}
                        </div>

                        <div class="bubble">
                            <div class="content" v-html="msg.text"></div>
                        </div>
                    </div>

                    <div v-if="loading" class="message bot" key="loading">
                        <div class="bubble loading">
                            正在思考中
                            <span class="dots">
                                <span class="dot">.</span>
                                <span class="dot">.</span>
                                <span class="dot">.</span>
                            </span>
                        </div>
                    </div>
                </transition-group>

            </div>

            <form class="input-area" @submit.prevent="sendMessage">
                <!-- 输入框改成 textarea -->
                <textarea v-model="input" placeholder="接下来要做什么呢…" :disabled="loading" @keydown="handleKeydown" rows="1"
                    ref="inputEl"></textarea>

                <!-- 清空按钮 -->
                <div class="btn-group">
                    <button type="button" class="clear-btn" @click="clearChat" :disabled="loading" title="清空对话">
                        ✖
                    </button>
                </div>

                <!-- 发送按钮 -->
                <button type="submit" class="send-btn" :disabled="!input.trim() || loading">
                    发送
                </button>

                <!-- 统计数据按钮 -->
                <button type="button" class="Alldetail-btn" @click="showModal = true" title="查看统计">
                    统计数据
                </button>
            </form>
        </div>

        <!-- 详细统计弹窗 -->
        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
            <div class="modal-content">
                <h3>详细统计</h3>
                <ul class="detail-list">
                    <li>总对话次数：{{ stats.totalChats }}</li>
                    <li>
                        首次使用：{{
                            new Date(stats.firstTimestamp).toISOString().slice(0, 10)
                        }}
                    </li>
                    <li>活跃天数：{{ stats.activeDates.length }} 天</li>
                    <li>
                        今日对话：{{
                            stats.dailyChats[new Date().toISOString().slice(0, 10)] || 0
                        }}
                        次
                    </li>
                    <li>总使用时长：{{ formatDuration(stats.totalTime) }}</li>
                    <li>当前连续活跃：{{ stats.currentStreak }} 天</li>
                    <li>最长连续活跃：{{ stats.longestStreak }} 天</li>
                    <li>
                        最活跃日：{{ mostActiveDayComputed }} （{{
                            stats.dailyChats[mostActiveDayComputed] || 0
                        }}
                        次）
                    </li>
                </ul>
                <button class="close-btn" @click="showModal = false">关闭</button>
            </div>
        </div>

        <!-- —— 新增：OC 创建弹窗 —— -->
        <!-- OC 弹窗不允许点击遮罩关闭（必须填写或点击使用示例） -->
        <div v-if="showOCModal" class="modal-overlay">
            <div class="modal-content">
                <h3>创建原创角色（OC）</h3>

                <ul class="form-list" style="max-height:460px; overflow:auto;">
                    <li class="form-row">
                        <label class="form-label">
                            <span class="label-text">姓名</span>
                            <input class="form-input" v-model="oc.name" placeholder="霜落" aria-label="姓名" />
                        </label>
                    </li>

                    <li class="form-row">
                        <label class="form-label">
                            <span class="label-text">年级</span>
                            <input class="form-input" v-model="oc.grade" placeholder="二年级" aria-label="年级" />
                        </label>
                    </li>

                    <li class="form-row">
                        <label class="form-label">
                            <span class="label-text">性格（逗号分隔，2~3项）</span>
                            <input class="form-input" v-model="oc.personality" placeholder="冷静, 务实" aria-label="性格" />
                        </label>
                    </li>

                    <li class="form-row">
                        <label class="form-label">
                            <span class="label-text">专长（原画/剧本/音乐/运营等）</span>
                            <input class="form-input" v-model="oc.specialty" placeholder="程序" aria-label="专长" />
                        </label>
                    </li>

                    <li class="form-row">
                        <label class="form-label">
                            <span class="label-text">备注（可选）</span>
                            <input class="form-input" v-model="oc.note" placeholder="曾在社团小项目负责构建工具链" aria-label="备注" />
                        </label>
                    </li>
                </ul>


                <div style="display:flex; gap:10px; margin-top:12px;">
                    <button class="close-btn" @click="useDefaultOC" type="button" title="使用示例角色快速开始">
                        使用示例角色
                    </button>
                    <button class="close-btn" @click="saveOCAndStart" type="button">
                        保存并生成开场
                    </button>
                </div>
            </div>
        </div>
        <!-- —— /OC 创建弹窗结束 —— -->
    </div>
</template>

<script setup lang="ts">
import {
    reactive,
    ref,
    computed,
    onMounted,
    nextTick,
    watch,
    onBeforeUnmount,
} from "vue";
import { sendMessageToSystem } from "@/api/deepseekApi";

const STORAGE_KEY = "hui_story_log";
const STORAGE_STATS_KEY = "hui_story_stats";
const STORAGE_OC_KEY = "hui_story_oc"; // 新增：OC 存储 key

const showModal = ref(false);
const showOCModal = ref(false); // 新增：控制 OC 弹窗

// Stats 类型声明，确保所有字段都有默认值
interface Stats {
    firstTimestamp: number;
    totalChats: number;
    activeDates: string[];
    dailyChats: Record<string, number>;
    currentStreak: number;
    longestStreak: number;
    totalTime: number;
}

const defaultStats: Stats = {
    firstTimestamp: Date.now(),
    totalChats: 0,
    activeDates: [],
    dailyChats: {},
    currentStreak: 0,
    longestStreak: 0,
    totalTime: 0,
};

function loadStats(): Stats {
    const saved = localStorage.getItem(STORAGE_STATS_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            return { ...defaultStats, ...parsed };
        } catch {
            console.warn("加载统计数据失败，使用默认值");
        }
    }
    return { ...defaultStats };
}

function saveStats() {
    localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(stats));
}

function updateActive(date: string) {
    if (!stats.activeDates.includes(date)) {
        stats.activeDates.push(date);
        updateStreak();
        saveStats();
    }
}
function updateStreak() {
    const dates = [...stats.activeDates].sort();
    let curr = 0,
        max = stats.longestStreak,
        prevTs = 0;
    const todayStr = new Date().toISOString().slice(0, 10);
    dates.forEach((d) => {
        const ts = new Date(d).getTime();
        if (prevTs && ts - prevTs === 86400000) curr++;
        else curr = 1;
        max = Math.max(max, curr);
        prevTs = ts;
    });
    stats.currentStreak = dates[dates.length - 1] === todayStr ? curr : 0;
    stats.longestStreak = max;
    saveStats();
}

function updateDaily(date: string) {
    stats.dailyChats[date] = (stats.dailyChats[date] || 0) + 1;
    saveStats();
}

const mostActiveDayComputed = computed(() => {
    let day = "",
        max = 0;
    for (const [d, c] of Object.entries(stats.dailyChats)) {
        if (c > max) {
            max = c;
            day = d;
        }
    }
    return day || new Date().toISOString().slice(0, 10);
});

function formatDuration(ms: number): string {
    const totalMin = Math.floor(ms / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return h ? `${h} 小时 ${m} 分钟` : `${m} 分钟`;
}

// —— Vue 响应式状态 —— //
const stats = reactive<Stats>(loadStats());
const sessionStart = Date.now();

interface ChatMsg {
    id: number;
    role: "user" | "bot";
    text: string;
    isError?: boolean;
    isEgg?: boolean;
}

const chatLog = ref<ChatMsg[]>(loadChatLog());
const input = ref("");
const loading = ref(false);
const msgList = ref<HTMLElement>();
const inputEl = ref<HTMLTextAreaElement | null>(null);

// —— OC（原创角色）数据结构与加载/保存 —— //
interface OC {
    name: string;
    grade: string;
    personality: string;
    specialty: string;
    note?: string;
}

const oc = reactive<OC>(
    loadOC() || {
        name: "",
        grade: "",
        personality: "",
        specialty: "",
        note: "",
    }
);

function loadOC(): OC | null {
    const raw = localStorage.getItem(STORAGE_OC_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.error("OC 解析失败：", e);
        return null;
    }
}

function saveOCToLocal() {

    localStorage.setItem(STORAGE_OC_KEY, JSON.stringify(oc));
}

// 快速使用示例 OC
function useDefaultOC() {
    oc.name = "霜落";
    oc.grade = "二年级";
    oc.personality = "冷静, 务实";
    oc.specialty = "程序";
    oc.note = "擅长工具链优化，性格安静而认真";

    saveOCAndStart();
}

// 新增：保存 OC 并生成开场
async function saveOCAndStart() {
    // 必填校验：姓名
    if (!oc.name || !oc.specialty) {
        alert("请填写 OC 的姓名与专长（至少）。");
        return;
    }
    saveOCToLocal();
    showOCModal.value = false;
    // 生成开场
    await generateOpeningFromOC();
}

// 生成开场：调用 sendMessageToSystem 把 OC 信息传给后端模型，请求开场旁白 + 三条建议
async function generateOpeningFromOC() {
    loading.value = true;
    // push 一条系统提示型占位（可选）
    chatLog.value.push({
        id: Date.now(),
        role: "bot",
        text: `正在为 ${oc.name} 准备剧情开场…`,
        isEgg: true,
    });

    await nextTick();
    try {
        const history = chatLog.value.filter((m) => !m.isEgg && !m.isError);
        // 构造开场 prompt（简洁可读）
        const prompt = `【开场初始化】作为《路人女主的养成方法》世界的剧情引擎，为以下原创角色生成“从樱花坡相遇前后进入 Blessing Software 的开场旁白 + 角色第一印象 + 三条下一步建议（低/中/高风险）”。角色信息：${JSON.stringify(oc)}。全程中文，保持原作人设不被颠覆。只输出场景描写、事件结果和编号的 1/2/3 三条建议。`;

        const botReply = await sendMessageToSystem(prompt, history);
        // 移除上面的占位（isEgg）
        const idx = chatLog.value.findIndex((m) => m.isEgg);
        if (idx >= 0) chatLog.value.splice(idx, 1);
        // 将回复计为一次对话（统计）
        const today = new Date().toISOString().slice(0, 10);
        stats.totalChats++;
        updateActive(today);
        updateDaily(today);
        saveStats();

        chatLog.value.push({
            id: Date.now() + 1,
            role: "bot",
            text: botReply,
        });
    } catch (e) {
        console.error(e);
        // 移除占位
        const idx = chatLog.value.findIndex((m) => m.isEgg);
        if (idx >= 0) chatLog.value.splice(idx, 1);

        chatLog.value.push({
            id: Date.now() + 2,
            role: "bot",
            text: "生成开场时出现问题，请稍后重试。",
            isError: true,
        });
    } finally {
        loading.value = false;
        await scrollToBottom();
    }
}

// —— 现有聊天逻辑（做了少量整合） —— //
async function sendMessage() {
    if (!input.value.trim()) return;
    if (stats.totalChats === 0 && !localStorage.getItem(STORAGE_STATS_KEY)) {
        stats.firstTimestamp = Date.now();
        saveStats();
    }
    const date = new Date().toISOString().slice(0, 10);
    stats.totalChats++;
    updateActive(date);
    updateDaily(date);
    saveStats();

    const userText = input.value;
    chatLog.value.push({
        id: Date.now(),
        role: "user",
        text: userText,
    });
    input.value = "";
    loading.value = true;

    try {
        const history = chatLog.value.filter((msg) => !msg.isEgg && !msg.isError);
        const botReply = await sendMessageToSystem(userText, history);
        chatLog.value.push({
            id: Date.now() + 1,
            role: "bot",
            text: botReply,
        });
    } catch (e) {
        console.error(e);

        chatLog.value.push({
            id: Date.now() + 2,
            role: "bot",
            text: "API余额耗尽了，去b站提醒我充钱吧",
            isError: true,
        });
    } finally {
        loading.value = false;
        await scrollToBottom();
    }
}

function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
        // 防止在 textarea 中误提交（按住 Ctrl/Meta+Enter 才发送会更好）
        // 这里保持你原来逻辑：Enter 发送
        sendMessage();
    }
}

function clearChat() {
    if (confirm("确定要清空全部对话吗？")) {
        chatLog.value = [];
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_OC_KEY);
        showOCModal.value = true;
    }
}

function loadChatLog(): ChatMsg[] {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error("chatLog 解析失败：", e);
        }
    }
    return [];
}

async function scrollToBottom() {
    await nextTick();
    if (msgList.value) {
        msgList.value.scrollTop = msgList.value.scrollHeight;
    }
}

watch(
    chatLog,
    async () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(chatLog.value));
        await scrollToBottom();
    },
    { deep: true }
);

function handleBeforeUnload() {
    stats.totalTime += Date.now() - sessionStart;
    saveStats();
}

onMounted(async () => {
    scrollToBottom();
    window.addEventListener("beforeunload", handleBeforeUnload);

    // 页面进入时检查：是否存在 OC（原创角色）与聊天记录
    const hasOC = !!localStorage.getItem(STORAGE_OC_KEY);
    const hasChat = !!localStorage.getItem(STORAGE_KEY);
    // 如果任一缺失，则强制弹出 OC 创建弹窗（优先创建 OC）
    if (!hasOC) {
        showOCModal.value = true;
    } else {
        // 如果已有 OC 但没有聊天记录，自动生成开场（从 OC）
        if (!hasChat) {
            // 把本地 OC 载入到 oc 中并触发开场
            const existing = loadOC();
            if (existing) {
                Object.assign(oc, existing);
                // 直接生成开场
                await generateOpeningFromOC();
            }
        }
    }
});

onBeforeUnmount(() => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
});
</script>

<style scoped lang="scss">
/* 这里保留你原先的样式（为了篇幅我只略去重复注释） */
.chat-page {
    padding-top: 64px;
    min-height: 100vh;
    background-color: #fff6f9;
    background-image: linear-gradient(145deg,
            #fff6f9 0%,
            #fff1f4 40%,
            #eef6fb 100%);
    color: #5b463f;
    display: flex;
    flex-direction: column;

    .chat-container {
        flex: 1;
        width: 800px;
        margin: 0 auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;

        .stats-panel {
            display: flex;
            align-items: center;
            background: rgba(255, 250, 245, 0.95);
            backdrop-filter: blur(4px);
            padding: 8px 16px;
            border-radius: 12px;
            font-size: 14px;
            color: #5b463f;
            justify-content: space-around;
            box-shadow: 0 6px 18px rgba(90, 70, 60, 0.06);
            border: 1px solid rgba(199, 143, 123, 0.12);

            .stat-item {
                .label {
                    font-size: 12px;
                    color: #7a6254;
                    margin-bottom: 4px;
                    opacity: 0.9;
                }

                span {
                    color: #c97f7e;
                    font-weight: 700;
                    font-size: 15px;
                    text-shadow: 0 0 4px rgba(230, 200, 180, 0.3);
                }
            }

            .detail-btn {
                background: transparent;
                border: 1px solid rgba(199, 143, 123, 0.28);
                border-radius: 6px;
                color: #7a6254;
                padding: 6px 12px;
                cursor: pointer;
                font-size: 13px;
                transition: background 0.16s ease, box-shadow 0.16s ease,
                    transform 0.12s;

                &:hover {
                    background: rgba(230, 200, 180, 0.18);
                    box-shadow: 0 8px 18px rgba(90, 70, 60, 0.06);
                    transform: translateY(-2px);
                }

                &:active {
                    transform: translateY(0);
                }

                &:focus-visible {
                    outline: none;
                    box-shadow: 0 0 0 6px rgba(199, 143, 123, 0.1);
                }
            }
        }
    }

    .messages {
        flex: 1;
        overflow-y: auto;
        padding: 10px 0 100px;
        overscroll-behavior: contain;
        scroll-behavior: smooth;
    }

    .message {
        display: flex;
        align-items: flex-start;
        margin-bottom: 12px;
        color: #5b463f;

        &.user {
            flex-direction: row-reverse;
        }

        &.bot {

            /* Bot 消息不占头像位，直接左对齐 */
            .bubble {
                margin-left: 0;
            }
        }

        .avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            margin: 0 8px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 18px;
            background: linear-gradient(180deg, #fff7f2, #fff1ee);
            color: #5b463f;
            border: 1px solid rgba(199, 143, 123, 0.08);
            box-shadow: 0 6px 16px rgba(255, 228, 235, 0.6);
        }

        .bubble {
            max-width: 78%;
            background: rgba(255, 250, 245, 0.9);
            border: 1px solid rgba(199, 143, 123, 0.12);
            padding: 12px 16px;
            border-radius: 16px;
            line-height: 1.6;
            word-break: break-word;
            box-shadow: 0 6px 16px rgba(90, 70, 60, 0.04);
            color: #5b463f;
            transition: box-shadow 0.18s, transform 0.12s;

            &:hover {
                box-shadow: 0 10px 26px rgba(90, 70, 60, 0.06);
                transform: translateY(-2px);
            }

            .dots {
                display: inline-flex;
                align-items: center;
                margin-left: 4px;

                .dot {
                    opacity: 0;
                    font-size: 16px;
                    animation: blink 1s infinite;

                    &:nth-child(1) {
                        animation-delay: 0s;
                    }

                    &:nth-child(2) {
                        animation-delay: 0.2s;
                    }

                    &:nth-child(3) {
                        animation-delay: 0.4s;
                    }
                }

                @keyframes blink {

                    0%,
                    100% {
                        opacity: 0;
                    }

                    50% {
                        opacity: 1;
                    }
                }
            }
        }
    }


    .input-area {
        position: sticky;
        bottom: 12px;
        display: flex;
        align-items: center;
        background: rgba(255, 250, 245, 0.96);
        backdrop-filter: blur(6px);
        padding: 10px;
        gap: 8px;
        z-index: 10;
        border-radius: 14px;
        box-shadow: 0 6px 18px rgba(90, 70, 60, 0.08);
        border: 1px solid rgba(200, 180, 160, 0.3);

        textarea {
            flex: 1;
            padding: 0 14px;
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(200, 180, 160, 0.35);
            color: #5b463f;
            font-size: 15px;
            line-height: 1.45;
            outline: none;
            resize: none;
            overflow: hidden;
            min-height: 44px;
            max-height: 160px;
            border-radius: 10px;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
            transition: box-shadow 0.12s, border-color 0.12s;

            &::placeholder {
                color: rgba(90, 63, 82, 0.35);
            }

            &:focus {
                border-color: #e6a5a0;
                box-shadow: 0 0 0 4px rgba(230, 165, 160, 0.12);
            }
        }

        .btn-group {
            display: flex;
            gap: 8px;

            button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                padding: 0;
                border: none;
                border-radius: 10px;
                background: rgba(230, 200, 180, 0.12);
                color: #7a6254;
                cursor: pointer;
                transition: transform 0.12s, box-shadow 0.12s, background 0.12s;
                box-shadow: 0 2px 6px rgba(90, 70, 60, 0.04);
                margin: 0 auto;

                &:hover {
                    transform: translateY(-2px);
                    background: rgba(230, 200, 180, 0.22);
                }

                &:active {
                    transform: translateY(0);
                }

                &:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            }

            .clear-btn {
                font-size: 16px;
                line-height: 1;
            }
        }

        .send-btn {
            padding: 0 22px;
            height: 40px;
            border: none;
            border-radius: 20px;
            background: linear-gradient(135deg, #f3d6c6, #c78f7b);
            color: #fff8f5;
            font-weight: 600;
            font-size: 15px;
            cursor: pointer;
            box-shadow: 0 8px 20px rgba(199, 143, 123, 0.16);
            transition: transform 0.12s, box-shadow 0.18s, filter 0.12s;

            &:hover:not(:disabled) {
                transform: translateY(-3px);
                box-shadow: 0 12px 30px rgba(199, 143, 123, 0.2);
                filter: saturate(1.03);
            }

            &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
                filter: none;
            }

            &:focus-visible {
                outline: none;
                box-shadow: 0 0 0 4px rgba(199, 143, 123, 0.12);
            }
        }

        .Alldetail-btn {
            display: none;
            margin-left: 4px;
            background: transparent;
            border: 1px solid rgba(199, 143, 123, 0.35);
            border-radius: 6px;
            padding: 6px 10px;
            color: #7a6254;
            font-size: 13px;
            cursor: pointer;
            transition: background 0.12s, box-shadow 0.12s;

            &:hover {
                background: rgba(230, 200, 180, 0.18);
                box-shadow: 0 6px 14px rgba(90, 70, 60, 0.04);
            }
        }
    }

    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(45, 36, 32, 0.72);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 16px;

        .modal-content {
            width: 340px;
            max-width: 100%;
            background: rgba(255, 250, 245, 0.98);
            backdrop-filter: blur(6px);
            border-radius: 14px;
            padding: 20px;
            color: #5b463f;
            box-shadow: 0 10px 30px rgba(90, 70, 60, 0.12),
                inset 0 1px 0 rgba(255, 255, 255, 0.7);
            border: 1px solid rgba(199, 143, 123, 0.22);
            animation: fadeInUp 220ms ease;

            &::before {
                content: "♡";
                position: absolute;
                left: 14px;
                top: 10px;
                font-size: 14px;
                color: rgba(199, 143, 123, 0.9);
                background: rgba(255, 255, 255, 0);
                transform: translateY(-2px);
                pointer-events: none;
            }

            h3 {
                margin: 0 0 12px 0;
                font-size: 18px;
                font-weight: 600;
                text-align: center;
                color: #c78f7b;
                padding-bottom: 8px;
                border-bottom: 1px dashed rgba(199, 143, 123, 0.14);
            }

            .detail-list {
                list-style: none;
                padding: 0;
                margin: 12px 0 18px;
                line-height: 1.6;
                font-size: 14px;
                color: #5b463f;

                li {
                    margin-bottom: 8px;
                    padding-left: 6px;

                    &:nth-child(odd) {
                        color: #6f5648;
                    }

                    &:last-child {
                        margin-bottom: 0;
                    }
                }
            }

            .form-list {
                list-style: none;
                padding: 6px 4px;
                margin: 10px 0 18px;
                line-height: 1.5;
                font-size: 14px;
                color: #5b463f;
                max-height: 360px;
                overflow: auto;

                .form-row {
                    display: block;
                    margin-bottom: 12px;
                    padding-left: 0;

                    &:last-child {
                        margin-bottom: 0;
                    }
                }

                .form-label {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    width: 100%;
                    cursor: text;
                }

                .label-text {
                    font-size: 12px;
                    color: #7a6254;
                    opacity: 0.95;
                    letter-spacing: 0.2px;
                }

                .form-input {
                    appearance: none;
                    -webkit-appearance: none;
                    width: 100%;
                    box-sizing: border-box;
                    padding: 10px 12px;
                    border-radius: 10px;
                    border: 1px solid rgba(200, 180, 170, 0.12);
                    background: rgba(255, 255, 255, 0.98);
                    color: #5b463f;
                    font-size: 14px;
                    line-height: 1.4;
                    outline: none;
                    transition: box-shadow 0.16s ease, transform 0.06s ease, border-color 0.12s ease;
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);

                    &::placeholder {
                        color: rgba(91, 70, 63, 0.45);
                        font-style: italic;
                    }

                    &:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 6px 18px rgba(90, 70, 60, 0.04);
                    }

                    &:focus {
                        border-color: #c78f7b;
                        box-shadow: 0 8px 20px rgba(199, 143, 123, 0.12);
                        transform: translateY(-1px);
                    }
                }
            }

            .close-btn {
                display: block;
                margin: 0 auto;
                padding: 8px 20px;
                background: linear-gradient(135deg, #f3d6c6, #c78f7b);
                color: #fff8f5;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                font-weight: 600;
                box-shadow: 0 8px 20px rgba(199, 143, 123, 0.14);
                transition: transform 0.12s ease, box-shadow 0.14s ease, filter 0.12s;

                &:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 28px rgba(199, 143, 123, 0.18);
                    filter: saturate(1.03);
                }

                &:active {
                    transform: translateY(-1px) scale(0.996);
                }

                &:focus-visible {
                    outline: none;
                    box-shadow: 0 0 0 6px rgba(199, 143, 123, 0.1);
                }
            }
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(8px) scale(0.995);
            }

            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        @media (max-width: 480px) {
            .modal-content {
                width: 100%;
                padding: 16px;
                border-radius: 12px;

                h3 {
                    font-size: 16px;
                }

                .close-btn {
                    width: 100%;
                    padding: 10px 14px;
                    border-radius: 8px;
                }
            }
        }
    }

    @media (max-width: 768px) {
        .chat-container {
            width: 100%;
            padding: 6px;

            .stats-panel {
                display: none;
            }
        }

        .bubble {
            padding: 8px 12px;
            font-size: 14px;
            max-width: 85%;
        }

        .avatar {
            width: 32px;
            height: 32px;
        }

        .input-area {
            flex-direction: column;
            align-items: stretch;

            textarea {
                width: 100%;
            }

            button {
                width: 100%;
            }

            .Alldetail-btn {
                display: block;
            }
        }
    }
}
</style>
