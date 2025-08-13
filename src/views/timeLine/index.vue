<template>
  <div class="megumi-page" aria-live="polite">
    <main class="container">
      <!-- HERO -->
      <header class="hero" role="banner">
        <div class="left-col">
          <button class="avatar-card" ref="avatarCard" @click="openAvatar" @keydown.enter.prevent="openAvatar"
            @keydown.space.prevent="openAvatar" aria-label="查看加藤惠头像大图" :aria-expanded="isAvatarOpen">
            <picture class="avatar-wrap">
              <!-- 可替换为更高分辨率资源 / srcset -->
              <img src="@/assets/megumi_kato.png" alt="加藤惠 头像" class="avatar" loading="lazy" decoding="async" />
            </picture>

            <div class="avatar-meta">
              <span class="avatar-badge">配音 · {{ profile.voice }}</span>
              <span class="sakura-note" aria-hidden="true">代表花 · 樱花</span>
            </div>
          </button>


        </div>

        <div class="right-col" ref="metaCard">
          <h1 class="name">{{ profile.name }} <span class="jp">（{{ profile.jp }}）</span></h1>

          <p class="lead">
            《路人女主的养成方法》中平凡却独具魅力的女主。外表沉静、内心细腻，作为
            <em>blessing software</em> 中关键的一员，承担剧本与演出等重要工作，人物弧线由“路人”逐步成长为“女主”。
          </p>



          <!-- 桌面侧边 quick-info（sticky） -->
          <aside class="quick-info" ref="infoCard" aria-label="角色快速信息">
            <h3 class="qi-title">快速资料</h3>
            <dl>
              <div>
                <dt>中文名</dt>
                <dd>{{ profile.name }}</dd>
              </div>
              <div>
                <dt>外文名</dt>
                <dd>{{ profile.jp }}</dd>
              </div>
              <div>
                <dt>生日</dt>
                <dd>{{ profile.birthday }}（{{ profile.zodiac }}）</dd>
              </div>
              <div>
                <dt>身高</dt>
                <dd>{{ profile.height }}</dd>
              </div>
              <div>
                <dt>三围</dt>
                <dd>{{ profile.sizes }}</dd>
              </div>
              <div>
                <dt>学校</dt>
                <dd>{{ profile.school }}</dd>
              </div>
              <div>
                <dt>社团</dt>
                <dd>{{ profile.club }}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </header>

      <!-- CONTENT -->
      <section id="overview" class="card overview">
        <div class="card-head">
          <h2>角色概览</h2>
        </div>

        <p class="desc">
          加藤惠为私立丰之崎学园学生，最初被描绘为存在感薄弱的普通少女，但其细腻与温柔在剧情中逐步显露，是团队中不可或缺的稳定力量。
        </p>

        <div class="grid two-col">
          <div>
            <h3>身份与经历</h3>
            <ul>
              <li>安艺伦也的同班同学，曾多次换班级（一年E→二年B→三年A）</li>
              <li>成为 blessing software 的核心成员，承担剧本与演出等工作</li>
              <li>在关键时刻以沉着支持团队完成作品</li>
            </ul>
          </div>

          <div>
            <h3>外观与造型</h3>
            <ul>
              <li>首登场：波波头配白贝雷帽</li>
              <li>后续发型变化（短马尾→普通马尾→黑长直→回归波波头）反映内心成长</li>
              <li>穿搭简洁日常，重要场合会适当精心打扮</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="personality" class="card personality">
        <h2>性格特征</h2>
        <ul class="traits">
          <li><strong>存在感薄弱</strong> — 外表平静，细节处流露真实魅力。</li>
          <li><strong>温柔体贴</strong> — 善解人意，常为他人考虑。</li>
          <li><strong>冷静理性</strong> — 关键时刻具有沉着判断力。</li>
          <li><strong>耐心与包容</strong> — 对团队持接纳态度。</li>
          <li><strong>情感含蓄</strong> — 平常淡然，必要时会表达真实情感。</li>
        </ul>

        <blockquote class="quote">「伦也君是属于我的。」 — 小说后期（感情确认）</blockquote>
      </section>

      <section id="timeline" class="card timeline">
        <div class="card-head">
          <h2>剧情时间线 · 重点节点</h2>
         
        </div>

        <div class="tl-wrap">
          <div class="vl" aria-hidden="true"></div>
          <ol class="tl-list">
            <li v-for="(ev, i) in visibleTimeline" :key="i" class="tl-item">
              <div class="marker" aria-hidden="true"><span>{{ i + 1 }}</span></div>
              <div class="tl-card">
                <div class="tl-meta">{{ ev.time }}</div>
                <h3 class="tl-title">{{ ev.title }}</h3>
                <p class="tl-desc">{{ ev.desc }}</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <footer class="credits">
        <p>资料整合自轻小说原文、官方设定及公开条目；若有纰漏欢迎指正。</p>
      </footer>
    </main>

    <!-- 简易模态：头像大图 -->
    <div v-if="isAvatarOpen" class="overlay" role="dialog" aria-modal="true" @click.self="closeAvatar">
      <button class="overlay-close" @click="closeAvatar" aria-label="关闭大图">✕</button>
      <div class="overlay-content">
        <img src="@/assets/megumi_kato.png" alt="加藤惠 大图" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

