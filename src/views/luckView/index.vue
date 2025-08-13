<template>
    <div class="kato-fortune-page" role="main">
        <header class="hero">
            <div class="badge">加藤惠 · 每日运势</div>
            <h1 class="page-title">今天的运势</h1>
            <p class="lead">轻轻看看就好，不必太在意。惠会在这里静静地陪着你。</p>
        </header>

        <section class="draw-zone" aria-labelledby="draw-btn">
            <div class="reel-wrap" aria-hidden="true">
                <div class="reel" :class="{ spinning: drawing }">
                    <div class="reel-item" v-for="(t, i) in reelPreview" :key="i">{{ t }}</div>
                </div>
            </div>

            <button id="draw-btn" class="draw-button" :disabled="drawing || drawnToday" @click="onDraw"
                :aria-busy="drawing" :aria-disabled="drawing || drawnToday">
                <template v-if="drawnToday">已抽取 — {{ savedResult?.type }}</template>
                <template v-else-if="drawing">抽取中…</template>
                <template v-else>抽取今日运势</template>
            </button>

            <p class="hint" v-if="drawnToday">
                今天已抽过，明天再来吧。
            </p>
        </section>

        <section class="result-zone" aria-live="polite">
            <div class="card-stage">
                <div class="result-card" :class="{ flipped: revealed }" role="region" aria-label="运势卡片">
                    <!-- 卡片正面 -->
                    <div class="card-face card-front" aria-hidden="true">
                        <div class="avatar-wrap">
                            <div class="avatar-sticker" aria-hidden="true">
                                <svg viewBox="0 0 64 64" class="avatar-svg" aria-hidden="true">
                                    <defs>
                                        <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
                                            <stop offset="0" stop-color="#fff7f2" />
                                            <stop offset="1" stop-color="#ffeef3" />
                                        </linearGradient>
                                    </defs>
                                    <rect width="64" height="64" rx="12" fill="url(#g1)" />
                                    <circle cx="32" cy="24" r="10" fill="#d9b2a8" />
                                    <rect x="14" y="40" width="36" height="12" rx="6" fill="#e8cfc6" />
                                </svg>
                            </div>
                        </div>
                        <div class="front-text">
                            <div class="level-ghost">——</div>
                            <div class="front-msg">点「抽取」揭晓今日运势</div>
                        </div>
                    </div>

                    <!-- 卡片背面（结果） -->
                    <div class="card-face card-back">
                        <div class="back-top">
                            <div class="level-pill" :class="savedResult?.typeClass || result?.typeClass">
                                {{ savedResult?.type || result?.type || '—' }}
                            </div>
                            <div class="summary" aria-hidden="true">{{ typed.summary || '' }}</div>
                        </div>

                        <div class="back-body">
                            <div class="row">
                                <div class="label">爱情</div>
                                <div class="value" v-html="typed.love || ''"></div>
                            </div>
                            <div class="row">
                                <div class="label">工作 / 学业</div>
                                <div class="value" v-html="typed.work || ''"></div>
                            </div>
                            <div class="row">
                                <div class="label">财运</div>
                                <div class="value" v-html="typed.money || ''"></div>
                            </div>
                            <div class="row">
                                <div class="label">健康</div>
                                <div class="value" v-html="typed.health || ''"></div>
                            </div>

                            <div class="extras">
                                <div class="tip"><strong>小语：</strong><span v-html="typed.tip || ''"></span></div>
                                <div class="lucky"><strong>吉祥物：</strong><span>{{ savedResult?.lucky?.item ||
                                    result?.lucky?.item
                                    || '—' }}</span> </div>
                                <div class="lucky"><strong>幸运数字：</strong>  <span>{{ savedResult?.lucky?.number ||
                                    result?.lucky?.number
                                    || '—'
                                        }}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


        </section>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

type PoolBucket = {
    summaries: string[]
    love: string[]
    work: string[]
    money: string[]
    health: string[]
    tips: string[]
}

const types = [
    { key: 'daiji', label: '大吉', weight: 6, cls: 'daiji' },
    { key: 'zhongji', label: '中吉', weight: 14, cls: 'zhongji' },
    { key: 'xiaoji', label: '小吉', weight: 20, cls: 'xiaoji' },
    { key: 'ji', label: '吉', weight: 30, cls: 'ji' },
    { key: 'xiong', label: '凶', weight: 20, cls: 'xiong' },
    { key: 'daxiong', label: '大凶', weight: 10, cls: 'daxiong' }
]

