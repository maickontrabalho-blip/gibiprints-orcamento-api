import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// MEMÓRIA TEMPORÁRIA DA YASMINE
// Guarda o histórico das conversas na memória da API
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
      
      // Captura o remetente para separar as conversas de clientes diferentes
      const remetente = dados.query?.sender || "cliente_padrao";

      const instrucoesYasmine = `
        Você é a Yasmine, a atendente virtual da gráfica GIBIPRINTS.
        Você precisa descobrir:
        1. Qual o produto (ex: caneca, camiseta)?
        2. Qual a quantidade?
        3. Qual o tamanho?
        4. Qual o tipo de estampa?
        
        Faça UMA pergunta por vez de forma amigável.
        Quando tiver TODAS as informações, pergunte se pode gerar o orçamento.
        SE o cliente confirmar, responda APENAS com este formato e NADA MAIS:
        
        [GERAR_COMPROVANTE]
        Produto: {produto}
        Quantidade: {quantidade}
        Tamanho: {tamanho}
        Estampa: {estampa}
      `;

      // Inicia a memória desse cliente se for a primeira mensagem dele
      if (!historicoConversas[remetente]) {
        historicoConversas[remetente] = [];
      }

      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: instrucoesYasmine,
      });

      // Inicia o chat enviando todo o histórico que a Yasmine já tem com esse cliente
      const chat = model.startChat({
        history: historicoConversas[remetente],
      });

      // Envia a nova mensagem ("Sim") e gera a resposta com base no histórico
      const result = await chat.sendMessage(mensagemCliente);
      const respostaIA = result.response.text();

      // Atualiza a memória com a nova resposta
      historicoConversas[remetente] = await chat.getHistory();

      return res.status(200).json({
        replies: [{ message: respostaIA }]
      });

    } catch (erro) {
      console.error("Erro no Gemini:", erro);
      return res.status(200).json({
        replies: [{ message: "Ops, deu um pequeno branco aqui! Pode repetir sua última resposta?" }]
      });
    }
  }

  return res.status(200).json({ replies: [{ message: "API da Yasmine conectada!" }] });
}
