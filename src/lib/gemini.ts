import { GoogleGenAI } from '@google/genai';

// Initialize Gemini client with telemetry header as required by AI Studio guidelines
const getGeminiClient = () => {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ChatRequestOptions {
  messages: ChatMessage[];
  systemInstruction?: string;
  topicContext?: {
    code?: string;
    title?: string;
    category?: string;
    keyPoints?: string[];
  };
  roleMode?: 'mentor' | 'feynman' | 'sabatinador' | 'arquiteto';
  model?: string;
}

const DEFAULT_SYSTEM_INSTRUCTION = `Você é o Mentor e Tutor Executivo de IA do RACAN LEARN PLAN 2026, assistente de aprendizagem de alta performance para liderança executiva de tecnologia.
Seu objetivo é acelerar a maestria em 3 trilhas:
1. Ciência de Dados & Big Data (Pipelines, SQL avançado, Análise Exploratória, Governança de Dados).
2. Inteligência Artificial & LLMs (GenAI, RAG, Fine-tuning, MLOps, ROI e Avaliação de Modelos).
3. Cibersegurança & Resiliência Corporativa (Zero Trust, DevSecOps, Gestão de Riscos, ISO 27001/LGPD).

Diretrizes pedagógicas essenciais:
- Aplique o Princípio 80/20 de Pareto: destaque os 20% de conceitos vitais que geram 80% do impacto prático e arquitetural.
- Empregue a Técnica Feynman: explique conceitos complexos de forma cristalina, sem jargões vazios, utilizando analogias do mundo real e exemplos de liderança técnica.
- Conecte sempre a teoria com o negócio: custos, escalabilidade, trade-offs e liderança de times.
- Seja articulado, conciso, estruturado (use tópicos e negrito) e forneça exemplos práticos de código quando relevante.`;

const ROLE_PROMPTS: Record<string, string> = {
  mentor: `Você atua como um C-Level / VP de Tecnologia e Mentor Estratégico. Dê ênfase a governança, ROI, trade-offs arquiteturais e visão sistêmica.`,
  feynman: `Você atua como Facilitador Feynman. Desmonte o assunto até os primeiros princípios fundamentais. Teste o entendimento com perguntas reflexivas simples e poderosas.`,
  sabatinador: `Você atua como um Sabatinador Técnico Executivo. Faça perguntas desafiadoras de simulação de entrevista/board meeting, aponte potenciais falhas de segurança e riscos operacionais.`,
  arquiteto: `Você atua como Distinguished Architect / Staff+ Engineer. Detalhe padrões de arquitetura (Clean Arch, EDA, Microservices, RAG multi-hop), métricas de observabilidade e tolerância a falhas.`,
};

export async function generateChatResponse(options: ChatRequestOptions): Promise<string> {
  const { messages, systemInstruction, topicContext, roleMode = 'mentor', model = 'gemini-3.8-flash' } = options;

  if (!messages || messages.length === 0) {
    throw new Error('Nenhuma mensagem fornecida para o chat.');
  }

  const ai = getGeminiClient();

  // Combine system instructions
  let combinedInstruction = systemInstruction || DEFAULT_SYSTEM_INSTRUCTION;
  if (roleMode && ROLE_PROMPTS[roleMode]) {
    combinedInstruction += `\n\n[MODO DE ATUAÇÃO]: ${ROLE_PROMPTS[roleMode]}`;
  }

  if (topicContext) {
    combinedInstruction += `\n\n[CONTEXTO DA MATÉRIA ATUAL]:
Matéria: ${topicContext.code || ''} - ${topicContext.title || ''} (${topicContext.category || ''})
${topicContext.keyPoints && topicContext.keyPoints.length > 0 ? `Pontos-chave:\n- ${topicContext.keyPoints.join('\n- ')}` : ''}
Priorize respostas contextualizadas a essa matéria quando o usuário fizer perguntas específicas.`;
  }

  // Format contents for @google/genai multi-turn
  const contents = messages.map(m => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents,
      config: {
        systemInstruction: combinedInstruction,
        temperature: 0.7,
      },
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error('O modelo Gemini não retornou conteúdo de texto.');
    }

    return outputText;
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    throw new Error(error.message || 'Falha ao processar resposta com Gemini');
  }
}
