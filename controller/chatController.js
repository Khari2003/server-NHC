const { GoogleGenerativeAI } = require("@google/generative-ai"); // đúng package

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.chat = async (req, res) => {
  try {
    const { message } = req.body;

    // gọi model
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Câu hỏi: ${message}
    `;

    const result = await model.generateContent(prompt);

    res.json({ reply: result.response.text() });
  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({ error: "Lỗi khi gọi Gemini" });
  }
};
