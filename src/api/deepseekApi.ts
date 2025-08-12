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
