// server.js - SJC Sports Facebook Chatbot (IMPROVED with Better Error Logging)
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Configuration
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'sjc_sports_2025_verify';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PORT = process.env.PORT || 3000;

// Critical validation on startup
console.log('\n🔍 STARTUP VALIDATION:');
if (!PAGE_ACCESS_TOKEN || PAGE_ACCESS_TOKEN === 'undefined' || PAGE_ACCESS_TOKEN.length < 50) {
  console.error('❌ CRITICAL ERROR: PAGE_ACCESS_TOKEN is missing or invalid!');
  console.error('   Token length:', PAGE_ACCESS_TOKEN ? PAGE_ACCESS_TOKEN.length : 0);
  console.error('   First 20 chars:', PAGE_ACCESS_TOKEN ? PAGE_ACCESS_TOKEN.substring(0, 20) + '...' : 'NONE');
  console.error('\n   ⚠️  THE BOT WILL NOT WORK WITHOUT A VALID TOKEN!');
  console.error('   📌 Get it from: Facebook App Dashboard → Messenger → Access Tokens\n');
} else {
  console.log('✅ PAGE_ACCESS_TOKEN: Set correctly (length:', PAGE_ACCESS_TOKEN.length, ')');
}

if (!GEMINI_API_KEY || GEMINI_API_KEY === 'undefined') {
  console.warn('⚠️  WARNING: GEMINI_API_KEY not set. Using fallback responses only.');
} else {
  console.log('✅ GEMINI_API_KEY: Set correctly');
}

console.log('✅ VERIFY_TOKEN:', VERIFY_TOKEN);
console.log('');

// Using Gemini 2.0 Flash
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

// Business Context
const BUSINESS_CONTEXT = `You are a friendly and helpful MULTILINGUAL assistant for the Saint Joseph College (SJC) GreenHawks Sports Program in Maasin City, Southern Leyte, Philippines.

BUSINESS DETAILS:
- Name: Saint Joseph College GreenHawks Sports Program
- Location: Tungka-tunga, Maasin City, Southern Leyte, Philippines
- Email: sjcdo@gmail.com
- Sports Offered: Basketball, Volleyball, Badminton, Football, Table Tennis, Swimming, and more

CORE VALUES: Teamwork, Discipline, Sportsmanship, Resilience, Faith

KEY INFORMATION:
- We compete in PRISAA regional and national meets
- We provide varsity scholarships for qualified student-athletes
- Athletes must maintain academic eligibility
- Medical clearance required before tryouts
- Training: 2-3 hours, 4-5 times/week, late afternoon/evening
- School provides uniforms and major equipment
- Travel, accommodation, and meals provided for competitions

CRITICAL INSTRUCTIONS:
1. **ALWAYS detect and respond in the SAME LANGUAGE the user writes in**
2. Keep responses SHORT (2-4 sentences) but helpful
3. Use sports emojis: 🏀⚽🏐🏆🦅
4. If unsure, suggest contacting sjcdo@gmail.com
5. Be enthusiastic about SJC sports!

IMPORTANT: Your response MUST be in the SAME language as the user's message.`;

// Language detection
function detectLanguage(text) {
  const lower = text.toLowerCase();
  
  if (lower.match(/(ako|ikaw|mo|ko|ba|po|hindi|oo|paano|ano)/)) return 'Filipino';
  if (lower.match(/(nako|nimo|dili|unsa|asa)/)) return 'Cebuano';
  if (lower.match(/(hola|gracias|sí|cómo|qué)/)) return 'Spanish';
  if (lower.match(/(bonjour|merci|oui|comment)/)) return 'French';
  if (lower.match(/(hallo|danke|ja|wie)/)) return 'German';
  if (lower.match(/(ciao|grazie|sì|come)/)) return 'Italian';
  if (lower.match(/(olá|obrigado|sim|como)/)) return 'Portuguese';
  if (text.match(/[а-яА-ЯёЁ]/)) return 'Russian';
  if (text.match(/[\u0600-\u06FF]/)) return 'Arabic';
  if (text.match(/[\u4E00-\u9FFF]/)) return 'Chinese';
  if (text.match(/[\u3040-\u309F\u30A0-\u30FF]/)) return 'Japanese';
  if (text.match(/[\uAC00-\uD7AF]/)) return 'Korean';
  if (text.match(/[\u0E00-\u0E7F]/)) return 'Thai';
  if (text.match(/[\u0900-\u097F]/)) return 'Hindi';
  
  return 'English';
}

