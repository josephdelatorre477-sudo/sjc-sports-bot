// server.js - SJC Sports Facebook Chatbot (ENHANCED MULTILINGUAL)
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Configuration
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || '5% .spot\'s_200s_vest5y';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.SENSUE_API_KEY;
const PORT = process.env.PORT || 3000;

// Validate configuration
console.log('\n🔍 CONFIGURATION CHECK:');
console.log('✓ VERIFY_TOKEN:', VERIFY_TOKEN ? 'SET' : 'MISSING');
console.log('✓ PAGE_ACCESS_TOKEN:', PAGE_ACCESS_TOKEN ? `SET (${PAGE_ACCESS_TOKEN.length} chars)` : 'MISSING');
console.log('✓ GEMINI_API_KEY:', GEMINI_API_KEY ? 'SET' : 'MISSING');

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

// Enhanced Business Context with Complete Information
const BUSINESS_CONTEXT = `You are a friendly MULTILINGUAL assistant for Saint Joseph College (SJC) GreenHawks Sports Program in Maasin City, Philippines.

OFFICE LOCATION:
- Sports Development Office: Tunga-Tunga, Maasin City
- At SJC Junior High School Department
- Besides SJC Clinic
- Email: sjcdo@gmail.com
- Facebook Page: https://www.facebook.com/profile.php?id=100094320444442

SPORTS COORDINATORS:
- Sir Dante Monter
- Sir Jason S. Monter

SPORTS OFFERED (17 Sports):
Basketball, Volleyball, Arnis, Futsal, Sepak Takraw, Athletics, Football, Wushu, Table Tennis, Billiards, Taekwondo, Chess, Badminton, Boxing, Swimming, Dance Sports, Tennis

FACILITIES AND TRAINING LOCATIONS:

1. SJC Extension Campus, Mambajao (Poblacion)
   - Address: 6600 Maasin, Philippines (4VM3+G56, San Jose Street, Maasin, Southern Leyte)
   - Google Maps: https://maps.app.goo.gl/PHnkZHJ94CFShYPfA
   - Sports: Basketball, Football, Billiards, Tennis, Athletics

2. SJC Junior High School Department
   - Address: 4RMQ+724, Maasin, Southern Leyte
   - Google Maps: https://maps.app.goo.gl/NvzJ4FL9RKoowAcG7
   - Sports: Table Tennis, Dance Sports, Chess, Arnis, Wushu, Badminton
   - Also location of: Sports Development Office, SJC Fitness Gym

3. SJC Elementary Department at Bishop Hacbang Gym
   - Address: 4RJQ+Q64, Rosales Street, Maasin, Southern Leyte
   - Google Maps: https://maps.app.goo.gl/BSo8cEWfzKWTezX36
   - Sports: Volleyball, Sepak Takraw, Futsal, Taekwondo

4. SJC Main Campus
   - Address: 4RJQ+P2R, E. Cabrera Street, Maasin, Southern Leyte
   - Google Maps: https://maps.app.goo.gl/HBnCK2NdG7GtYNS16

FACILITIES:
- SJC Fitness Gym (located at SJC Junior High School Department)

SEASONAL SPORTS EVENTS:
- Eastern Visayas Regional Athletic Association (EVRAA) Meet
- State Colleges and Universities Athletic Association Eastern Visayas (SCUAA EV) Regional Meet
- Palarong Pambansa
- Batang Pinoy (Philippine Youth Games)
- National PRISAA Games (Private Schools Athletic Association)
- Regional PRISAA Meets

PROGRAM DETAILS:
- Varsity scholarships available for qualified student-athletes
- Training: 2-3 hours, 4-5 times/week, late afternoon/evening
- Medical clearance required before tryouts
- Compete in regional and national competitions

INSTRUCTIONS:
1. ALWAYS respond in the EXACT SAME LANGUAGE the user writes in
2. Keep responses SHORT (2-4 sentences maximum)
3. Be enthusiastic with appropriate sports emojis 🏀⚽🏐🦅
4. When asked about specific sports, mention the training location/facility
5. For announcements/updates, direct users to Facebook: https://www.facebook.com/profile.php?id=100094320444442
6. If unsure, suggest visiting the office (beside SJC Clinic) or emailing sjcdo@gmail.com

CRITICAL: Match the user's language EXACTLY!`;

