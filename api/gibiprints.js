import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
let historico = {};

export default async function handler(req, res) {
  try {
    const dados = req.body || {};
    const msg = dados.message || "Oi";
    const user = dados.sender || "padrao";
    
    if (!historico[user]) historico[user] = [];

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const chat = model.startChat({ history: historico[user] });
    
    const result = await chat.sendMessage(msg);
    const resposta = result.response.text();
    
    historico[user] = await chat.getHistory();

    // Resposta ultra-simplificada para o AutoResponder não dar erro de JSON
    return res.status(200).json({
      replies: [{ message: resposta }]
    });

  } catch (e) {
    return res.status(200).json({
      replies: [{ message: "Tudo bem por aqui, pode continuar!" }]
    });
  }
}
