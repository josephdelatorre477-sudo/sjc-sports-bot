const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(bodyParser.json());

// Environment variables
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PORT = process.env.PORT || 3000;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Conversation history storage (in-memory)
const conversationHistory = new Map();

// SJC Sports Knowledge Base
const sportsKnowledge = `
You are the official SJC Sports Assistant for Saint Joseph College Green Hawks. You help students and visitors with sports-related inquiries.

IMPORTANT INFORMATION:
- School: Saint Joseph College
- Team: Green Hawks
- Location: Talisay, Western Visayas, Philippines
- Email: sjcsdo@gmail.com

FAQs YOU MUST ANSWER ACCURATELY:

1. VARSITY SCHOLARSHIP:
Visit the Sports Development Office and inquire about the varsity scholarship program. Requirements and qualifications will be discussed during the screening process.

2. JOINING THE TEAM:
Interested students may visit the Sports Office for enlistment and tryout schedules. Selection will depend on your performance and commitment during training.

3. MERCHANDISE PRICING:
Prices vary depending on the item (e.g., jerseys, jackets, shirts). You may check the official merchandise list at the Sports Office.

4. AVAILABLE SPORTS:
- Basketball
- Volleyball
- Badminton
- Football
- Table tennis
- Swimming
- And more!
Ask the Sports Office for the complete list and current schedules.

PERSONALITY:
- Friendly, enthusiastic, and supportive
- Use emojis occasionally (🏀⚽🏆🦅)
- Keep responses concise (2-4 sentences unless detailed info needed)
- Always encourage students to visit the Sports Office for specific details
- Show school spirit and pride in the Green Hawks

RULES:
- If you don't know something specific, direct them to the Sports Office
- Always prioritize the FAQ information above
- Be helpful and motivating about sports and fitness
- Never make up information about schedules, prices, or specific requirements
`;

// FAQ Database (quick keyword matching)
const faqs = {
  'varsity scholarship': {
    keywords: ['varsity', 'scholarship', 'scholar', 'financial aid', 'avail scholarship'],
    answer: '🎓 *How to avail varsity scholarship:*\n\nVisit the Sports Development Office and inquire about the varsity scholarship program. Requirements and qualifications will be discussed during the screening process.'
  },
  'join team': {
    keywords: ['join', 'team', 'tryout', 'recruit', 'enlist', 'member'],
    answer: '⚽ *How to join the team:*\n\nInterested students may visit the Sports Office for enlistment and tryout schedules. Selection will depend on your performance and commitment during training.'
  },
  'merchandise': {
    keywords: ['merchandise', 'merch', 'price', 'cost', 'jersey', 'jacket', 'shirt', 'buy'],
    answer: '👕 *Merchandise Pricing:*\n\nPrices vary depending on the item (e.g., jerseys, jackets, shirts). You may check the official merchandise list at the Sports Office.'
  },
  'sports events': {
    keywords: ['sports', 'event', 'game', 'tournament', 'competition', 'available', 'what sports'],
    answer: '🏆 *Available Sports Events:*\n\nSaint Joseph College offers:\n• Basketball\n• Volleyball\n• Badminton\n• Football\n• Table tennis\n• Swimming\n• And more!\n\nVisit the Sports Office for the complete list and current schedules.'
  }
};

// Webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === VERIFY_TOKEN) {
    console.log('Webhook verified!');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Handle incoming messages
app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(entry => {
      const webhook_event = entry.messaging[0];
      const sender_psid = webhook_event.sender.id;

      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Quick FAQ keyword matching (fallback)
function findQuickFAQ(userMessage) {
  const message = userMessage.toLowerCase();
  
  for (const [key, faq] of Object.entries(faqs)) {
    for (const keyword of faq.keywords) {
      if (message.includes(keyword.toLowerCase())) {
        return faq.answer;
      }
    }
  }
  return null;
}

// Get or create conversation history
function getConversationHistory(userId) {
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, []);
  }
  return conversationHistory.get(userId);
}

// Add message to history (keep last 10 messages)
function addToHistory(userId, role, content) {
  const history = getConversationHistory(userId);
  history.push({ role, content });
  
  // Keep only last 10 messages to manage memory
  if (history.length > 10) {
    history.shift();
  }
}

// Generate AI response with Gemini
async function generateAIResponse(userMessage, userId) {
  try {
    // Get conversation history
    const history = getConversationHistory(userId);
    
    // Build context with history
    let contextPrompt = sportsKnowledge + '\n\nCONVERSATION HISTORY:\n';
    
    history.forEach(msg => {
      contextPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
    });
    
    contextPrompt += `\nUser: ${userMessage}\n\nAssistant:`;
    
    // Generate response
    const result = await model.generateContent(contextPrompt);
    const response = result.response;
    const aiResponse = response.text();
    
    // Add to history
    addToHistory(userId, 'user', userMessage);
    addToHistory(userId, 'assistant', aiResponse);
    
    return aiResponse;
    
  } catch (error) {
    console.error('Gemini API Error:', error);
    return "I'm having trouble connecting right now. Please try asking: 'help' for quick answers, or contact sjcsdo@gmail.com directly. 🏀";
  }
}

