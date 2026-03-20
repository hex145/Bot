// ============================================
// بوت SMM الاحترافي - مع إشعار المكافأة
// ============================================

const CONFIG = {
  TELEGRAM_TOKEN: '7710008981:AAFxAX1NNJlZiHfkvWMbzdgCrkoPfC_li88',
  SMM_API_KEY: '6665c778187dd2e20a7ce9c0752da440',
  SMM_API_URL: 'https://global-smm.com/api/v2',
  WORKER_URL: 'https://orange-cloud-4f73.ilhamyouuhjj.workers.dev',
  PROFIT_MARGIN: 1.0, // 100% ربح
  SERVICES_PER_PAGE: 8,
  CACHE_DURATION: 12 * 60 * 60 * 1000, // 12 ساعة
  
  // إعدادات العملة
  CURRENCY: '$', // رمز الدولار
  BONUS_AMOUNT: 1.0, // 1 دولار مكافأة
  MAX_BONUS_USERS: 20, // أول 20 مستخدم فقط
  
  // إعدادات الإحالة
  REFERRAL_BONUS: 0.5, // 0.5 دولار لكل إحالة
  REFERRAL_PERCENTAGE: 10, // 10% من مشتريات المدعو
  
  DEFAULT_DELIVERY_TIME: '30 دقيقة - 2 ساعة',
  DEFAULT_WARRANTY: '30 يوم'
};

// ========== التخزين المؤقت ==========
let servicesCache = {
  data: null,
  timestamp: 0,
  lastFetch: null
};

// إحصائيات البوت
const botStats = {
  totalUsers: 0,
  bonusUsersCount: 0,
  totalReferrals: 0,
  totalOrders: 0,
  totalRevenue: 0
};

// تخزين المستخدمين والطلبات
const userSessions = {};
const userBalances = {};
const userOrders = {};
const userReferrals = {};
const userReferrers = {};

// قائمة أول 20 مستخدم
const firstUsers = [];