// Root route
app.get('/', (req, res) => {
  const tokenStatus = PAGE_ACCESS_TOKEN && PAGE_ACCESS_TOKEN.length > 50;
  const geminiStatus = GEMINI_API_KEY && GEMINI_API_KEY !== 'undefined';
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SJC Sports Chatbot</title>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 900px;
          margin: 50px auto;
          padding: 20px;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          color: white;
        }
        .container {
          background: rgba(255,255,255,0.1);
          padding: 30px;
          border-radius: 10px;
          backdrop-filter: blur(10px);
        }
        h1 { font-size: 2.5em; margin-bottom: 10px; }
        .status { margin: 20px 0; }
        .status-item { 
          padding: 15px; 
          margin: 10px 0; 
          background: rgba(255,255,255,0.2); 
          border-radius: 5px;
          font-size: 1.1em;
        }
        .green { color: #4CAF50; font-weight: bold; }
        .red { color: #f44336; font-weight: bold; }
        .warning { 
          background: rgba(255,152,0,0.2); 
          border-left: 4px solid #ff9800;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .success {
          background: rgba(76,175,80,0.2);
          border-left: 4px solid #4CAF50;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏀 SJC GreenHawks Sports Chatbot</h1>
        <p><strong>🌍 Powered by Google Gemini 2.0 Flash - MULTILINGUAL AI</strong></p>
        
        <div class="status">
          <div class="status-item">
            🚀 Server Status: <span class="green">✓ Running on Port ${PORT}</span>
          </div>
          <div class="status-item">
            🔑 Verify Token: <span class="${VERIFY_TOKEN ? 'green' : 'red'}">${VERIFY_TOKEN ? '✓ Set' : '✗ Missing'}</span>
          </div>
          <div class="status-item">
            📱 Page Access Token: <span class="${tokenStatus ? 'green' : 'red'}">${tokenStatus ? '✓ Valid (length: ' + PAGE_ACCESS_TOKEN.length + ')' : '✗ MISSING OR INVALID'}</span>
          </div>
          <div class="status-item">
            🤖 Gemini API: <span class="${geminiStatus ? 'green' : 'red'}">${geminiStatus ? '✓ Configured' : '⚠ Using Fallback Responses'}</span>
          </div>
        </div>

        ${!tokenStatus ? `
        <div class="warning">
          <h3>⚠️ ACTION REQUIRED</h3>
          <p><strong>Your PAGE_ACCESS_TOKEN is missing or invalid!</strong></p>
          <p>The bot will NOT work until you:</p>
          <ol>
            <li>Go to Facebook App Dashboard → Messenger → Access Tokens</li>
            <li>Generate a Page Access Token for "SJC Sports Chat"</li>
            <li>Copy the token (it's very long, starts with EAA...)</li>
            <li>Go to Render Dashboard → Environment → Edit PAGE_ACCESS_TOKEN</li>
            <li>Paste the token and save</li>
          </ol>
        </div>
        ` : `
        <div class="success">
          <h3>✅ Configuration Looks Good!</h3>
          <p><strong>Next steps:</strong></p>
          <ol>
            <li>Verify your webhook in Facebook App Dashboard</li>
            <li>Subscribe webhook to your page</li>
            <li>Test by messaging your page!</li>
          </ol>
        </div>
        `}

        <div style="margin-top: 30px; padding: 15px; background: rgba(255,255,255,0.15); border-radius: 5px;">
          <h3>📋 Setup Information:</h3>
          <p><strong>Webhook URL:</strong> ${req.protocol}://${req.get('host')}/webhook</p>
          <p><strong>Verify Token:</strong> ${VERIFY_TOKEN}</p>
          <p><strong>Facebook Page:</strong> SJC Sports Chat</p>
          <p><strong>Contact:</strong> sjcdo@gmail.com</p>
        </div>

        <div style="margin-top: 20px; font-size: 0.9em; opacity: 0.8;">
          <p>🌍 Supports ALL major languages: English, Filipino, Cebuano, Spanish, French, German, Italian, Portuguese, Russian, Arabic, Chinese, Japanese, Korean, Hindi, and more!</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('\n📞 WEBHOOK VERIFICATION REQUEST:');
  console.log('   Mode:', mode);
  console.log('   Token received:', token);
  console.log('   Token expected:', VERIFY_TOKEN);
  console.log('   Challenge:', challenge);

  if (mode && token === VERIFY_TOKEN) {
    if (mode === 'subscribe') {
      console.log('✅ WEBHOOK VERIFIED SUCCESSFULLY!');
      console.log('   Responding with challenge:', challenge);
      res.status(200).send(challenge);
    }
  } else {
    console.error('❌ WEBHOOK VERIFICATION FAILED!');
    console.error('   Token mismatch or missing mode');
    res.sendStatus(403);
  }
});

// Webhook event handler with detailed logging
app.post('/webhook', (req, res) => {
  console.log('\n📬 WEBHOOK EVENT RECEIVED:');
  console.log('   Body:', JSON.stringify(req.body, null, 2));

  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(entry => {
      entry.messaging.forEach(event => {
        console.log('   Event type:', Object.keys(event));
        console.log('   Sender ID:', event.sender?.id);
        
        if (event.message && event.message.text) {
          console.log('   Message text:', event.message.text);
          handleMessage(event.sender.id, event.message.text);
        } else if (event.postback) {
          console.log('   Postback payload:', event.postback.payload);
          handlePostback(event.sender.id, event.postback.payload);
        } else {
          console.log('   ⚠️  Unknown event type');
        }
      });
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    console.warn('   ⚠️  Not a page object');
    res.sendStatus(404);
  }
});

// Message handler with detailed logging
async function handleMessage(senderId, messageText) {
  console.log(`\n📨 PROCESSING MESSAGE:`);
  console.log(`   From: ${senderId}`);
  console.log(`   Text: "${messageText}"`);
  
  const detectedLanguage = detectLanguage(messageText);
  console.log(`   Detected language: ${detectedLanguage}`);

  // Validate token before attempting to send
  if (!PAGE_ACCESS_TOKEN || PAGE_ACCESS_TOKEN.length < 50) {
    console.error('❌ CANNOT RESPOND: PAGE_ACCESS_TOKEN is invalid!');
    console.error('   Token length:', PAGE_ACCESS_TOKEN ? PAGE_ACCESS_TOKEN.length : 0);
    return;
  }

  // Show typing indicator
  sendTypingIndicator(senderId, true);

  // Try Gemini AI
  if (GEMINI_API_KEY && GEMINI_API_KEY !== 'undefined') {
    try {
      console.log('   🤖 Calling Gemini AI...');
      const aiResponse = await getGeminiResponseWithRetry(messageText, detectedLanguage, 2);
      console.log('   ✅ AI Response:', aiResponse.substring(0, 100) + '...');
      sendQuickReply(senderId, aiResponse, detectedLanguage);
      return;
    } catch (error) {
      console.error('   ❌ Gemini AI failed:', error.message);
      console.error('   Falling back to default responses');
    }
  } else {
    console.log('   ℹ️  Gemini not configured, using fallback');
  }

  // Fallback response
  const fallbackResponse = getMultilingualFallback(detectedLanguage);
  console.log('   📋 Using fallback:', fallbackResponse.substring(0, 50) + '...');
  sendQuickReply(senderId, fallbackResponse, detectedLanguage);
}

// Gemini AI with retry logic
async function getGeminiResponseWithRetry(userMessage, detectedLanguage, maxRetries = 2) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'undefined') {
    throw new Error('Gemini API key not configured');
  }

  const languageInstruction = `CRITICAL: The user wrote in ${detectedLanguage}. Respond ONLY in ${detectedLanguage}.`;
  const fullPrompt = `${BUSINESS_CONTEXT}\n\n${languageInstruction}\n\nUser: "${userMessage}"\n\nResponse (in ${detectedLanguage}, 2-4 sentences):`;

  const requestBody = {
    contents: [{ parts: [{ text: fullPrompt }] }],
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 200,
      topP: 0.95,
      topK: 40
    }
  };

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      console.log(`   🔄 Gemini attempt ${attempt}/${maxRetries + 1}`);
      
      const response = await axios.post(GEMINI_API_URL, requestBody, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      });

      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return response.data.candidates[0].content.parts[0].text.trim();
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error(`   ⚠️  Attempt ${attempt} failed:`, error.response?.data?.error?.message || error.message);
      
      if (error.response?.status === 503 && attempt <= maxRetries) {
        console.log(`   ⏳ Retrying in ${attempt * 2} seconds...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        continue;
      }
      throw error;
    }
  }
}

// Multilingual fallback responses
function getMultilingualFallback(language) {
  const fallbacks = {
    'English': "I'm here to help with SJC GreenHawks Sports! 🏀 Ask me about scholarships, joining teams, merchandise, training schedules, or contact us at sjcdo@gmail.com 📧",
    'Filipino': "Nandito ako para tumulong sa SJC GreenHawks Sports! 🏀 Tanungin mo ako tungkol sa scholarships, pagsali sa teams, merchandise, training schedules, o contact us sa sjcdo@gmail.com 📧",
    'Cebuano': "Ania ko para motabang sa SJC GreenHawks Sports! 🏀 Pangutana ko bahin sa scholarships, pag-apil sa teams, merchandise, training schedules, o kontak sa sjcdo@gmail.com 📧",
    'Spanish': "¡Estoy aquí para ayudar con SJC GreenHawks Sports! 🏀 Pregúntame sobre becas, unirse a equipos, mercancía, horarios de entrenamiento, o contáctanos en sjcdo@gmail.com 📧",
    'French': "Je suis là pour vous aider avec SJC GreenHawks Sports! 🏀 Demandez-moi des bourses, rejoindre des équipes, marchandises, horaires d'entraînement, ou contactez-nous à sjcdo@gmail.com 📧"
  };

  return fallbacks[language] || fallbacks['English'];
}

// Handle postback buttons
function handlePostback(senderId, payload) {
  console.log(`   📘 Processing postback: ${payload}`);
  
  const responses = {
    'GET_STARTED': "Welcome to SJC GreenHawks Sports! 🏀🦅 I can help you in ANY language! How can I assist you today?",
    'SHOW_FAQS': "Here's what I can help you with! 👇 Click a button or ask me anything!",
    'CONTACT_US': "📧 Contact the Sports Development Office at sjcdo@gmail.com or message me here! 😊"
  };

  sendQuickReply(senderId, responses[payload] || responses['GET_STARTED'], 'English');
}

// Send typing indicator
function sendTypingIndicator(recipientId, isTyping) {
  const messageData = {
    recipient: { id: recipientId },
    sender_action: isTyping ? 'typing_on' : 'typing_off'
  };
  callSendAPI(messageData);
}

// Send message with quick replies
function sendQuickReply(recipientId, messageText, language) {
  const quickReplyTranslations = {
    'English': { scholarship: '🎓 Scholarship', join: '🏃 Join', merch: '👕 Merch', sports: '🏆 Sports', training: '⏰ Training', contact: '📧 Contact' },
    'Filipino': { scholarship: '🎓 Scholarship', join: '🏃 Sumali', merch: '👕 Merch', sports: '🏆 Sports', training: '⏰ Training', contact: '📧 Kontak' },
    'Cebuano': { scholarship: '🎓 Scholarship', join: '🏃 Apil', merch: '👕 Merch', sports: '🏆 Sports', training: '⏰ Training', contact: '📧 Kontak' }
  };

  const translations = quickReplyTranslations[language] || quickReplyTranslations['English'];

  const messageData = {
    recipient: { id: recipientId },
    message: {
      text: messageText,
      quick_replies: [
        { content_type: "text", title: translations.scholarship, payload: "SCHOLARSHIP" },
        { content_type: "text", title: translations.join, payload: "JOIN" },
        { content_type: "text", title: translations.merch, payload: "MERCHANDISE" },
        { content_type: "text", title: translations.sports, payload: "SPORTS" },
        { content_type: "text", title: translations.training, payload: "TRAINING" },
        { content_type: "text", title: translations.contact, payload: "CONTACT_US" }
      ]
    }
  };
  
  callSendAPI(messageData);
}

// Call Facebook Send API with detailed error logging
function callSendAPI(messageData) {
  if (!PAGE_ACCESS_TOKEN || PAGE_ACCESS_TOKEN.length < 50) {
    console.error('❌ CANNOT SEND: Invalid PAGE_ACCESS_TOKEN');
    return;
  }

  console.log('   📤 Sending message to Facebook...');
  
  axios.post(`https://graph.facebook.com/v18.0/me/messages`, messageData, {
    params: { access_token: PAGE_ACCESS_TOKEN },
    timeout: 10000
  })
  .then((response) => {
    console.log('   ✅ Message sent successfully!');
    console.log('   Message ID:', response.data.message_id);
  })
  .catch(error => {
    console.error('   ❌ SEND FAILED!');
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', JSON.stringify(error.response.data, null, 2));
      
      // Specific error messages
      if (error.response.data?.error?.code === 190) {
        console.error('   ⚠️  TOKEN ERROR: Your PAGE_ACCESS_TOKEN is invalid or expired!');
        console.error('   Action: Generate a new token from Facebook Developer Dashboard');
      } else if (error.response.data?.error?.code === 200) {
        console.error('   ⚠️  PERMISSION ERROR: Missing permissions for this page');
        console.error('   Action: Check if webhook is subscribed to your page');
      } else if (error.response.data?.error?.code === 10) {
        console.error('   ⚠️  APPLICATION ERROR: Check app permissions');
      }
    } else if (error.request) {
      console.error('   No response received from Facebook');
      console.error('   Network error or timeout');
    } else {
      console.error('   Error:', error.message);
    }
  });
}

