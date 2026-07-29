const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is missing from your .env file.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

function parseModelJson(rawText) {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Gemini returned non-JSON output:', cleaned);
    throw new SyntaxError('AI response was not valid JSON.');
  }
}

async function generateTutoringPlan({ subject, topic, level, goals }) {
  const prompt = `
You are an expert tutor and curriculum designer. Create a detailed, structured tutoring plan.

SUBJECT: ${subject}
TOPIC: ${topic}
STUDENT LEVEL: ${level}
LEARNING GOALS: ${goals}

Respond ONLY with valid JSON (no markdown fences, no extra text) in this exact format:
{
  "title": "string — a concise plan title",
  "summary": "string — 2-3 sentence overview",
  "duration_weeks": number,
  "sections": [
    {
      "week": number,
      "title": "string",
      "objectives": ["string"],
      "activities": ["string"],
      "resources": ["string"],
      "assessment": "string"
    }
  ],
  "tips": ["string — general study tips for this topic"],
  "estimated_hours": number
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseModelJson(text);
}

async function generateQuiz({ subject, topic, numQuestions = 5 }) {
  const prompt = `
You are an expert educator. Create a ${numQuestions}-question multiple-choice quiz.

SUBJECT: ${subject}
TOPIC: ${topic}

Respond ONLY with valid JSON (no markdown fences, no extra text):
{
  "title": "string",
  "questions": [
    {
      "question": "string",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct_answer": "string — the full correct option text",
      "explanation": "string — why this is correct"
    }
  ]
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseModelJson(text);
}

async function generateExplanation({ subject, topic, level }) {
  const prompt = `
You are a patient, expert tutor. Explain the following concept clearly.

SUBJECT: ${subject}
TOPIC: ${topic}
STUDENT LEVEL: ${level}

Respond ONLY with valid JSON (no markdown fences, no extra text):
{
  "title": "string",
  "introduction": "string — simple introduction to the concept",
  "key_points": [
    { "point": "string", "detail": "string" }
  ],
  "analogy": "string — a real-world analogy to help understanding",
  "common_misconceptions": ["string"],
  "next_steps": ["string — what the student should study next"]
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseModelJson(text);
}

module.exports = { generateTutoringPlan, generateQuiz, generateExplanation };