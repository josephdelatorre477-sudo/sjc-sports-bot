// server.js - SJC Sports Facebook Chatbot (FULLY FIXED & DEBUGGED)
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

// Validate configuration
console.log('\n🔍 CONFIGURATION CHECK:');
console.log('✓ VERIFY_TOKEN:', VERIFY_TOKEN ? 'SET' : 'MISSING');
console.log('✓ PAGE_ACCESS_TOKEN:', PAGE_ACCESS_TOKEN ? `SET (${PAGE_ACCESS_TOKEN.length} chars)` : 'MISSING');
console.log('✓ GEMINI_API_KEY:', GEMINI_API_KEY ? 'SET' : 'MISSING');

// Using Gemini 2.0 Flash
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

// Enhanced Business Context
const BUSINESS_CONTEXT = `You are a friendly MULTILINGUAL assistant for Saint Joseph College (SJC) GreenHawks Sports Program in Maasin City, Philippines.

KEY INFO:
- Location: Tungka-tunga, Maasin City, Southern Leyte, Philippines
- Email: sjcdo@gmail.com
- Sports: Basketball, Volleyball, Badminton, Football, Table Tennis, Swimming
- We offer varsity scholarships for qualified student-athletes
- Training: 2-3 hours, 4-5 times/week, late afternoon/evening
- Medical clearance required before tryouts
- Compete in PRISAA regional and national meets

INSTRUCTIONS:
1. ALWAYS respond in the SAME LANGUAGE the user writes in
2. Keep responses SHORT (2-4 sentences)
3. Be enthusiastic with sports emojis 🏀⚽🏐🦅
4. If unsure, suggest contacting sjcdo@gmail.com

CRITICAL: Respond in user's language!`;

// Language detection
function detectLanguage(text) {
  const lower = text.toLowerCase();
  
  // Filipino/Tagalog
  if (lower.match(/(ako|ikaw|mo|ko|ba|po|hindi|oo|paano|ano|saan|gusto)/)) return 'Filipino';
  // Cebuano/Bisaya  
  if (lower.match(/(nako|nimo|dili|unsa|asa|gusto|og|kay)/)) return 'Cebuano';
  // Spanish
  if (lower.match(/(hola|gracias|sí|cómo|qué|dónde|quiero)/)) return 'Spanish';
  // French
  if (lower.match(/(bonjour|merci|oui|comment|quoi|où)/)) return 'French';
  // German
  if (lower.match(/(hallo|danke|ja|wie|was|wo)/)) return 'German';
  // Chinese
  if (text.match(/[\u4E00-\u9FFF]/)) return 'Chinese';
  // Japanese
  if (text.match(/[\u3040-\u309F\u30A0-\u30FF]/)) return 'Japanese';
  // Korean
  if (text.match(/[\uAC00-\uD7AF]/)) return 'Korean';
  // Arabic
  if (text.match(/[\u0600-\u06FF]/)) return 'Arabic';
  // Russian
  if (text.match(/[а-яА-ЯёЁ]/)) return 'Russian';
  // Thai
  if (text.match(/[\u0E00-\u0E7F]/)) return 'Thai';
  // Hindi
  if (text.match(/[\u0900-\u097F]/)) return 'Hindi';
  
  return 'English';
}

