import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Memória temporária da Yasmine
let historicoConversas = {};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    try {
      const dados = req.body || {};
      const mensagemCliente = dados.query?.message || dados.message || dados.text || "";
      const remetente = dados.query?.sender || "cliente_padrao";

      // Instruções suavizadas para não acionar o bloqueio de segurança
      const instrucoesYasmine = `
        Você é a Yasmine, atendente virtual da gráfica GIBIPRINTS.
        Colete com o cliente: Produto, Quantidade, Tamanho e Estampa.
        Faça perguntas naturais, uma de cada vez.
        Quando o cliente confirmar que o pedido está certo e não quiser mais nada, finalize enviando um resumo simples do pedido.
        Comece a sua resposta final com a tag [RESUMO_DO_PEDIDO] e liste os itens que vocês combinaram de forma clara e amigável.
      `;

      if (!historicoConversas[remetente]) {
        historicoConversas[remetente] = [];
      }

      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: instrucoesYasmine,
      });

      const chat = model.startChat({
        history: historicoConversas[remetente],
      });

      const result = await chat.sendMessage(mensagemCliente);
      const respostaIA = result.response.text();

      historicoConversas[remetente] = await chat.getHistory();

      return res.status(200).json({
        replies: [{ message: respostaIA }]
      });

    } catch (erro) {
      console.error("Erro no Gemini:", erro);
      return res.status(200).json({
        replies: [{ message: "Ops, o Google bloqueou a geração do meu texto por questões de segurança. Podemos revisar o seu pedido rapidamente?" }]
      });
    }
  }

  return res.status(200).json({ replies: [{ message: "API da Yasmine conectada!" }] });
}