// Handle image attachments with Gemini Vision
async function handleImageWithAI(imageUrl, caption, userId) {
  try {
    // Fetch image as base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.buffer();
    const base64Image = imageBuffer.toString('base64');
    
    // Use Gemini's vision capabilities
    const visionModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `${sportsKnowledge}

The user sent an image with this caption: "${caption || 'No caption'}"

Analyze the image and respond helpfully as the SJC Sports Assistant. If it's sports-related, provide encouragement or relevant information. Keep response brief (2-3 sentences).`;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: 'image/jpeg'
      }
    };
    
    const result = await visionModel.generateContent([prompt, imagePart]);
    const response = result.response.text();
    
    return response;
    
  } catch (error) {
    console.error('Image processing error:', error);
    return "Thanks for sharing! 📸 If you have questions about SJC Sports, feel free to ask!";
  }
}

// Handle messages
async function handleMessage(sender_psid, received_message) {
  let response;
  
  // Show typing indicator
  sendTypingIndicator(sender_psid, true);

  try {
    // Handle text messages
    if (received_message.text) {
      const userText = received_message.text;
      
      // Check for quick commands
      if (userText.toLowerCase() === 'help' || userText.toLowerCase() === 'menu') {
        response = {
          text: '🏀 Welcome to SJC Sports! GREEN HAWKS! 🦅\n\nI\'m your AI assistant powered by Google Gemini. Ask me anything about:\n\n• Varsity scholarships\n• Joining teams\n• Merchandise\n• Sports events\n• Training tips\n• General sports questions\n\nJust type your question naturally!',
          quick_replies: [
            { content_type: 'text', title: '🎓 Scholarship', payload: 'SCHOLARSHIP' },
            { content_type: 'text', title: '⚽ Join Team', payload: 'JOIN' },
            { content_type: 'text', title: '👕 Merchandise', payload: 'MERCH' },
            { content_type: 'text', title: '🏆 Sports', payload: 'SPORTS' }
          ]
        };
      }
      // Clear conversation history
      else if (userText.toLowerCase() === 'clear' || userText.toLowerCase() === 'reset') {
        conversationHistory.delete(sender_psid);
        response = { text: '✅ Conversation cleared! How can I help you today?' };
      }
      // Try quick FAQ match first (faster)
      else {
        const quickAnswer = findQuickFAQ(userText);
        
        if (quickAnswer && userText.split(' ').length <= 5) {
          // Use quick answer for simple queries
          response = { text: quickAnswer };
        } else {
          // Use AI for complex/conversational queries
          const aiResponse = await generateAIResponse(userText, sender_psid);
          response = { text: aiResponse };
        }
      }
    }
    // Handle image attachments
    else if (received_message.attachments) {
      const attachment = received_message.attachments[0];
      
      if (attachment.type === 'image') {
        const imageUrl = attachment.payload.url;
        const caption = received_message.text || '';
        
        const aiResponse = await handleImageWithAI(imageUrl, caption, sender_psid);
        response = { text: aiResponse };
      } else {
        response = { text: 'Thanks for sharing! 📎 If you have sports-related questions, feel free to ask!' };
      }
    }
    
  } catch (error) {
    console.error('Message handling error:', error);
    response = { 
      text: "Oops! Something went wrong. Type 'help' to see what I can do, or contact sjcsdo@gmail.com! 🏀" 
    };
  }
  
  // Turn off typing indicator and send response
  sendTypingIndicator(sender_psid, false);
  callSendAPI(sender_psid, response);
}

// Handle quick reply postbacks
function handlePostback(sender_psid, received_postback) {
  let response;
  const payload = received_postback.payload;

  switch(payload) {
    case 'SCHOLARSHIP':
      response = { text: faqs['varsity scholarship'].answer };
      break;
    case 'JOIN':
      response = { text: faqs['join team'].answer };
      break;
    case 'MERCH':
      response = { text: faqs['merchandise'].answer };
      break;
    case 'SPORTS':
      response = { text: faqs['sports events'].answer };
      break;
    default:
      response = { text: 'Type "help" to see what I can do! 🏀' };
  }

  callSendAPI(sender_psid, response);
}

// Send typing indicator
function sendTypingIndicator(sender_psid, isTyping) {
  const action = isTyping ? 'typing_on' : 'typing_off';
  
  fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: sender_psid },
      sender_action: action
    })
  }).catch(err => console.error('Typing indicator error:', err));
}

// Send message via Facebook API
function callSendAPI(sender_psid, response) {
  const request_body = {
    recipient: { id: sender_psid },
    message: response
  };

  fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request_body)
  })
  .then(res => res.json())
  .then(data => console.log('Message sent!'))
  .catch(err => console.error('Unable to send message:', err));
}

// Health check endpoint
app.get('/', (req, res) => {
  res.send('🏀 SJC Sports AI Bot is running! Powered by Google Gemini 🤖');
});

// Test Gemini connection
app.get('/test-ai', async (req, res) => {
  try {
    const testPrompt = sportsKnowledge + '\n\nUser: Hi!\n\nAssistant:';
    const result = await model.generateContent(testPrompt);
    const response = result.response.text();
    res.json({ status: 'success', response });
  } catch (error) {
    res.json({ status: 'error', error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SJC Sports AI Bot running on port ${PORT}`);
  console.log(`📡 Powered by Google Gemini`);
});