// ========== المعالج الرئيسي ==========
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname === '/webhook') {
      if (request.method === 'POST') {
        try {
          const update = await request.json();
          await handleUpdate(update);
          return new Response('OK', { status: 200 });
        } catch (error) {
          console.error('خطأ:', error);
          return new Response('Error', { status: 500 });
        }
      }
      return new Response('Method not allowed', { status: 405 });
    }
    
    if (url.pathname === '/') {
      return new Response(getHtmlPage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    
    if (url.pathname === '/api/stats') {
      return new Response(JSON.stringify({
        ...botStats,
        currency: CONFIG.CURRENCY,
        bonusAmount: CONFIG.BONUS_AMOUNT,
        maxBonusUsers: CONFIG.MAX_BONUS_USERS,
        remainingBonusSlots: Math.max(0, CONFIG.MAX_BONUS_USERS - botStats.bonusUsersCount)
      }, null, 2), {
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }
    
    if (url.pathname === '/api/services') {
      try {
        const data = await fetchServices();
        return new Response(JSON.stringify(data, null, 2), {
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
    }
    
    return new Response('Not found', { status: 404 });
  }
};

// ============================================
// الصفحة الرئيسية HTML
// ============================================
function getHtmlPage() {
  const remainingSlots = Math.max(0, CONFIG.MAX_BONUS_USERS - botStats.bonusUsersCount);
  
  return `
    <html>
      <head>
        <title>بوت SMM الاحترافي - مكافأة 1$</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Tajawal', 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 800px;
            width: 100%;
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
          }
          .header p {
            font-size: 1.2em;
            opacity: 0.9;
          }
          .bonus-badge {
            background: #ffd700;
            color: #333;
            padding: 15px 30px;
            border-radius: 50px;
            display: inline-block;
            margin-top: 20px;
            font-weight: bold;
            font-size: 1.3em;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
          }
          .stat-card {
            background: white;
            padding: 25px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s;
          }
          .stat-card:hover {
            transform: translateY(-5px);
          }
          .stat-icon {
            font-size: 2.5em;
            margin-bottom: 10px;
          }
          .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
          }
          .stat-label {
            color: #666;
            font-size: 0.9em;
          }
          .bonus-counter {
            background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 1.5em;
            font-weight: bold;
          }
          .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 30px;
          }
          .feature {
            text-align: center;
            padding: 20px;
          }
          .feature h3 {
            color: #333;
            margin-bottom: 10px;
          }
          .feature p {
            color: #666;
          }
          .cta-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 50px;
            font-size: 1.2em;
            cursor: pointer;
            margin: 30px auto;
            display: block;
            text-decoration: none;
            width: fit-content;
            transition: transform 0.3s;
          }
          .cta-button:hover {
            transform: scale(1.05);
          }
          .footer {
            background: #333;
            color: white;
            text-align: center;
            padding: 20px;
          }
          @media (max-width: 600px) {
            .header h1 { font-size: 1.8em; }
            .bonus-badge { font-size: 1.1em; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤖 بوت SMM الاحترافي</h1>
            <p>أقوى بوت لشراء خدمات التواصل الاجتماعي بالدولار</p>
            <div class="bonus-badge">
              🎁 مكافأة 1$ فورية لأول 20 مشترك!
            </div>
          </div>
          
          <div class="bonus-counter">
            ⭐ ${remainingSlots} فرصة متبقية من أصل ${CONFIG.MAX_BONUS_USERS} ⭐
          </div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">👥</div>
              <div class="stat-value">${botStats.totalUsers}</div>
              <div class="stat-label">إجمالي المستخدمين</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🎁</div>
              <div class="stat-value">${botStats.bonusUsersCount}</div>
              <div class="stat-label">حصلوا على المكافأة</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">💰</div>
              <div class="stat-value">${CONFIG.CURRENCY}${botStats.totalRevenue.toFixed(2)}</div>
              <div class="stat-label">إجمالي المشتريات</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🤝</div>
              <div class="stat-value">${botStats.totalReferrals}</div>
              <div class="stat-label">الإحالات</div>
            </div>
          </div>
          
          <div class="features">
            <div class="feature">
              <h3>🎁 مكافأة فورية</h3>
              <p>أول 20 مشترك يحصلون على 1$ فور الانضمام!</p>
            </div>
            <div class="feature">
              <h3>💰 نظام الإحالة</h3>
              <p>0.5$ عن كل صديق + 10% من مشترياته</p>
            </div>
            <div class="feature">
              <h3>💵 ربح 100%</h3>
              <p>ضعف سعر الشراء - أرباحك مضمونة</p>
            </div>
          </div>
          
          <a href="https://t.me/your_bot_username" class="cta-button">
            🚀 ابدأ الآن واستلم مكافأتك
          </a>
          
          <div class="footer">
            <p>© 2026 بوت SMM الاحترافي - جميع الحقوق محفوظة</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// ============================================
// معالجة تحديثات تيليجرام
// ============================================
async function handleUpdate(update) {
  // معالجة الرسائل النصية
  if (update.message) {
    const chatId = update.message.chat.id;
    const text = update.message.text || '';
    const userId = update.message.from.id;
    const username = update.message.from.username || 'مستخدم';
    const firstName = update.message.from.first_name || '';
    
    console.log(`📨 رسالة من ${chatId}: ${text}`);
    
    // التحقق من وجود مستخدم جديد
    const isNewUser = !userBalances[userId];
    
    if (isNewUser) {
      await registerNewUser(userId, chatId, username, firstName, text);
    }
    
    // معالجة الأوامر
    if (text === '/start' || text === '🏠 الرئيسية') {
      await showMainMenu(chatId, username, userId);
      return;
    }
    
    if (text === '📋 الخدمات' || text === '/services') {
      await showServices(chatId, 1);
      return;
    }
    
    if (text === '💰 رصيدي' || text === '/balance') {
      await showBalance(chatId, userId);
      return;
    }
    
    if (text === '📦 طلباتي' || text === '/orders') {
      await showOrders(chatId, userId);
      return;
    }
    
    if (text === '🤝 الإحالات' || text === '/referrals') {
      await showReferrals(chatId, userId);
      return;
    }
    
    if (text === '❓ مساعدة' || text === '/help') {
      await showHelp(chatId);
      return;
    }
    
    if (text === '❌ إلغاء' || text === '/cancel') {
      delete userSessions[userId];
      await sendMessage(chatId, '❌ تم إلغاء العملية', await getMainKeyboard());
      return;
    }
    
    if (text === '▶️ التالي') {
      if (userSessions[userId] && userSessions[userId].viewingServices) {
        await showServices(chatId, userSessions[userId].currentPage + 1);
      } else {
        await sendMessage(chatId, '❌ لا توجد صفحة تالية', await getMainKeyboard());
      }
      return;
    }
    
    if (text === '◀️ السابق') {
      if (userSessions[userId] && userSessions[userId].viewingServices && userSessions[userId].currentPage > 1) {
        await showServices(chatId, userSessions[userId].currentPage - 1);
      } else {
        await sendMessage(chatId, '❌ لا توجد صفحة سابقة', await getMainKeyboard());
      }
      return;
    }
    
    // معالجة اختيار الخدمة
    if (userSessions[userId] && userSessions[userId].step === 'selecting_service') {
      await handleServiceSelection(chatId, userId, text);
      return;
    }
    
    // معالجة إدخال الرابط
    if (userSessions[userId] && userSessions[userId].step === 'waiting_link') {
      await handleLinkInput(chatId, userId, text);
      return;
    }
    
    // معالجة إدخال الكمية
    if (userSessions[userId] && userSessions[userId].step === 'waiting_quantity') {
      await handleQuantityInput(chatId, userId, text);
      return;
    }
    
    // رسالة غير معروفة
    await sendMessage(chatId, '❌ أمر غير معروف', await getMainKeyboard());
  }
}

// ============================================
// تسجيل مستخدم جديد - مع إشعار المكافأة
// ============================================
async function registerNewUser(userId, chatId, username, firstName, startText) {
  // تحديث إحصائيات المستخدمين
  botStats.totalUsers++;
  
  // التحقق من رابط الإحالة
  let referrerId = null;
  if (startText.startsWith('/start ')) {
    const referralCode = startText.split(' ')[1];
    if (referralCode && userBalances[referralCode]) {
      referrerId = referralCode;
    }
  }
  
  // الرصيد الافتتاحي
  let initialBalance = 0;
  let hasBonus = false;
  
  // التحقق من كون المستخدم ضمن أول 20
  if (botStats.bonusUsersCount < CONFIG.MAX_BONUS_USERS) {
    initialBalance = CONFIG.BONUS_AMOUNT;
    botStats.bonusUsersCount++;
    firstUsers.push(userId);
    hasBonus = true;
    
    // تسجيل المكافأة
    console.log(`🎁 مكافأة 1$ للمستخدم ${userId} - رقم ${botStats.bonusUsersCount} في قائمة أول 20`);
  }
  
  userBalances[userId] = initialBalance;
  userOrders[userId] = [];
  userReferrals[userId] = { count: 0, earnings: 0 };
  
  // ===== إشعار المكافأة =====
  if (hasBonus) {
    await sendMessage(chatId,
      `🎉 *مبروك! أنت من أوائل المستخدمين!*\n\n` +
      `✨ *لقد حصلت على:*\n` +
      `┌─────────────────\n` +
      `│💰 مكافأة: *${CONFIG.CURRENCY}${CONFIG.BONUS_AMOUNT}*\n` +
      `│🎯 الترتيب: *${botStats.bonusUsersCount}* من أصل ${CONFIG.MAX_BONUS_USERS}\n` +
      `│⭐ الفرص المتبقية: *${CONFIG.MAX_BONUS_USERS - botStats.bonusUsersCount}*\n` +
      `└─────────────────\n\n` +
      `✅ تم إضافة المكافأة إلى رصيدك!\n` +
      `🔽 استخدم الأزرار أدناه للبدء`
    );
  } else {
    await sendMessage(chatId,
      `👋 *مرحباً بك في البوت!*\n\n` +
      `⚠️ *للأسف، انتهت المكافآت الخاصة بأول 20 مستخدم.*\n` +
      `💰 رصيدك الافتتاحي: *${CONFIG.CURRENCY}0*\n\n` +
      `💡 لكن لا تقلق! لا يزال بإمكانك الربح عبر نظام الإحالة:\n` +
      `• ${CONFIG.CURRENCY}0.5 عن كل صديق تدعوه\n` +
      `• 10% من مشتريات أصدقائك مدى الحياة\n\n` +
      `🔽 استخدم الأزرار أدناه لبدء الربح`
    );
  }
  
  // معالجة الإحالة
  if (referrerId) {
    userReferrers[userId] = referrerId;
    userReferrals[referrerId].count++;
    botStats.totalReferrals++;
    
    // إضافة مكافأة الإحالة
    userBalances[referrerId] += CONFIG.REFERRAL_BONUS;
    userReferrals[referrerId].earnings += CONFIG.REFERRAL_BONUS;
    
    // إرسال إشعار للمُحيل
    await sendMessage(referrerId, 
      `🎉 *مبروك! إحالة جديدة!*\n\n` +
      `قام المستخدم ${firstName || username} بالتسجيل عن طريق رابطك!\n` +
      `💰 تم إضافة ${CONFIG.CURRENCY}${CONFIG.REFERRAL_BONUS} إلى رصيدك`,
      await getMainKeyboard()
    );
  }
}

// ============================================
// الحصول على أزرار الكيبورد الرئيسية
// ============================================
async function getMainKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        ['📋 الخدمات', '💰 رصيدي'],
        ['📦 طلباتي', '🤝 الإحالات'],
        ['❓ مساعدة', '🏠 الرئيسية']
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
}

// ============================================
// عرض القائمة الرئيسية
// ============================================
async function showMainMenu(chatId, username, userId) {
  const isFirstUser = firstUsers.includes(userId);
  const remainingSlots = CONFIG.MAX_BONUS_USERS - botStats.bonusUsersCount;
  
  // الحصول على رابط الإحالة
  const botUsername = await getBotUsername();
  const referralLink = `https://t.me/${botUsername}?start=${userId}`;
  
  const welcomeText = 
    `👋 *مرحباً بعودتك يا ${username}!*\n\n` +
    `✨ *معلومات حسابك:*\n` +
    `┌─────────────────\n` +
    `│💰 الرصيد: *${CONFIG.CURRENCY}${userBalances[userId].toFixed(2)}*\n` +
    `│📊 عدد الطلبات: *${userOrders[userId].length}*\n` +
    `│🤝 الإحالات: *${userReferrals[userId].count}*\n` +
    `└─────────────────\n\n` +
    `${isFirstUser ? '⭐ *أنت من أوائل المستخدمين!* ⭐\n\n' : ''}` +
    `🎁 *المكافآت المتبقية:* ${remainingSlots} من أصل ${CONFIG.MAX_BONUS_USERS}\n\n` +
    `📌 *رابط الإحالة الخاص بك:*\n` +
    `\`${referralLink}\`\n\n` +
    `🔽 اختر من القائمة أدناه:`;
  
  await sendMessage(chatId, welcomeText, await getMainKeyboard());
}

// ============================================
// عرض الرصيد
// ============================================
async function showBalance(chatId, userId) {
  const balance = userBalances[userId];
  const orders = userOrders[userId] || [];
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const referrals = userReferrals[userId] || { count: 0, earnings: 0 };
  const isFirstUser = firstUsers.includes(userId);
  
  const balanceText = 
    `💰 *محفظتك المالية*\n\n` +
    `┌─────────────────\n` +
    `│💵 الرصيد الحالي: *${CONFIG.CURRENCY}${balance.toFixed(2)}*\n` +
    `│📊 إجمالي الطلبات: *${orders.length}*\n` +
    `│✅ المكتملة: *${completedOrders}*\n` +
    `│🤝 الإحالات: *${referrals.count}*\n` +
    `│💰 أرباح الإحالات: *${CONFIG.CURRENCY}${referrals.earnings.toFixed(2)}*\n` +
    `└─────────────────\n\n` +
    `${isFirstUser ? '⭐ أنت من أوائل المستخدمين!' : ''}`;
  
  await sendMessage(chatId, balanceText, await getMainKeyboard());
}

// ============================================
// عرض الإحالات
// ============================================
async function showReferrals(chatId, userId) {
  const referrals = userReferrals[userId] || { count: 0, earnings: 0 };
  const botUsername = await getBotUsername();
  const referralLink = `https://t.me/${botUsername}?start=${userId}`;
  
  const remainingSlots = CONFIG.MAX_BONUS_USERS - botStats.bonusUsersCount;
  
  const referralsText = 
    `🤝 *نظام الإحالة المربح*\n\n` +
    `*مكافآتك الحالية:*\n` +
    `┌─────────────────\n` +
    `│👥 عدد الإحالات: *${referrals.count}*\n` +
    `│💰 أرباح الإحالات: *${CONFIG.CURRENCY}${referrals.earnings.toFixed(2)}*\n` +
    `└─────────────────\n\n` +
    
    `*كيف يعمل النظام؟*\n` +
    `• تحصل على ${CONFIG.CURRENCY}0.5 فوراً لكل صديق يسجل\n` +
    `• تحصل على 10% من مشتريات كل صديق مدى الحياة\n` +
    `• أصدقاؤك يحصلون على مكافآتهم أيضاً!\n\n` +
    
    `*رابط الإحالة الخاص بك:*\n` +
    `\`${referralLink}\`\n\n` +
    
    `🎁 *المكافآت المتبقية:* ${remainingSlots} من أصل ${CONFIG.MAX_BONUS_USERS}\n\n` +
    `انسخ الرابط وأرسله لأصدقائك لبدء الربح!`;
  
  await sendMessage(chatId, referralsText, await getMainKeyboard());
}

// ============================================
// عرض الطلبات السابقة
// ============================================
async function showOrders(chatId, userId) {
  const orders = userOrders[userId] || [];
  
  if (orders.length === 0) {
    await sendMessage(chatId, '📭 *لا توجد طلبات سابقة*', await getMainKeyboard());
    return;
  }
  
  let ordersText = `📦 *طلباتك السابقة (آخر 5):*\n\n`;
  
  orders.slice(-5).reverse().forEach((order, index) => {
    const statusEmoji = order.status === 'completed' ? '✅' : '🔄';
    ordersText += 
      `${statusEmoji} *طلب #${order.id}*\n` +
      `   📋 ${order.serviceName.substring(0, 30)}\n` +
      `   📊 ${order.quantity} | 💰 ${CONFIG.CURRENCY}${order.amount}\n\n`;
  });
  
  await sendMessage(chatId, ordersText, await getMainKeyboard());
}

// ============================================
// عرض المساعدة
// ============================================
async function showHelp(chatId) {
  const remainingSlots = CONFIG.MAX_BONUS_USERS - botStats.bonusUsersCount;
  
  const helpText = 
    `📚 *دليل استخدام البوت*\n\n` +
    
    `*🎁 المكافآت:*\n` +
    `• أول 20 مشترك: ${CONFIG.CURRENCY}1 فوراً\n` +
    `• الفرص المتبقية: ${remainingSlots}\n\n` +
    
    `*🔹 الأزرار المتاحة:*\n` +
    `• 📋 الخدمات - عرض جميع الخدمات\n` +
    `• 💰 رصيدي - عرض رصيدك الحالي\n` +
    `• 📦 طلباتي - عرض طلباتك السابقة\n` +
    `• 🤝 الإحالات - نظام الإحالة وأرباحك\n` +
    `• ❓ مساعدة - عرض هذه المساعدة\n\n` +
    
    `*💡 طريقة الشراء:*\n` +
    `1️⃣ اضغط على 📋 الخدمات\n` +
    `2️⃣ اختر رقم الخدمة من القائمة\n` +
    `3️⃣ أرسل رابط حسابك\n` +
    `4️⃣ أرسل الكمية المطلوبة\n` +
    `5️⃣ أكد الطلب\n\n` +
    
    `*💰 نظام الربح:*\n` +
    `• ربح 100% على كل عملية\n` +
    `• مثال: خدمة تكلف 10 → تبيعها بـ 20\n\n` +
    
    `*🤝 نظام الإحالة:*\n` +
    `• ${CONFIG.CURRENCY}0.5 عن كل صديق يسجل\n` +
    `• 10% من مشتريات كل صديق مدى الحياة`;
  
  await sendMessage(chatId, helpText, await getMainKeyboard());
}

// ============================================
// عرض الخدمات
// ============================================
async function showServices(chatId, page = 1) {
  try {
    await sendMessage(chatId, '🔄 *جاري تحميل الخدمات...*');
    
    const services = await fetchServices();
    const totalServices = services.length;
    const totalPages = Math.ceil(totalServices / CONFIG.SERVICES_PER_PAGE);
    
    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;
    
    const startIndex = (page - 1) * CONFIG.SERVICES_PER_PAGE;
    const endIndex = Math.min(startIndex + CONFIG.SERVICES_PER_PAGE, totalServices);
    const pageServices = services.slice(startIndex, endIndex);
    
    let message = `📋 *الخدمات (صفحة ${page}/${totalPages})*\n\n`;
    
    // إنشاء أزرار الخدمات (كأرقام)
    const serviceButtons = [];
    let row = [];
    
    for (let i = 0; i < pageServices.length; i++) {
      const s = pageServices[i];
      const serviceNumber = startIndex + i + 1;
      const sellingPrice = (parseFloat(s.rate) * (1 + CONFIG.PROFIT_MARGIN)).toFixed(2);
      
      message += 
        `*${serviceNumber}.* ${s.name.substring(0, 35)}\n` +
        `   💰 ${CONFIG.CURRENCY}${sellingPrice} | 📊 ${s.min}-${s.max}\n\n`;
      
      // إضافة زر للخدمة
      row.push(`${serviceNumber}`);
      
      if (row.length === 3) {
        serviceButtons.push(row);
        row = [];
      }
    }
    
    if (row.length > 0) {
      serviceButtons.push(row);
    }
    
    await sendMessage(chatId, message);
    
    // إرسال أزرار الخدمات
    if (serviceButtons.length > 0) {
      await sendMessage(chatId, '🔢 *اختر رقم الخدمة:*', {
        reply_markup: {
          keyboard: [...serviceButtons, ['◀️ السابق', '🏠 الرئيسية', '▶️ التالي'], ['❌ إلغاء']],
          resize_keyboard: true,
          one_time_keyboard: false
        }
      });
    }
    
    const userId = chatId;
    userSessions[userId] = { 
      step: 'selecting_service',
      viewingServices: true,
      currentPage: page,
      totalPages: totalPages
    };
    
  } catch (error) {
    await sendMessage(chatId, `❌ خطأ: ${error.message}`, await getMainKeyboard());
  }
}

// ============================================
// معالجة اختيار الخدمة
// ============================================
async function handleServiceSelection(chatId, userId, text) {
  const choice = parseInt(text);
  
  if (isNaN(choice) || choice < 1) {
    await sendMessage(chatId, '❌ اختيار غير صحيح');
    return;
  }
  
  try {
    const services = await fetchServices();
    
    if (choice > services.length) {
      await sendMessage(chatId, `❌ أقصى رقم هو ${services.length}`);
      return;
    }
    
    const selectedService = services[choice - 1];
    const originalPrice = parseFloat(selectedService.rate);
    const sellingPrice = (originalPrice * (1 + CONFIG.PROFIT_MARGIN)).toFixed(2);
    
    userSessions[userId] = {
      serviceId: selectedService.service,
      serviceName: selectedService.name,
      originalPrice: originalPrice,
      sellingPrice: sellingPrice,
      min: selectedService.min,
      max: selectedService.max,
      step: 'waiting_link'
    };
    
    const serviceInfo = 
      `✅ *تم اختيار الخدمة*\n\n` +
      `📌 *الخدمة:* ${selectedService.name.substring(0, 50)}\n` +
      `💰 *السعر:* ${CONFIG.CURRENCY}${sellingPrice}\n` +
      `📊 *الحد:* ${selectedService.min} - ${selectedService.max}\n\n` +
      `🔗 *الآن أرسل رابط حسابك*`;
    
    await sendMessage(chatId, serviceInfo);
    
  } catch (error) {
    await sendMessage(chatId, `❌ خطأ: ${error.message}`, await getMainKeyboard());
    delete userSessions[userId];
  }
}

// ============================================
// معالجة إدخال الرابط
// ============================================
async function handleLinkInput(chatId, userId, text) {
  const link = text.trim();
  
  if (!link.startsWith('http://') && !link.startsWith('https://')) {
    await sendMessage(chatId, '❌ الرابط غير صالح (يجب أن يبدأ بـ http)');
    return;
  }
  
  userSessions[userId].link = link;
  userSessions[userId].step = 'waiting_quantity';
  
  await sendMessage(chatId,
    `📊 *أدخل الكمية المطلوبة*\n\n` +
    `الحد المسموح: ${userSessions[userId].min} - ${userSessions[userId].max}`
  );
}

// ============================================
// معالجة إدخال الكمية
// ============================================
async function handleQuantityInput(chatId, userId, text) {
  const quantity = parseInt(text);
  const session = userSessions[userId];
  
  if (isNaN(quantity) || quantity < session.min || quantity > session.max) {
    await sendMessage(chatId, `❌ الكمية غير صالحة (يجب أن تكون بين ${session.min} و ${session.max})`);
    return;
  }
  
  session.quantity = quantity;
  session.totalPrice = (session.sellingPrice * quantity).toFixed(2);
  session.step = 'confirm';
  
  const confirmText = 
    `✅ *تأكيد الطلب*\n\n` +
    `📋 الخدمة: ${session.serviceName.substring(0, 40)}\n` +
    `🔗 الرابط: ${session.link}\n` +
    `📊 الكمية: ${session.quantity}\n` +
    `💰 السعر: ${CONFIG.CURRENCY}${session.totalPrice}\n\n` +
    `✅ *للتأكيد أرسل:* تأكيد\n` +
    `❌ *للإلغاء أرسل:* إلغاء`;
  
  // أزرار التأكيد
  await sendMessage(chatId, confirmText, {
    reply_markup: {
      keyboard: [['✅ تأكيد', '❌ إلغاء'], ['🏠 الرئيسية']],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
}

// ============================================
// دوال مساعدة
// ============================================

async function sendMessage(chatId, text, options = {}) {
  const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_TOKEN}/sendMessage`;
  
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
    ...options
  };
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

async function getBotUsername() {
  // يمكنك إرجاع اسم البوت الخاص بك هنا
  return 'your_bot_username';
}

async function fetchServices() {
  const now = Date.now();
  
  if (servicesCache.data && (now - servicesCache.timestamp) < CONFIG.CACHE_DURATION) {
    return servicesCache.data;
  }
  
  const url = `${CONFIG.SMM_API_URL}?key=${CONFIG.SMM_API_KEY}&action=services`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    if (servicesCache.data) return servicesCache.data;
    throw new Error(`فشل الاتصال: ${response.status}`);
  }
  
  const data = await response.json();
  
  servicesCache.data = data;
  servicesCache.timestamp = now;
  
  return data;
}

async function placeOrder(serviceId, link, quantity) {
  const formData = new URLSearchParams();
  formData.append('key', CONFIG.SMM_API_KEY);
  formData.append('action', 'add');
  formData.append('service', serviceId);
  formData.append('link', link);
  formData.append('quantity', quantity);
  
  const response = await fetch(CONFIG.SMM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0'
    },
    body: formData
  });
  
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
}