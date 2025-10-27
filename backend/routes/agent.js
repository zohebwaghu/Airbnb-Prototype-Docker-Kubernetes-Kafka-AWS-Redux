const express = require('express');
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Chat endpoint - for conversational AI agent
router.post('/chat', requireAuth, async (req, res) => {
  try {
    const { user_message, booking_context, conversation_history } = req.body;

    // Validate required fields
    if (!user_message) {
      return res.status(400).json({
        error: 'user_message is required'
      });
    }

    // Call AI agent service chat endpoint
    const aiAgentUrl = process.env.AI_AGENT_URL || 'http://ai-agent:8000';
    const response = await axios.post(`${aiAgentUrl}/chat`, {
      user_message,
      booking_context: booking_context || null,
      conversation_history: conversation_history || []
    }, {
      timeout: 30000, // 30 second timeout for chat
      headers: {
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);

  } catch (error) {
    console.error('AI Agent chat error:', error);

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'AI Agent service is not available'
      });
    }

    if (error.response) {
      return res.status(error.response.status).json({
        error: error.response.data.detail || 'AI Agent service error'
      });
    }

    res.status(500).json({
      error: 'Failed to process chat message'
    });
  }
});

// AI Agent endpoint for travel plan generation
router.post('/travel-plan', requireAuth, async (req, res) => {
  try {
    const { booking_context, preferences } = req.body;

    // Validate required fields
    if (!booking_context || !preferences) {
      return res.status(400).json({
        error: 'booking_context and preferences are required'
      });
    }

    // Call AI agent service
    const aiAgentUrl = process.env.AI_AGENT_URL || 'http://ai-agent:8000';
    const response = await axios.post(`${aiAgentUrl}/generate-plan`, {
      booking_context,
      preferences
    }, {
      timeout: 120000, // 120 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);

  } catch (error) {
    console.error('AI Agent error:', error);

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'AI Agent service is not available'
      });
    }

    if (error.response) {
      return res.status(error.response.status).json({
        error: error.response.data.detail || 'AI Agent service error'
      });
    }

    res.status(500).json({
      error: 'Failed to generate travel plan'
    });
  }
});

module.exports = router;
