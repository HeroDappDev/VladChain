"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.multiAgentRouter = void 0;
const express_1 = __importDefault(require("express"));
const multi_agent_1 = require("./multi-agent");
exports.multiAgentRouter = express_1.default.Router();
// POST endpoint to send a message to all agents and get their responses
exports.multiAgentRouter.post('/chat', async (req, res) => {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required and must be a string' });
    }
    try {
        // Get responses from all agents
        const responses = await (0, multi_agent_1.getAllAgentResponses)(message);
        res.json({
            success: true,
            message: 'Responses from all agents',
            responses: responses.map(r => ({
                agentId: r.agentId,
                name: r.name,
                response: r.response
            }))
        });
    }
    catch (error) {
        console.error('Error in multi-agent chat:', error);
        res.status(500).json({
            error: 'Failed to get agent responses',
            details: String(error)
        });
    }
});
// POST endpoint to send a message to a specific agent
exports.multiAgentRouter.post('/chat/:agentId', async (req, res) => {
    const { agentId } = req.params;
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required and must be a string' });
    }
    if (!multi_agent_1.agents[agentId]) {
        return res.status(404).json({ error: `Agent ${agentId} not found` });
    }
    try {
        const response = await (0, multi_agent_1.getAgentResponse)(agentId, message);
        res.json({
            success: true,
            agentId,
            name: multi_agent_1.agents[agentId].name,
            response
        });
    }
    catch (error) {
        console.error(`Error getting response from agent ${agentId}:`, error);
        res.status(500).json({
            error: `Failed to get response from agent ${agentId}`,
            details: String(error)
        });
    }
});
// POST endpoint to get a response from a random agent
exports.multiAgentRouter.post('/chat/random', async (req, res) => {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required and must be a string' });
    }
    try {
        const result = await (0, multi_agent_1.getRandomAgentResponse)(message);
        res.json({
            success: true,
            agentId: result.agentId,
            name: result.name,
            response: result.response
        });
    }
    catch (error) {
        console.error('Error getting random agent response:', error);
        res.status(500).json({
            error: 'Failed to get random agent response',
            details: String(error)
        });
    }
});
// GET endpoint to list all available agents
exports.multiAgentRouter.get('/agents', (req, res) => {
    const agentList = Object.keys(multi_agent_1.agents).map(agentId => ({
        id: agentId,
        name: multi_agent_1.agents[agentId].name,
        model: multi_agent_1.agents[agentId].model
    }));
    res.json({
        success: true,
        agents: agentList
    });
});
// GET endpoint to get a specific agent's information
exports.multiAgentRouter.get('/agents/:agentId', (req, res) => {
    const { agentId } = req.params;
    if (!multi_agent_1.agents[agentId]) {
        return res.status(404).json({ error: `Agent ${agentId} not found` });
    }
    const agent = multi_agent_1.agents[agentId];
    res.json({
        success: true,
        agent: {
            id: agent.id,
            name: agent.name,
            model: agent.model,
            messageCount: agent.messageHistory.length
        }
    });
});
// GET endpoint to get an agent's message history
exports.multiAgentRouter.get('/agents/:agentId/history', (req, res) => {
    const { agentId } = req.params;
    if (!multi_agent_1.agents[agentId]) {
        return res.status(404).json({ error: `Agent ${agentId} not found` });
    }
    const history = (0, multi_agent_1.getAgentHistory)(agentId);
    res.json({
        success: true,
        agentId,
        history
    });
});
// DELETE endpoint to clear an agent's message history
exports.multiAgentRouter.delete('/agents/:agentId/history', (req, res) => {
    const { agentId } = req.params;
    if (!multi_agent_1.agents[agentId]) {
        return res.status(404).json({ error: `Agent ${agentId} not found` });
    }
    multi_agent_1.agents[agentId].messageHistory = [];
    res.json({
        success: true,
        message: `Cleared history for agent ${agentId}`
    });
});
// DELETE endpoint to clear all agents' message history
exports.multiAgentRouter.delete('/history', (req, res) => {
    (0, multi_agent_1.clearAllAgentHistory)();
    res.json({
        success: true,
        message: 'Cleared history for all agents'
    });
});
// POST endpoint to simulate a conversation between agents (for testing)
exports.multiAgentRouter.post('/simulate', async (req, res) => {
    const { topic, rounds = 3 } = req.body;
    if (!topic || typeof topic !== 'string') {
        return res.status(400).json({ error: 'Topic is required and must be a string' });
    }
    try {
        const conversation = [];
        // Get initial responses from all agents
        const initialResponses = await (0, multi_agent_1.getAllAgentResponses)(topic);
        conversation.push(...initialResponses);
        // Continue conversation for specified rounds
        for (let i = 1; i < rounds; i++) {
            // Get a random agent to continue the conversation
            const randomAgentId = Object.keys(multi_agent_1.agents)[Math.floor(Math.random() * Object.keys(multi_agent_1.agents).length)];
            const continuationPrompt = `Continue this conversation about "${topic}" with a new perspective or insight.`;
            const response = await (0, multi_agent_1.getAgentResponse)(randomAgentId, continuationPrompt);
            conversation.push({
                agentId: randomAgentId,
                name: multi_agent_1.agents[randomAgentId].name,
                response
            });
        }
        res.json({
            success: true,
            topic,
            rounds,
            conversation
        });
    }
    catch (error) {
        console.error('Error simulating conversation:', error);
        res.status(500).json({
            error: 'Failed to simulate conversation',
            details: String(error)
        });
    }
});