const pool: Record<string, PoolBucket> = {
    daiji: {
        summaries: ['运势极佳，一切顺利。', '吉星高照，事情容易如愿。'],
        love: ['情感温和，可以主动一点。', '可能有小惊喜，留心身边的人。'],
        work: ['适合开始重要计划。', '创意与合作都很有利。'],
        money: ['小有收获，但别放松理财。', '适合整理理财计划或小额尝试。'],
        health: ['精神好，适合外出走走。', '注意均衡饮食。'],
        tips: ['今天的你，很值得信任。', '把握机会，但别太骄傲。']
    },
    zhongji: {
        summaries: ['状态良好，可以适当积极。', '机会不少，但要稳妥。'],
        love: ['交流顺畅，但不要强求。', '适合小范围约会或主动一点。'],
        work: ['按计划推进。', '注意细节会有收获。'],
        money: ['避免冲动消费。', '小额投资谨慎即可。'],
        health: ['能量充足但别过度透支。', '适合轻运动。'],
        tips: ['慢慢来，步步为营。', '别把自己逼得太紧。']
    },
    xiaoji: {
        summaries: ['有小幸运，但需耐心。', '小事带来小愉快。'],
        love: ['遇见有趣的小对话。', '顺其自然即可。'],
        work: ['小进步显现。', '适合整理与补强。'],
        money: ['小笔意外之财或优惠。', '节省一点更稳妥。'],
        health: ['注意眼睛疲劳。', '适当补水与休息。'],
        tips: ['期待小确幸，但别太依赖运气。', '做些小事，会有成就感.']
    },
    ji: {
        summaries: ['平稳的一天，适合常规安排。', '平凡但安稳。'],
        love: ['感情平淡，适合交流日常。', '别期待戏剧化发展。'],
        work: ['按部就班即可。', '清理任务清单会有收获。'],
        money: ['收支正常，守住当下。', '注意小额支出。'],
        health: ['精神稳定，注意放松。', '可安排短时休息。'],
        tips: ['平凡也值得珍惜。', '给自己一点温柔的时间。']
    },
    xiong: {
        summaries: ['需多加小心，别掉以轻心。', '易出现小波折，注意沟通。'],
        love: ['情绪易波动，别冲动。', '适合多聆听、少争辩。'],
        work: ['可能遇到阻碍，拆解问题再做。', '确认需求再行动。'],
        money: ['避免大额开支。', '注意小额骗局。'],
        health: ['注意休息，情绪管理重要。', '必要时寻求帮助。'],
        tips: ['小心为上，别冒险尝试。', '遇到问题，多问一句人。']
    },
    daxiong: {
        summaries: ['状况较差，建议保守。', '遇事先留白，稳住情绪再处理。'],
        love: ['易生误解，沟通耐心。', '避免激烈争论。'],
        work: ['不适合激进动作，先缓一缓。', '寻求他人协助更好。'],
        money: ['避免冲动消费、赌博。', '核对重要账务。'],
        health: ['适合静养，认真休息。', '不适及时就医。'],
        tips: ['先保护自己，再考虑别的。', '求助并不是软弱.']
    }
}

const luckyPool = {
    items: ['蓝色手帕', '一杯拿铁', '一本旧书', '一条围巾', '一只小挂件', '一支钢笔'],
    numbers: [3, 7, 8, 12, 21, 28, 33]
}

const reelPreview = ['大吉', '中吉', '小吉', '吉', '凶', '大凶', '爱情', '工作', '财运', '健康']

// 状态
const drawing = ref(false)
const revealed = ref(false)
const result = ref<any | null>(null)
const typed = reactive({ summary: '', love: '', work: '', money: '', health: '', tip: '' })

// localStorage 管理
const STORAGE_KEY = 'kato.fortune'
const todayStr = () => {
    const d = new Date()
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

function loadSaved() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (parsed?.date === todayStr() && parsed?.result) return parsed.result
    } catch (e) { /* ignore */ }
    return null
}

function saveToday(res: any) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayStr(), result: res }))
    } catch (e) { /* ignore */ }
}

