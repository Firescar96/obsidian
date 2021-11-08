import { Bot, Context } from 'grammy';
import fs from 'fs'
import {workerData} from 'worker_threads';

const token = fs.readFileSync('token.secret').toString()
// Create bot object
const bot = new Bot(token); // <-- place your bot token inside this string

console.log('run reminder')
const chatId = workerData?.chatId;
bot.api.sendMessage(chatId, "are you still fat? How much did you eat yesterday?")
