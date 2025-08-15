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
          <div
            v-for="msg in chatLog"
            :key="msg.id"
            :class="['message', msg.role, { error: msg.isError }]"
          >
            <div class="avatar" :class="msg.role"></div>
            <div class="bubble">
              <div class="content" v-html="msg.text"></div>
            </div>
          </div>
          <div v-if="loading" class="message bot" key="loading">
            <div class="avatar bot"></div>
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
        <textarea
          v-model="input"
          placeholder="向惠提问…"
          :disabled="loading"
          @keydown="handleKeydown"
          rows="1"
        ></textarea>

        <!-- 清空按钮 -->
        <div class="btn-group">
          <button
            type="button"
            class="clear-btn"
            @click="clearChat"
            :disabled="loading"
            title="清空对话"
          >
            ✖
          </button>
        </div>

        <!-- 发送按钮 -->
        <button
          type="submit"
          class="send-btn"
          :disabled="!input.trim() || loading"
        >
          发送
        </button>

        <!-- 统计数据按钮 -->
        <button
          type="button"
          class="Alldetail-btn"
          @click="showModal = true"
          title="查看统计"
        >
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
import { sendMessageToHui } from "@/api/deepseekApi";

const STORAGE_KEY = "hui_chat_log";

// 本地存储键名
const STORAGE_STATS_KEY = "hui_chat_stats";
const showModal = ref(false);
// Stats 类型声明，确保所有字段都有默认值
interface Stats {
  firstTimestamp: number; // 首次使用时间戳
  totalChats: number; // 总对话次数
  activeDates: string[]; // 有发言的日期列表（yyyy‑mm‑dd）
  dailyChats: Record<string, number>; // 每日对话次数
  currentStreak: number; // 当前连续活跃天数
  longestStreak: number; // 历史最长连续活跃天数

  totalTime: number; // 累计使用时长（毫秒）
}

// 默认值，用于补齐本地存储中可能缺失的字段
const defaultStats: Stats = {
  firstTimestamp: Date.now(),
  totalChats: 0,
  activeDates: [],
  dailyChats: {},
  currentStreak: 0,
  longestStreak: 0,

  totalTime: 0,
};

// 从 localStorage 加载并合并默认值
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

// 保存到 localStorage
function saveStats() {
  localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(stats));
}