// Enhanced Language Detection with ALL Philippine Languages
function detectLanguage(text) {
  const lower = text.toLowerCase();
  
  // === PHILIPPINE LANGUAGES ===
  
  // Tagalog/Filipino - Enhanced patterns
  if (lower.match(/(^|\s)(ako|ikaw|mo|ko|ba|po|opo|hindi|oo|opo|paano|ano|saan|gusto|nais|kailangan|pwede|meron|wala|magkano|kailan|sino|bakit|nasaan|anong|alin|kanino|kaysa|lang|na|ng|ay|mga|naman|pala|din|rin|yung|yun|yan)(\s|$)/)) {
    return 'Filipino';
  }
  
  // Cebuano/Bisaya - Enhanced patterns
  if (lower.match(/(^|\s)(nako|nimo|niya|nato|ninyo|nila|dili|wala|unsa|asa|kanus-a|kinsa|ngano|gusto|ganahan|kinahanglan|pwede|adto|ania|naa|tua|dinhi|diha|dira|kini|kana|kadto|og|ug|sa|ni|ang|si|ug|kay|nga)(\s|$)/)) {
    return 'Cebuano';
  }
  
  // Ilocano
  if (lower.match(/(^|\s)(siak|sika|daytoy|diay|awan|adda|ania|sadino|kaano|sino|apay|kayat|kasapulan|mabalin|mapan|agturong|ditoy|sadiay|ket|ken|wenno|ngem|ta)(\s|$)/)) {
    return 'Ilocano';
  }
  
  // Hiligaynon/Ilonggo
  if (lower.match(/(^|\s)(ako|ikaw|amon|inyo|ila|indi|wala|ano|diin|san-o|sin-o|ngaa|gusto|kinahanglan|pwede|kadto|diri|dira|ini|ina|sini|sina|kag|sang|sa|ang|kay)(\s|$)/)) {
    return 'Hiligaynon';
  }
  
  // Waray-Waray
  if (lower.match(/(^|\s)(ako|ikaw|amon|iyo|ira|diri|waray|ano|hain|kanus-a|hin-o|ngain|gusto|kinahanglan|pwede|kadto|dinhi|didto|ini|iton|ngan|han|san|hin|nga)(\s|$)/)) {
    return 'Waray-Waray';
  }
  
  // Kapampangan
  if (lower.match(/(^|\s)(aku|ika|ikami|ikayu|ila|ali|alang|nanu|nukarin|kailan|ninu|bakit|buri|kailangan|malyari|makapaunta|keni|karin|ini|ita|at|ning|king|kareng)(\s|$)/)) {
    return 'Kapampangan';
  }
  
  // Bicolano
  if (lower.match(/(^|\s)(ako|ika|kami|kamo|sinda|dai|mayo|ano|sain|kailan|siisay|ta-ano|gusto|kaipotan|puwede|duman|digdi|diyan|ini|iyan|asin|sa|kan|nin)(\s|$)/)) {
    return 'Bicolano';
  }
  
  // Pangasinan
  if (lower.match(/(^|\s)(siak|sika|sikami|sikayo|sikara|anggapo|anggapoy|anto|akin|kapigan|siopa|apon|kayari|kailangan|maong|ondadya|iyan|ditoy|diay|tan|ed|na|nen)(\s|$)/)) {
    return 'Pangasinan';
  }
  
  // Maranao
  if (lower.match(/(^|\s)(ako|ikaw|kami|kamu|iran|diri|wara|onopa|dimano|kapiya|mano|apiya|giya|kailangan|masari|dito|diyan|ini|iyan|ago|so|ko|ko)(\s|$)/)) {
    return 'Maranao';
  }
  
  // Maguindanao
  if (lower.match(/(^|\s)(aku|ikaw|kami|kamu|siran|diri|wara|nopa|dini|kapan|sinu|apiya|nu|kailangan|maari|ditu|diyan|ini|iyan|aw|sa|nu|den)(\s|$)/)) {
    return 'Maguindanao';
  }
  
  // === MAJOR WORLD LANGUAGES ===
  
  // Mandarin Chinese
  if (text.match(/[\u4E00-\u9FFF]/)) {
    return 'Chinese';
  }
  
  // Hindi/Devanagari script
  if (text.match(/[\u0900-\u097F]/)) {
    return 'Hindi';
  }
  
  // Spanish
  if (lower.match(/(^|\s)(hola|gracias|sí|no|cómo|qué|dónde|cuándo|quién|por qué|quiero|necesito|puedo|buenos|días|noches|señor|señora)(\s|$|[?!.])/)) {
    return 'Spanish';
  }
  
  // French
  if (lower.match(/(^|\s)(bonjour|merci|oui|non|comment|quoi|où|quand|qui|pourquoi|je|tu|nous|vous|ils|avec|pour|dans|sur)(\s|$)/)) {
    return 'French';
  }
  
  // === OTHER SCRIPTS ===
  
  // Japanese
  if (text.match(/[\u3040-\u309F\u30A0-\u30FF]/)) {
    return 'Japanese';
  }
  
  // Korean
  if (text.match(/[\uAC00-\uD7AF]/)) {
    return 'Korean';
  }
  
  // Arabic
  if (text.match(/[\u0600-\u06FF]/)) {
    return 'Arabic';
  }
  
  // Russian/Cyrillic
  if (text.match(/[а-яА-ЯёЁ]/)) {
    return 'Russian';
  }
  
  // Thai
  if (text.match(/[\u0E00-\u0E7F]/)) {
    return 'Thai';
  }
  
  // German
  if (lower.match(/(^|\s)(hallo|danke|ja|nein|wie|was|wo|wann|wer|warum|ich|du|wir|ihr|sie|mit|für|und|oder)(\s|$)/)) {
    return 'German';
  }
  
  // Default to English
  return 'English';
}

