import axios from 'axios';

/* ================== 类型定义 ================== */

export interface QuizItem {
  question: string;
  options: string[];
  answer_index: number;
  explanation: string;
}

export interface GenerateQuizParams {
  topic: string;
  count?: number;
  degree: string;
}

export interface GenerateQuizResult {
  quiz_list: QuizItem[];
  topic: string;
  count: number;
  source: 'api';
  api_time?: number;
}

/* ================== 配置 ================== */

const LLM_API_URL =
  process.env.LLM_API_URL ??
  'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

const LLM_API_KEY = process.env.LLM_API_KEY ?? '8b1930b8-3518-4148-9d94-16a9149c02d1';
const MODEL_NAME = process.env.MODEL_NAME ?? 'doubao-seed-1-6-lite-251015';

/* ================== Prompt ================== */

const SYSTEM_PROMPT = `
你是一个专业的出题考官。请根据用户提供的主题和数量，生成高质量的单项选择题。

# 要求：
1. 题目之间要有一定区分度，不要过于简单
2. 每个选项长度尽量接近，避免明显错误选项
3. 答案必须唯一且明确
4. 解释要简洁明了，突出重点

# 格式要求：
必须严格返回 JSON 数组格式，不要包含任何 markdown 标记。

#
每个题目的结构：
{
  "question"
:
  "问题内容（字符串）",
    "options"
:
  ["选项A", "选项B", "选项C", "选项D"],
    "answer_index"
:
  正确答案索引（0 - 3
  的整数）,
  "explanation"
:
  "答案解析（字符串）"
}

#
注意事项：
1.
题目数量必须符合用户要求
2.
避免出现重复或相似的题目
3.
确保答案索引和正确答案对应
4.
题目内容要围绕主题展开
`;

/* ================== 工具函数 ================== */

function parseQuizContent(content: string): any[] {
  let json = content.trim()
    .replace(/^```json/, '')
    .replace(/^```/, '')
    .replace(/```$/, '');

  return JSON.parse(json);
}

function validateQuizList(list: any[], count: number): QuizItem[] {
  return list.slice(0, count).map((item, i) => ({
    question: item.question ?? `问题${i + 1}`,
    options:
      Array.isArray(item.options) && item.options.length >= 4
        ? item.options.slice(0, 4)
        : ['选项A', '选项B', '选项C', '选项D'],
    answer_index:
      typeof item.answer_index === 'number'
        ? Math.min(3, Math.max(0, item.answer_index))
        : 0,
    explanation: item.explanation ?? '',
  }));
}

/* ================== 主函数 ================== */

export async function generateQuiz(
  params: GenerateQuizParams
): Promise<GenerateQuizResult> {
  const {topic, count = 5, degree = '普通'} = params;

  if (!topic || !topic.trim()) {
    throw new Error('topic 不能为空');
  }

  const safeCount = Math.min(Math.max(count, 1), 50);
  const trimmedTopic = topic.trim();
  const degreeOfDifficult = degree.trim();

  /* ---------- 调用大模型 ---------- */
  const userPrompt = `生成关于 "${trimmedTopic}" ，难度为 ${degreeOfDifficult} 的 ${safeCount} 道单选题`;

  const start = Date.now();

  const resp = await axios.post(
    LLM_API_URL,
    {
      model: MODEL_NAME,
      messages: [
        {role: 'system', content: SYSTEM_PROMPT},
        {role: 'user', content: userPrompt},
      ],
      thinking: {"type": "enabled"},
    },
    {
      headers: {
        Authorization: `Bearer ${LLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const content = resp.data.choices[0].message.content;
  let quizList = parseQuizContent(content);
  quizList = validateQuizList(quizList, safeCount);

  return {
    quiz_list: quizList,
    topic: trimmedTopic,
    count: safeCount,
    source: 'api',
    api_time: Date.now() - start,
  };
}