const profile = reactive({
  name: '加藤惠',
  jp: '加藤 恵（かとう めぐみ；Megumi Kato）',
  voice: '安野希世乃',
  birthday: '1995-09-23',
  zodiac: '处女座',
  height: '160 cm',
  sizes: '84 / 57 / 83 cm',
  school: '私立丰之崎学校（班级：一年E→二年B→三年A）',
  club: 'blessing software（同人游戏社团）'
});

const timeline = ref([
  { time: '入学前', title: '入学考相遇', desc: '在丰之崎学园入学考试阶段与伦也相遇并有短暂交集。' },
  { time: '一年级', title: '同班但未被注意', desc: '虽同班一年，但伦也几乎未注意到她的存在。' },
  { time: '坡道邂逅', title: '白贝雷帽被风刮跑', desc: '坡道上帽子被风刮走，被伦也捡到，成为重要相遇节点。' },
  { time: '社团成立', title: '加入 blessing software', desc: '应伦也邀请加入社团并促成英梨梨、诗羽的加入，成为女主并承担多项工作。' },
  { time: '冲突与和解', title: '冷战与重新接近', desc: '因误会冷战，后在伦也的坦诚与努力下和好并确认彼此心意。' },
  { time: '成长', title: '从路人到女主', desc: '发型与心态的变化象征她逐步成为故事核心与伦也的伴侣。' }
]);

// 控制显示（折叠/展开 timeline）
const compact = ref(false);
const visibleTimeline = computed(() => (compact.value ? timeline.value.slice(0, 3) : timeline.value));

// 模态控制
const isAvatarOpen = ref(false);
function openAvatar() { isAvatarOpen.value = true; document.body.style.overflow = 'hidden'; }
function closeAvatar() { isAvatarOpen.value = false; document.body.style.overflow = ''; }



onMounted(() => {
  // prefers-reduced-motion 考量
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduced) {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.avatar-card', { duration: 0.8, y: 18, opacity: 0, scale: 0.99 })
      .from('.right-col > .name', { duration: 0.9, x: 24, opacity: 0 }, '-=0.45')
      .from('.quick-info', { duration: 0.7, y: 12, opacity: 0 }, '-=0.55');

    // timeline items
    gsap.utils.toArray('.tl-item').forEach((it, idx) => {
      gsap.from(it.querySelector('.tl-card'), {
        scrollTrigger: {
          trigger: it,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        },
        opacity: 0,
        y: 22,
        duration: 0.7,
        delay: idx * 0.06
      });
    });

    // 轻微呼吸动画（非强制）
    gsap.to('.avatar-card', { scale: 1.007, duration: 2.8, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  } else {
    // reduced motion: 加上简单的可访问 fading-class
    document.documentElement.classList.add('reduced-motion');
  }
});
</script>

<style scoped lang="scss">
/* palette */
:root {
  --bg-start: #fffafc;
  --bg-end: #f8f7fb;
  --card: #ffffff;
  --muted: #6f6f6f;
  --text: #14202b;
  --accent: #f3b7c9;
  --accent-2: #9fb8d1;
  --glass: rgba(255, 255, 255, 0.7);
  --max-width: 1100px;
}

.megumi-page {
  min-height: 100vh;
  background: linear-gradient(180deg, var(--bg-start), var(--bg-end));
  font-family: 'Noto Sans SC', system-ui, -apple-system, 'Segoe UI', Roboto, Arial;
  color: var(--text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  padding: clamp(18px, 4vw, 80px);
  box-sizing: border-box;
  background-image: url("@/assets/timeLineBg.webp");
  background-repeat: no-repeat;
  background-position: right top;
  background-size: cover;
}

.container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: clamp(12px, 2vw, 40px);
}

/* HERO */
.hero {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 28px;
  align-items: start;
}

.left-col {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.avatar-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(255, 250, 252, 0.95));
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 18px 50px rgba(20, 20, 30, 0.06);
  display: grid;
  justify-items: center;
  gap: 8px;
  border: 1px solid rgba(220, 220, 225, 0.6);
  cursor: pointer;
  transition: transform .28s cubic-bezier(.2, .9, .3, 1), box-shadow .28s;
}

.avatar-card:focus {
  outline: 3px solid rgba(243, 183, 201, 0.18);
}

.avatar-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 28px 70px rgba(20, 20, 30, 0.08);
}

.avatar-wrap {
  width: 100%;
  display: block;
}

.avatar {
  width: 100%;
  height: auto;
  border-radius: 10px;
  display: block;
  box-shadow: 0 10px 36px rgba(20, 20, 30, 0.06);
  border: 3px solid rgba(255, 255, 255, 0.85);
}

.avatar-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.avatar-badge {
  font-size: 0.9rem;
  color: var(--muted);
}