// Root route with updated language list
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
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 10px;
          margin-top: 15px;
        }
        .lang-tag {
          background: rgba(255,255,255,0.2);
          padding: 8px;
          border-radius: 5px;
          text-align: center;
          font-size: 0.85em;
        }
        .lang-category {
          margin-top: 20px;
        }
        .lang-category h4 {
          color: #ffeb3b;
          margin-bottom: 10px;
          font-size: 1.1em;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏀 SJC GreenHawks Sports Bot</h1>
        <p style="font-size: 1.2em; margin: 10px 0;">🌐 Multilingual AI Chatbot - Powered by Google Gemini 2.0</p>
        
        <div class="status">
          <div class="status-card ok">
            <div class="label">🚀 SERVER STATUS</div>
            <div class="value ok-text">✓ Running on Port ${PORT}</div>
          </div>
          
          <div class="status-card ${VERIFY_TOKEN ? 'ok' : 'error'}">
            <div class="label">🔑 VERIFY TOKEN</div>
            <div class="value ${VERIFY_TOKEN ? 'ok-text' : 'error-text'}">
              ${VERIFY_TOKEN ? '✓ Set (Matches Facebook)' : '✗ Not Set'}
            </div>
          </div>
          
          <div class="status-card ${PAGE_ACCESS_TOKEN && PAGE_ACCESS_TOKEN.length > 100 ? 'ok' : 'error'}">
            <div class="label">📱 PAGE ACCESS TOKEN</div>
            <div class="value ${PAGE_ACCESS_TOKEN && PAGE_ACCESS_TOKEN.length > 100 ? 'ok-text' : 'error-text'}">
              ${PAGE_ACCESS_TOKEN && PAGE_ACCESS_TOKEN.length > 100 
                ? '✓ Valid (' + PAGE_ACCESS_TOKEN.length + ' chars)'
                : '✗ Missing or Invalid'}
            </div>
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
          <h3>🌐 Supported Languages (15 Total)</h3>
          
          <div class="lang-category">
            <h4>🌍 Major World Languages (5)</h4>
            <div class="languages">
              <div class="lang-tag">🇬🇧 English</div>
              <div class="lang-tag">🇨🇳 Mandarin Chinese</div>
              <div class="lang-tag">🇮🇳 Hindi</div>
              <div class="lang-tag">🇪🇸 Spanish</div>
              <div class="lang-tag">🇫🇷 French</div>
            </div>
          </div>
          
          <div class="lang-category">
            <h4>🇵🇭 Philippine Languages (10)</h4>
            <div class="languages">
              <div class="lang-tag">🇵🇭 Tagalog (Filipino)</div>
              <div class="lang-tag">🇵🇭 Cebuano (Bisaya)</div>
              <div class="lang-tag">🇵🇭 Ilocano</div>
              <div class="lang-tag">🇵🇭 Hiligaynon (Ilonggo)</div>
              <div class="lang-tag">🇵🇭 Waray-Waray</div>
              <div class="lang-tag">🇵🇭 Kapampangan</div>
              <div class="lang-tag">🇵🇭 Bicolano</div>
              <div class="lang-tag">🇵🇭 Pangasinan</div>
              <div class="lang-tag">🇵🇭 Maranao</div>
              <div class="lang-tag">🇵🇭 Maguindanao</div>
            </div>
          </div>
        </div>

        <div class="info-box">
          <h3>📋 Webhook Configuration</h3>
          <p style="margin: 10px 0;"><strong>Callback URL:</strong> https://sjc-sports-bot.onrender.com/webhook</p>
          <p style="margin: 10px 0;"><strong>Verify Token:</strong> ${VERIFY_TOKEN}</p>
          <p style="margin: 10px 0;"><strong>Events:</strong> messages, messaging_postbacks</p>
        </div>

        <div class="info-box">
          <h3>📧 Contact Information</h3>
          <p><strong>Sports Development Office:</strong></p>
          <p>📍 Tunga-Tunga, Maasin City</p>
          <p>🏫 SJC Junior High School Department (Beside SJC Clinic)</p>
          <p>🗺️ <a href="https://maps.app.goo.gl/NvzJ4FL9RKoowAcG7" target="_blank">View on Google Maps</a></p>
          <p>📧 Email: sjcdo@gmail.com</p>
          <p>📱 Facebook: <a href="https://www.facebook.com/profile.php?id=100094320444442" target="_blank">SJC Sports Page</a></p>
          <p style="margin-top: 15px;"><strong>Sports Coordinators:</strong></p>
          <p>👨‍🏫 Sir Dante Monter</p>
          <p>👨‍🏫 Sir Jason S. Monter</p>
          <p style="margin-top: 15px;"><strong>Fitness Facility:</strong></p>
          <p>💪 SJC Fitness Gym (at SJC Junior High School Department)</p>
        </div>

        <div class="info-box">
          <h3>🏟️ Training Facilities & Locations</h3>
          
          <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 10px 0;">
            <h4 style="color: #ffeb3b; margin-bottom: 8px;">📍 SJC Extension Campus, Mambajao</h4>
            <p style="font-size: 0.9em; margin: 5px 0;">🏀 Basketball | ⚽ Football | 🎱 Billiards | 🎾 Tennis | 🏃 Athletics</p>
            <p style="font-size: 0.85em; margin: 5px 0;">📌 San Jose Street, Maasin, Southern Leyte (4VM3+G56)</p>
            <p style="font-size: 0.85em;"><a href="https://maps.app.goo.gl/PHnkZHJ94CFShYPfA" target="_blank" style="color: #4CAF50;">🗺️ View Map</a></p>
          </div>

          <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 10px 0;">
            <h4 style="color: #ffeb3b; margin-bottom: 8px;">📍 SJC Junior High School Department</h4>
            <p style="font-size: 0.9em; margin: 5px 0;">🏓 Table Tennis | 💃 Dance Sports | ♟️ Chess | 🥋 Arnis | 🥋 Wushu | 🏸 Badminton</p>
            <p style="font-size: 0.85em; margin: 5px 0;">📌 Tunga-Tunga, Maasin, Southern Leyte (4RMQ+724)</p>
            <p style="font-size: 0.85em;"><a href="https://maps.app.goo.gl/NvzJ4FL9RKoowAcG7" target="_blank" style="color: #4CAF50;">🗺️ View Map</a></p>
          </div>

          <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 10px 0;">
            <h4 style="color: #ffeb3b; margin-bottom: 8px;">📍 SJC Elementary Dept - Bishop Hacbang Gym</h4>
            <p style="font-size: 0.9em; margin: 5px 0;">🏐 Volleyball | 🏸 Sepak Takraw | ⚽ Futsal | 🥋 Taekwondo</p>
            <p style="font-size: 0.85em; margin: 5px 0;">📌 Rosales Street, Maasin, Southern Leyte (4RJQ+Q64)</p>
            <p style="font-size: 0.85em;"><a href="https://maps.app.goo.gl/BSo8cEWfzKWTezX36" target="_blank" style="color: #4CAF50;">🗺️ View Map</a></p>
          </div>

          <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 10px 0;">
            <h4 style="color: #ffeb3b; margin-bottom: 8px;">📍 SJC Main Campus</h4>
            <p style="font-size: 0.85em; margin: 5px 0;">📌 E. Cabrera Street, Maasin, Southern Leyte (4RJQ+P2R)</p>
            <p style="font-size: 0.85em;"><a href="https://maps.app.goo.gl/HBnCK2NdG7GtYNS16" target="_blank" style="color: #4CAF50;">🗺️ View Map</a></p>
          </div>
        </div>

        <div class="info-box">
          <h3>🏆 Sports Offered (17 Total)</h3>
          <div class="languages">
            <div class="lang-tag">🏀 Basketball</div>
            <div class="lang-tag">🏐 Volleyball</div>
            <div class="lang-tag">🥋 Arnis</div>
            <div class="lang-tag">⚽ Futsal</div>
            <div class="lang-tag">🏸 Sepak Takraw</div>
            <div class="lang-tag">🏃 Athletics</div>
            <div class="lang-tag">⚽ Football</div>
            <div class="lang-tag">🥋 Wushu</div>
            <div class="lang-tag">🏓 Table Tennis</div>
            <div class="lang-tag">🎱 Billiards</div>
            <div class="lang-tag">🥋 Taekwondo</div>
            <div class="lang-tag">♟️ Chess</div>
            <div class="lang-tag">🏸 Badminton</div>
            <div class="lang-tag">🥊 Boxing</div>
            <div class="lang-tag">🏊 Swimming</div>
            <div class="lang-tag">💃 Dance Sports</div>
            <div class="lang-tag">🎾 Tennis</div>
          </div>
        </div>

        <div class="info-box">
          <h3>🏅 Seasonal Sports Events</h3>
          <ul style="margin-left: 20px; margin-top: 10px;">
            <li>Eastern Visayas Regional Athletic Association (EVRAA) Meet</li>
            <li>State Colleges and Universities Athletic Association Eastern Visayas (SCUAA EV) Regional Meet</li>
            <li>Palarong Pambansa</li>
            <li>Batang Pinoy - Philippine Youth Games</li>
            <li>National PRISAA Games (Private Schools Athletic Association)</li>
            <li>Regional PRISAA Meets</li>
          </ul>
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

  console.log('\n📞 WEBHOOK VERIFICATION ATTEMPT:');
  console.log('Mode:', mode);
  console.log('Token Received:', token);
  console.log('Token Expected:', VERIFY_TOKEN);

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ WEBHOOK VERIFIED SUCCESSFULLY!');
    res.status(200).send(challenge);
  } else {
    console.log('❌ WEBHOOK VERIFICATION FAILED');
    res.sendStatus(403);
  }
});

