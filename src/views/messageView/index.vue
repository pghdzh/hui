<template>
  <div class="megumi-message-board">
    <!-- 半透明标题 -->
    <header class="board-header">
      <h1>惠惠の小屋</h1>
    </header>

    <!-- 留言展示区 -->
    <section class="message-list">
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="message-card"
      >
        <div class="message-meta">
          <span class="message-name">{{ msg.name }}</span>
          <span class="message-time">{{ formatTime(msg.created_at) }}</span>
        </div>
        <p class="message-content">{{ msg.content }}</p>
      </div>
    </section>

    <!-- 底部发送区 -->
    <section class="message-form">
      <input v-model="name" type="text" placeholder="你的昵称" />
      <textarea v-model="content" placeholder="写下你的留言..." />
      <button @click="submitMessage" :disabled="!content.trim()">发送</button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getMessageList, createMessage } from '@/api/modules/message';

const messages = ref<any[]>([]);
const name = ref(localStorage.getItem('megumi_name') || '');
const content = ref('');

const fetchMessages = async () => {
  try {
    const res = await getMessageList({page: 1, pageSize: 9999});
    messages.value = res.data?.records || res.data || [];
  } catch (err) {
    console.error(err);
  }
};

const submitMessage = async () => {
  if (!content.value.trim()) return;
  try {
    await createMessage({ name: name.value || '匿名', content: content.value });
    localStorage.setItem('megumi_name', name.value);
    content.value = '';
    await fetchMessages();
  } catch (err) {
    console.error(err);
  }
};

const formatTime = (time: string) => {
  return new Date(time).toLocaleString();
};

onMounted(() => {
  fetchMessages();
});
</script>

<style scoped>
.megumi-message-board {
  position: relative;
  min-height: 100vh;
  padding-top: 80px;
  display: flex;
  flex-direction: column;
  /* background: url('/assets/megumi-bg.jpg') no-repeat center/cover;  */
}

/* 半透明顶部标题 */
.board-header {
  background: rgba(255, 255, 255, 0.3);
  padding: 10px;
  text-align: center;
  backdrop-filter: blur(5px);
}
.board-header h1 {
  color: #e48a9f;
  font-size: 22px;
  font-weight: bold;
}

/* 留言列表 */
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}
.message-card {
  background: rgba(255, 255, 255, 0.85);
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}
.message-meta {
  font-size: 13px;
  color: #999;
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}
.message-name {
  color: #e48a9f;
  font-weight: bold;
}
.message-content {
  font-size: 14px;
  color: #444;
  line-height: 1.4;
  word-break: break-word;
}

/* 固定底部输入区 */
.message-form {
  position: sticky;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  backdrop-filter: blur(5px);
}
.message-form input,
.message-form textarea {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 14px;
}
.message-form textarea {
  resize: none;
  height: 60px;
}
.message-form button {
  padding: 8px;
  background: #e48a9f;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}
.message-form button:disabled {
  background: #f3c2cc;
  cursor: not-allowed;
}
.message-form button:hover:not(:disabled) {
  background: #d2798c;
}

/* 移动端优化 */
@media (max-width: 600px) {
  .board-header h1 {
    font-size: 18px;
  }
  .message-card {
    padding: 8px 10px;
  }
}
</style>
