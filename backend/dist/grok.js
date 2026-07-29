"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.grokChatCompletion = grokChatCompletion;
const node_fetch_1 = __importDefault(require("node-fetch"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const GROK_API_KEY = process.env.GROK_API_KEY;
const GROK_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
if (!GROK_API_KEY || GROK_API_KEY === 'your_grok_api_key_here') {
    console.warn('Warning: GROK_API_KEY not set. AI personality features will be disabled.');
}
async function grokChatCompletion(personaPrompt, message) {
    // Check if we have a valid API key
    if (!GROK_API_KEY || GROK_API_KEY === 'your_grok_api_key_here') {
        throw new Error('GROK_API_KEY is required. Please set a valid Grok API key in your .env file.');
    }
    // Use real Grok API
    const body = {
        model: 'mixtral-8x7b-32768',
        messages: [
            { role: 'system', content: personaPrompt },
            { role: 'user', content: message },
        ],
        max_tokens: 200,
        temperature: 0.8,
    };
    try {
        const response = await (0, node_fetch_1.default)(GROK_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROK_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const errTxt = await response.text();
            console.error('Grok API error:', errTxt);
            throw new Error(`Grok API request failed: ${errTxt}`);
        }
        const data = await response.json();
        const aiResponse = data.choices?.[0]?.message?.content?.trim() || '(no response)';
        // Add some personality-specific emojis to the AI response
        let enhancedResponse = aiResponse;
        if (personaPrompt.includes('Alice'))
            enhancedResponse = `😊 ${aiResponse}`;
        else if (personaPrompt.includes('Bob'))
            enhancedResponse = `😏 ${aiResponse}`;
        else if (personaPrompt.includes('Carol'))
            enhancedResponse = `🧠 ${aiResponse}`;
        else if (personaPrompt.includes('Dave'))
            enhancedResponse = `😰 ${aiResponse}`;
        else if (personaPrompt.includes('Eve'))
            enhancedResponse = `😌 ${aiResponse}`;
        return enhancedResponse;
    }
    catch (error) {
        console.error('Grok API error:', error);
        throw error; // Re-throw the error instead of falling back to mock responses
    }
}