// Webhook events (POST)
app.post('/webhook', (req, res) => {
  console.log('\n📬 WEBHOOK EVENT RECEIVED:', new Date().toISOString());
  
  const body = req.body;

  if (body.object === 'page') {
    body.entry?.forEach((entry) => {
      entry.messaging?.forEach((event) => {
        if (event.message?.text) {
          console.log('💬 Message:', event.message.text);
          handleMessage(event.sender.id, event.message.text);
        } else if (event.postback) {
          console.log('📘 Postback:', event.postback.payload);
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
  console.log(`\n📝 PROCESSING MESSAGE FROM ${senderId}`);
  console.log(`📄 Text: "${messageText}"`);

  if (!PAGE_ACCESS_TOKEN || PAGE_ACCESS_TOKEN.length < 100) {
    console.error('❌ CANNOT RESPOND: Invalid PAGE_ACCESS_TOKEN');
    return;
  }

  const detectedLanguage = detectLanguage(messageText);
  console.log(`🌐 Detected Language: ${detectedLanguage}`);

  sendTypingIndicator(senderId, true);

  // Enhanced greeting detection for all languages
  const lowerText = messageText.toLowerCase();
  const greetingPatterns = /^(hi|hello|hey|kamusta|musta|kumusta|hola|bonjour|ola|你好|नमस्ते|maayong|adlaw|maupay|kumusta|ola)$/i;
  
  if (lowerText.match(greetingPatterns)) {
    const greetings = {
      'English': "Hey there! 👋 Welcome to SJC GreenHawks Sports! I'm your AI assistant. How can I help you today? 🏀",
      'Filipino': "Kamusta! 👋 Welcome sa SJC GreenHawks Sports! Ako ang iyong AI assistant. Paano kita matutulungan? 🏀",
      'Cebuano': "Kumusta! 👋 Welcome sa SJC GreenHawks Sports! Ako ang imong AI assistant. Unsaon nako pagtabang? 🏀",
      'Ilocano': "Kumusta! 👋 Welcome iti SJC GreenHawks Sports! Siak ti AI assistant mo. Kasano nga makatulongak kenka? 🏀",
      'Hiligaynon': "Kamusta! 👋 Welcome sa SJC GreenHawks Sports! Ako ang imo AI assistant. Paano ko makabulig sa imo? 🏀",
      'Waray-Waray': "Maupay! 👋 Welcome ha SJC GreenHawks Sports! Ako an imo AI assistant. Paano ko makabubulig ha imo? 🏀",
      'Kapampangan': "Kumusta! 👋 Welcome king SJC GreenHawks Sports! Aku ing AI assistant mu. Makasanmetung daka ku? 🏀",
      'Bicolano': "Kumusta! 👋 Welcome sa SJC GreenHawks Sports! Ako an saimong AI assistant. Paano ko matatabangan ka? 🏀",
      'Pangasinan': "Kumusta! 👋 Welcome ed SJC GreenHawks Sports! Siakoy AI assistant mo. Paano ko makabiang na sika? 🏀",
      'Maranao': "Kapiya sa tao! 👋 Welcome sa SJC GreenHawks Sports! Ako a AI assistant mo. Onopa ko tabangan ka? 🏀",
      'Maguindanao': "Ampiya sa tao! 👋 Welcome sa SJC GreenHawks Sports! Aku nu AI assistant nu. Nopa ku tabangan ka? 🏀",
      'Spanish': "¡Hola! 👋 ¡Bienvenido a SJC GreenHawks Sports! Soy tu asistente de IA. ¿Cómo puedo ayudarte? 🏀",
      'Chinese': "你好！👋 欢迎来到SJC GreenHawks体育！我是你的AI助手。我能帮你什么？🏀",
      'Hindi': "नमस्ते! 👋 SJC GreenHawks Sports में आपका स्वागत है! मैं आपका AI सहायक हूं। मैं आपकी कैसे मदद कर सकता हूं? 🏀",
      'French': "Bonjour! 👋 Bienvenue à SJC GreenHawks Sports! Je suis votre assistant IA. Comment puis-je vous aider? 🏀"
    };
    sendQuickReply(senderId, greetings[detectedLanguage] || greetings['English'], detectedLanguage);
    return;
  }

  // Try Gemini AI
  if (GEMINI_API_KEY && GEMINI_API_KEY !== 'undefined') {
    try {
      console.log('🤖 Calling Gemini AI...');
      const aiResponse = await getGeminiResponse(messageText, detectedLanguage);
      console.log('✅ AI Response generated');
      sendQuickReply(senderId, aiResponse, detectedLanguage);
      return;
    } catch (error) {
      console.error('❌ Gemini failed:', error.message);
    }
  }

  // Fallback
  const fallback = getFallbackResponse(detectedLanguage, lowerText);
  console.log('📋 Using fallback response');
  sendQuickReply(senderId, fallback, detectedLanguage);
}

// Gemini AI call with enhanced language support
async function getGeminiResponse(userMessage, language) {
  const prompt = `${BUSINESS_CONTEXT}\n\nCRITICAL INSTRUCTION: The user wrote their message in ${language}. You MUST respond ONLY in ${language}. Do not use any other language.\n\nUser message: "${userMessage}"\n\nYour response (in ${language}, keep it 2-4 sentences):`;

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

// Enhanced fallback responses for all languages
function getFallbackResponse(language, queryLower) {
  // Sports inquiries
  if (queryLower.match(/(sports|laro|isport|deporte|sport|what sports|ano ang sports|unsa nga sports)/)) {
    const responses = {
      'English': "🏆 SJC offers 17 sports: Basketball, Volleyball, Arnis, Futsal, Sepak Takraw, Athletics, Football, Wushu, Table Tennis, Billiards, Taekwondo, Chess, Badminton, Boxing, Swimming, Dance Sports, and Tennis! Which one interests you? 🦅",
      'Filipino': "🏆 Nag-aalok ang SJC ng 17 sports: Basketball, Volleyball, Arnis, Futsal, Sepak Takraw, Athletics, Football, Wushu, Table Tennis, Billiards, Taekwondo, Chess, Badminton, Boxing, Swimming, Dance Sports, at Tennis! Alin ang gusto mo? 🦅",
      'Cebuano': "🏆 Nag-offer ang SJC ug 17 ka sports: Basketball, Volleyball, Arnis, Futsal, Sepak Takraw, Athletics, Football, Wushu, Table Tennis, Billiards, Taekwondo, Chess, Badminton, Boxing, Swimming, Dance Sports, ug Tennis! Unsa ang gusto nimo? 🦅",
      'Spanish': "🏆 ¡SJC ofrece 17 deportes: Baloncesto, Voleibol, Arnis, Futsal, Sepak Takraw, Atletismo, Fútbol, Wushu, Tenis de Mesa, Billar, Taekwondo, Ajedrez, Bádminton, Boxeo, Natación, Baile Deportivo y Tenis! ¿Cuál te interesa? 🦅"
    };
    return responses[language] || responses['English'];
  }

  // Location/Office inquiries
  if (queryLower.match(/(where|location|saan|asa|diin|office|opisina|lugar|facility|campus)/)) {
    const responses = {
      'English': "📍 Sports Development Office: SJC Junior High School Department, Tunga-Tunga, Maasin City (beside SJC Clinic). Visit Sir Dante Monter or Sir Jason S. Monter! Map: https://maps.app.goo.gl/NvzJ4FL9RKoowAcG7 🏫",
      'Filipino': "📍 Sports Development Office: SJC Junior High School Department, Tunga-Tunga, Maasin City (tabi ng SJC Clinic). Bisitahin sina Sir Dante Monter o Sir Jason S. Monter! Map: https://maps.app.goo.gl/NvzJ4FL9RKoowAcG7 🏫",
      'Cebuano': "📍 Sports Development Office: SJC Junior High School Department, Tunga-Tunga, Maasin City (tupad sa SJC Clinic). Bisitaha si Sir Dante Monter o Sir Jason S. Monter! Map: https://maps.app.goo.gl/NvzJ4FL9RKoowAcG7 🏫",
      'Spanish': "📍 Oficina de Desarrollo Deportivo: SJC Junior High School Department, Tunga-Tunga, Maasin City (al lado de SJC Clinic). ¡Visita a Sir Dante Monter o Sir Jason S. Monter! Mapa: https://maps.app.goo.gl/NvzJ4FL9RKoowAcG7 🏫"
    };
    return responses[language] || responses['English'];
  }

  // Specific sport location inquiries
  if (queryLower.match(/(basketball|football|billiards|tennis|athletics)/)) {
    const responses = {
      'English': "🏀 Basketball, Football, Billiards, Tennis & Athletics are at SJC Extension Campus, Mambajao. Map: https://maps.app.goo.gl/PHnkZHJ94CFShYPfA Contact coordinators for schedule! 📍",
      'Filipino': "🏀 Basketball, Football, Billiards, Tennis at Athletics ay sa SJC Extension Campus, Mambajao. Map: https://maps.app.goo.gl/PHnkZHJ94CFShYPfA Kontakin ang coordinators para sa schedule! 📍",
      'Cebuano': "🏀 Basketball, Football, Billiards, Tennis ug Athletics naa sa SJC Extension Campus, Mambajao. Map: https://maps.app.goo.gl/PHnkZHJ94CFShYPfA Kontaka ang coordinators para sa schedule! 📍",
      'Spanish': "🏀 Baloncesto, Fútbol, Billar, Tenis y Atletismo están en SJC Extension Campus, Mambajao. Mapa: https://maps.app.goo.gl/PHnkZHJ94CFShYPfA ¡Contacta a los coordinadores para el horario! 📍"
    };
    return responses[language] || responses['English'];
  }

  if (queryLower.match(/(table tennis|dance|chess|arnis|wushu|badminton)/)) {
    const responses = {
      'English': "🏓 Table Tennis, Dance Sports, Chess, Arnis, Wushu & Badminton are at SJC Junior High School Department. Map: https://maps.app.goo.gl/NvzJ4FL9RKoowAcG7 Contact coordinators! 📍",
      'Filipino': "🏓 Table Tennis, Dance Sports, Chess, Arnis, Wushu at Badminton ay sa SJC Junior High School Department. Map: https://maps.app.goo.gl/NvzJ4FL9RKoowAcG7 Kontakin ang coordinators! 📍",
      'Cebuano': "🏓 Table Tennis, Dance Sports, Chess, Arnis, Wushu ug Badminton naa sa SJC Junior High School Department. Map: https://maps.app.goo.gl/NvzJ4FL9RKoowAcG7 Kontaka ang coordinators! 📍",
      'Spanish': "🏓 Tenis de Mesa, Baile Deportivo, Ajedrez, Arnis, Wushu y Bádminton están en SJC Junior High School Department. Mapa: https://maps.app.goo.gl/NvzJ4FL9RKoowAcG7 ¡Contacta coordinadores! 📍"
    };
    return responses[language] || responses['English'];
  }

  if (queryLower.match(/(volleyball|sepak takraw|futsal|taekwondo|takraw)/)) {
    const responses = {
      'English': "🏐 Volleyball, Sepak Takraw, Futsal & Taekwondo are at SJC Elementary Dept (Bishop Hacbang Gym). Map: https://maps.app.goo.gl/BSo8cEWfzKWTezX36 Contact coordinators! 📍",
      'Filipino': "🏐 Volleyball, Sepak Takraw, Futsal at Taekwondo ay sa SJC Elementary Dept (Bishop Hacbang Gym). Map: https://maps.app.goo.gl/BSo8cEWfzKWTezX36 Kontakin ang coordinators! 📍",
      'Cebuano': "🏐 Volleyball, Sepak Takraw, Futsal ug Taekwondo naa sa SJC Elementary Dept (Bishop Hacbang Gym). Map: https://maps.app.goo.gl/BSo8cEWfzKWTezX36 Kontaka ang coordinators! 📍",
      'Spanish': "🏐 Voleibol, Sepak Takraw, Futsal y Taekwondo están en SJC Elementary Dept (Bishop Hacbang Gym). Mapa: https://maps.app.goo.gl/BSo8cEWfzKWTezX36 ¡Contacta coordinadores! 📍"
    };
    return responses[language] || responses['English'];
  }

  // Gym inquiries
  if (queryLower.match(/(gym|fitness|workout|exercise|training facility|pahugasan)/)) {
    const responses = {
      'English': "💪 Visit SJC Fitness Gym at SJC Junior High School Department! Perfect for strength training and conditioning. Contact the Sports Office for access! 🏋️",
      'Filipino': "💪 Bisitahin ang SJC Fitness Gym sa SJC Junior High School Department! Perfect para sa strength training at conditioning. Kontakin ang Sports Office para sa access! 🏋️",
      'Cebuano': "💪 Bisitaha ang SJC Fitness Gym sa SJC Junior High School Department! Perfect para sa strength training ug conditioning. Kontaka ang Sports Office para sa access! 🏋️",
      'Spanish': "💪 ¡Visita el SJC Fitness Gym en el Departamento de Secundaria de SJC! Perfecto para entrenamiento de fuerza y acondicionamiento. ¡Contacta la Oficina de Deportes para acceso! 🏋️"
    };
    return responses[language] || responses['English'];
  }

  // Events/Competition inquiries
  if (queryLower.match(/(event|competition|meet|tournament|palaro|kompetisyon|laban|games)/)) {
    const responses = {
      'English': "🏅 SJC competes in major events: EVRAA, SCUAA EV, Palarong Pambansa, Batang Pinoy, National PRISAA Games & Regional PRISAA! Follow SJC Sports page for schedules! 📅",
      'Filipino': "🏅 Lumalaban ang SJC sa major events: EVRAA, SCUAA EV, Palarong Pambansa, Batang Pinoy, National PRISAA Games at Regional PRISAA! I-follow ang SJC Sports page para sa schedules! 📅",
      'Cebuano': "🏅 Nakig-kompetensya ang SJC sa major events: EVRAA, SCUAA EV, Palarong Pambansa, Batang Pinoy, National PRISAA Games ug Regional PRISAA! I-follow ang SJC Sports page para sa schedules! 📅",
      'Spanish': "🏅 ¡SJC compite en eventos importantes: EVRAA, SCUAA EV, Palarong Pambansa, Batang Pinoy, Juegos PRISAA Nacionales y PRISAA Regionales! ¡Sigue la página de SJC Sports para horarios! 📅"
    };
    return responses[language] || responses['English'];
  }

  // Coordinator inquiries
  if (queryLower.match(/(coordinator|coach|sir|teacher|guro|maestro|coordinator|sino ang)/)) {
    const responses = {
      'English': "👨‍🏫 Our Sports Coordinators are Sir Dante Monter and Sir Jason S. Monter! You can visit them at the Sports Development Office beside SJC Clinic! 🦅",
      'Filipino': "👨‍🏫 Ang aming Sports Coordinators ay sina Sir Dante Monter at Sir Jason S. Monter! Bisitahin sila sa Sports Development Office tabi ng SJC Clinic! 🦅",
      'Cebuano': "👨‍🏫 Ang among Sports Coordinators mao sila si Sir Dante Monter ug Sir Jason S. Monter! Bisitaha sila sa Sports Development Office tupad sa SJC Clinic! 🦅",
      'Spanish': "👨‍🏫 ¡Nuestros Coordinadores Deportivos son Sir Dante Monter y Sir Jason S. Monter! ¡Puedes visitarlos en la Oficina de Desarrollo Deportivo al lado de la Clínica SJC! 🦅"
    };
    return responses[language] || responses['English'];
  }

  // Facebook page inquiries
  if (queryLower.match(/(facebook|fb|page|social media|announcement|update|balita)/)) {
    const responses = {
      'English': "📱 Follow SJC Sports on Facebook for announcements and updates! 👉 https://www.facebook.com/profile.php?id=100094320444442 Stay updated with tryouts, events, and achievements! 🦅",
      'Filipino': "📱 I-follow ang SJC Sports sa Facebook para sa announcements at updates! 👉 https://www.facebook.com/profile.php?id=100094320444442 Manatiling updated sa tryouts, events, at achievements! 🦅",
      'Cebuano': "📱 I-follow ang SJC Sports sa Facebook para sa mga announcements ug updates! 👉 https://www.facebook.com/profile.php?id=100094320444442 Magpabilin nga updated sa tryouts, events, ug achievements! 🦅",
      'Spanish': "📱 ¡Sigue SJC Sports en Facebook para anuncios y actualizaciones! 👉 https://www.facebook.com/profile.php?id=100094320444442 ¡Mantente actualizado con pruebas, eventos y logros! 🦅"
    };
    return responses[language] || responses['English'];
  }

  // Scholarship inquiries
  if (queryLower.match(/(scholar|scholarship|beasiswa|iskolar|tuition|free)/)) {
    const responses = {
      'English': "🎓 Visit our Sports Development Office (beside SJC Clinic) to inquire about varsity scholarships! Contact Sir Dante Monter or Sir Jason S. Monter. Requirements discussed during screening. 📧 sjcdo@gmail.com",
      'Filipino': "🎓 Bisitahin ang Sports Development Office (tabi ng SJC Clinic) para sa scholarship! Kontakin sina Sir Dante Monter o Sir Jason S. Monter. Mga requirements ay tatalakayin sa screening. 📧 sjcdo@gmail.com",
      'Cebuano': "🎓 Bisitaha ang Sports Development Office (tupad sa SJC Clinic) para sa scholarship! Kontaka si Sir Dante Monter o Sir Jason S. Monter. Mga requirements i-discuss sa screening. 📧 sjcdo@gmail.com",
      'Ilocano': "🎓 Sarungkaran ti Sports Development Office (abay ti SJC Clinic) para iti scholarship! Kontaken da Sir Dante Monter wenno Sir Jason S. Monter. Maipakaammo dagiti requirements iti screening. 📧 sjcdo@gmail.com",
      'Hiligaynon': "🎓 Bisitaha ang Sports Development Office (kilid sang SJC Clinic) para sa scholarship! Kontaka si Sir Dante Monter ukon Sir Jason S. Monter. Ang mga requirements ipahayag sa screening. 📧 sjcdo@gmail.com",
      'Waray-Waray': "🎓 Bisitaha an Sports Development Office (kilid han SJC Clinic) para han scholarship! Kontaka si Sir Dante Monter o Sir Jason S. Monter. An mga requirements makikiharap ha screening. 📧 sjcdo@gmail.com",
      'Kapampangan': "🎓 Darapon me ing Sports Development Office (kasinglat ning SJC Clinic) para king scholarship! Kontaken yu si Sir Dante Monter o Sir Jason S. Monter. Deng requirements ipatalastas yu king screening. 📧 sjcdo@gmail.com",
      'Bicolano': "🎓 Bisitahon an Sports Development Office (tabing kan SJC Clinic) para sa scholarship! Kontakton si Sir Dante Monter o Sir Jason S. Monter. An mga requirements ipahayag sa screening. 📧 sjcdo@gmail.com",
      'Pangasinan': "🎓 Bisitaen yo so Sports Development Office (abay na SJC Clinic) para ed scholarship! Kontaken yo si Sir Dante Monter o Sir Jason S. Monter. Diad screening ipatalakad ray requirements. 📧 sjcdo@gmail.com",
      'Spanish': "🎓 ¡Visita nuestra Oficina de Desarrollo Deportivo (al lado de la Clínica SJC) para preguntar sobre becas! Contacta a Sir Dante Monter o Sir Jason S. Monter. Los requisitos se discutirán en la evaluación. 📧 sjcdo@gmail.com",
      'Chinese': "🎓 请访问我们的体育发展办公室（SJC诊所旁边）咨询体育奖学金！联系Dante Monter先生或Jason S. Monter先生。要求将在筛选时讨论。📧 sjcdo@gmail.com",
      'Hindi': "🎓 छात्रवृत्ति के बारे में पूछताछ के लिए हमारे खेल विकास कार्यालय (SJC क्लिनिक के बगल में) पर जाएं! Sir Dante Monter या Sir Jason S. Monter से संपर्क करें। आवश्यकताओं पर स्क्रीनिंग में चर्चा की जाएगी।📧 sjcdo@gmail.com",
      'French': "🎓 Visitez notre Bureau de développement sportif (à côté de la Clinique SJC) pour vous renseigner sur les bourses! Contactez Sir Dante Monter ou Sir Jason S. Monter. Les exigences seront discutées lors du dépistage. 📧 sjcdo@gmail.com"
    };
    return responses[language] || responses['English'];
  }

  // Join team inquiries
  if (queryLower.match(/(join|sumali|apil|tryout|team|entry|pasok)/)) {
    const responses = {
      'English': "🏃 Want to join our team? Visit the Sports Office (beside SJC Clinic) for tryout schedules! Talk to Sir Dante Monter or Sir Jason S. Monter. Selection based on performance and commitment. Go GreenHawks! 🦅",
      'Filipino': "🏃 Gusto sumali sa team? Bisitahin ang Sports Office (tabi ng SJC Clinic) para sa tryout schedule! Makipag-usap kina Sir Dante Monter o Sir Jason S. Monter. Based sa performance at commitment ang selection. Go GreenHawks! 🦅",
      'Cebuano': "🏃 Gusto mo-apil sa team? Bisitaha ang Sports Office (tupad sa SJC Clinic) para sa tryout schedule! Pakigsulti kang Sir Dante Monter o Sir Jason S. Monter. Based sa performance ug commitment ang selection. Go GreenHawks! 🦅",
      'Ilocano': "🏃 Kayat mo nga sumali iti team? Sarungkaran ti Sports Office (abay ti SJC Clinic) para iti tryout schedule! Makisarita kada Sir Dante Monter wenno Sir Jason S. Monter. Batayan ti performance ken commitment ti selection. Go GreenHawks! 🦅",
      'Hiligaynon': "🏃 Gusto mo mag-apil sa team? Bisitaha ang Sports Office (kilid sang SJC Clinic) para sa tryout schedule! Mag-istorya kay Sir Dante Monter ukon Sir Jason S. Monter. Base sa performance kag commitment ang selection. Go GreenHawks! 🦅",
      'Waray-Waray': "🏃 Gusto mo magsangkot han team? Bisitaha an Sports Office (kilid han SJC Clinic) para han tryout schedule! Makig-istorya kan Sir Dante Monter o Sir Jason S. Monter. Base han performance ngan commitment an selection. Go GreenHawks! 🦅",
      'Spanish': "🏃 ¿Quieres unirte a nuestro equipo? ¡Visita la Oficina de Deportes (al lado de la Clínica SJC) para conocer los horarios de prueba! Habla con Sir Dante Monter o Sir Jason S. Monter. La selección se basa en el rendimiento y el compromiso. ¡Vamos GreenHawks! 🦅",
      'Chinese': "🏃 想加入我们的团队吗？访问体育办公室（SJC诊所旁边）了解试训时间！与Dante Monter先生或Jason S. Monter先生交谈。选拔基于表现和承诺。加油GreenHawks！🦅",
      'Hindi': "🏃 हमारी टीम में शामिल होना चाहते हैं? ट्रायआउट शेड्यूल के लिए खेल कार्यालय (SJC क्लिनिक के बगल में) पर जाएं! Sir Dante Monter या Sir Jason S. Monter से बात करें। चयन प्रदर्शन और प्रतिबद्धता पर आधारित है। चलो GreenHawks! 🦅"
    };
    return responses[language] || responses['English'];
  }

  // Default responses
  const defaults = {
    'English': "I'm here to help with SJC GreenHawks Sports! 🏀 Ask about scholarships, joining teams, training schedules, or contact sjcdo@gmail.com 📧",
    'Filipino': "Nandito ako para sa SJC GreenHawks Sports! 🏀 Tanungin ako tungkol sa scholarships, pagsali sa teams, training, o contact sjcdo@gmail.com 📧",
    'Cebuano': "Ania ko para sa SJC GreenHawks Sports! 🏀 Pangutana bahin sa scholarships, pag-apil sa teams, training, o contact sjcdo@gmail.com 📧",
    'Ilocano': "Addaak ditoy para iti SJC GreenHawks Sports! 🏀 Damagek maipanggep iti scholarships, panagsilpo iti teams, training, wenno kontaken ti sjcdo@gmail.com 📧",
    'Hiligaynon': "Ara ako diri para sa SJC GreenHawks Sports! 🏀 Pamangkuta parte sa scholarships, pag-apil sa teams, training, ukon contact ang sjcdo@gmail.com 📧",
    'Waray-Waray': "Ania ako dinhi para han SJC GreenHawks Sports! 🏀 Pamangkot parte han scholarships, pagsangkot han teams, training, o contact an sjcdo@gmail.com 📧",
    'Kapampangan': "Atyu ku keni para king SJC GreenHawks Sports! 🏀 Kutnan yu ku tungkol king scholarships, pamagdaklut kareng teams, training, o contact ing sjcdo@gmail.com 📧",
    'Bicolano': "Yaon ako digdi para sa SJC GreenHawks Sports! 🏀 Hapot saako tungkol sa scholarships, pagsali sa teams, training, o contact si sjcdo@gmail.com 📧",
    'Pangasinan': "Atateng ak diya para ed SJC GreenHawks Sports! 🏀 Iyeptan yoy manengneng ed scholarships, panggagawa ed teams, training, o contact so sjcdo@gmail.com 📧",
    'Maranao': "Aya ako dini para sa SJC GreenHawks Sports! 🏀 Pangangkotanon ako tungkol sa scholarships, pagdakel sa teams, training, o contact so sjcdo@gmail.com 📧",
    'Maguindanao': "Aya aku dini para sa SJC GreenHawks Sports! 🏀 Pangutana ka tungkul sa scholarships, pagsulud sa teams, training, o contact su sjcdo@gmail.com 📧",
    'Spanish': "¡Estoy aquí para SJC GreenHawks Sports! 🏀 Pregunta sobre becas, unirse a equipos, entrenamientos, o contacta sjcdo@gmail.com 📧",
    'French': "Je suis là pour SJC GreenHawks Sports! 🏀 Demandez des bourses, rejoindre équipes, entraînements, ou contactez sjcdo@gmail.com 📧",
    'Chinese': "我在这里帮助SJC GreenHawks体育！🏀 询问奖学金、加入团队、训练，或联系 sjcdo@gmail.com 📧",
    'Japanese': "SJC GreenHawksスポーツをサポートします！🏀 奨学金、チーム参加、トレーニングについて質問、または sjcdo@gmail.com へ 📧",
    'Korean': "SJC GreenHawks 스포츠를 도와드립니다! 🏀 장학금, 팀 가입, 훈련에 대해 문의하거나 sjcdo@gmail.com로 연락하세요 📧",
    'Hindi': "मैं SJC GreenHawks Sports के लिए यहां हूं! 🏀 छात्रवृत्ति, टीमों में शामिल होने, प्रशिक्षण के बारे में पूछें, या sjcdo@gmail.com से संपर्क करें 📧",
    'Arabic': "أنا هنا للمساعدة في SJC GreenHawks Sports! 🏀 اسأل عن المنح الدراسية أو الانضمام إلى الفرق أو التدريب أو اتصل بـ sjcdo@gmail.com 📧",
    'Russian': "Я здесь, чтобы помочь с SJC GreenHawks Sports! 🏀 Спросите о стипендиях, присоединении к командам, тренировках или свяжитесь sjcdo@gmail.com 📧",
    'Thai': "ฉันอยู่ที่นี่เพื่อช่วยเหลือ SJC GreenHawks Sports! 🏀 ถามเกี่ยวกับทุนการศึกษา การเข้าร่วมทีม การฝึกซ้อม หรือติดต่อ sjcdo@gmail.com 📧"
  };

  return defaults[language] || defaults['English'];
}

// Postback handler with multilingual support
function handlePostback(senderId, payload) {
  console.log(`📘 Postback: ${payload}`);
  
  const responses = {
    'GET_STARTED': "Welcome to SJC GreenHawks Sports! 🏀🦅 I speak multiple languages! How can I help you?",
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

// Quick reply message with multilingual buttons
function sendQuickReply(recipientId, text, language) {
  const translations = {
    'English': { scholar: '🎓 Scholarship', join: '🏃 Join', merch: '👕 Merch', sports: '🏆 Sports', train: '⏰ Training', contact: '📧 Contact' },
    'Filipino': { scholar: '🎓 Scholarship', join: '🏃 Sumali', merch: '👕 Merch', sports: '🏆 Sports', train: '⏰ Training', contact: '📧 Kontak' },
    'Cebuano': { scholar: '🎓 Scholarship', join: '🏃 Apil', merch: '👕 Merch', sports: '🏆 Sports', train: '⏰ Training', contact: '📧 Kontak' },
    'Ilocano': { scholar: '🎓 Scholarship', join: '🏃 Sumali', merch: '👕 Merch', sports: '🏆 Sports', train: '⏰ Training', contact: '📧 Kontak' },
    'Hiligaynon': { scholar: '🎓 Scholarship', join: '🏃 Apil', merch: '👕 Merch', sports: '🏆 Sports', train: '⏰ Training', contact: '📧 Kontak' },
    'Waray-Waray': { scholar: '🎓 Scholarship', join: '🏃 Sangkot', merch: '👕 Merch', sports: '🏆 Sports', train: '⏰ Training', contact: '📧 Kontak' },
    'Kapampangan': { scholar: '🎓 Scholarship', join: '🏃 Daklut', merch: '👕 Merch', sports: '🏆 Sports', train: '⏰ Training', contact: '📧 Kontak' },
    'Bicolano': { scholar: '🎓 Scholarship', join: '🏃 Sali', merch: '👕 Merch', sports: '🏆 Sports', train: '⏰ Training', contact: '📧 Kontak' },
    'Pangasinan': { scholar: '🎓 Scholarship', join: '🏃 Gawaen', merch: '👕 Merch', sports: '🏆 Sports', train: '⏰ Training', contact: '📧 Kontak' },
    'Maranao': { scholar: '🎓 Scholarship', join: '🏃 Dakel', merch: '👕 Merch', sports: '🏆 Sports', train: '⏰ Training', contact: '📧 Kontak' },
    'Maguindanao': { scholar: '🎓 Scholarship', join: '🏃 Sulud', merch: '👕 Merch', sports: '🏆 Sports', train: '⏰ Training', contact: '📧 Kontak' },
    'Spanish': { scholar: '🎓 Beca', join: '🏃 Unirse', merch: '👕 Tienda', sports: '🏆 Deportes', train: '⏰ Entrenar', contact: '📧 Contacto' },
    'Chinese': { scholar: '🎓 奖学金', join: '🏃 加入', merch: '👕 商品', sports: '🏆 体育', train: '⏰ 训练', contact: '📧 联系' },
    'Hindi': { scholar: '🎓 छात्रवृत्ति', join: '🏃 शामिल', merch: '👕 सामान', sports: '🏆 खेल', train: '⏰ प्रशिक्षण', contact: '📧 संपर्क' },
    'French': { scholar: '🎓 Bourse', join: '🏃 Rejoindre', merch: '👕 Boutique', sports: '🏆 Sports', train: '⏰ Entraîner', contact: '📧 Contact' }
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
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏀 Privacy Policy</h1>
        <p class="effective-date"><strong>Effective Date:</strong> October 31, 2025</p>
        <p class="effective-date"><strong>Service:</strong> SJC GreenHawks Sports Chatbot on Facebook Messenger</p>

        <h2>1. Introduction</h2>
        <p>
          Welcome to the Saint Joseph College (SJC) GreenHawks Sports Bot. We are committed to protecting your privacy 
          and handling your personal information responsibly.
        </p>

        <h2>2. Information We Collect</h2>
        <ul>
          <li><strong>Facebook User ID:</strong> A unique identifier provided by Facebook</li>
          <li><strong>Message Content:</strong> The text messages you send to our bot</li>
          <li><strong>Language Preference:</strong> Automatically detected (supports 15 languages)</li>
          <li><strong>Interaction Timestamps:</strong> For session management only</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <ul>
          <li>To respond to inquiries about SJC sports programs and scholarships</li>
          <li>To detect your language and respond appropriately</li>
          <li>To improve our chatbot's responses</li>
        </ul>

        <h2>4. Data Storage</h2>
        <p>
          <strong>We do not permanently store your personal messages.</strong> Messages are processed in real-time 
          and are not retained in our database.
        </p>

        <h2>5. Contact Us</h2>
        <div class="contact-box">
          <p><strong>Saint Joseph College - Sports Development Office</strong><br>
          📧 Email: <a href="mailto:sjcdo@gmail.com">sjcdo@gmail.com</a><br>
          📍 Location: Tungka-tunga, Maasin City, Southern Leyte, Philippines</p>
        </div>

        <div class="footer">
          <p><strong>© 2025 Saint Joseph College - Sports Development Office</strong></p>
          <p>🏀 Go GreenHawks! 🦅</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Terms of Service route
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
        <p><strong>Effective Date:</strong> October 31, 2025</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By using the SJC GreenHawks Sports Chatbot, you agree to these Terms of Service.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          The SJC Sports Bot is an AI-powered multilingual chatbot (15 languages) that provides information about 
          Saint Joseph College's sports programs.
        </p>

        <h2>3. User Conduct</h2>
        <ul>
          <li>Use the Service only for lawful purposes</li>
          <li>Do not send spam or abusive content</li>
          <li>Do not attempt to disrupt the Service</li>
        </ul>

        <h2>4. Contact</h2>
        <p>
          <strong>SJC Sports Development Office</strong><br>
          📧 Email: sjcdo@gmail.com<br>
          📍 Tungka-tunga, Maasin City, Southern Leyte, Philippines
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
  console.log('\n' + '='.repeat(60));
  console.log('🏀 SJC GREENHAWKS SPORTS BOT STARTED!');
  console.log('='.repeat(60));
  console.log(`🌐 Server running on port: ${PORT}`);
  console.log(`📊 Status page: https://sjc-sports-bot.onrender.com`);
  console.log(`🔗 Webhook URL: https://sjc-sports-bot.onrender.com/webhook`);
  console.log(`🔑 Verify Token: ${VERIFY_TOKEN}`);
  console.log(`🌍 Supported Languages: 15 (5 World + 10 Philippine)`);
  console.log('='.repeat(60));
  console.log('🚀 Ready to receive webhook events from Facebook!');
  console.log('💡 Multilingual support: Auto-detects user language');
  console.log('='.repeat(60) + '\n');
});
