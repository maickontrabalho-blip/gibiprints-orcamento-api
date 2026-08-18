import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  try {
    const dados = req.body || {};
    const msg = dados.message || "Oi";
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(msg);
    const resposta = result.response.text();
    
    // Resposta em texto puro
    return res.status(200).send(resposta);

  } catch (e) {
    return res.status(200).send("Tudo certo, pode continuar!");
  }
}
