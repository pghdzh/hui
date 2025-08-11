<template>
  <div class="chat-page">

    <div class="chat-container">
      <!-- 统计面板 -->

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
          今日对话：<span>{{ stats.dailyChats[new Date().toISOString().slice(0, 10)] || 0 }}</span> 次
        </div>
        <button class="detail-btn" @click="showModal = true">全部</button>
      </div>
      <div class="messages" ref="msgList">
        <transition-group name="msg" tag="div">
          <div v-for="msg in chatLog" :key="msg.id" :class="['message', msg.role, { error: msg.isError }]">
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
        <!-- 输入框 -->
        <input v-model="input" type="text" placeholder="向珂朵莉提问…" :disabled="loading" @keydown="handleKeydown" />
        <!-- 清空 & 语音 图标按钮组 -->
        <div class="btn-group">
          <button type="button" class="clear-btn" @click="clearChat" :disabled="loading" title="清空对话">
            ✖
          </button>
        </div>
        <!-- 发送主按钮 -->
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
          <li>今日对话：{{ stats.dailyChats[new Date().toISOString().slice(0, 10)] || 0 }} 次</li>
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
  onUnmounted,
} from "vue";
import { sendMessageToKdl } from "@/api/deepseekApi";


const STORAGE_KEY = "kdl_chat_log";


// 本地存储键名
const STORAGE_STATS_KEY = "kdl_chat_stats";
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
    saveStats();  // 持久化活跃天数变化
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
  saveStats()
}

// 更新「每日对话次数」
function updateDaily(date: string) {
  stats.dailyChats[date] = (stats.dailyChats[date] || 0) + 1;
  saveStats();  // 持久化活跃天数变化
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
  return day || new Date().toISOString().slice(0, 10)
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
  const date = new Date().toISOString().slice(0, 10);  // 每次都取最新“今天”
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
    const botReply = await sendMessageToKdl(userText, history);
    chatLog.value.push({
      id: Date.now() + 1,
      role: "bot",
      text: botReply,
    });

  } catch (e) {
    console.error(e);

    const errorMessages = [
      "API余额耗尽了，去b站提醒我充钱吧",
    ];

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
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) sendMessage();
}