.sakura-note {
  font-size: 0.82rem;
  color: var(--accent);
}

.right-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.name {
  font-size: clamp(1.4rem, 2.5vw, 2rem);
  margin: 0;
  color: var(--text);
}

.jp {
  font-size: .95rem;
  color: var(--muted);
  margin-left: 8px;
  font-weight: 400;
}

.lead {
  margin: 6px 0 0;
  color: #47525a;
  line-height: 1.7;
  max-width: 78ch;
}



.btn {
  padding: 10px 14px;
  border-radius: 12px;
  border: none;
  background: #fff;
  box-shadow: 0 8px 22px rgba(20, 20, 30, 0.04);
  cursor: pointer;
  font-weight: 600;
}

.btn.primary {
  background: linear-gradient(90deg, #fff, #fff);
  border: 1px solid rgba(240, 120, 160, 0.06);
}

.btn:active {
  transform: translateY(1px);
}

.quick-info {
  margin-top: 12px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), var(--glass));
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 10px 28px rgba(20, 20, 30, 0.04);
  font-size: 0.95rem;
  position: sticky;
  top: 18px;
  align-self: start;
}

.qi-title {
  margin: 0 0 8px;
  font-size: 0.95rem;
  color: #333;
}

.quick-info dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 10px;
}

.quick-info dt {
  font-weight: 600;
  color: #555;
  font-size: 0.85rem;
}

.quick-info dd {
  margin: 0;
  color: #333;
  font-size: 0.93rem;
}

/* Cards */
.card {
  margin-top: 22px;
  background: var(--card);
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 18px 44px rgba(20, 20, 30, 0.04);
}

.card h2 {
  margin: 0 0 8px 0;
  font-size: 1.12rem;
  color: var(--text);
}

.desc {
  color: #444;
  line-height: 1.75;
  margin-bottom: 12px;
}

.overview .two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-top: 8px;
}

.personality .traits {
  list-style: none;
  margin: 0;
  padding: 0;
}

.personality .traits li {
  padding: 12px 0;
  border-bottom: 1px dashed #f5f5f5;
  font-size: 1rem;
  color: #333;
}

.quote {
  margin-top: 12px;
  padding: 12px 14px;
  border-left: 4px solid var(--accent);
  background: linear-gradient(90deg, rgba(243, 183, 201, 0.04), transparent);
  color: #4f4f4f;
  border-radius: 6px;
}

/* Timeline */
.timeline .tl-wrap {
  position: relative;
  padding: 8px 0 0 0;
}

.timeline .vl {
  position: absolute;
  left: 56px;
  top: 26px;
  bottom: 20px;
  width: 2px;
  background: linear-gradient(180deg, var(--accent), var(--accent-2));
  border-radius: 2px;
  opacity: 0.12;
}

.tl-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.tl-item {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  padding: 12px 8px 18px 8px;
  position: relative;
}

.marker {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  flex: 0 0 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #fff, rgba(255, 255, 255, 0.95));
  box-shadow: 0 8px 20px rgba(20, 20, 30, 0.06);
  border: 1px solid rgba(200, 200, 200, 0.08);
}

.marker span {
  font-weight: 700;
  color: var(--accent);
}

.tl-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.96));
  border-radius: 10px;
  padding: 10px 14px;
  box-shadow: 0 10px 32px rgba(20, 20, 30, 0.04);
  width: calc(100% - 60px);
}

.tl-meta {
  color: var(--muted);
  font-size: 0.9rem;
  margin-bottom: 6px;
}

.tl-title {
  margin: 0;
  font-size: 1.02rem;
  color: var(--text);
}

.tl-desc {
  margin: 8px 0 0;
  color: #444;
  line-height: 1.6;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}



.credits {
  margin-top: 18px;
  color: var(--muted);
  font-size: 0.94rem;
}

/* Overlay */
.overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(6, 8, 10, 0.6);
  z-index: 1200;
}

.overlay-content img {
  max-width: min(90vw, 720px);
  width: 100%;
  height: auto;
  border-radius: 10px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
}

.overlay-close {
  position: absolute;
  top: 18px;
  right: 18px;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
}

/* Responsive */
@media (max-width: 980px) {
  .hero {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .quick-info {
    display: none;
  }

  .overview .two-col {
    grid-template-columns: 1fr;
  }

  .timeline .vl {
    left: 40px;
  }
}

@media (max-width: 560px) {
  .container {
    padding: 12px;
  }

  .avatar-card {
    width: 92%;
    margin: 0 auto;
  }

  .lead {
    font-size: 0.98rem;
  }

  .marker {
    width: 36px;
    height: 36px;
    flex: 0 0 36px;
  }

  .tl-card {
    width: calc(100% - 56px);
  }



  .btn {
    width: 100%;
  }
}

/* reduced motion class */
.reduced-motion * {
  transition: none !important;
  animation: none !important;
}

/* small accessibility tweaks */
.avatar-card,
.btn{
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0.06);
}
</style>
