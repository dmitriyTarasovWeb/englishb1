const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');


const token = '7905320284:AAFIieVCn68ELMF3XXLt-6p1Se58VRtV5DA';


const bot = new TelegramBot(token, { polling: true });


const readDataFile = (level) => {
  const filePath = `./data/data${level}.json`; 
  try {
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading the file:', error);
    return [];
  }
};


const userState = {};


bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;


  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'A1', callback_data: 'A1' }, { text: 'A2', callback_data: 'A2' }],
        [{ text: 'B1', callback_data: 'B1' }, { text: 'B2', callback_data: 'B2' }],
        [{ text: 'C1', callback_data: 'C1' }, { text: 'C2', callback_data: 'C2' }],
      ],
    },
  };

  bot.sendMessage(chatId, 'Привет! Какой уровень английских слов вы хотите изучать?', options);
});


bot.on('callback_query', (callbackQuery) => {

 


  const chatId = callbackQuery.message.chat.id;
  const level = callbackQuery.data;

 
  if(level !== "true" && level !== "false"){

    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    if (!validLevels.includes(level)) {
        return;
    }


    const words = readDataFile(level);
    if (words.length === 0) {
        bot.sendMessage(chatId, `У нас нет данных для уровня ${level}. Попробуйте другой.`);
        return;
    }


    userState[chatId] = {
        level: level,
        words: words,
        isEnglish: null,
        shownWords: [], 
        messageId: null, 
    };

  }
  

  if(level === "true") userState[chatId].isEnglish = true
  if(level === "false") userState[chatId].isEnglish = false
  

  if(userState[chatId].isEnglish === null){

    const options = {
        reply_markup: {
        inline_keyboard: [
            [{ text: 'C английского на русский', callback_data: 'true' }],
            [{ text: 'C русского на английский', callback_data: 'false' }]
        ],
        },
    };

    bot.sendMessage(chatId, 'Как хотите учить слова?', options);

    return
  }

  sendNextWord(chatId);
});


const sendNextWord = (chatId) => {
  const user = userState[chatId];
  if (!user) return;

  const remainingWords = user.words.filter(word => !user.shownWords.includes(word));

  if (remainingWords.length === 0) {
    bot.sendMessage(chatId, 'Вы изучили все слова для этого уровня!');
    return;
  }


  const randomWordIndex = Math.floor(Math.random() * remainingWords.length);
  const wordData = remainingWords[randomWordIndex];
  const word = Object.keys(wordData)[0];
  const translation = wordData[word].translation; 
  const href = wordData[word].link;


  user.shownWords.push(wordData);


  let message = `<b>${word}</b> (${user.level})\n<tg-spoiler>${translation}</tg-spoiler>\n<tg-spoiler>${href}</tg-spoiler>`;
  
  if(user.isEnglish === false) message = `<b>${translation}</b> (${user.level})\n<tg-spoiler>${word}</tg-spoiler>\n<tg-spoiler>${href}</tg-spoiler>`;

  

  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Следующее слово', callback_data: 'next' }],
      ],
    },
    parse_mode: "HTML",
    disable_web_page_preview: true
  };


    bot.sendMessage(chatId, message, options).then((sentMessage) => {
      user.messageId = sentMessage.message_id; 
    });
  
};


bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (data === 'next') {

    const user = userState[chatId];
    if (!user || !user.level) {
      bot.sendMessage(chatId, 'Пожалуйста, выберите уровень сначала.');
      return;
    }

    sendNextWord(chatId);
  }
});
