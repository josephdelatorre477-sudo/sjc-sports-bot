

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const FAQ_DATABASE = [
  {
    question: "How can I avail of a varsity scholarship?",
    answer: "Visit the Sports Development Office and inquire about the varsity scholarship program. Requirements and qualifications will be discussed during the screening process."
  },
  {
    question: "How can I join the team?",
    answer: "Interested students may visit the Sports Office for enlistment and tryout schedules. Selection will depend on your performance and commitment during training."
  },
  {
    question: "How much does your merchandise cost?",
    answer: "Prices vary depending on the item (e.g., jerseys, jackets, shirts). You may check the official merchandise list at the Sports Office."
  },
  {
    question: "What sports events are available to join?",
    answer: "Saint Joseph College offers a variety of sports including basketball, volleyball, badminton, football, table tennis, swimming, and more. Ask the Sports Office for the complete list and current schedules."
  },
  {
    question: "What is the process for a transfer student to join a team?",
    answer: "Transfer students must first be admitted to SJC. Once enrolled, visit the Sports Development Office to submit your previous academic and athletic records for eligibility review and to discuss tryout schedules with the coach."
  },
  {
    question: "Is there a maximum age limit to be a varsity athlete?",
    answer: "Yes, the maximum age is usually set by the intercollegiate league (like PRISAA or others) SJC competes in, typically capping eligibility at age 25 for certain levels of competition."
  },
  {
    question: "Can I join a sports team if I'm an evening/working student?",
    answer: "Varsity sports require a full-time academic load and a commitment to practices, training, and travel. While club sports might be flexible, varsity eligibility is strict. Consult the Sports Director for your specific situation."
  },
  {
    question: "What happens if I fail a course during the season?",
    answer: "Failing a course may result in immediate academic probation and could render you temporarily ineligible to compete, as per the scholarship and institutional academic policies."
  },
  {
    question: "Do I need a medical clearance to try out?",
    answer: "Yes, all prospective athletes must submit a valid Medical Certificate or Clearance from an accredited physician, affirming fitness for competitive sports, before joining any tryout or practice."
  },
  {
    question: "What is the daily training schedule like for varsity teams?",
    answer: "Training typically runs for 2-3 hours in the late afternoon/early evening to avoid class conflicts, usually 4 to 5 times per week. The coach will provide the definitive weekly schedule."
  },
  {
    question: "Are there designated study periods for athletes?",
    answer: "Yes, the Sports Development Office works with athletes to establish mandatory study hall hours and offers tutoring resources to ensure academic success alongside athletic commitments."
  },
  {
    question: "What kind of gear or equipment does SJC provide?",
    answer: "The school provides official uniforms (jerseys, shorts/pants) and major team equipment (balls, nets, specialized gear). Athletes are responsible for personal items like shoes, socks, and protective gear."
  },
  {
    question: "Is the SJC GreenHawks Fitness Gym available for all students?",
    answer: "The gym is primarily used for varsity athlete strength and conditioning. It may have public hours for general students; check the schedule posted at the gym entrance or the Sports Office."
  },
  {
    question: "Where is the nearest clinic for athlete injuries?",
    answer: "SJC has a dedicated Athletic Training Room and access to the main School Clinic. For serious injuries, the school will coordinate transport to the nearest partner medical facility in Maasin."
  },
  {
    question: "How many players are usually selected for a varsity team?",
    answer: "The roster size varies by sport. For example, Basketball is typically 12-15 players, while Volleyball is 14-16. Final selection depends on the coach's assessment and league limits."
  },
  {
    question: "Which leagues or tournaments does the SJC GreenHawks participate in?",
    answer: "We primarily compete in the PRISAA (Private Schools Athletic Association) regional and national meets, as well as local inter-collegiate and inter-town tournaments."
  },
  {
    question: "Who are the current coaches for the major sports teams?",
    answer: "Due to privacy and changes, we do not list names here. Please contact the Sports Development Office directly via email at sjcdo@gmail.com or visit the office to get the current head coach's contact information."
  },
  {
    question: "Do the teams travel for competitions?",
    answer: "Yes, teams travel regularly within the region (and occasionally nationally for championships) to compete. All travel, accommodation, and food logistics are managed and sponsored by the school."
  },
  {
    question: "What are the core values of the SJC Sports Program?",
    answer: "Our program focuses on developing the whole person, embodying values like Teamwork, Discipline, Sportsmanship, Resilience, and Faith, aligning with the Saint Joseph College mission."
  },
  {
    question: "Where is the SJC Sports Development Office located?",
    answer: "The office is located on the SJC Campus in Tungka-tunga, Maasin, Philippines. You can find us near the main quadrangle/gym."
  },
  {
    question: "What are the office hours for the SJC Sports Development Office?",
    answer: "Standard office hours are Monday to Friday. It's best to call or email in advance at sjcdo@gmail.com to ensure the Director or Coordinator is available."
  },
  {
    question: "How can I purchase GreenHawks merchandise?",
    answer: "You can purchase merchandise at the Official SJC Merchandise Booth during major school events or directly from the SJC Bookstore/Sports Office. Check the SJC Sports Facebook page for current items."
  },
  {
    question: "Do you accept payments online for merchandise?",
    answer: "Merchandise purchases are typically handled on-site (cash or GCash/PayMaya, if available). For bulk or special orders, please email sjcdo@gmail.com to inquire about online payment options."
  },
  {
    question: "Can I suggest a new sport for the school to offer?",
    answer: "Yes, we encourage student initiative! Please submit a formal proposal to the SJC Sports Development Office, including details on student interest, required facilities, and potential competition leagues."
  },
  {
    question: "What support does SJC offer for student-athletes facing academic challenges?",
    answer: "The school provides individualized academic mentoring, priority enrollment advising, and access to tutoring services to help athletes balance their rigorous training and academic schedule."
  },
  {
    question: "Are there any restrictions on part-time jobs for scholarship athletes?",
    answer: "Yes, your scholarship agreement typically restricts outside employment to ensure your focus remains on academics and training. Any work must be approved by the Sports Director."
  },
  {
    question: "How do I get permission for an excused absence due to a game?",
    answer: "Coaches submit an official list of traveling athletes and game schedules to the faculty at the beginning of the season. You are responsible for notifying your professors and completing missed assignments."
  },
  {
    question: "Can I still play in club sports outside of SJC?",
    answer: "Varsity athletes are generally restricted from participating in outside leagues during the competitive season to prevent injury and focus commitment. Consult your coach and the Sports Office for the specific policy."
  },
  {
    question: "How can the SJC community best support the GreenHawks?",
    answer: "The best support is showing up! Follow the SJC Sports page for game schedules, attend our home games, and participate in school events like the Family Run. Your enthusiasm fuels our GreenHawks!"
  }
];

