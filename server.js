// server.js - SJC Sports Facebook Chatbot with Google Gemini AI (Multilingual)
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

// Using Gemini 2.0 Flash
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

// Enhanced Multilingual SJC Sports Context
const BUSINESS_CONTEXT = `You are a friendly and helpful MULTILINGUAL assistant for the Saint Joseph College (SJC) GreenHawks Sports Program in Maasin City, Southern Leyte, Philippines.

BUSINESS DETAILS:
- Name: Saint Joseph College GreenHawks Sports Program
- Location: Tungka-tunga, Maasin City, Southern Leyte, Philippines
- Email: sjcdo@gmail.com
- Sports Offered: Basketball, Volleyball, Badminton, Football, Table Tennis, Swimming, and more

CORE VALUES:
- Teamwork
- Discipline
- Sportsmanship
- Resilience
- Faith

KEY INFORMATION:
- We compete in PRISAA (Private Schools Athletic Association) regional and national meets
- We provide varsity scholarships for qualified student-athletes
- Athletes must maintain academic eligibility
- All athletes need medical clearance before tryouts
- Training is typically 2-3 hours, 4-5 times per week in late afternoon/early evening
- The school provides uniforms and major equipment
- Travel, accommodation, and meals are provided for competitions

FAQs:
1. Scholarship: Visit the Sports Development Office to inquire about our varsity scholarship program. Requirements discussed during screening. Email: sjcdo@gmail.com
2. Join Team: Visit Sports Office for enlistment and tryout schedules. Selection based on performance and commitment.
3. Merchandise: Prices vary by item (jerseys, jackets, shirts). Check with Sports Office for pricing.
4. Sports Events: Basketball, Volleyball, Badminton, Football, Table Tennis, Swimming, and more.
5. Transfer Students: Must be admitted to SJC first, then submit academic/athletic records at Sports Office.
6. Medical Clearance: Required from accredited physician before tryouts/practice.
7. Training Schedule: 2-3 hours, late afternoon/evening, 4-5 times weekly. Coach provides specific schedule.
8. Equipment: School provides uniforms and major equipment. Athletes bring shoes, socks, protective gear.

CRITICAL MULTILINGUAL INSTRUCTIONS:
1. **ALWAYS detect and respond in the EXACT SAME LANGUAGE the user writes in**
2. Support ALL languages: English, Spanish, French, German, Italian, Portuguese, Russian, Arabic, Hindi, Chinese (Simplified/Traditional), Japanese, Korean, Filipino/Tagalog, Cebuano/Bisaya, Indonesian, Malay, Thai, Vietnamese, Turkish, Polish, Dutch, Swedish, Danish, Norwegian, Finnish, Greek, Hebrew, Persian, Urdu, Bengali, Tamil, Telugu, Marathi, and ANY other language
3. Keep responses SHORT (2-4 sentences) but helpful
4. Use appropriate sports emojis: 🏀⚽🏐🏆🦅
5. If you don't know specific details, suggest contacting sjcdo@gmail.com
6. Be enthusiastic about SJC sports!
7. Stay professional and respectful
8. Use culturally appropriate greetings and expressions for each language

LANGUAGE DETECTION EXAMPLES:
- English: "How can I join?" → Respond in English
- Spanish: "¿Cómo puedo unirme?" → Respond in Spanish
- French: "Comment puis-je rejoindre?" → Respond in French
- Filipino: "Paano ako makakasali?" → Respond in Filipino
- Chinese: "我怎么加入？" → Respond in Chinese
- Japanese: "どうやって参加できますか？" → Respond in Japanese
- Arabic: "كيف يمكنني الانضمام؟" → Respond in Arabic
- Korean: "어떻게 가입하나요?" → Respond in Korean

IMPORTANT: Your response MUST be in the SAME language as the user's message. This is absolutely critical.`;

