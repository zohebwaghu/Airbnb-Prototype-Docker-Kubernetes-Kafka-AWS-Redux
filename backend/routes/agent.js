const express = require('express');
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// AI Agent endpoint
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
    const aiAgentUrl = process.env.AI_AGENT_URL || 'http://localhost:8000';
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
