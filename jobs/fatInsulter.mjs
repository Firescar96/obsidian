import { Bot, Context } from 'grammy';
import fs from 'fs'
import later from 'later';
import Bree from 'bree';
import {workerData} from 'worker_threads';
import sourceMaterial from './sourceMaterial.js'

const token = fs.readFileSync('token.secret').toString()
// Create bot object
const bot = new Bot(token); // <-- place your bot token inside this string


const chatId = workerData?.chatId;
const chosenInsult = sourceMaterial[Math.floor(Math.random() * sourceMaterial.length)];
bot.api.sendMessage(chatId, chosenInsult)