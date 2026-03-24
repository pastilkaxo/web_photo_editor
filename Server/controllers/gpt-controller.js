require('dotenv').config();
const { Mistral } = require("@mistralai/mistralai");
const Together = require("together-ai");

const mistral = new Mistral({
    apiKey: process.env.OPENAI_API_KEY,
});

class GptController {

    async generateText(req, res) {
        try {
            const { text } = req.body;
            if (!text) {
                return res.status(400).json({ message: "Введите текст." });
            }
            if (!process.env.OPENAI_API_KEY) {
                return res.status(500).json({ message: "Не задан ключ Mistral API." });
            }

            const response = await mistral.chat.complete({
                model: "mistral-small-latest",
                messages: [{ role: "user", content: text }],
            });

            const generatedText = response.choices[0]?.message?.content?.trim();
            if (!generatedText) {
                return res.status(500).json({ message: "Не удалось получить ответ от модели" });
            }
            res.json({ generatedText });
        } catch (err) {
            console.log(err.message);
            res.status(500).json({ message: "Ошибка при генерации текста" });
        }
    }

    async generateImage(req, res) {
        try {
            const { prompt } = req.body;
            if (!prompt || !prompt.trim()) {
                return res.status(400).json({ message: "Введите описание изображения (prompt)." });
            }

            const togetherKey = process.env.TOGETHER_API_KEY;
            if (!togetherKey) {
                return res.status(500).json({ message: "Together AI API ключ не задан! Добавьте TOGETHER_API_KEY в .env" });
            }

            const together = new Together({ apiKey: togetherKey });

            const response = await together.images.generate({
                model: "black-forest-labs/FLUX.1-schnell-Free",
                prompt: prompt.trim(),
                width: 1024,
                height: 1024,
                steps: 4,
                n: 1,
                response_format: "b64_json",
            });

            const b64 = response.data?.[0]?.b64_json;
            if (!b64) {
                console.error("Together AI: пустой ответ", response);
                return res.status(500).json({ message: "Модель не вернула изображение. Попробуйте ещё раз." });
            }

            return res.json({ imageUrl: `data:image/png;base64,${b64}` });

        } catch (err) {
            console.error("Image generation error:", err?.message || err);

            const status = err?.status;
            const detail = err?.error?.message || err?.message;

            if (status === 401 || status === 403) {
                return res.status(500).json({ message: "Неверный Together AI API ключ." });
            }
            if (status === 429) {
                return res.status(429).json({ message: "Превышен лимит запросов Together AI. Подождите немного." });
            }
            if (detail?.includes("timeout") || err?.code === "ETIMEDOUT") {
                return res.status(504).json({ message: "Модель не ответила вовремя. Попробуйте ещё раз." });
            }
            if (detail) {
                return res.status(500).json({ message: `Ошибка Together AI: ${detail}` });
            }

            return res.status(500).json({ message: "Ошибка при генерации изображения. Попробуйте ещё раз." });
        }
    }
}

module.exports = new GptController();