const savedResult = ref<any | null>(null)
const drawnToday = ref(false)

// 启动时恢复
onMounted(() => {
    const s = loadSaved()
    if (s) {
        savedResult.value = s
        result.value = s
        drawnToday.value = true
        revealed.value = true
        Object.assign(typed, {
            summary: s.summary || '',
            love: s.love || '',
            work: s.work || '',
            money: s.money || '',
            health: s.health || '',
            tip: s.tip || ''
        })
    }
})

// 随机工具
function sample<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)] }
function randIndexByWeight(list: any[]) {
    const total = list.reduce((s, it) => s + it.weight, 0)
    let r = Math.random() * total
    for (const it of list) {
        if (r < it.weight) return it
        r -= it.weight
    }
    return list[list.length - 1]
}

function pickTypeKey() { return randIndexByWeight(types).key }

function makeResult(typeKey: string) {
    const bucket = pool[typeKey]
    const res = {
        type: types.find(t => t.key === typeKey)!.label,
        typeClass: types.find(t => t.key === typeKey)!.cls,
        summary: sample(bucket.summaries),
        love: sample(bucket.love),
        work: sample(bucket.work),
        money: sample(bucket.money),
        health: sample(bucket.health),
        tip: sample(bucket.tips),
        lucky: { item: sample(luckyPool.items), number: sample(luckyPool.numbers) }
    }
    return res
}

// 打字机效果
async function typeTo(targetKey: keyof typeof typed, text: string, speed = 26) {
    typed[targetKey] = ''
    for (let i = 0; i < text.length; i++) {
        typed[targetKey] += text[i]
        const extra = (text[i] === '。' || text[i] === '，' || text[i] === '、') ? 110 : 0
        await new Promise(r => setTimeout(r, speed + extra))
    }
    await new Promise(r => setTimeout(r, 200))
}

// 抽取逻辑（滚动等待 -> 翻牌或淡入 -> 逐字）
async function onDraw() {
    if (drawing.value || drawnToday.value) return
    drawing.value = true
    revealed.value = false
    result.value = null
    Object.assign(typed, { summary: '', love: '', work: '', money: '', health: '', tip: '' })

    // 视觉等待（滚动感）
    const wait = 2400 + Math.floor(Math.random() * 900)
    await new Promise(r => setTimeout(r, wait))

    // 生成结果并揭示
    const key = pickTypeKey()
    const res = makeResult(key)
    result.value = res
    revealed.value = true

    // 等待翻转 / 淡入中点
    await new Promise(r => setTimeout(r, 480))

    // 逐字展示：summary -> 各项
    await typeTo('summary', res.summary, 22)
    await typeTo('love', res.love, 18)
    await typeTo('work', res.work, 18)
    await typeTo('money', res.money, 18)
    await typeTo('health', res.health, 18)
    await typeTo('tip', res.tip, 20)

    // 保存到本地
    saveToday(res)
    savedResult.value = res
    drawnToday.value = true
    drawing.value = false
}
</script>

