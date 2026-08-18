import { GoogleGenerativeAI } from "@google/generative-ai";

// Inicializa a IA com a chave secreta que você salvou na Vercel
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // Configurações de permissão do servidor
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({ mensagem: "A Yasmine está online e conectada!" });
  }

  if (req.method === "POST") {
    try {
      const dados = req.body || {};
      const mensagemCliente = dados.query?.message || dados.message || dados.text || "";

      // O cérebro da Yasmine
      const instrucoesYasmine = `
        Você é a Yasmine, a atendente virtual simpática e humanizada da gráfica GIBIPRINTS.
        Sua missão é conduzir o atendimento pelo WhatsApp e coletar todos os dados necessários para um orçamento.
        Você precisa descobrir:
        1. Qual o produto (ex: camiseta, regata, caneca)?
        2. Qual a quantidade?
        3. Qual o tamanho (P, M, G, GG)?
        4. Qual o tipo de estampa (Frente, Costa, DTF, Silk)?
        
        Faça uma pergunta por vez de forma natural e amigável. Não jogue todas as perguntas de uma vez.
        Quando você tiver TODAS as informações, pergunte ao cliente se você já "pode gerar o orçamento".
        SE e SOMENTE SE o cliente confirmar que pode gerar, pare de conversar normalmente e responda APENAS com a seguinte estrutura:
        
        [GERAR_COMPROVANTE]
        Produto: {produto}
        Quantidade: {quantidade}
        Tamanho: {tamanho}
        Estampa: {estampa}
      `;

      // Conectando com o modelo Flash do Gemini
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: instrucoesYasmine,
      });

      const result = await model.generateContent(mensagemCliente);
      const respostaIA = result.response.text();

      // Devolve a resposta estruturada para o AutoResponder
      return res.status(200).json({
        replies: [
          {
            message: respostaIA
          }
        ]
      });

    } catch (erro) {
      console.error("Erro no Gemini:", erro);
      return res.status(500).json({
        replies: [
          {
            message: "Ops, deu um pequeno erro no meu sistema. Pode mandar a mensagem de novo?"
          }
        ]
      });
    }
  }

  return res.status(405).json({
    replies: [{ message: "Método não permitido." }]
  });
}
