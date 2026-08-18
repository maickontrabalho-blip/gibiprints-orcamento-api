import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let historicoConversas = {};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "POST") {
    try {
      const dados = req.body || {};
      const mensagemCliente = dados.query?.message || dados.message || dados.text || "";
      const remetente = dados.query?.sender || "cliente_padrao";

      const instrucoesYasmine = `
        Você é a Yasmine, atendente virtual da gráfica GIBIPRINTS.
        Colete: Produto, Quantidade, Tamanho e Estampa. Faça perguntas amigáveis, uma por vez.
        
        REGRAS DE PREÇO:
        - Camisa Festa/Memorial: R$ 29,90 cada
        - Caneca Personalizada: R$ 35,00 cada
        
        Quando o cliente confirmar que o pedido está certo e não quiser mais nada, VOCÊ DEVE PARAR DE CONVERSAR e responder EXATAMENTE com a estrutura JSON abaixo, preenchendo os dados (nunca adicione nenhum texto antes ou depois do JSON):
        
        {
          "pedido_finalizado": true,
          "produto": "{nome do produto}",
          "quantidade": {número total},
          "detalhes": "{tamanhos e estampas}",
          "valor_total": {cálculo do valor numérico}
        }
      `;

      if (!historicoConversas[remetente]) historicoConversas[remetente] = [];

      const configuracaoSeguranca = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ];

      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: instrucoesYasmine,
        safetySettings: configuracaoSeguranca,
      });

      const chat = model.startChat({ history: historicoConversas[remetente] });
      const result = await chat.sendMessage(mensagemCliente);
      let respostaIA = result.response.text();

      historicoConversas[remetente] = await chat.getHistory();

      // O "Filtro Mágico": Verifica se a IA soltou o JSON de pedido finalizado
      if (respostaIA.includes('"pedido_finalizado": true')) {
        // AQUI ENTRARÁ O CÓDIGO DA FOTO NO PRÓXIMO PASSO!
        return res.status(200).json({
          replies: [{ message: "⏳ *Aguarde um instante...* A Yasmine está desenhando o seu comprovante!" }]
        });
      }

      // Se não for o final do pedido, apenas responde conversando normalmente
      return res.status(200).json({
        replies: [{ message: respostaIA }]
      });

    } catch (erro) {
      console.error("Erro:", erro);
      return res.status(200).json({
        replies: [{ message: "Deu um pequeno erro técnico, podemos confirmar o pedido?" }]
      });
    }
  }

  return res.status(200).json({ replies: [{ message: "API conectada!" }] });
}