<style scoped lang="scss">
/* 页面基调：奶油 · 暖粉 · 纸感 */
.kato-fortune-page {
    min-height: 100vh;
    padding: 20px 16px;
    padding-top: 80px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    background: linear-gradient(135deg, #fffaf6 0%, #fff2ee 60%, #f6e7e3 100%);
    color: #5b463f;
    font-family: "PingFang SC", "Noto Sans SC", "Helvetica Neue", sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;

    .hero {
        text-align: center;
        width: 100%;
        max-width: 720px;

        .badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 999px;
            background: rgba(230, 200, 180, 0.12);
            color: #7a6254;
            border: 1px solid rgba(199, 143, 123, 0.08);
            font-size: 13px;
            margin-bottom: 8px;
        }

        .page-title {
            margin: 6px 0 6px;
            font-size: 24px;
            color: #c78f7b;
            letter-spacing: 0.4px;
        }

        .lead {
            margin: 0;
            color: #7a6254;
            font-size: 13px;
            opacity: 0.95;
        }
    }

    /* 抽取区 */
    .draw-zone {
        width: 100%;
        max-width: 720px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;

        .reel-wrap {
            width: 100%;
            max-width: 520px;
            height: 50px;
            position: relative;
            overflow: hidden;
            border-radius: 10px;
            border: 1px solid rgba(199, 143, 123, 0.10);
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 245, 242, 0.92));
            box-shadow: 0 8px 20px rgba(90, 70, 60, 0.06);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 6px;
        }

        .reel {
            display: flex;
            gap: 14px;
            transform-origin: center;
            transition: transform 0.28s linear;

            .reel-item {
                font-weight: 700;
                color: #5b463f;
                font-size: 16px;
                opacity: 0.95;
            }
        }

        .reel.spinning {
            animation: reelSpin 0.18s linear infinite;
        }

        @keyframes reelSpin {
            0% {
                transform: translateX(0) rotate(0.1deg);
            }

            50% {
                transform: translateX(-6px) rotate(-0.1deg);
            }

            100% {
                transform: translateX(0) rotate(0.1deg);
            }
        }

        .draw-button {
            width: 100%;
            max-width: 520px;
            padding: 12px 20px;
            border-radius: 14px;
            border: none;
            background: linear-gradient(135deg, #f3d6c6, #c78f7b);
            color: #fff8f5;
            font-weight: 700;
            font-size: 16px;
            box-shadow: 0 10px 28px rgba(199, 143, 123, 0.14);
            cursor: pointer;
            transition: transform 0.12s ease, box-shadow 0.14s ease;
            user-select: none;
            touch-action: manipulation;

            &:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 14px 36px rgba(199, 143, 123, 0.16);
            }

            &:disabled {
                opacity: 0.62;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }
        }

        .hint {
            margin: 6px 0 0;
            color: rgba(91, 70, 63, 0.62);
            font-size: 12px;
            max-width: 520px;
            text-align: center;
        }
    }

    /* 结果区 */
    .result-zone {
        width: 100%;
        max-width: 720px;
        display: flex;
        justify-content: center;

        .card-stage {
            perspective: 1200px;
            width: 100%;
            display: flex;
            justify-content: center;
        }

        .result-card {
            width: 100%;
            max-width: 680px;
            transform-style: preserve-3d;
            transition: transform 480ms cubic-bezier(.2, .9, .3, 1);
            position: relative;
            margin-top: 6px;
            will-change: transform;
            -webkit-transform: translateZ(0);
            min-height: 320px;

            .card-face {
                position: absolute;
                inset: 0;
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;
                border-radius: 12px;
                overflow: hidden;
                display: flex;
                gap: 14px;
                padding: 14px;
                background: linear-gradient(180deg, rgba(255, 250, 245, 0.98), rgba(255, 245, 242, 0.96));
                box-shadow: 0 16px 36px rgba(90, 70, 60, 0.06);
                border: 1px solid rgba(199, 143, 123, 0.10);
                color: #5b463f;
                transform: translateZ(0);
            }

            &.flipped {
                transform: rotateY(180deg);
            }

            .card-front {
                align-items: center;
                justify-content: flex-start;

                .avatar-wrap {
                    width: 110px;
                    display: flex;
                    align-items: center;
                    justify-content: center;

                    .avatar-sticker {
                        width: 86px;
                        height: 86px;
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 8px 18px rgba(90, 70, 60, 0.06);
                        border: 1px solid rgba(199, 143, 123, 0.08);
                        background: linear-gradient(180deg, #fff7f2, #fff1ee);
                    }

                    .avatar-svg {
                        width: 64px;
                        height: 64px;
                    }
                }

                .front-text {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    gap: 6px;
                    padding-right: 10px;

                    .level-ghost {
                        font-weight: 700;
                        color: rgba(91, 70, 63, 0.12);
                    }

                    .front-msg {
                        font-size: 17px;
                        font-weight: 700;
                        color: #5b463f;
                    }
                }
            }

            .card-back {
                transform: rotateY(180deg);
                display: flex;
                flex-direction: column;

                .back-top {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 10px;

                    .level-pill {
                        padding: 10px 14px;
                        border-radius: 999px;
                        font-weight: 800;
                        color: #fff;
                        min-width: 88px;
                        text-align: center;
                        font-size: 15px;
                    }

                    .summary {
                        font-size: 15px;
                        color: #5b463f;
                        font-weight: 600;
                    }
                }

                .daiji {
                    background: linear-gradient(135deg, #f6b3b6, #c97f7e);
                }

                .zhongji {
                    background: linear-gradient(135deg, #f5c6c5, #e6a5a0);
                }

                .xiaoji {
                    background: linear-gradient(135deg, #f8d4d7, #f4cfd6);
                    color: #583d3d;
                }

                .ji {
                    background: linear-gradient(135deg, #ffe3e7, #ffdfe6);
                    color: #583d3d;
                }

                .xiong {
                    background: linear-gradient(135deg, #e5b9b9, #d8a3a8);
                    color: #3b2727;
                }

                .daxiong {
                    background: linear-gradient(135deg, #c8a2a0, #b98a88);
                    color: #2e1e1e;
                }

                .back-body {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;

                    .row {
                        display: flex;
                        gap: 12px;
                        align-items: flex-start;

                        .label {
                            width: 140px;
                            font-size: 14px;
                            color: #7a6254;
                            flex-shrink: 0;
                        }

                        .value {
                            flex: 1;
                            background: rgba(255, 255, 255, 0.92);
                            padding: 10px;
                            border-radius: 8px;
                            border: 1px solid rgba(199, 143, 123, 0.06);
                            color: #5b463f;
                            min-height: 36px;
                            font-size: 14px;
                        }
                    }

                    .extras {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 8px;
                        gap: 12px;

                        .tip {
                            flex: 2;
                            font-size: 14px;
                            color: #5b463f;
                            background: rgba(255, 250, 245, 0.9);
                            padding: 10px;
                            border-radius: 8px;
                            border: 1px solid rgba(199, 143, 123, 0.06);
                        }

                        .lucky {
                            flex: 1;
                            text-align: right;
                            color: #c97f7e;
                            font-weight: 700;
                            align-self: center;
                        }
                    }
                }
            }
        }


        /* ====== 替换用：移动端（修复断裂 & 保持清晰） ====== */
        @media (max-width: 720px) {
            .card-stage {
                perspective: none;
                /* 保证舞台最小高度，避免父容器收缩产生跳动 */
                min-height: 260px;
                width: 100%;
            }

            .result-card {
                max-width: 100%;
                /* 仍然设为相对容器，但卡面用绝对定位叠放 */
                position: relative;
                min-height: 260px;
                /* 这里可以按需微调（240~300） */
                margin-top: 8px;
                padding: 0;
                transform: none !important;
                transition: none;
                will-change: opacity;
            }

            .card-face {
                /* 关键：绝对叠放（不占文档流），但不进行 rotateY */
                position: absolute !important;
                inset: 0;
                padding: 12px;
                gap: 10px;
                backface-visibility: visible !important;
                -webkit-backface-visibility: visible !important;
                transform: none !important;
                opacity: 1;
                /* 通过 will-change/translateZ 提示合成层，减少模糊 */
                will-change: opacity;
                -webkit-transform: translateZ(0);
            }

            /* 正面样式（初始可见） */
            .card-front {
                z-index: 2;
                transition: opacity 260ms ease;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
            }

            /* 背面初始隐藏，通过 opacity 切换显示 */
            .card-back {
                z-index: 1;
                opacity: 0;
                pointer-events: none;
                transition: opacity 320ms ease 80ms;
                min-height: 500px;
            }

            /* 翻开：正面隐藏，背面显示（不会引起布局跳变） */
            .result-card.flipped .card-front {
                opacity: 0;
                pointer-events: none;
                z-index: 1;
            }

            .result-card.flipped .card-back {
                opacity: 1;
                pointer-events: auto;
                z-index: 2;
            }

            /* 竖向堆叠：标签在上内容在下，节省横向空间 */
            .card-front .avatar-wrap {
                width: 100%;
            }

            .card-back .back-top {
                flex-direction: column;
                align-items: flex-start;
            }

            .card-back .back-body .row {
                flex-direction: column;
            }

            .card-back .back-body .row .label {
                width: auto;
                margin-bottom: 6px;
            }

            .card-back .extras {
                flex-direction: column-reverse;
                gap: 8px;
            }

            .card-back .lucky {
                text-align: left;
            }

            /* 如需更紧凑或更宽松，可微调 min-height 与 padding */
        }

    }



    /* 减少动画（偏好） */
    @media (prefers-reduced-motion: reduce) {
        .reel.spinning {
            animation: none;
        }

        .result-card {
            transition: none !important;
        }
    }
}
</style>