// Enhanced language detection function
function detectLanguage(text) {
  const lowerText = text.toLowerCase();
  
  // Filipino/Tagalog
  if (lowerText.match(/(ako|ikaw|sila|kami|tayo|mo|ko|natin|ka|ba|po|opo|hindi|oo|sige|paano|ano|saan|mabuhay)/)) {
    return 'Filipino';
  }
  
  // Cebuano/Bisaya
  if (lowerText.match(/(nako|nimo|ato|imo|dili|unsaon|unsa|asa|bai|istorya|lingaw)/)) {
    return 'Cebuano';
  }
  
  // Spanish
  if (lowerText.match(/(hola|gracias|por favor|buenos|días|noche|adiós|sí|no|cómo|qué|dónde|cuándo)/)) {
    return 'Spanish';
  }
  
  // French
  if (lowerText.match(/(bonjour|merci|s'il vous plaît|oui|non|comment|quoi|où|quand|bonsoir)/)) {
    return 'French';
  }
  
  // German
  if (lowerText.match(/(hallo|danke|bitte|ja|nein|wie|was|wo|wann|guten tag|tschüss)/)) {
    return 'German';
  }
  
  // Italian
  if (lowerText.match(/(ciao|grazie|prego|sì|no|come|cosa|dove|quando|buongiorno)/)) {
    return 'Italian';
  }
  
  // Portuguese
  if (lowerText.match(/(olá|obrigado|por favor|sim|não|como|que|onde|quando|bom dia)/)) {
    return 'Portuguese';
  }
  
  // Russian (Cyrillic)
  if (text.match(/[а-яА-ЯёЁ]/)) {
    return 'Russian';
  }
  
  // Arabic
  if (text.match(/[\u0600-\u06FF]/)) {
    return 'Arabic';
  }
  
  // Chinese (Simplified/Traditional)
  if (text.match(/[\u4E00-\u9FFF]/)) {
    return 'Chinese';
  }
  
  // Japanese (Hiragana, Katakana, Kanji)
  if (text.match(/[\u3040-\u309F\u30A0-\u30FF]/)) {
    return 'Japanese';
  }
  
  // Korean (Hangul)
  if (text.match(/[\uAC00-\uD7AF]/)) {
    return 'Korean';
  }
  
  // Thai
  if (text.match(/[\u0E00-\u0E7F]/)) {
    return 'Thai';
  }
  
  // Vietnamese
  if (lowerText.match(/(xin chào|cảm ơn|làm thế nào|gì|ở đâu|khi nào)/)) {
    return 'Vietnamese';
  }
  
  // Hindi (Devanagari)
  if (text.match(/[\u0900-\u097F]/)) {
    return 'Hindi';
  }
  
  // Greek
  if (text.match(/[\u0370-\u03FF]/)) {
    return 'Greek';
  }
  
  // Hebrew
  if (text.match(/[\u0590-\u05FF]/)) {
    return 'Hebrew';
  }
  
  // Indonesian/Malay
  if (lowerText.match(/(selamat|terima kasih|tolong|bagaimana|apa|di mana|kapan)/)) {
    return 'Indonesian';
  }
  
  // Turkish
  if (lowerText.match(/(merhaba|teşekkür|lütfen|nasıl|ne|nerede|ne zaman)/)) {
    return 'Turkish';
  }
  
  // Polish
  if (lowerText.match(/(cześć|dziękuję|proszę|jak|co|gdzie|kiedy)/)) {
    return 'Polish';
  }
  
  // Dutch
  if (lowerText.match(/(hallo|dank je|alstublieft|hoe|wat|waar|wanneer)/)) {
    return 'Dutch';
  }
  
  // Swedish
  if (lowerText.match(/(hej|tack|snälla|hur|vad|var|när)/)) {
    return 'Swedish';
  }
  
  return 'English'; // Default
}

// Root route
app.get('/', (req, res) => {
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
        .status-item { padding: 10px; margin: 5px 0; background: rgba(255,255,255,0.2); border-radius: 5px; }
        .green { color: #4CAF50; font-weight: bold; }
        .red { color: #f44336; font-weight: bold; }
        .languages {
          margin-top: 20px;
          padding: 15px;
          background: rgba(255,255,255,0.15);
          border-radius: 5px;
          font-size: 0.9em;
        }
        .language-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 8px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏀 SJC GreenHawks Sports Chatbot</h1>
        <p><strong>🌍 Powered by Google Gemini 2.0 Flash - MULTILINGUAL AI</strong></p>
        <div class="status">
          <div class="status-item">
            📍 Status: <span class="green">✓ Running</span>
          </div>
          <div class="status-item">
            🔑 Verify Token: <span class="${VERIFY_TOKEN ? 'green' : 'red'}">${VERIFY_TOKEN ? '✓ Set' : '✗ Missing'}</span>
          </div>
          <div class="status-item">
            📱 Page Token: <span class="${PAGE_ACCESS_TOKEN ? 'green' : 'red'}">${PAGE_ACCESS_TOKEN ? '✓ Set' : '✗ Missing'}</span>
          </div>
          <div class="status-item">
            🤖 Gemini API: <span class="${GEMINI_API_KEY ? 'green' : 'red'}">${GEMINI_API_KEY ? '✓ Set' : '✗ Missing'}</span>
          </div>
        </div>
        
        <div class="languages">
          <h3>🌍 Supported Languages (All Major World Languages):</h3>
          <div class="language-grid">
            <div>🇬🇧 English</div>
            <div>🇵🇭 Filipino</div>
            <div>🇵🇭 Cebuano</div>
            <div>🇪🇸 Spanish</div>
            <div>🇫🇷 French</div>
            <div>🇩🇪 German</div>
            <div>🇮🇹 Italian</div>
            <div>🇵🇹 Portuguese</div>
            <div>🇷🇺 Russian</div>
            <div>🇸🇦 Arabic</div>
            <div>🇨🇳 Chinese</div>
            <div>🇯🇵 Japanese</div>
            <div>🇰🇷 Korean</div>
            <div>🇮🇳 Hindi</div>
            <div>🇮🇩 Indonesian</div>
            <div>🇹🇭 Thai</div>
            <div>🇻🇳 Vietnamese</div>
            <div>🇹🇷 Turkish</div>
            <div>🇵🇱 Polish</div>
            <div>🇳🇱 Dutch</div>
            <div>🇸🇪 Swedish</div>
            <div>🇬🇷 Greek</div>
            <div>🇮🇱 Hebrew</div>
            <div>+ Many More!</div>
          </div>
        </div>

        <p style="margin-top: 30px;">
          📧 Contact: sjcdo@gmail.com<br>
          🔗 Webhook: ${req.protocol}://${req.get('host')}/webhook<br>
          💬 The bot automatically detects and responds in ANY language!
        </p>
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

  if (mode && token === VERIFY_TOKEN) {
    if (mode === 'subscribe') {
      console.log('✅ Webhook verified!');
      res.status(200).send(challenge);
    }
  } else {
    console.error('❌ Webhook verification failed');
    res.sendStatus(403);
  }
});

// Webhook event handler
app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(entry => {
      entry.messaging.forEach(event => {
        if (event.message && event.message.text) {
          handleMessage(event.sender.id, event.message.text);
        } else if (event.postback) {
          handlePostback(event.sender.id, event.postback.payload);
        }
      });
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Enhanced multilingual message handler
async function handleMessage(senderId, messageText) {
  console.log(`📨 Received: "${messageText}" from ${senderId}`);
  
  const detectedLanguage = detectLanguage(messageText);
  console.log(`🌍 Detected language: ${detectedLanguage}`);

  // Show typing indicator
  sendTypingIndicator(senderId, true);

  // Try Gemini AI (with multilingual support)
  if (GEMINI_API_KEY && GEMINI_API_KEY !== 'undefined') {
    try {
      console.log('🤖 Calling Gemini AI with multilingual support...');
      const aiResponse = await getGeminiResponseWithRetry(messageText, detectedLanguage, 2);
      console.log('✅ AI Response:', aiResponse);
      sendQuickReply(senderId, aiResponse, detectedLanguage);
      return;
    } catch (error) {
      console.error('❌ Gemini AI failed:', error.message);
      // Continue to fallback
    }
  }

  // Fallback to multilingual default
  const fallbackResponse = getMultilingualFallback(detectedLanguage);
  console.log('📋 Using fallback:', fallbackResponse);
  sendQuickReply(senderId, fallbackResponse, detectedLanguage);
}

// Enhanced Gemini AI with explicit language instruction
async function getGeminiResponseWithRetry(userMessage, detectedLanguage, maxRetries = 2) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'undefined') {
    throw new Error('Gemini API key not configured');
  }

  // Explicit language instruction for Gemini
  const languageInstruction = `CRITICAL: The user wrote their message in ${detectedLanguage}. You MUST respond in ${detectedLanguage} ONLY. Do NOT use English unless the user wrote in English.`;
  
  const fullPrompt = `${BUSINESS_CONTEXT}\n\n${languageInstruction}\n\nUser's message (in ${detectedLanguage}): "${userMessage}"\n\nYour response (respond ONLY in ${detectedLanguage}, 2-4 sentences, enthusiastic):`;

  const requestBody = {
    contents: [{
      parts: [{
        text: fullPrompt
      }]
    }],
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 200,
      topP: 0.95,
      topK: 40
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      }
    ]
  };

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      console.log(`🔄 Gemini API attempt ${attempt}/${maxRetries + 1}`);
      
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
      if (error.response?.status === 503 && attempt <= maxRetries) {
        console.log(`⏳ Retrying in ${attempt * 2} seconds...`);
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
    'French': "Je suis là pour vous aider avec SJC GreenHawks Sports! 🏀 Demandez-moi des bourses, rejoindre des équipes, marchandises, horaires d'entraînement, ou contactez-nous à sjcdo@gmail.com 📧",
    'German': "Ich bin hier, um bei SJC GreenHawks Sports zu helfen! 🏀 Fragen Sie mich nach Stipendien, Teams beitreten, Waren, Trainingszeiten oder kontaktieren Sie uns unter sjcdo@gmail.com 📧",
    'Italian': "Sono qui per aiutarti con SJC GreenHawks Sports! 🏀 Chiedimi di borse di studio, unirsi ai team, merchandising, orari di allenamento, o contattaci a sjcdo@gmail.com 📧",
    'Portuguese': "Estou aqui para ajudar com SJC GreenHawks Sports! 🏀 Pergunte-me sobre bolsas de estudo, ingressar em equipes, mercadorias, horários de treino, ou entre em contato em sjcdo@gmail.com 📧",
    'Russian': "Я здесь, чтобы помочь со спортом SJC GreenHawks! 🏀 Спросите меня о стипендиях, присоединении к командам, товарах, расписании тренировок или свяжитесь с нами по адресу sjcdo@gmail.com 📧",
    'Arabic': "أنا هنا للمساعدة في SJC GreenHawks Sports! 🏀 اسألني عن المنح الدراسية، الانضمام إلى الفرق، البضائع، جداول التدريب، أو اتصل بنا على sjcdo@gmail.com 📧",
    'Chinese': "我在这里帮助SJC GreenHawks体育！🏀 问我关于奖学金、加入团队、商品、训练时间表，或联系我们 sjcdo@gmail.com 📧",
    'Japanese': "SJC GreenHawksスポーツのお手伝いをします！🏀 奨学金、チーム参加、グッズ、トレーニングスケジュールについて聞いてください。お問い合わせ：sjcdo@gmail.com 📧",
    'Korean': "SJC GreenHawks 스포츠를 도와드립니다! 🏀 장학금, 팀 가입, 상품, 훈련 일정에 대해 물어보세요. 문의: sjcdo@gmail.com 📧",
    'Hindi': "मैं SJC GreenHawks Sports में मदद के लिए हूं! 🏀 मुझसे छात्रवृत्ति, टीमों में शामिल होने, माल, प्रशिक्षण कार्यक्रम के बारे में पूछें, या sjcdo@gmail.com पर संपर्क करें 📧",
    'Indonesian': "Saya di sini untuk membantu dengan SJC GreenHawks Sports! 🏀 Tanyakan tentang beasiswa, bergabung dengan tim, merchandise, jadwal latihan, atau hubungi kami di sjcdo@gmail.com 📧",
    'Thai': "ฉันอยู่ที่นี่เพื่อช่วยเหลือ SJC GreenHawks Sports! 🏀 ถามฉันเกี่ยวกับทุนการศึกษา การเข้าร่วมทีม สินค้า ตารางการฝึก หรือติดต่อเราที่ sjcdo@gmail.com 📧",
    'Vietnamese': "Tôi ở đây để giúp đỡ SJC GreenHawks Sports! 🏀 Hỏi tôi về học bổng, tham gia đội, hàng hóa, lịch tập luyện, hoặc liên hệ với chúng tôi tại sjcdo@gmail.com 📧",
    'Turkish': "SJC GreenHawks Sports konusunda yardımcı olmak için buradayım! 🏀 Bana burslar, takımlara katılma, ürünler, antrenman programları hakkında sorun veya sjcdo@gmail.com adresinden bize ulaşın 📧",
    'Polish': "Jestem tutaj, aby pomóc w SJC GreenHawks Sports! 🏀 Zapytaj mnie o stypendia, dołączanie do drużyn, towary, harmonogramy treningów lub skontaktuj się z nami pod adresem sjcdo@gmail.com 📧",
    'Dutch': "Ik ben hier om te helpen met SJC GreenHawks Sports! 🏀 Vraag me naar beurzen, teams, merchandise, trainingsschema's, of neem contact met ons op via sjcdo@gmail.com 📧",
    'Swedish': "Jag är här för att hjälpa till med SJC GreenHawks Sports! 🏀 Fråga mig om stipendier, gå med i lag, varor, träningsscheman, eller kontakta oss på sjcdo@gmail.com 📧",
    'Greek': "Είμαι εδώ για να βοηθήσω με το SJC GreenHawks Sports! 🏀 Ρωτήστε με για υποτροφίες, συμμετοχή σε ομάδες, προϊόντα, προγράμματα προπόνησης, ή επικοινωνήστε μαζί μας στο sjcdo@gmail.com 📧",
    'Hebrew': "אני כאן כדי לעזור עם SJC GreenHawks Sports! 🏀 שאלו אותי על מלגות, הצטרפות לקבוצות, מוצרים, לוחות אימונים, או צרו קשר בכתובת sjcdo@gmail.com 📧"
  };

  return fallbacks[language] || fallbacks['English'];
}

// Handle postback buttons
function handlePostback(senderId, payload) {
  console.log(`📘 Postback: ${payload}`);
  
  const responses = {
    'GET_STARTED': "Welcome to SJC GreenHawks Sports! 🏀🦅 I can help you in ANY language! How can I assist you today?",
    'SHOW_FAQS': "Here's what I can help you with! 👇 Click a button or ask me anything in your language!",
    'CONTACT_US': "📧 Contact the Sports Development Office at sjcdo@gmail.com or message me here! I speak your language! 😊"
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

// Send message with multilingual quick replies
function sendQuickReply(recipientId, messageText, language) {
  // Quick reply translations
  const quickReplyTranslations = {
    'English': { scholarship: '🎓 Scholarship', join: '🏃 Join Team', merch: '👕 Merchandise', sports: '🏆 Sports', training: '⏰ Training', contact: '📧 Contact' },
    'Filipino': { scholarship: '🎓 Scholarship', join: '🏃 Sumali', merch: '👕 Merchandise', sports: '🏆 Sports', training: '⏰ Training', contact: '📧 Kontak' },
    'Cebuano': { scholarship: '🎓 Scholarship', join: '🏃 Apil', merch: '👕 Merchandise', sports: '🏆 Sports', training: '⏰ Training', contact: '📧 Kontak' },
    'Spanish': { scholarship: '🎓 Beca', join: '🏃 Unirse', merch: '👕 Productos', sports: '🏆 Deportes', training: '⏰ Entrenamiento', contact: '📧 Contacto' },
    'French': { scholarship: '🎓 Bourse', join: '🏃 Rejoindre', merch: '👕 Produits', sports: '🏆 Sports', training: '⏰ Entraînement', contact: '📧 Contact' },
    'Chinese': { scholarship: '🎓 奖学金', join: '🏃 加入', merch: '👕 商品', sports: '🏆 体育', training: '⏰ 训练', contact: '📧 联系' },
    'Japanese': { scholarship: '🎓 奨学金', join: '🏃 参加', merch: '👕 グッズ', sports: '🏆 スポーツ', training: '⏰ トレーニング', contact: '📧 お問合せ' },
    'Korean': { scholarship: '🎓 장학금', join: '🏃 가입', merch: '👕 상품', sports: '🏆 스포츠', training: '⏰ 훈련', contact: '📧 연락' }
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

// Send button template
function sendButtonTemplate(recipientId) {
  const messageData = {
    recipient: { id: recipientId },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "🌍 Welcome to SJC GreenHawks Sports! I speak ALL languages! 🏀🦅 How can I help?",
          buttons: [
            {
              type: "postback",
              title: "📋 View FAQs",
              payload: "SHOW_FAQS"
            },
            {
              type: "postback",
              title: "📧 Contact Us",
              payload: "CONTACT_US"
            },
            {
              type: "web_url",
              title: "🌐 Visit SJC",
              url: "https://sjc.edu.ph"
            }
          ]
        }
      }
    }
  };
  callSendAPI(messageData);
}

// Call Facebook Send API
function callSendAPI(messageData) {
  axios.post(`https://graph.facebook.com/v18.0/me/messages`, messageData, {
    params: { access_token: PAGE_ACCESS_TOKEN }
  })
  .then(() => {
    console.log('✅ Message sent successfully');
  })
  .catch(error => {
    console.error('❌ Send failed:', error.response?.data || error.message);
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🏀 SJC GreenHawks Sports Chatbot - Port ${PORT}`);
  console.log(`🌍 MULTILINGUAL SUPPORT - ALL LANGUAGES WORLDWIDE 🌍`);
  console.log(`🤖 Powered by Google Gemini 2.0 Flash AI`);
  console.log(`${'='.repeat(70)}`);
  console.log(`🔑 Verify Token: ${VERIFY_TOKEN ? '✓ Set' : '✗ Missing'}`);
  console.log(`📱 Page Token: ${PAGE_ACCESS_TOKEN ? '✓ Set' : '✗ Missing'}`);
  console.log(`🤖 Gemini Key: ${GEMINI_API_KEY ? '✓ Set' : '✗ Missing'}`);
  console.log(`${'='.repeat(70)}`);
  console.log(`📋 Supported Languages:`);
  console.log(`   English, Filipino, Cebuano, Spanish, French, German,`);
  console.log(`   Italian, Portuguese, Russian, Arabic, Chinese, Japanese,`);
  console.log(`   Korean, Hindi, Indonesian, Thai, Vietnamese, Turkish,`);
  console.log(`   Polish, Dutch, Swedish, Greek, Hebrew, and MORE!`);
  console.log(`${'='.repeat(70)}\n`);
});
