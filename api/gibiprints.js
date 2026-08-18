export default async function handler(req, res) {

  // Permitir requisições do AutoResponder e do navegador
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Responder ao teste CORS
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Teste simples pelo navegador
  if (req.method === "GET") {
    return res.status(200).json({
      sucesso: true,
      sistema: "GIBIPRINTS",
      servidor: "online",
      atendente: "Yasmine",
      mensagem: "Servidor web da GIBIPRINTS funcionando!"
    });
  }

  // Receber mensagens do AutoResponder
  if (req.method === "POST") {
    try {
      const dados = req.body || {};

      // CORREÇÃO: O AutoResponder envia a mensagem dentro de dados.query.message
      const mensagem =
        dados.query?.message ||
        dados.message ||
        dados.text ||
        "";

      const texto = String(mensagem).toLowerCase().trim();

      let resposta =
        "Olá! 👋 Eu sou a Yasmine, atendente virtual da GIBIPRINTS. Como posso ajudar?";

      if (
        texto.includes("oi") ||
        texto.includes("olá") ||
        texto.includes("ola") ||
        texto.includes("bom dia") ||
        texto.includes("boa tarde") ||
        texto.includes("boa noite")
      ) {
        resposta =
          "Olá! 👋 Seja bem-vindo(a) à GIBIPRINTS! Eu sou a Yasmine. 😊 Como posso ajudar você?";
      }

      else if (
        texto.includes("preço") ||
        texto.includes("preco") ||
        texto.includes("valor") ||
        texto.includes("orçamento") ||
        texto.includes("orcamento")
      ) {
        // CORREÇÃO: Estrutura visual da notinha/comprovante
        resposta = 
          "🧾 *COMPROVANTE DE ORÇAMENTO - GIBIPRINTS*\n" +
          "-----------------------------------\n" +
          "Status: Aguardando detalhes\n" +
          "Atendente: Yasmine\n\n" +
          "Por favor, me informe:\n" +
          "1️⃣ Produto (ex: Camisa, Caneca)\n" +
          "2️⃣ Quantidade\n" +
          "3️⃣ Tipo de Estampa\n\n" +
          "_Assim que você enviar os dados, eu calculo o valor total para você!_";
      }

      else if (
        texto.includes("camisa") ||
        texto.includes("camiseta") ||
        texto.includes("regata")
      ) {
        resposta =
          "Perfeito! 👕 Trabalhamos com personalização de camisas e regatas. Me diga a quantidade e o modelo que você deseja para eu continuar seu orçamento.";
      }

      else if (
        texto.includes("whatsapp") ||
        texto.includes("contato")
      ) {
        resposta =
          "Claro! 📲 Vou te ajudar com o atendimento da GIBIPRINTS. Me informe o que você deseja personalizar e a quantidade.";
      }

      // Formato de resposta exigido pelo AutoResponder
      return res.status(200).json({
        replies: [
          {
            message: resposta
          }
        ]
      });

    } catch (erro) {
      return res.status(500).json({
        replies: [
          {
            message: "Desculpe, ocorreu um erro no servidor da GIBIPRINTS ao processar sua mensagem."
          }
        ]
      });
    }
  }

  return res.status(405).json({
    replies: [
      {
        message: "Método não permitido."
      }
    ]
  });
}

