"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatbotService_1 = require("../services/chatbotService");
const router = (0, express_1.Router)();
// POST /api/chatbot/message - Process natural language user question
router.post('/message', async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        if (typeof message !== 'string') {
            return res.status(400).json({ error: 'Message must be a string' });
        }
        const sid = sessionId || 'demo-user-session';
        const result = await chatbotService_1.ChatbotService.processMessage(message, sid);
        res.json(result);
    }
    catch (error) {
        console.error('[ChatbotRoute] Error processing message:', error);
        res.status(500).json({
            error: 'Failed to process message',
            message: "I'm having a little trouble connecting to the live campus telemetry right now. Please try again in a moment!"
        });
    }
});
// GET /api/chatbot/suggestions - Initial quick prompt chips
router.get('/suggestions', (req, res) => {
    res.json({
        suggestions: [
            'Is Block 34 (CSE) free right now?',
            'Where can I park near the Uni-Mall?',
            'What events are happening today?',
            'How crowded is the Central Library?',
            'How do I report a maintenance issue?'
        ]
    });
});
exports.default = router;