// Root route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>SJC Sports Bot - Status</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          color: white;
          padding: 20px;
          min-height: 100vh;
        }
        .container {
          max-width: 1000px;
          margin: 0 auto;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border-radius: 15px;
          padding: 40px;
        }
        h1 { font-size: 2.5em; margin-bottom: 10px; }
        .status {
          display: grid;
          gap: 15px;
          margin: 30px 0;
        }
        .status-card {
          background: rgba(255,255,255,0.15);
          padding: 20px;
          border-radius: 10px;
          border-left: 5px solid;
        }
        .status-card.ok { border-color: #4CAF50; }
        .status-card.error { border-color: #f44336; }
        .status-card.warning { border-color: #ff9800; }
        .label { font-size: 0.9em; opacity: 0.8; margin-bottom: 5px; }
        .value { font-size: 1.3em; font-weight: bold; }
        .ok-text { color: #4CAF50; }
        .error-text { color: #f44336; }
        .warning-text { color: #ff9800; }
        .info-box {
          background: rgba(255,255,255,0.1);
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
        }
        .languages {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 10px;
          margin-top: 15px;
        }
        .lang-tag {
          background: rgba(255,255,255,0.2);
          padding: 8px;
          border-radius: 5px;
          text-align: center;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏀 SJC GreenHawks Sports Bot</h1>
        <p style="font-size: 1.2em; margin: 10px 0;">🌍 Multilingual AI Chatbot - Powered by Google Gemini 2.0</p>
        
        <div class="status">
          <div class="status-card ok">
            <div class="label">🚀 SERVER STATUS</div>
            <div class="value ok-text">✓ Running on Port ${PORT}</div>
          </div>
          
          <div class="status-card ${VERIFY_TOKEN ? 'ok' : 'error'}">
            <div class="label">🔑 VERIFY TOKEN</div>
            <div class="value ${VERIFY_TOKEN ? 'ok-text' : 'error-text'}">
              ${VERIFY_TOKEN ? '✓ ' + VERIFY_TOKEN : '✗ Not Set'}
            </div>
          </div>
          
          <div class="status-card ${PAGE_ACCESS_TOKEN && PAGE_ACCESS_TOKEN.length > 100 ? 'ok' : 'error'}">
            <div class="label">📱 PAGE ACCESS TOKEN</div>
            <div class="value ${PAGE_ACCESS_TOKEN && PAGE_ACCESS_TOKEN.length > 100 ? 'ok-text' : 'error-text'}">
              ${PAGE_ACCESS_TOKEN && PAGE_ACCESS_TOKEN.length > 100 
                ? '✓ Valid (' + PAGE_ACCESS_TOKEN.length + ' chars)'
                : '✗ Missing or Invalid'}
            </div>
            ${PAGE_ACCESS_TOKEN && PAGE_ACCESS_TOKEN.length > 100 
              ? '<div style="margin-top:10px; font-size:0.8em; opacity:0.7;">First 40: ' + PAGE_ACCESS_TOKEN.substring(0, 40) + '...</div>'
              : ''}
          </div>
          
          <div class="status-card ${GEMINI_API_KEY && GEMINI_API_KEY !== 'undefined' ? 'ok' : 'warning'}">
            <div class="label">🤖 GEMINI AI</div>
            <div class="value ${GEMINI_API_KEY && GEMINI_API_KEY !== 'undefined' ? 'ok-text' : 'warning-text'}">
              ${GEMINI_API_KEY && GEMINI_API_KEY !== 'undefined' 
                ? '✓ Connected' 
                : '⚠ Using Fallback Responses'}
            </div>
          </div>
        </div>

        <div class="info-box">
          <h3>📋 Webhook Configuration</h3>
          <p style="margin: 10px 0;"><strong>Callback URL:</strong> ${req.protocol}://${req.get('host')}/webhook</p>
          <p style="margin: 10px 0;"><strong>Verify Token:</strong> ${VERIFY_TOKEN}</p>
          <p style="margin: 10px 0;"><strong>Events:</strong> messages, messaging_postbacks</p>
        </div>

        <div class="info-box">
          <h3>🌍 Supported Languages</h3>
          <div class="languages">
            <div class="lang-tag">🇬🇧 English</div>
            <div class="lang-tag">🇵🇭 Filipino</div>
            <div class="lang-tag">🇵🇭 Cebuano</div>
            <div class="lang-tag">🇪🇸 Spanish</div>
            <div class="lang-tag">🇫🇷 French</div>
            <div class="lang-tag">🇩🇪 German</div>
            <div class="lang-tag">🇮🇹 Italian</div>
            <div class="lang-tag">🇵🇹 Portuguese</div>
            <div class="lang-tag">🇨🇳 Chinese</div>
            <div class="lang-tag">🇯🇵 Japanese</div>
            <div class="lang-tag">🇰🇷 Korean</div>
            <div class="lang-tag">🇷🇺 Russian</div>
            <div class="lang-tag">🇸🇦 Arabic</div>
            <div class="lang-tag">🇮🇳 Hindi</div>
            <div class="lang-tag">🇹🇭 Thai</div>
            <div class="lang-tag">+ More</div>
          </div>
        </div>

        <div class="info-box">
          <h3>📧 Contact Information</h3>
          <p>Email: sjcdo@gmail.com</p>
          <p>Facebook Page: SJC Sports Chat</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Webhook verification (GET)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('\n📞 WEBHOOK VERIFICATION:');
  console.log('Mode:', mode);
  console.log('Token:', token);
  console.log('Expected:', VERIFY_TOKEN);

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ WEBHOOK VERIFIED!');
    res.status(200).send(challenge);
  } else {
    console.log('❌ VERIFICATION FAILED');
    res.sendStatus(403);
  }
});

// Webhook events (POST)
app.post('/webhook', (req, res) => {
  console.log('\n📬 WEBHOOK EVENT:', new Date().toISOString());
  console.log('Body:', JSON.stringify(req.body, null, 2));

  const body = req.body;

  if (body.object === 'page') {
    body.entry?.forEach(entry => {
      entry.messaging?.forEach(event => {
        console.log('📨 Event from:', event.sender?.id);
        
        if (event.message?.text) {
          console.log('💬 Message:', event.message.text);
          handleMessage(event.sender.id, event.message.text);
        } else if (event.postback) {
          console.log('🔘 Postback:', event.postback.payload);
          handlePostback(event.sender.id, event.postback.payload);
        }
      });
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Message handler
async function handleMessage(senderId, messageText) {
  console.log(`\n🔄 PROCESSING MESSAGE FROM ${senderId}`);
  console.log(`📝 Text: "${messageText}"`);

  // Validate token
  if (!PAGE_ACCESS_TOKEN || PAGE_ACCESS_TOKEN.length < 100) {
    console.error('❌ CANNOT RESPOND: Invalid PAGE_ACCESS_TOKEN');
    return;
  }

  const detectedLanguage = detectLanguage(messageText);
  console.log(`🌍 Language: ${detectedLanguage}`);

  // Typing indicator
  sendTypingIndicator(senderId, true);

  // Simple greeting check
  const lowerText = messageText.toLowerCase();
  if (lowerText.match(/^(hi|hello|hey|kamusta|musta|asa|hola)$/i)) {
    const greetings = {
      'English': "Hey there! 👋 Welcome to SJC GreenHawks Sports! I'm your AI assistant. How can I help you today? 🏀",
      'Filipino': "Kamusta! 👋 Welcome sa SJC GreenHawks Sports! Ako ang iyong AI assistant. Paano kita matutulungan? 🏀",
      'Cebuano': "Kumusta! 👋 Welcome sa SJC GreenHawks Sports! Ako ang imong AI assistant. Unsaon nako pagtabang? 🏀",
      'Spanish': "¡Hola! 👋 ¡Bienvenido a SJC GreenHawks Sports! Soy tu asistente de IA. ¿Cómo puedo ayudarte? 🏀"
    };
    sendQuickReply(senderId, greetings[detectedLanguage] || greetings['English'], detectedLanguage);
    return;
  }

  // Try Gemini AI
  if (GEMINI_API_KEY && GEMINI_API_KEY !== 'undefined') {
    try {
      console.log('🤖 Calling Gemini AI...');
      const aiResponse = await getGeminiResponse(messageText, detectedLanguage);
      console.log('✅ AI Response:', aiResponse.substring(0, 80) + '...');
      sendQuickReply(senderId, aiResponse, detectedLanguage);
      return;
    } catch (error) {
      console.error('❌ Gemini failed:', error.message);
    }
  }

  // Fallback
  const fallback = getFallbackResponse(detectedLanguage, lowerText);
  console.log('📋 Fallback response');
  sendQuickReply(senderId, fallback, detectedLanguage);
}

// Gemini AI call
async function getGeminiResponse(userMessage, language) {
  const prompt = `${BUSINESS_CONTEXT}\n\nIMPORTANT: User wrote in ${language}. Respond ONLY in ${language}.\n\nUser: "${userMessage}"\n\nYour response (in ${language}, 2-4 sentences):`;

  try {
    const response = await axios.post(
      GEMINI_API_URL,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 200,
          topP: 0.95
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 12000
      }
    );

    return response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Error getting response';
  } catch (error) {
    console.error('Gemini error:', error.response?.data || error.message);
    throw error;
  }
}

// Fallback responses
function getFallbackResponse(language, queryLower) {
  // FAQ matching
  if (queryLower.includes('scholar') || queryLower.includes('beasiswa')) {
    const responses = {
      'English': "🎓 Visit our Sports Development Office to inquire about varsity scholarships! Requirements will be discussed during screening. Contact: sjcdo@gmail.com",
      'Filipino': "🎓 Bisitahin ang Sports Development Office para sa scholarship! Mga requirements ay tatalakayin sa screening. Contact: sjcdo@gmail.com",
      'Cebuano': "🎓 Bisitaha ang Sports Development Office para sa scholarship! Mga requirements i-discuss sa screening. Contact: sjcdo@gmail.com"
    };
    return responses[language] || responses['English'];
  }

  if (queryLower.includes('join') || queryLower.includes('sumali') || queryLower.includes('apil')) {
    const responses = {
      'English': "🏃 Want to join our team? Visit the Sports Office for tryout schedules! Selection is based on performance and commitment. Let's go GreenHawks! 🦅",
      'Filipino': "🏃 Gusto sumali sa team? Bisitahin ang Sports Office para sa tryout schedule! Based sa performance at commitment ang selection. Go GreenHawks! 🦅",
      'Cebuano': "🏃 Gusto mo-apil sa team? Bisitaha ang Sports Office para sa tryout schedule! Based sa performance ug commitment ang selection. Go GreenHawks! 🦅"
    };
    return responses[language] || responses['English'];
  }

  // Default response
  const defaults = {
    'English': "I'm here to help with SJC GreenHawks Sports! 🏀 Ask about scholarships, joining teams, training schedules, or contact sjcdo@gmail.com 📧",
    'Filipino': "Nandito ako para sa SJC GreenHawks Sports! 🏀 Tanungin ako tungkol sa scholarships, pagsali sa teams, training, o contact sjcdo@gmail.com 📧",
    'Cebuano': "Ania ko para sa SJC GreenHawks Sports! 🏀 Pangutana bahin sa scholarships, pag-apil sa teams, training, o contact sjcdo@gmail.com 📧",
    'Spanish': "¡Estoy aquí para SJC GreenHawks Sports! 🏀 Pregunta sobre becas, unirse a equipos, entrenamientos, o contacta sjcdo@gmail.com 📧",
    'French': "Je suis là pour SJC GreenHawks Sports! 🏀 Demandez des bourses, rejoindre équipes, entraînements, ou contactez sjcdo@gmail.com 📧",
    'Chinese': "我在这里帮助SJC GreenHawks体育！🏀 询问奖学金、加入团队、训练，或联系 sjcdo@gmail.com 📧",
    'Japanese': "SJC GreenHawksスポーツをサポートします！🏀 奨学金、チーム参加、トレーニングについて質問、または sjcdo@gmail.com へ 📧",
    'Korean': "SJC GreenHawks 스포츠를 도와드립니다! 🏀 장학금, 팀 가입, 훈련에 대해 문의하거나 sjcdo@gmail.com로 연락하세요 📧"
  };

  return defaults[language] || defaults['English'];
}

// Postback handler
function handlePostback(senderId, payload) {
  console.log(`🔘 Postback: ${payload}`);
  
  const responses = {
    'GET_STARTED': "Welcome to SJC GreenHawks Sports! 🏀🦅 I speak all languages! How can I help you?",
    'SHOW_FAQS': "Here's what I can help with! 👇 Ask about scholarships, joining teams, training, or merchandise!",
    'CONTACT_US': "📧 Email: sjcdo@gmail.com | Message me here anytime! I'm available 24/7! 😊"
  };

  sendQuickReply(senderId, responses[payload] || responses['GET_STARTED'], 'English');
}

// Typing indicator
function sendTypingIndicator(recipientId, isTyping) {
  callSendAPI({
    recipient: { id: recipientId },
    sender_action: isTyping ? 'typing_on' : 'typing_off'
  });
}

// Quick reply message
function sendQuickReply(recipientId, text, language) {
  const translations = {
    'English': { scholar: '🎓 Scholarship', join: '🏃 Join', merch: '👕 Merch', sports: '🏆 Sports', train: '⏰ Training', contact: '📧 Contact' },
    'Filipino': { scholar: '🎓 Scholarship', join: '🏃 Sumali', merch: '👕 Merch', sports: '🏆 Sports', train: '⏰ Training', contact: '📧 Kontak' },
    'Cebuano': { scholar: '🎓 Scholarship', join: '🏃 Apil', merch: '👕 Merch', sports: '🏆 Sports', train: '⏰ Training', contact: '📧 Kontak' },
    'Spanish': { scholar: '🎓 Beca', join: '🏃 Unirse', merch: '👕 Tienda', sports: '🏆 Deportes', train: '⏰ Entrenar', contact: '📧 Contacto' }
  };

  const t = translations[language] || translations['English'];

  callSendAPI({
    recipient: { id: recipientId },
    message: {
      text: text,
      quick_replies: [
        { content_type: "text", title: t.scholar, payload: "SCHOLARSHIP" },
        { content_type: "text", title: t.join, payload: "JOIN" },
        { content_type: "text", title: t.merch, payload: "MERCHANDISE" },
        { content_type: "text", title: t.sports, payload: "SPORTS" },
        { content_type: "text", title: t.train, payload: "TRAINING" },
        { content_type: "text", title: t.contact, payload: "CONTACT_US" }
      ]
    }
  });
}

// Send API call
function callSendAPI(messageData) {
  if (!PAGE_ACCESS_TOKEN || PAGE_ACCESS_TOKEN.length < 100) {
    console.error('❌ Invalid token, cannot send');
    return;
  }

  console.log('📤 Sending to Facebook...');

  axios.post(
    'https://graph.facebook.com/v18.0/me/messages',
    messageData,
    {
      params: { access_token: PAGE_ACCESS_TOKEN },
      timeout: 10000
    }
  )
  .then(response => {
    console.log('✅ Sent! Message ID:', response.data.message_id);
  })
  .catch(error => {
    console.error('❌ SEND FAILED:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
      
      const errorCode = error.response.data?.error?.code;
      if (errorCode === 190) {
        console.error('💥 TOKEN INVALID/EXPIRED! Get new token from Facebook.');
      } else if (errorCode === 200) {
        console.error('💥 PERMISSION ERROR! Check webhook subscriptions.');
      }
    } else {
      console.error('Error:', error.message);
    }
  });
}

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(70));
  console.log('🏀 SJC GREENHAWKS SPORTS CHATBOT');
  console.log('🌍 MULTILINGUAL AI - POWERED BY GEMINI 2.0 FLASH');
  console.log('='.repeat(70));
  console.log(`\n🚀 Server: http://localhost:${PORT}`);
  console.log(`🔗 Webhook: /webhook\n`);
  console.log('📊 STATUS:');
  console.log('  ✓ VERIFY_TOKEN:', VERIFY_TOKEN);
  console.log('  ✓ PAGE_TOKEN:', PAGE_ACCESS_TOKEN ? `Valid (${PAGE_ACCESS_TOKEN.length} chars)` : 'MISSING');
  console.log('  ✓ GEMINI_KEY:', GEMINI_API_KEY ? 'Set' : 'Not set');
  console.log('\n' + '='.repeat(70));
  console.log('✨ Bot is READY! Send a message to test...\n');
});
