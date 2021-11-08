import { Bot, Context } from 'grammy';
import fs from 'fs'
import {workerData, MessageChannel} from 'worker_threads';
import sourceMaterial from '../sourceMaterial.mjs'
import gpt3Interface from '../gpt3Interface.mjs';


const token = fs.readFileSync('token.secret').toString()

const prompts = [...sourceMaterial.fixed]
let sourceIndex = Math.floor(Math.random() * sourceMaterial.variable.length);
for(let i = 0; i < 5; i++) {
  prompts.push(sourceMaterial.variable[sourceIndex])
  sourceIndex = (sourceIndex+1) % sourceMaterial.variable.length;
}

const result = await gpt3Interface.axiosProxy({
  method: 'post',
  data: {
    prompt: prompts.join('\n'),
    max_tokens: 33,
    temperature: .7,
    top_p: .85,
    frequency_penalty: 1.21,
    presence_penalty: .61,
    best_of: 2,
  }
})
const chosenInsult = result.data.choices[0].text.split('\n')[1];
// Create bot object
const bot = new Bot(token); // <-- place your bot token inside this string

const chatId = workerData?.chatId;
bot.api.sendMessage(chatId, chosenInsult)