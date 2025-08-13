<template>
  <div class="megumi-message-board" aria-live="polite">

    <!-- 半透明顶部标题 -->
    <header class="board-header" role="banner">
      <div class="title-wrap">
        <h1>惠惠の小屋</h1>
        <p class="subtitle">静静地说一句：欢迎来访</p>
      </div>
    </header>

    <!-- 留言展示区 -->
    <section class="message-list" >
      <transition-group name="msg" tag="div" class="message-list-inner">
        <!-- skeleton loading -->
        <div v-if="loading" class="skeleton-wrap" key="skeleton">
          <div class="skeleton" v-for="i in 4" :key="i">
            <div class="sk-avatar"></div>
            <div class="sk-lines">
              <div class="sk-line short"></div>
              <div class="sk-line"></div>
            </div>
          </div>
        </div>

        <!-- messages -->
        <div v-for="(msg, idx) in messages" :key="msg.id || msg._tempId || idx" class="message-card" :data-index="idx"
          tabindex="0" role="article" :aria-label="`留言来自 ${msg.name || '匿名'}，内容：${msg.content}`">
          <div class="message-meta">
            <div class="left-meta">
              <div class="name-avatar" :title="msg.name || '匿名'">{{ getInitial(msg.name) }}</div>
              <div class="meta-texts">
                <div class="message-name">{{ msg.name || '匿名' }}</div>
                <div class="message-time">{{ formatTime(msg.created_at) }}</div>
              </div>
            </div>
            <div class="meta-actions" aria-hidden="true">
              <span class="heart">❤</span>
            </div>
          </div>

          <p class="message-content">{{ msg.content }}</p>
        </div>
      </transition-group>
    </section>

    <!-- 底部发送区 -->
    <section class="message-form" aria-label="写下你的留言">
      <label class="sr-only" for="mb-name">你的昵称</label>
      <input id="mb-name" v-model="name" type="text" placeholder="你的昵称" @keydown.enter.prevent />

      <label class="sr-only" for="mb-content">留言内容</label>
      <textarea id="mb-content" v-model="content" placeholder="写下你的留言...（按 Ctrl+Enter 发送）"
        @keydown.ctrl.enter.prevent="submitMessage" @input="autoGrow" ref="textareaRef" />

      <div class="form-row">
        <div class="hint">按 <kbd>Ctrl</kbd> + <kbd>Enter</kbd> 快捷发送</div>
        <button @click="submitMessage" :disabled="isSending || !content.trim()"
          aria-disabled="isSending || !content.trim()">
          <span v-if="!isSending">发送</span>
          <span v-else>发送中…</span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { getMessageList, createMessage } from '@/api/modules/message';

const messages = ref<any[]>([]);
const name = ref(localStorage.getItem('megumi_name') || '');
const content = ref('');
const loading = ref(true);
const isSending = ref(false);


const textareaRef = ref<HTMLTextAreaElement | null>(null);