// 更新「活跃天数」及「连续活跃」逻辑
function updateActive(date: string) {
  if (!stats.activeDates.includes(date)) {
    stats.activeDates.push(date);
    updateStreak();
    saveStats(); // 持久化活跃天数变化
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

// 更新「每日对话次数」
function updateDaily(date: string) {
  stats.dailyChats[date] = (stats.dailyChats[date] || 0) + 1;
  saveStats(); // 持久化活跃天数变化
}

// 计算最活跃日
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

// 格式化总使用时长
function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h ? `${h} 小时 ${m} 分钟` : `${m} 分钟`;
}

// —— Vue 响应式状态 ——
const stats = reactive<Stats>(loadStats());
// 会话开始时间，用于计算本次时长
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

async function sendMessage() {
  if (!input.value.trim()) return;
  if (stats.totalChats === 0 && !localStorage.getItem(STORAGE_STATS_KEY)) {
    stats.firstTimestamp = Date.now();
    saveStats();
  }
  const date = new Date().toISOString().slice(0, 10); // 每次都取最新“今天”
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
    //  throw new Error("测试错误");
    const history = chatLog.value.filter((msg) => !msg.isEgg && !msg.isError);
    const botReply = await sendMessageToHui(userText, history);
    chatLog.value.push({
      id: Date.now() + 1,
      role: "bot",
      text: botReply,
    });
  } catch (e) {
    console.error(e);

    const errorMessages = ["API余额耗尽了，去b站提醒我充钱吧"];

    const randomIndex = Math.floor(Math.random() * errorMessages.length);

    chatLog.value.push({
      id: Date.now() + 2,
      role: "bot",
      text: errorMessages[randomIndex],
      isError: true,
    });
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter") sendMessage();
}

function clearChat() {
  if (confirm("确定要清空全部对话吗？")) {
    chatLog.value = [
      {
        id: Date.now(),
        role: "bot",
        text: "嗯……要从哪里聊起呢？",
      },
    ];
    localStorage.removeItem(STORAGE_KEY);
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
  return [
    {
      id: Date.now(),
      role: "bot",
      text: "嗯……要从哪里聊起呢？",
    },
  ];
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

onMounted(() => {
  scrollToBottom();
  window.addEventListener("beforeunload", handleBeforeUnload);
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload);
});
</script>

<style scoped lang="scss">
.chat-page {
  padding-top: 64px;
  min-height: 100vh;
  background-color: #fff6f9;
  background-image: linear-gradient(
    145deg,
    #fff6f9 0%,
    #fff1f4 40%,
    #eef6fb 100%
  );
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
      background: rgba(255, 250, 245, 0.95); /* 奶油纸质底 */
      backdrop-filter: blur(4px);
      padding: 8px 16px;
      border-radius: 12px;
      font-size: 14px;
      color: #5b463f; /* 暖棕文字 */
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
          color: #c97f7e; /* 暖粉色数字，低饱和 */
          font-weight: 700;
          font-size: 15px;
          text-shadow: 0 0 4px rgba(230, 200, 180, 0.3);
        }
      }

      .detail-btn {
        background: transparent;
        border: 1px solid rgba(199, 143, 123, 0.28); /* 暖棕描边 */
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

  /* 加藤惠风格的消息气泡 */
  .message {
    display: flex;
    align-items: flex-start;
    margin-bottom: 12px;
    color: #5b463f; /* 暖棕正文色 */

    &.user {
      flex-direction: row-reverse;
    }

    &.error .bubble {
      background: rgba(229, 155, 156, 0.18); /* 柔粉错误提示 */
      border: 1px solid rgba(209, 107, 165, 0.28);
      box-shadow: 0 6px 18px rgba(209, 107, 165, 0.08);
    }

    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      margin: 0 8px;
      background-size: cover;
      background-position: center;
      flex-shrink: 0;
      box-shadow: 0 6px 16px rgba(90, 70, 60, 0.06); /* 暖棕柔光 */
      z-index: 10;

      &.bot {
        background-image: url("@/assets/megumi_kato.png");
        box-shadow: 0 8px 22px rgba(199, 143, 123, 0.12);
        border: 2px solid rgba(255, 255, 255, 0.35); /* 头像外侧轻描 */
      }

      &.user {
        background: linear-gradient(180deg, #fff7f2, #fff1ee);
        box-shadow: 0 6px 16px rgba(255, 228, 235, 0.6);
        border: 1px solid rgba(199, 143, 123, 0.08);
      }
    }

    .bubble {
      max-width: 78%;
      background: rgba(255, 250, 245, 0.9); /* 纸质暖底 */
      border: 1px solid rgba(199, 143, 123, 0.12);
      backdrop-filter: blur(6px);
      padding: 12px 16px;
      border-radius: 16px;
      line-height: 1.6;
      word-break: break-word;
      box-shadow: 0 6px 16px rgba(90, 70, 60, 0.04);
      transition: box-shadow 0.18s, transform 0.12s, background 0.12s;
      color: #5b463f; /* 与整体文字色统一 */

      &:hover {
        box-shadow: 0 10px 26px rgba(90, 70, 60, 0.06);
        transform: translateY(-2px);
      }

      &.loading {
        color: rgba(91, 70, 63, 0.7);
        opacity: 0.95;
      }

      /* bot 消息 — 微妙的左侧“尾巴”视觉（通过圆角处理）*/
      .message.bot & {
        border-radius: 16px 16px 16px 6px;
        background: linear-gradient(
          135deg,
          rgba(255, 247, 242, 0.95),
          rgba(255, 236, 238, 0.88)
        );
      }

      /* user 消息 — 右侧“尾巴” */
      .message.user & {
        border-radius: 16px 16px 6px 16px;
        background: linear-gradient(
          135deg,
          rgba(255, 247, 242, 0.95),
          rgba(252, 241, 238, 0.92)
        );
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

  /* 加藤惠风格的输入区（替换原来的 .input-area） */
  .input-area {
    position: sticky;
    bottom: 12px;
    display: flex;
    align-items: center;
    background: rgba(255, 250, 245, 0.96); /* 米白暖底 */
    backdrop-filter: blur(6px);
    padding: 10px;
    gap: 8px;
    z-index: 10;
    border-radius: 14px;
    box-shadow: 0 6px 18px rgba(90, 70, 60, 0.08);
    border: 1px solid rgba(200, 180, 160, 0.3);

    /* 文本输入区使用 textarea（自动扩展） */
    textarea {
      flex: 1;
      padding: 0 14px;
      background: rgba(255, 255, 255, 0.9); /* 纸质感 */
      border: 1px solid rgba(200, 180, 160, 0.35);
      color: #5b463f; /* 暗棕，保证可读 */
      font-size: 15px;
      line-height: 1.45;
      outline: none;
      resize: none; /* 禁止拖拽改变大小 */
      overflow: hidden; /* 自动扩展时不出现滚动条 */
      min-height: 44px;
      max-height: 160px; /* 最多扩展到 ~6 行 */
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

    /* 发送主按钮——温柔但明显 */
    .send-btn {
      padding: 0 22px;
      height: 40px;
      border: none;
      border-radius: 20px;
      background: linear-gradient(135deg, #f3d6c6, #c78f7b); /* 米粉渐变 */
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

    /* 统计数据按钮（次要） */
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

  /* 加藤惠风格的模态框 */
  .modal-overlay {
    position: fixed;
    inset: 0;
    /* 稍暖的暗色遮罩，让弹窗像翻出的一页纸 */
    background: rgba(45, 36, 32, 0.72);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 16px;

    .modal-content {
      width: 320px;
      max-width: 100%;
      background: rgba(255, 250, 245, 0.98); /* 奶油纸质底 */
      backdrop-filter: blur(6px);
      border-radius: 14px;
      padding: 20px;
      color: #5b463f; /* 暖棕文字 */
      box-shadow: 0 10px 30px rgba(90, 70, 60, 0.12),
        /* 柔和投影 */ inset 0 1px 0 rgba(255, 255, 255, 0.7); /* 纸张高光 */
      border: 1px solid rgba(199, 143, 123, 0.22); /* 细腻边框 */
      animation: fadeInUp 220ms ease;

      /* 小装饰（左上角的手写贴纸感） */
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
        color: #c78f7b; /* 奶茶粉标题色 */
        padding-bottom: 8px;
        /* 微手写/纸感下划线（可删） */
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
            color: #6f5648; /* 稍深一点的棕，便于区分行 */
          }

          &:last-child {
            margin-bottom: 0;
          }
        }
      }

      .close-btn {
        display: block;
        margin: 0 auto;
        padding: 8px 20px;
        background: linear-gradient(135deg, #f3d6c6, #c78f7b); /* 米粉渐变 */
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

    /* 动画 */
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

    /* 移动端微调：更窄但留白充足 */
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
