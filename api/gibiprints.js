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

      const mensagem =
        dados.mensagem ||
        dados.message ||
        dados.text ||
        dados.body ||
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
          "Olá! 👋 Seja bem-vindo(a) à GIBIPRINTS! Eu sou a Yasmine. 😊 Como posso ajudar você com seu orçamento?";
      }

      else if (
        texto.includes("preço") ||
        texto.includes("preco") ||
        texto.includes("valor") ||
        texto.includes("orçamento") ||
        texto.includes("orcamento")
      ) {
        resposta =
          "Claro! 😊 Posso preparar seu orçamento. Me informe o produto, quantidade, tamanho e tipo de estampa que você deseja.";
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
            message: "Desculpe, ocorreu um erro ao processar sua mensagem."
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
