const express = require('express');
const router = express.Router();
const { chatbotMessage } = require('../controllers/chatbotController');

router.post('/message', chatbotMessage);

module.exports = router;
