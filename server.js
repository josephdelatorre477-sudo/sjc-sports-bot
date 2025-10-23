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

// Privacy Policy route
app.get('/privacy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Privacy Policy - SJC Sports Bot</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          padding: 20px;
          min-height: 100vh;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          border-radius: 15px;
          padding: 40px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        h1 {
          color: #1e3c72;
          font-size: 2.5em;
          margin-bottom: 10px;
          border-bottom: 3px solid #2a5298;
          padding-bottom: 15px;
        }
        .effective-date {
          color: #666;
          font-size: 0.9em;
          margin-bottom: 30px;
        }
        h2 {
          color: #2a5298;
          font-size: 1.5em;
          margin-top: 30px;
          margin-bottom: 15px;
        }
        p {
          margin-bottom: 15px;
          text-align: justify;
        }
        ul {
          margin: 15px 0 15px 30px;
        }
        li {
          margin-bottom: 10px;
        }
        .contact-box {
          background: #f0f4f8;
          border-left: 4px solid #2a5298;
          padding: 20px;
          margin: 30px 0;
          border-radius: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e0e0e0;
          color: #666;
          font-size: 0.9em;
        }
        .highlight {
          background: #fff3cd;
          padding: 2px 6px;
          border-radius: 3px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏀 Privacy Policy</h1>
        <p class="effective-date"><strong>Effective Date:</strong> October 23, 2025</p>
        <p class="effective-date"><strong>Service:</strong> SJC GreenHawks Sports Chatbot on Facebook Messenger</p>

        <h2>1. Introduction</h2>
        <p>
          Welcome to the Saint Joseph College (SJC) GreenHawks Sports Bot. We are committed to protecting your privacy 
          and handling your personal information responsibly. This Privacy Policy explains how we collect, use, and 
          protect your information when you interact with our chatbot on Facebook Messenger.
        </p>

        <h2>2. Information We Collect</h2>
        <p>When you interact with the SJC Sports Bot, we collect the following information:</p>
        <ul>
          <li><strong>Facebook User ID:</strong> A unique identifier provided by Facebook to enable us to respond to your messages</li>
          <li><strong>Message Content:</strong> The text messages you send to our bot</li>
          <li><strong>Language Preference:</strong> Automatically detected based on your message to provide responses in your language</li>
          <li><strong>Interaction Timestamps:</strong> When you send messages (for session management only)</li>
        </ul>
        <p><span class="highlight">Note:</span> We do NOT collect your name, email address, phone number, or any other personal information beyond what Facebook Messenger provides for bot interactions.</p>

        <h2>3. How We Use Your Information</h2>
        <p>Your information is used exclusively for the following purposes:</p>
        <ul>
          <li>To respond to your inquiries about SJC sports programs, scholarships, and events</li>
          <li>To provide information about team tryouts, training schedules, and merchandise</li>
          <li>To detect your language and respond in your preferred language</li>
          <li>To improve our chatbot's responses and user experience</li>
          <li>To maintain conversation context during your current session</li>
        </ul>

        <h2>4. Data Storage and Retention</h2>
        <p>
          <strong>We do not permanently store your personal messages.</strong> Messages are processed in real-time 
          through our AI system (Google Gemini) and are not retained in our database. Conversation data may be 
          temporarily cached during your active session but is automatically deleted after the session ends.
        </p>
        <p>
          Server logs containing anonymized interaction data (such as timestamps and response times) may be 
          retained for up to 30 days for technical monitoring purposes only.
        </p>

        <h2>5. Third-Party Services</h2>
        <p>Our chatbot uses the following third-party services:</p>
        <ul>
          <li>
            <strong>Facebook Messenger Platform:</strong> For message delivery and receiving messages. 
            Facebook's privacy policy applies: <a href="https://www.facebook.com/privacy/explanation" target="_blank">facebook.com/privacy</a>
          </li>
          <li>
            <strong>Google Gemini AI:</strong> For generating intelligent responses to your questions. 
            Your messages are processed by Google's AI but are not used to train their models or stored permanently. 
            Google's privacy policy: <a href="https://policies.google.com/privacy" target="_blank">policies.google.com/privacy</a>
          </li>
          <li>
            <strong>Render.com:</strong> Cloud hosting service for our bot infrastructure. 
            Privacy policy: <a href="https://render.com/privacy" target="_blank">render.com/privacy</a>
          </li>
        </ul>

        <h2>6. Data Sharing and Disclosure</h2>
        <p>
          <strong>We do NOT sell, trade, rent, or share your personal information with third parties</strong> for 
          marketing purposes. Your information may only be disclosed in the following limited circumstances:
        </p>
        <ul>
          <li><strong>With Your Consent:</strong> If you explicitly request us to share information</li>
          <li><strong>Legal Requirements:</strong> If required by law, court order, or government regulation</li>
          <li><strong>Service Providers:</strong> Only to the extent necessary for the third-party services mentioned above to function</li>
        </ul>

        <h2>7. Your Rights and Choices</h2>
        <p>You have the following rights regarding your data:</p>
        <ul>
          <li><strong>Stop Using the Service:</strong> You can stop using the bot at any time by not sending messages</li>
          <li><strong>Delete Conversation:</strong> You can delete your conversation history on Facebook Messenger</li>
          <li><strong>Request Data Deletion:</strong> Contact us to request deletion of any stored data</li>
          <li><strong>Access Your Information:</strong> Request information about what data we have about you</li>
          <li><strong>Opt-Out:</strong> Block or report the bot on Facebook Messenger to stop all interactions</li>
        </ul>

        <h2>8. Children's Privacy</h2>
        <p>
          Our service is intended for users <strong>13 years of age and older</strong>, in compliance with Facebook's 
          Terms of Service and the Children's Online Privacy Protection Act (COPPA). We do not knowingly collect 
          information from children under 13. If we become aware that we have collected data from a child under 13, 
          we will take immediate steps to delete that information.
        </p>

        <h2>9. Data Security</h2>
        <p>
          We implement reasonable security measures to protect your information from unauthorized access, alteration, 
          disclosure, or destruction. These include:
        </p>
        <ul>
          <li>Secure HTTPS/SSL encryption for all data transmission</li>
          <li>Access controls and authentication for our systems</li>
          <li>Regular security monitoring and updates</li>
          <li>Minimal data retention policies</li>
        </ul>
        <p>
          However, no method of transmission over the internet is 100% secure. While we strive to protect your 
          information, we cannot guarantee absolute security.
        </p>

        <h2>10. International Users</h2>
        <p>
          Our service is primarily intended for users in the Philippines. However, we support multiple languages 
          and welcome international users. By using our service, you consent to the transfer and processing of 
          your information in the Philippines and the United States (where our hosting and AI services are located).
        </p>

        <h2>11. Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, 
          operational, or regulatory reasons. When we make changes, we will:
        </p>
        <ul>
          <li>Update the "Effective Date" at the top of this policy</li>
          <li>Post the updated policy at this URL</li>
          <li>Notify users through the chatbot if changes are significant</li>
        </ul>
        <p>We encourage you to review this policy periodically.</p>

        <h2>12. Contact Us</h2>
        <div class="contact-box">
          <p><strong>For questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact:</strong></p>
          <p style="margin-top: 15px;">
            <strong>Saint Joseph College - Sports Development Office</strong><br>
            📧 Email: <a href="mailto:sjcdo@gmail.com">sjcdo@gmail.com</a><br>
            📍 Location: Tungka-tunga, Maasin City, Southern Leyte, Philippines<br>
            💬 Facebook: <a href="https://www.facebook.com/people/SJC-Sports-Chat/61582368223061/" target="_blank">SJC Sports Chat</a>
          </p>
          <p style="margin-top: 15px;">
            <strong>Response Time:</strong> We will respond to privacy-related inquiries within 5-7 business days.
          </p>
        </div>

        <h2>13. Consent</h2>
        <p>
          By using the SJC Sports Bot on Facebook Messenger, you acknowledge that you have read, understood, and 
          agree to the terms of this Privacy Policy. If you do not agree with this policy, please do not use our service.
        </p>

        <div class="footer">
          <p><strong>© 2025 Saint Joseph College - Sports Development Office</strong></p>
          <p>All rights reserved.</p>
          <p style="margin-top: 10px;">
            🏀 Go GreenHawks! 🦅
          </p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Terms of Service route (optional but recommended)
app.get('/terms', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Terms of Service - SJC Sports Bot</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          padding: 20px;
          min-height: 100vh;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          border-radius: 15px;
          padding: 40px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        h1 {
          color: #1e3c72;
          font-size: 2.5em;
          margin-bottom: 10px;
          border-bottom: 3px solid #2a5298;
          padding-bottom: 15px;
        }
        h2 {
          color: #2a5298;
          font-size: 1.5em;
          margin-top: 30px;
          margin-bottom: 15px;
        }
        p { margin-bottom: 15px; }
        ul { margin: 15px 0 15px 30px; }
        li { margin-bottom: 10px; }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e0e0e0;
          color: #666;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏀 Terms of Service</h1>
        <p><strong>Effective Date:</strong> October 23, 2025</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By using the SJC GreenHawks Sports Bot, you agree to these Terms of Service. 
          If you do not agree, please do not use the service.
        </p>

        <h2>2. Service Description</h2>
        <p>
          The SJC Sports Bot is an AI-powered chatbot that provides information about:
        </p>
        <ul>
          <li>Sports programs and teams at Saint Joseph College</li>
          <li>Varsity scholarships and application processes</li>
          <li>Training schedules and tryout information</li>
          <li>Sports merchandise and events</li>
        </ul>

        <h2>3. User Responsibilities</h2>
        <p>You agree to:</p>
        <ul>
          <li>Provide accurate information when requesting assistance</li>
          <li>Use the service for its intended purpose only</li>
          <li>Not attempt to hack, abuse, or disrupt the service</li>
          <li>Comply with Facebook's Terms of Service</li>
        </ul>

        <h2>4. Disclaimer</h2>
        <p>
          The information provided by the bot is for general guidance only. For official 
          information regarding scholarships, enrollment, and policies, please contact 
          the Sports Development Office directly at sjcdo@gmail.com.
        </p>

        <h2>5. Limitation of Liability</h2>
        <p>
          SJC and the Sports Development Office are not liable for any decisions made 
          based on information provided by the chatbot. The service is provided "as is" 
          without warranties of any kind.
        </p>

        <h2>6. Contact</h2>
        <p>
          <strong>Saint Joseph College - Sports Development Office</strong><br>
          Email: sjcdo@gmail.com<br>
          Location: Tungka-tunga, Maasin City, Southern Leyte, Philippines
        </p>

        <div class="footer">
          <p><strong>© 2025 Saint Joseph College</strong></p>
          <p>🏀 Go GreenHawks! 🦅</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(70));
  console.log('🏀 SJC GREENHAWKS SPORTS CHATBOT');
  console.log('🌍 MULTILINGUAL AI - POWERED BY GEMINI 2.0 FLASH');
  console.log('='.repeat(70));
  console.log(`\n🚀 Server: http://localhost:${PORT}`);
  console.log(`🔗 Webhook: /webhook`);
  console.log(`📄 Privacy Policy: /privacy`);
  console.log(`📜 Terms of Service: /terms\n`);
  console.log('📊 STATUS:');
  console.log('  ✓ VERIFY_TOKEN:', VERIFY_TOKEN);
  console.log('  ✓ PAGE_TOKEN:', PAGE_ACCESS_TOKEN ? `Valid (${PAGE_ACCESS_TOKEN.length} chars)` : 'MISSING');
  console.log('  ✓ GEMINI_KEY:', GEMINI_API_KEY ? 'Set' : 'Not set');
  console.log('\n' + '='.repeat(70));
  console.log('✨ Bot is READY! Send a message to test...\n');
});
