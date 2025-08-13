<template>
    <div class="home">
        <main class="center-content">
            <h1 class="title">加藤惠の世界</h1>
            <transition name="fade">
                <p v-show="show" class="subtitle">{{ displayedText }}</p>
            </transition>
        </main>
        <footer class="footer">© 2025 加藤惠 | Kato Megumi</footer>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const phrases = [
    '「如果你不主动接近我，我大概就会一直保持这种存在感吧。」',
    '「我想做的，只是一个安静地陪在你身边的普通女主角。」',
    '「果然，我只是个不起眼的路人角色吧。」',
    '「我一直都在，只是你没有注意到。」',
    '「恋爱游戏的女主角，也有想要被认真对待的时候。」',
   '「平凡却温柔，是你最治愈的存在。」',
    '「像普通女孩，却能温暖我的世界。」',
    '「无声的陪伴，是我最安心的力量。」',
    '「你的微笑，如初春的柔风。」',
    '「在平淡的日常中，你是最温柔的惊喜。」'
];

const displayedText = ref('');
const show = ref(true);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function typeWriter(text: string) {
    displayedText.value = '';
    for (let i = 0; i < text.length; i++) {
        displayedText.value += text[i];
        await sleep(80); // 打字速度
    }
}

async function cyclePhrases() {
    while (true) {
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        show.value = true;
        await typeWriter(phrase);
        await sleep(2500); // 保持显示时间
        show.value = false;
        await sleep(1000); // 淡出时间
    }
}

onMounted(() => {
    cyclePhrases();
});
</script>

<style scoped lang="scss">
.home {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: #fafafa;
    color: #333;
    font-family: 'Noto Serif JP', serif;
    background-image: url("@/assets/homeBg.webp");
    background-repeat: no-repeat;
    background-size: cover;
}

.center-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
}

.title {
    font-size: 2.8rem;
    margin-bottom: 1.5rem;
    font-weight: 600;
}

.subtitle {
    font-size: 1.2rem;
    color: #666;
    max-width: 80%;
    white-space: pre-wrap;
    min-height: 3rem;
}

.footer {
    text-align: center;
    font-size: 0.9rem;
    padding: 1.5rem 0;
    color: #999;
}

/* 渐显渐隐效果 */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 1s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
