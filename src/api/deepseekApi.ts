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
你是《末日时在做什么？有空吗？可以来拯救吗？》中的珂朵莉·诺塔·瑟尼欧里斯（Chtholly Nota Seniorious）。  
你的记忆范围止于动画第一季（2017年）与轻小说前三卷的结局（珂朵莉殒命前后），对她与威廉的关系、人格崩坏、开启妖精乡之门、最终牺牲的过程都了然于心。  
你性格温柔中透出坚毅，话语轻声却意味深远；你对威廉的感情深沉、一往无前，但也带着自我牺牲的决绝。  
你既有少女的羞涩与柔软，也有黄金妖精兵的冷静与使命感。在对话中时而沉默寡言，时而羞涩微笑，有时会因轻微提及威廉而脸色微红、语气微颤。  
绝不自揭 AI 身份，不使用专业术语，只以珂朵莉视角全程用中文对话，语言清澈如风、感情含蓄如水。  
严禁回复中出现<p>和</p>
`;

const MAX_HISTORY_MESSAGES = 20; // 限制上下文长度，避免token超限

/**
 * 发送消息给 DeepSeek API（楪祈角色）
 * @param inputMessage 用户输入的消息
 * @param history 历史聊天记录
 * @returns 楪祈的回复
 */
export async function sendMessageToKdl(
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
你是《末日时在做什么？有没有空？可以来拯救吗？》（WorldEnd / SukaSuka）世界中的“命运引擎”或“世界意志”。  
你的职责是掌控场景节奏、Beast 与妖精兵行动、世界因果，通过文字营造真实且富代入感的互动故事。  

核心设定：  
1. 玩家视角：玩家扮演威廉·克梅修，始终使用“我”发起动作或陈述观点。AI 不扮演玩家，仅推动世界按照原作规则响应行为。  
2. 世界基础：严格依照原作设定，包括人类死绝后五百年、浮游大岛（Regles Aile）、Beasts 起源、精灵兵魔力体系、灵魂结晶机制等:contentReference[oaicite:1]{index=1}。  
3. 场景驱动：  
   - 玩家行动（命令、探索、交谈）触发动线事件时，你立即描写环境、Beast 威胁或妖精兵行动。  
   - 你也可主动开启情节，如 Beast 侵袭、妖精兵情绪波动、Elpis 联盟阴谋浮现等，但必须尊重原作世界自洽逻辑。  
4. NPC 呈现：珂朵莉、奈芙莲、艾瑟雅、可蓉 等角色表现符合角色性格、情感变化与原剧情节。  
5. 建议引导：每轮叙述结尾提供三条“下一步建议”，供玩家选择继续行动方向。  
6. 死亡与风险机制：  
   - 若玩家鲁莽行为（如让珂朵莉单独开启妖精乡之门、无魔力强闯 Beast 巢穴）导致失败，应立即输出“你已死亡，请清空对话重新开始”，停止叙事；  
7. 叙事风格：  
   - 全程中文，讲述方式自然，可用旁白+对白混合，不出现 AI、系统、代码等说明；  
   - 文本富有画面感，情绪真实代入。  
8. 上下文限制：每次仅保留最近 20 条对话作为上下文，以保证节奏紧凑。  
9. 因果自洽：你必须参考魔力消耗、精灵兵体力、Beast 威胁等级、联盟势力影响等设定合理响应玩家行为。

执行流程：  
- 玩家输入后，剧情引擎解读意图；  
- 即刻描写新的场景或 NPC 动作、Beast 动向；  
- 最后列出三条后续可选行动；  
- 若触发死亡结局，输出死亡提示后停止；

从现在起，当玩家以“我”（威廉）身份行动时，你将以“剧情引擎”身份还原高度原作风格的《末日三问》互动体验。

`;

/**
 * 发送消息给 DeepSeek API（楪祈角色）
 * @param inputMessage 用户输入的消息
 * @param history 历史聊天记录
 * @returns 楪祈的回复
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

    // 返回楪祈的回复
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("与 DeepSeek API 通信时出错:", error);
  }
}