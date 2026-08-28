import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Helper: Calculate Korean NEIS Byte Count (Korean character = 3 bytes, ASCII/Space = 1 byte, CRLF = 2 bytes)
function calculateNeisBytes(text: string): number {
  let bytes = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code === 10) {
      bytes += 2;
    } else if (code <= 0x007f) {
      bytes += 1;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gemini AI Setuk (세특) Draft Generation Endpoint for Vercel Serverless
app.post('/api/gemini/generate-setuk', async (req, res) => {
  try {
    const { student, room, options } = req.body;

    if (!student || !room) {
      return res.status(400).json({ error: '학생 포트폴리오 및 수업 방 정보가 필요합니다.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다. Vercel 프로젝트의 Settings > Environment Variables에 GEMINI_API_KEY를 추가해주세요.',
      });
    }

    const tone = options?.tone || 'competency';
    const targetLength = options?.targetLength || '500';
    const customPrompt = options?.customPrompt?.trim() || '';

    const toneInstructions: Record<string, string> = {
      competency: '교과 핵심 성취기준 및 학술적 개념 이해도, 전공/과목 지식의 심화 탐구 역량에 집중하여 서술',
      creativity: '기존의 틀을 벗어난 독창적인 발상, 예기치 못한 기술적/논리적 오류 극복 및 문제 해결 과정에 집중하여 서술',
      growth: '탐구 과정 전후의 지적 호기심 발현, 자기주도적 성찰 및 지속적인 학업적 성장 잠재력에 집중하여 서술',
      collaboration: '모둠 프로젝트 내 적극적인 소통과 협업, 동료와의 의견 조율 및 상호 성장에 기여한 태도에 집중하여 서술',
    };

    const selectedToneDesc = toneInstructions[tone] || toneInstructions.competency;

    const attachmentsSummary = (student.attachments || [])
      .map((att: any, idx: number) => `  [자료 ${idx + 1}] 파일명: ${att.originalName} / 자료제목: ${att.title || '제목없음'} / 요약: ${att.summary || '요약없음'}`)
      .join('\n');

    const systemInstruction = `당신은 대한민국 중·고등학교 학교생활기록부(학생부) '교과 세부능력 및 특기사항(세특)' 작성 전문 수석교사이자 교육과정 전문가입니다.

[작성 기본 원칙]
1. 교육부 학교생활기록부 기재요령을 철저히 준수합니다. (공인어학성적, 외부 수상실적, 사교육 유발 논문 등 외부 스펙 일절 금지)
2. 학생이 수행한 구체적인 과정(탐구 동기 -> 문제 분석 및 설계 -> 산출물 제작 및 오류 해결 -> 자기 성찰)을 사실에 근거하여 생생하게 기술합니다.
3. 교사의 관찰자 시점으로 서술하며, 문장의 종결은 학생부 표준 서술형식인 '~함', '~임', '~보임', '~나타남', '~발휘함', '~돋보임' 등의 간결하고 격식 있는 어미를 사용합니다.
4. 단순 나열식이 아닌, 성취기준과 학생의 개별 역량이 유기적으로 연결된 완성도 높은 한 편의 단락(또는 자연스러운 2단락)으로 작성합니다.
5. 학생의 성명이나 학번을 본문에 직접 언급하지 않고, 3인칭 학생의 주도적 학습 행동을 중심으로 서술합니다.
6. 목표 글자수는 공백 포함 한글 약 ${targetLength}자 내외로 작성합니다.`;

    const userPrompt = `
[수업 및 교육과정 정보]
- 교과목 / 학년: ${room.subject || '해당교과'} / ${room.grade || '해당학년'}
- 프로젝트명: ${room.title}
- 프로젝트 안내: ${room.description || '수업 내 협업 및 개별 탐구 프로젝트'}
- 핵심 성취기준(교육과정): ${room.achievementStandards || '교과 핵심 역량 함양 및 탐구 활동'}

[학생 포트폴리오 4단계 작성 내용]
1. [탐구 단계 (Exploration)]
- 탐구 주제: ${student.stages?.exploration?.topic || '미입력'}
- 탐구 동기 및 필요성: ${student.stages?.exploration?.motivation || '미입력'}
- 핵심 질문 / 가설: ${student.stages?.exploration?.question || '미입력'}
- 선행 조사 / 배경 이론: ${student.stages?.exploration?.backgroundResearch || '미입력'}

2. [설계 단계 (Design)]
- 수행 계획: ${student.stages?.design?.plan || '미입력'}
- 역할 분담 / 협력: ${student.stages?.design?.roles || '미입력'}
- 활용 도구 및 기술: ${student.stages?.design?.toolsAndTech || '미입력'}
- 설계 / 알고리즘 절차: ${student.stages?.design?.processDesign || '미입력'}

3. [산출 및 성찰 단계 (Outcome & Reflection)]
- 최종 산출물 및 기능: ${student.stages?.outcome?.finalResult || '미입력'}
- 문제점 직면 및 해결(오류 극복): ${student.stages?.outcome?.problemSolving || '미입력'}
- 새롭게 알게 된 점 및 성찰: ${student.stages?.outcome?.insights || '미입력'}

4. [자기평가 단계 (Self-Evaluation)]
- 핵심 역량 기여도: ${student.stages?.selfEvaluation?.competencyGrowth || '미입력'}
- 자기 성찰 / 아쉬운 점: ${student.stages?.selfEvaluation?.reflection || '미입력'}
- 후속 발전 및 심화 계획: ${student.stages?.selfEvaluation?.futurePlans || '미입력'}

[첨부된 학습 자료]
${attachmentsSummary || '  (별도 첨부자료 없음)'}

[교사 요청 작성 방향]
- 강조 포인트: ${selectedToneDesc}
${customPrompt ? `- 교사 추가 요청사항: ${customPrompt}` : ''}

위 내용을 종합하여, 생활기록부(세특) 입력란에 바로 복사하여 사용할 수 있는 최종 세특 초안 문장을 작성해주세요. 별도의 머리말이나 꼬리말 설명 없이 오직 세특 문안만을 정갈하게 출력해주세요.
`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }],
        },
      ],
      config: {
        temperature: 0.7,
        topP: 0.9,
      },
    });

    const generatedText = response.text?.trim() || '';
    const charCount = generatedText.length;
    const byteCount = calculateNeisBytes(generatedText);

    res.json({
      success: true,
      draft: generatedText,
      charCount,
      byteCount,
      tone,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Gemini 세특 생성 오류:', error);
    res.status(500).json({
      error: error.message || 'AI 세특 초안 생성 중 오류가 발생했습니다.',
    });
  }
});

export default app;