const SYSTEM_CONTEXT = `You are the official SJC Sports Bot for Saint Joseph College GreenHawks. You help answer questions about varsity sports programs, scholarships, training schedules, facilities, tryouts, merchandise, academic support, and PRISAA competitions. Always be friendly, professional, and encouraging. Promote school spirit and GreenHawks values: Teamwork, Discipline, Sportsmanship, Resilience, and Faith. For non-sports questions, politely redirect to the appropriate SJC department. Contact: sjcdo@gmail.com, Location: SJC Campus, Tungka-tunga, Maasin, Philippines`;

app.get('/', (req, res) => {
  res.send('🏀 SJC Sports Bot is running! Go GreenHawks! 🦅');
});

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully!');
    res.status(200).send(challenge);
  } else {
    console.error('❌ Webhook verification failed!');
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(async (entry) => {
      const webhookEvent = entry.messaging[0];
      const senderId = webhookEvent.sender.id;

      if (webhookEvent.message && webhookEvent.message.text) {
        const userMessage = webhookEvent.message.text;
        console.log(`📩 Message from ${senderId}: ${userMessage}`);
        await handleMessage(senderId, userMessage);
      }

      if (webhookEvent.postback) {
        const payload = webhookEvent.postback.payload;
        console.log(`🔘 Postback from ${senderId}: ${payload}`);
        await handlePostback(senderId, payload);
      }
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

async function handleMessage(senderId, messageText) {
  try {
    await sendTypingIndicator(senderId, true);

    const faqMatch = findFAQMatch(messageText);
    
    if (faqMatch) {
      await sendTextMessage(senderId, faqMatch.answer);
      await sendQuickReplies(senderId);
    } else {
      const aiResponse = await getGeminiResponse(messageText);
      await sendTextMessage(senderId, aiResponse);
      await sendQuickReplies(senderId);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    await sendTextMessage(
      senderId,
      "I apologize, but I'm having trouble processing your request. Please try again or contact the Sports Office at sjcdo@gmail.com for assistance."
    );
  }
}

async function handlePostback(senderId, payload) {
  let response = '';

  switch (payload) {
    case 'GET_STARTED':
      response = `🦅 Welcome to SJC Sports Bot! 🏀

I'm here to help you with information about Saint Joseph College GreenHawks sports programs!

I can answer questions about:
✅ Varsity scholarships
✅ Team tryouts and selection
✅ Training schedules
✅ Sports merchandise
✅ Academic support for athletes
✅ Competitions and tournaments

How can I assist you today?`;
      break;
    
    case 'VIEW_FAQS':
      response = `📋 Popular FAQs:

1️⃣ How can I avail of a varsity scholarship?
2️⃣ How can I join the team?
3️⃣ What sports are available?
4️⃣ Where is the Sports Office?

Ask me anything about SJC GreenHawks sports!`;
      break;
    
    case 'CONTACT_INFO':
      response = `📞 Contact SJC Sports Development Office:

📧 Email: sjcdo@gmail.com
📍 Location: SJC Campus, Tungka-tunga, Maasin, Philippines
⏰ Office Hours: Monday to Friday

Follow us on Facebook for updates on games and events! Go GreenHawks! 🦅`;
      break;
    
    default:
      response = 'How can I help you today?';
  }

  await sendTextMessage(senderId, response);
  await sendQuickReplies(senderId);
}

function findFAQMatch(userMessage) {
  const normalizedMessage = userMessage.toLowerCase().trim();
  
  for (const faq of FAQ_DATABASE) {
    const normalizedQuestion = faq.question.toLowerCase();
    const questionWords = normalizedQuestion.replace(/[?.,!]/g, '').split(' ').filter(word => word.length > 3);
    const matchCount = questionWords.filter(word => normalizedMessage.includes(word)).length;
    
    if (matchCount / questionWords.length > 0.4) {
      return faq;
    }
  }
  
  return null;
}

async function getGeminiResponse(userMessage) {
  try {
    const faqContext = FAQ_DATABASE.map((faq, idx) => 
      `${idx + 1}. Q: ${faq.question}\n   A: ${faq.answer}`
    ).join('\n\n');

    const prompt = `${SYSTEM_CONTEXT}

Available FAQs:
${faqContext}

User Question: ${userMessage}

Instructions:
- If the question matches any FAQ, provide that answer directly
- If it's a sports-related question not in FAQs, answer based on general SJC sports knowledge
- Keep responses concise (2-3 sentences max)
- Be friendly and encouraging
- End with "Go GreenHawks! 🦅" when appropriate
- If the question is not sports-related, politely redirect to the appropriate department

Response:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text.trim();
  } catch (error) {
    console.error('Gemini API Error:', error);
    return `I'm here to help with SJC GreenHawks sports questions! You can ask me about scholarships, tryouts, schedules, merchandise, and more. For specific inquiries, contact the Sports Office at sjcdo@gmail.com or visit us at the SJC Campus in Maasin.`;
  }
}

async function sendTextMessage(recipientId, messageText) {
  const messageData = {
    recipient: { id: recipientId },
    message: { text: messageText }
  };
  await callSendAPI(messageData);
}

async function sendTypingIndicator(recipientId, isTyping) {
  const messageData = {
    recipient: { id: recipientId },
    sender_action: isTyping ? 'typing_on' : 'typing_off'
  };
  await callSendAPI(messageData);
}

async function sendQuickReplies(recipientId) {
  const messageData = {
    recipient: { id: recipientId },
    message: {
      text: "What else can I help you with?",
      quick_replies: [
        {
          content_type: "text",
          title: "📋 View FAQs",
          payload: "VIEW_FAQS"
        },
        {
          content_type: "text",
          title: "📞 Contact Info",
          payload: "CONTACT_INFO"
        },
        {
          content_type: "text",
          title: "🏀 Sports Programs",
          payload: "SPORTS_PROGRAMS"
        }
      ]
    }
  };
  await callSendAPI(messageData);
}

async function callSendAPI(messageData) {
  try {
    await axios({
      url: 'https://graph.facebook.com/v18.0/me/messages',
      method: 'POST',
      params: { access_token: PAGE_ACCESS_TOKEN },
      data: messageData
    });
  } catch (error) {
    console.error('Error sending message:', error.response?.data || error.message);
  }
}

app.listen(PORT, () => {
  console.log(`🚀 SJC Sports Bot server is running on port ${PORT}`);
  console.log(`🦅 Go GreenHawks!`);
  console.log(`\n📝 Configuration:`);
  console.log(`   - Verify Token: ${VERIFY_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`   - Page Access Token: ${PAGE_ACCESS_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`   - Gemini API Key: ${GEMINI_API_KEY ? '✅ Set' : '❌ Missing'}`);
});
