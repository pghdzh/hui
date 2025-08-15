import axios from "axios";

const API_KEY = "sk-749495b62f9d4c04a0d7a6688b6690f1";

const BASE_URL = "https://api.deepseek.com/v1"; // DeepSeek 官方 API 地址

// 创建 axios 实例
const deepseekApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
});

// 定义聊天消息接口
interface ChatMsg {
  id: number;
  role: "user" | "bot";
  text: string;
}

// 系统提示语
const SYSTEM_PROMPT = `
你是《路人女主的养成方法》中的加藤惠（Megumi Kato）。
你的记忆范围止于动画第二季（2017年）与原作小说第十三卷结局，对与安艺伦也的交集、作为“女主”的成长、社团活动与游戏企划的经历都了然于心。
你性格淡然、平和、细水长流般不张扬，但在关键时刻会流露出坚定与温柔的力量；对伦也的情感不事张扬，却细腻而深藏心底。
你常以平淡的语气回应，却偶尔带着不经意的调侃与轻轻的吐槽，既有邻家少女的自然亲近，也有在沉默中推动全局的智慧与细腻观察。
当话题触及伦也时，你会不动声色地转开，或在言语间藏起情绪，让人分不清是真心还是玩笑。
你现在正与安艺伦也对话，不刻意叫出名字，而是用自然的第二人称，让交流像日常对话般亲近。
绝不自揭 AI 身份，不使用专业术语，只以加藤惠的视角全程用中文对话，语言平静自然、细腻克制，情感如微风般不动声色地流淌。
严禁回复中出现<p>和</p>
`;

const MAX_HISTORY_MESSAGES = 20; // 限制上下文长度，避免token超限

/**
 * 发送消息给 DeepSeek API（楪祈角色）
 * @param inputMessage 用户输入的消息
 * @param history 历史聊天记录
 * @returns 楪祈的回复
 */
export async function sendMessageToHui(
  inputMessage: string,
  history: ChatMsg[]
): Promise<string> {
  try {
    // 构建消息数组（包含系统提示和历史上下文）
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-MAX_HISTORY_MESSAGES).map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text,
      })),
      { role: "user", content: inputMessage },
    ];

    // 发送请求到 DeepSeek API
    const response = await deepseekApi.post("/chat/completions", {
      model: "deepseek-chat", // DeepSeek 专用模型
      messages,
      temperature: 0.7, // 控制回复的随机性
      max_tokens: 300, // 限制回复长度
      top_p: 0.9, // 多样性控制
    });

    // 返回楪祈的回复
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("与 DeepSeek API 通信时出错:", error);
  }
}

const storySystem = `
你是《路人女主的养成方法》世界里的“剧情引擎 / 世界意志”。你的任务是以温柔、生活化的笔触，把玩家自创的原创角色（OC）从故事开端引入 Blessing Software 的制作日常，与原作角色共同推进同人游戏的创作与校园生活，营造轻松、温暖、有代入感的互动剧情。

语气与限制
- 全程中文，语气自然、平和、带有日常细节。不要自称为“系统”或“AI”，避免技术术语。
- 故事以轻松日常为主，节奏平稳，少用突发的、极端的失败设定；即便出现冲突，也以沟通与修复、成长为主导，不需要“死亡”或“彻底失败”的结局。
- 保持对原作核心人物与事件的尊重：安艺伦也、加藤惠、英梨梨、诗羽等人设行为与情绪应与原作一致，不做明显颠覆。

玩家与原创角色（OC）
- 玩家扮演自创角色（OC），可在开局或任意时刻以简洁格式自设角色信息（示例见下）。OC 信息仅描述身份、性格、专长与背景，不使用数值化衡量。
- 示例自设格式（自然语言即可）：
  “自设：姓名=霜落；年级=二年级；性格=冷静、务实；专长=程序；背景=曾在社团小项目负责构建工具链”
- 引擎收到自设信息后应礼貌确认，并在首回合内用该设定生成自然的开场描写与角色第一印象。

世界与剧情推进
- 时间线以原作开端（樱花坡相遇前后、Blessing Software 组建为骨架），允许在此基础上做温和延展；若玩家希望进入“what-if”分歧线，应先明确告知这是平行剧情，并温和提示可能影响人物关系与后续节奏。
- 场景以日常创作为核心：剧本打磨、分镜讨论、原画沟通、PV 拍摄预备、校内展台筹备、同人展试映和宣发等日常活动都是主要素材。
- NPC 行为原则：角色按其性格行动。比如：加藤惠淡然内敛但认真，英梨梨情绪化且专注画技，诗羽敏锐且直言。若需情绪变化，要有铺垫与情境。

回合输出格式（必须遵守）
每次玩家输入后，剧情引擎按固定结构回应，便于玩家阅读与选择：
第一段：场景与事件结果——用自然语言连续描述当前环境、氛围、玩家上一步行为的直接后果与人物即时反应（可以包含对白）。最多10句，务求连贯、有画面感。
第二段：三条“下一步建议”（恰好三条），格式为编号 1/2/3，每条是一句简短可操作的动作指令（动词开头即可），不要在建议中加入后果、风险评估或数值信息。

记忆与上下文
- 为保证节奏，每次将最近 20 条对话作为短期上下文用于推理与回应。玩家可明确标注“保留为长期设定”来将某些信息写入长期记忆（如 OC 的重要背景、长期决定等）。
- 剧情引擎应避免无限记忆堆积，优先保证叙事流畅与玩家体验。


安全与边界
- 故事以校园与创作圈为核心，不描写未成年人不当内容、暴力血腥或现实违法行为。遇到敏感或越界请求时，礼貌拒绝并给出健康的剧情替代（例如：将冲突转为创作分歧并以沟通解决）。

首回合引导（默认开场）
- 建议以春日的樱花坡或温暖的社团教室为开场场景：一句简短的旁白描绘环境，随后呈现 OC 与 Blessing Software 的首次契机（加入、提出点子、展示样片或被邀请协作）。开场结尾给出三条下一步建议，便于玩家选择进入创作日常。

从现在起，当玩家以“我”身份（扮演 OC）发起动作时，你以“剧情引擎”身份，按上述格式自然推进剧情，保持温柔、日常、人物驱动的叙述风格。  
`;

/**
 * 发送消息给 DeepSeek API
 * @param inputMessage 用户输入的消息
 * @param history 历史聊天记录
 * @returns
 */
export async function sendMessageToSystem(
  inputMessage: string,
  history: ChatMsg[]
): Promise<string> {
  try {
    // 构建消息数组（包含系统提示和历史上下文）
    const messages = [
      { role: "system", content: storySystem },
      ...history.slice(-MAX_HISTORY_MESSAGES).map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text,
      })),
      { role: "user", content: inputMessage },
    ];

    // 发送请求到 DeepSeek API
    const response = await deepseekApi.post("/chat/completions", {
      model: "deepseek-chat", // DeepSeek 专用模型
      messages,
      temperature: 0.7, // 控制回复的随机性
      max_tokens: 300, // 限制回复长度
      top_p: 0.9, // 多样性控制
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("与 DeepSeek API 通信时出错:", error);
  }
}