const fetchMessages = async () => {
  loading.value = true;
  try {
    const res = await getMessageList({ page: 1, pageSize: 9999 });
    messages.value = res.data|| [];
    await nextTick();
    
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const submitMessage = async () => {
  if (!content.value.trim() || isSending.value) return;
  isSending.value = true;
  const payload = { name: name.value || '匿名', content: content.value };
  try {
    localStorage.setItem('megumi_name', name.value);
    content.value = '';
    await nextTick();
    // 发送请求
    await createMessage(payload);
    // 重新同步列表（更可靠）
    await fetchMessages();
  } catch (err) {
    console.error(err);
  } finally {
    isSending.value = false;
  }
};

const formatTime = (time: string) => {
  if (!time) return '';
  const d = new Date(time);
  // 例如：2025-08-11 15:30
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
};

const getInitial = (n?: string) => {
  if (!n) return '惠';
  return n.trim().slice(0, 1).toUpperCase();
};



const autoGrow = (e?: Event) => {
  const ta = textareaRef.value;
  if (!ta) return;
  ta.style.height = 'auto';
  const h = Math.min(ta.scrollHeight, 220);
  ta.style.height = h + 'px';
};

onMounted(() => {
  fetchMessages();
  // ensure textarea autosize initial
  nextTick(() => autoGrow());
});
</script>

<style scoped lang="scss">
.megumi-message-board {
  position: relative;
  min-height: 100vh;
  padding-top: 92px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #fffafc 0%, #fbf7ff 40%, #f6f9ff 100%);
  font-family: "Noto Sans", "Helvetica Neue", Arial, sans-serif;
  color: #2f2f2f;
  overflow: hidden;


  /* 半透明顶部标题 */
  .board-header {
    position: absolute;
    top: 74px;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 28px);
    max-width: 920px;
    background: rgba(255, 255, 255, 0.6);
    padding: 14px 18px;
    border-radius: 14px;
    box-shadow: 0 6px 24px rgba(86, 86, 86, 0.06);
    backdrop-filter: blur(6px);
    z-index: 2;
    border: 1px solid rgba(230, 220, 230, 0.6);

    .title-wrap {
      display: flex;
      align-items: center;
      gap: 14px;


      h1 {
        margin: 0;
        font-size: 18px;
        color: #c86b7f;
        letter-spacing: 0.4px;
      }

      .subtitle {
        margin: 0;
        margin-left: auto;
        color: #8f8f95;
        font-size: 13px;
      }
    }
  }

  /* 留言列表 */
  .message-list {
    z-index: 1;
    position: relative;
    flex: 1;
    overflow-y: auto;
    padding: 20px 20px 240px;
    margin-top: 18px;

    .message-list-inner {
      max-width: 920px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* skeleton */
    .skeleton-wrap {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .skeleton {
        display: flex;
        gap: 12px;
        align-items: center;
        padding: 12px;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(50, 50, 60, 0.03);
      }

      .sk-avatar {
        width: 42px;
        height: 42px;
        border-radius: 8px;
        background: linear-gradient(90deg, #f3dce9, #f7eef8);
      }

      .sk-lines {
        flex: 1;

        .sk-line {
          height: 10px;
          border-radius: 6px;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.8), rgba(230, 220, 230, 0.7));
          margin-bottom: 8px;
        }

        .sk-line.short {
          width: 40%;
        }
      }
    }
  }

  .message-card {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.95));
    border-radius: 14px;
    padding: 12px 14px;
    margin: 0 auto;
    width: calc(100% - 40px);
    max-width: 920px;
    box-shadow: 0 6px 18px rgba(197, 173, 184, 0.08);
    border: 1px solid rgba(245, 235, 240, 0.7);
    transition: transform 0.28s cubic-bezier(.2, .9, .2, 1), box-shadow 0.28s;
    transform-origin: center;
    z-index: 1;

    &:hover {
      transform: translateY(-6px) scale(1.01);
      box-shadow: 0 12px 28px rgba(166, 126, 140, 0.12);
    }

    .message-meta {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 8px;

      .left-meta {
        display: flex;
        gap: 10px;
        align-items: center;

        .name-avatar {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #ffffff;
          background: linear-gradient(180deg, #f7c7d9 0%, #f1e2f6 100%);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: inset 0 -6px 10px rgba(226, 181, 200, 0.12);
          font-size: 16px;
        }

        .meta-texts {
          .message-name {
            font-size: 15px;
            color: #bd6a7b;
            font-weight: 700;
            line-height: 1;
          }

          .message-time {
            font-size: 12px;
            color: #9a9a9a;
            margin-top: 2px;
          }
        }
      }

      .meta-actions {
        font-size: 14px;
        color: #f08a9a;
      }
    }

    .message-content {
      font-size: 15px;
      color: #3b3b3b;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
      padding-bottom: 2px;
    }
  }

  /* transition-group 动画（消息淡入上移） */
  .msg-enter-from,
  .msg-leave-to {
    opacity: 0;
    transform: translateY(12px);
    filter: blur(0.6px);
  }

  .msg-enter-active,
  .msg-leave-active {
    transition: all 360ms cubic-bezier(0.2, 0.9, 0.2, 1);
  }

  /* 固定底部输入区 */
  .message-form {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: 18px;
    width: calc(100% - 28px);
    max-width: 920px;
    background: rgba(255, 255, 255, 0.94);
    padding: 14px;
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-shadow: 0 10px 30px rgba(142, 118, 133, 0.08);
    z-index: 3;
    border: 1px solid rgba(241, 232, 239, 0.7);

    input,
    textarea {
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid #eee;
      font-size: 14px;
      outline: none;
      transition: box-shadow 0.18s, border-color 0.18s;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(250, 248, 251, 0.98));
      box-shadow: inset 0 -4px 8px rgba(234, 217, 227, 0.05);
    }

    input:focus,
    textarea:focus {
      border-color: rgba(200, 110, 130, 0.9);
      box-shadow: 0 6px 22px rgba(210, 144, 156, 0.08);
    }

    textarea {
      resize: none;
      min-height: 56px;
      max-height: 220px;
      line-height: 1.6;
    }

    .form-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;

      .hint {
        color: #8f8f95;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 8px;

        kbd {
          background: rgba(240, 240, 240, 0.9);
          border-radius: 6px;
          padding: 2px 6px;
          border: 1px solid rgba(220, 220, 220, 0.9);
          box-shadow: inset 0 -2px 4px rgba(200, 200, 200, 0.03);
          font-size: 12px;
        }
      }

      button {
        padding: 10px 16px;
        background: linear-gradient(180deg, #e98aa0 0%, #d57086 100%);
        color: #fff;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-weight: 700;
        box-shadow: 0 6px 18px rgba(213, 99, 123, 0.16);
        transition: transform 0.16s, box-shadow 0.16s, opacity 0.12s;
      }

      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
        background: linear-gradient(180deg, #f6c7d1 0%, #f2d6dd 100%);
        color: #fff;
      }

      button:not(:disabled):active {
        transform: translateY(1px);
      }
    }
  }

  /* 屏幕小的适配 */
  @media (max-width: 600px) {
    padding-top: 80px;

    .board-header {
      left: 12px;
      transform: none;
      width: calc(100% - 24px);
    }

    .message-card {
      width: calc(100% - 28px);
      border-radius: 12px;
    }

    .message-form {
      left: 12px;
      transform: none;
      width: calc(100% - 24px);
      bottom: 12px;
      padding: 12px;
    }

    .board-header .title-wrap h1 {
      font-size: 16px;
    }

    .bg-decor .petal {
      width: 12px;
      height: 12px;
    }
  }

  /* 隐藏类名（可用于无障碍描述） */
  .sr-only {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }
}
</style>
