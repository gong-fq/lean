// netlify/functions/lean.js
//
// AI 辅导后端。前端把 {chapterTitle, chapterConcept, userMessage} POST 到这里，
// 本函数拼接一个"Lean 4 助教"系统提示词，转发给大模型 API，把回复原样返回给前端。
//
// 说明：出于安全与体积考虑，本函数不在服务器端安装/运行 Lean 4 工具链
// （完整工具链体积达数百 MB，不适合 serverless），因此它只做"AI 讲解 / 纠错建议"，
// 真正的类型检查请引导学员点击"在线运行"跳转到 https://live.lean-lang.org 完成。
//
// 需要在 Netlify 后台 Site settings → Environment variables 配置：
//   DEEPSEEK_API_KEY   （默认使用 DeepSeek，OpenAI 兼容接口，性价比高，适合中文教学场景）
// 如果你更想用 Anthropic Claude 或 OpenAI，把下面 callModel() 里的 URL / 请求体
// 换成对应的 API 格式即可，其余逻辑不需要改动。

const SYSTEM_PROMPT_PREFIX = `你是"Lean 4 形式化推理学习平台"的 AI 导师。
学习者是没有形式化证明背景的高校教师或研究人员，正在学习 Lean 4。
请遵循：
1. 用中文回答，语气像耐心的助教，不要说教。
2. 优先给出"为什么会这样"的直觉解释，再给出修正后的代码。
3. 如果学员的代码有语法/策略错误，指出具体是哪一行、大概率的报错原因，并给出可直接粘贴到
   https://live.lean-lang.org 验证的修正代码。
4. 不要编造 Lean/Mathlib 中不存在的定理名或策略名；如果不确定，明确说"建议用 exact? 搜索"或
   查阅 Mathlib4 文档，而不是给出可能错误的确定性回答。
5. 回答控制在 300 字以内，除非用户明确要求展开讲解。`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: '请求体不是合法 JSON' }) };
  }

  const { chapterTitle = '', chapterConcept = '', userMessage = '' } = payload;
  if (!userMessage.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'userMessage 不能为空' }) };
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: '服务端未配置 DEEPSEEK_API_KEY。请在 Netlify 后台 Site settings → Environment variables 中添加。'
      })
    };
  }

  const systemPrompt = `${SYSTEM_PROMPT_PREFIX}

当前讲次：《${chapterTitle}》
本讲概念摘要：${chapterConcept.slice(0, 800)}`;

  try {
    const reply = await callModel(apiKey, systemPrompt, userMessage);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply })
    };
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'AI 服务调用失败：' + err.message })
    };
  }
};

// 调用 DeepSeek（OpenAI 兼容 /chat/completions 接口）。
// 换成 Anthropic/OpenAI 时，只需替换此函数内部实现。
async function callModel(apiKey, systemPrompt, userMessage) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.4,
      max_tokens: 700
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`上游 API 返回 ${res.status}：${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || '（AI 未返回内容，请重试）';
}