// Start server with comprehensive status
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(70));
  console.log('🏀 SJC GREENHAWKS SPORTS CHATBOT');
  console.log('='.repeat(70));
  console.log(`📍 Server running on port ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🔗 Webhook: /webhook`);
  console.log('='.repeat(70));
  console.log('📊 CONFIGURATION STATUS:');
  console.log('='.repeat(70));
  
  // Verify Token
  if (VERIFY_TOKEN) {
    console.log('✅ VERIFY_TOKEN: Set (' + VERIFY_TOKEN + ')');
  } else {
    console.log('❌ VERIFY_TOKEN: Missing');
  }
  
  // Page Access Token
  if (PAGE_ACCESS_TOKEN && PAGE_ACCESS_TOKEN.length > 50) {
    console.log('✅ PAGE_ACCESS_TOKEN: Valid (length: ' + PAGE_ACCESS_TOKEN.length + ')');
    console.log('   First 30 chars: ' + PAGE_ACCESS_TOKEN.substring(0, 30) + '...');
    console.log('   Last 10 chars: ...' + PAGE_ACCESS_TOKEN.substring(PAGE_ACCESS_TOKEN.length - 10));
  } else if (PAGE_ACCESS_TOKEN) {
    console.log('❌ PAGE_ACCESS_TOKEN: TOO SHORT! (length: ' + PAGE_ACCESS_TOKEN.length + ')');
    console.log('   Expected: 200+ characters');
    console.log('   Current value: ' + PAGE_ACCESS_TOKEN);
  } else {
    console.log('❌ PAGE_ACCESS_TOKEN: NOT SET!');
  }
  
  // Gemini API Key
  if (GEMINI_API_KEY && GEMINI_API_KEY !== 'undefined') {
    console.log('✅ GEMINI_API_KEY: Set (length: ' + GEMINI_API_KEY.length + ')');
  } else {
    console.log('⚠️  GEMINI_API_KEY: Not set (will use fallback responses)');
  }
  
  console.log('='.repeat(70));
  console.log('🌍 MULTILINGUAL SUPPORT ENABLED');
  console.log('='.repeat(70));
  console.log('Languages: English, Filipino, Cebuano, Spanish, French,');
  console.log('          German, Italian, Portuguese, Russian, Arabic,');
  console.log('          Chinese, Japanese, Korean, Hindi, Thai, and more!');
  console.log('='.repeat(70));
  
  // Next steps
  console.log('\n📋 NEXT STEPS TO MAKE BOT WORK:');
  console.log('='.repeat(70));
  
  if (!PAGE_ACCESS_TOKEN || PAGE_ACCESS_TOKEN.length < 50) {
    console.log('🔴 CRITICAL: Set PAGE_ACCESS_TOKEN first!');
    console.log('   1. Go to: https://developers.facebook.com/apps/');
    console.log('   2. Select your app → Messenger → Access Tokens');
    console.log('   3. Generate token for "SJC Sports Chat" page');
    console.log('   4. Copy the FULL token (starts with EAA...)');
    console.log('   5. Set in Render: Environment → PAGE_ACCESS_TOKEN');
  } else {
    console.log('✅ Token is set! Now configure webhook:');
    console.log('   1. Go to Facebook App → Messenger → Webhooks');
    console.log('   2. Click "Add Callback URL"');
    console.log('   3. Callback URL: https://sjc-sports-bot.onrender.com/webhook');
    console.log('   4. Verify Token: ' + VERIFY_TOKEN);
    console.log('   5. Subscribe to: messages, messaging_postbacks');
    console.log('   6. Subscribe webhook to YOUR PAGE');
    console.log('   7. Test by messaging your Facebook page!');
  }
  
  console.log('='.repeat(70));
  console.log('🎯 Test the bot: https://www.facebook.com/people/SJC-Sports-Chat/61582368223061/');
  console.log('📧 Contact: sjcdo@gmail.com');
  console.log('='.repeat(70) + '\n');
  
  console.log('✨ Chatbot is ready! Waiting for messages...\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Catch unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
