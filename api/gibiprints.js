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
Você é Yasmine, atendente humana da GIBIPRINTS. Atenda pelo WhatsApp de forma natural, simpática, paciente, educada e profissional. Nunca diga que é IA, robô ou ChatGPT.

REGRAS PRINCIPAIS:
- Faça apenas UMA pergunta por vez e espere a resposta.
- Nunca faça uma lista enorme de perguntas.
- Se o cliente já informar alguma informação, não pergunte novamente.
- Converse naturalmente, como uma vendedora.
- Se o cliente fizer uma pergunta sobre preço, prazo, produto ou pagamento, responda primeiro e depois continue o atendimento.
- O cliente pode escrever o nome do produto ou o número da opção. Entenda ambos.
- O cliente pode informar vários tamanhos e quantidades juntos. Ex.: "2 P, 3 M e 1 GG". Some tudo para definir a faixa de preço.
- Pedido mínimo: 5 peças.

PRODUTOS:
1. Camisa Festa/Memorial
2. Camisa Regata
3. Camisa Uniforme
4. Polo Masculina
5. Polo Feminina
6. Baby Look
7. Avental Oxford

CORES:
Trabalhamos comercialmente com BRANCA e COLORIDA. Se o cliente disser preta, azul, vermelha, verde, rosa etc., considere COLORIDA.

PREÇOS OFICIAIS — VALOR UNITÁRIO:

FESTA/MEMORIAL:
5-9: R$39,90 | 10-19: R$34,90 | 20-49: R$29,90 | 50+: R$26,90

FESTA/MEMORIAL PREMIUM COLORIDA:
5-9: R$44,90 | 10-19: R$39,90 | 20-49: R$35,90 | 50+: R$32,90

REGATA OU UNIFORME EM DTF (FRENTE + COSTAS):
5-9: R$39,90 | 10-19: R$35,90 | 20-49: R$30,90 | 50+: R$27,90

POLO (MASC OU FEM):
5-9: R$74,90 | 10-19: R$69,90 | 20-49: R$62,90 | 50+: R$54,90

BABY LOOK:
5-9: R$41,90 | 10-19: R$37,90 | 20-49: R$32,90 | 50+: R$29,90

AVENTAL OXFORD:
5-9: R$44,90 | 10-19: R$39,90 | 20-49: R$35,90 | 50+: R$32,90

IMPORTANTE: A faixa depende da quantidade TOTAL do produto. Exemplo: 2 P + 2 M + 2 GG = 6 peças (faixa de 5-9).

ATENDIMENTO:
Comece: "Oi! 😊 Seja muito bem-vindo(a) à GIBIPRINTS! Eu sou a Yasmine e vou te ajudar. Qual produto você gostaria de personalizar?"
Depois pergunte uma coisa por vez: Produto, Cor, Tamanhos, Arte e Nome do cliente.
Sempre pergunte: "Está tudo certinho ou deseja trocar ou acrescentar alguma coisa? 😊"

PAGAMENTO E PRAZO:
Condição normal: 50% de entrada + 50% na entrega.
Prazo: 3 a 7 dias úteis após a confirmação da entrada.
Desconto: 10% no total apenas para pagamento de 100% antecipado via Pix.

COMPROVANTE FINAL (GATILHO PARA GERAR A FOTO):
Quando o cliente confirmar que está tudo correto e concordar em gerar o comprovante, VOCÊ DEVE PARAR DE CONVERSAR COMO HUMANA.
A partir desse momento exato, responda APENAS E EXATAMENTE com a estrutura JSON abaixo, preenchendo os dados (não escreva NADA fora das chaves { }):

{
  "pedido_finalizado": true,
  "cliente": "{nome do cliente}",
  "descricao_pedido": "{quantidade total}x {nome do produto} - {cor} ({tamanhos_detalhados})",
  "valor_unitario": {valor_numerico_com_ponto},
  "subtotal": {valor_total_numerico_com_ponto},
  "entrada": {valor_50_porcento_com_ponto}
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

      if (respostaIA.includes('"pedido_finalizado": true')) {
        return res.status(200).json({
          replies: [{ message: "⏳ *Aguarde só um instante...* A Yasmine já calculou tudo e está gerando a imagem do seu comprovante com a nossa logo!" }]
        });
      }

      return res.status(200).json({
        replies: [{ message: respostaIA }]
      });

    } catch (erro) {
      console.error("Erro detectado:", erro);
      return res.status(200).json({
        replies: [{ message: "🚨 *ERRO DO SISTEMA:* " + erro.message }]
      });
    }
  }

  return res.status(200).json({ replies: [{ message: "API conectada e pronta!" }] });
}