function clearChat() {
  if (confirm("确定要清空全部对话吗？")) {
    chatLog.value = [
      {
        id: Date.now(),
        role: "bot",
        text: "你好，我是珂朵莉，有什么想知道的吗？",
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
      text: "你好，我是珂朵莉，有什么想知道的吗？",
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
  stats.totalTime += Date.now() - sessionStart
  saveStats()
}

onMounted(() => {
  scrollToBottom();
  window.addEventListener("beforeunload", handleBeforeUnload)
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload)
});
</script>

<style scoped lang="scss">
.chat-page {
  padding-top: 64px;
  min-height: 100vh;
  background: linear-gradient(to bottom right,
      #1e2e4d,
      #758cb3,
      #d06487);
  color: #e9eef8;
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
      background: rgba(164, 217, 249, 0.12);
      backdrop-filter: blur(6px);
      padding: 8px 16px;
      border-radius: 12px;
      font-size: 14px;
      color: #e9eef8;
      justify-content: space-around;

      .stat-item span {
        color: #a4d9f9;
        font-weight: bold;
      }

      .detail-btn {

        background: transparent;
        border: 1px solid #a4d9f9;
        border-radius: 4px;
        color: #a4d9f9;
        padding: 4px 12px;
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
          background: rgba(164, 217, 249, 0.2);
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

    &.user {
      flex-direction: row-reverse;
    }

    &.error .bubble {
      background: rgba(209, 107, 165, 0.3);
      border: 1px solid #d16ba5;
    }

    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      margin: 0 8px;
      background-size: cover;
      flex-shrink: 0;
      box-shadow: 0 0 10px rgba(164, 217, 249, 0.5);
      z-index: 10;

      &.bot {
        background-image: url("@/assets/chtholly-avatar2.webp");
        box-shadow: 0 0 14px #a4d9f9;

      }

      &.user {
        background: rgba(255, 255, 255, 0.8);
      }
    }

    .bubble {
      max-width: 70%;
      background: rgba(164, 217, 249, 0.08);
      border: 1px solid rgba(164, 217, 249, 0.3);
      backdrop-filter: blur(10px);
      padding: 12px 16px;
      border-radius: 16px;
      line-height: 1.6;
      word-break: break-word;
      box-shadow: 0 0 6px rgba(164, 217, 249, 0.4);

      &:hover {
        box-shadow: 0 0 12px rgba(164, 217, 249, 0.5);
      }

      &.loading {
        color: rgba(255, 255, 255, 0.7);
      }

      .message.bot & {
        border-radius: 16px 16px 16px 4px;
      }

      .message.user & {
        border-radius: 16px 16px 4px 16px;
      }
    }
  }

  .input-area {
    position: sticky;
    bottom: 0;
    display: flex;
    align-items: center;
    background: rgba(15, 20, 60, 0.8);
    backdrop-filter: blur(6px);
    padding: 8px 12px;
    gap: 8px;
    z-index: 10;
    border-radius: 12px;

    input {
      flex: 1;
      padding: 12px 20px;
      background: transparent;
      border: none;
      color: #e9eef8;
      font-size: 16px;
      outline: none;

      &::placeholder {
        color: rgba(233, 238, 248, 0.6);
      }
    }

    .btn-group {
      display: flex;
      gap: 6px;

      button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
        border: none;
        border-radius: 50%;
        background: rgba(164, 217, 249, 0.1);
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
          background: rgba(164, 217, 249, 0.3);
        }

        &.voice-btn {
          font-size: 18px;
        }

        &.clear-btn {
          font-size: 16px;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    .send-btn {
      padding: 0 24px;
      height: 40px;
      background: linear-gradient(135deg, #a4d9f9, #2f3f6b);
      border: none;
      border-radius: 20px;
      color: #fff;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.3s;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &:hover {
        background: linear-gradient(135deg, #bedcff, #416a9c);
        box-shadow: 0 0 12px rgba(190, 220, 255, 0.6);
      }

      @keyframes pulse {

        0%,
        100% {
          box-shadow: 0 0 8px rgba(190, 220, 255, 0.4);
        }

        50% {
          box-shadow: 0 0 14px rgba(190, 220, 255, 0.8);
        }
      }

      &:not(:disabled) {
        animation: pulse 4s ease-in-out infinite;
      }
    }

    .Alldetail-btn {
      margin-left: 4px;
      background: transparent;
      border: 1px solid #a4d9f9;
      border-radius: 4px;
      padding: 4px 12px;
      color: #a4d9f9;
      font-size: 14px;
      cursor: pointer;
      display: none;

      &:hover {
        background: rgba(164, 217, 249, 0.2);
      }
    }
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 5, 40, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;

    .modal-content {
      background: rgba(20, 20, 60, 0.9);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(164, 217, 249, 0.4);
      border-radius: 16px;
      padding: 24px;
      width: 320px;
      color: #e9eef8;
      box-shadow: 0 0 20px rgba(164, 217, 249, 0.3);
      animation: fadeIn 0.3s ease;

      h3 {
        margin-bottom: 16px;
        font-size: 20px;
        font-weight: bold;
        text-align: center;
        color: #a4d9f9;
        border-bottom: 1px solid rgba(164, 217, 249, 0.3);
        padding-bottom: 8px;
      }

      .detail-list {
        list-style: none;
        padding: 0;
        margin: 0 0 20px;
        line-height: 1.6;
        font-size: 14px;

        li {
          margin-bottom: 8px;
          color: #e9eef8;

          &:nth-child(odd) {
            color: #b0ccea;
          }
        }
      }

      .close-btn {
        margin: 0 auto;
        padding: 8px 20px;
        background: transparent;
        border: 1px solid #a4d9f9;
        border-radius: 6px;
        color: #a4d9f9;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background: rgba(164, 217, 249, 0.2);
          transform: scale(1.05);
          box-shadow: 0 0 8px rgba(164, 217, 249, 0.4);
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
      gap: 6px;

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
