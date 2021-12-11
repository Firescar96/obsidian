import { Bot, Context } from 'grammy';
import fs from 'fs'
import * as chrono from 'chrono-node';
import database, {JobOptions} from './databaseInterface';
import taskScheduler from './taskScheduler';

const token = fs.readFileSync('token.secret').toString()

// Create bot object
const bot = new Bot(token); // <-- place your bot token inside this string

taskScheduler.start()
const newUserSetup = async (ctx: Context) => {
    const chatId = ctx.chat.id;

    if(database.hasJob('fatReminder-'+chatId)) {
        await ctx.reply('I know you are a fatty, but you\'ve already registered.')
        return;
    }
    database.data.userState[chatId] = {
        flag: 'setTime1'
    };
    await ctx.reply('you made the right choice.')

    const job: JobOptions = {
        name: 'fatReminder-'+chatId,
        path: './jobs/fatReminder.mjs',
    }
    database.addJob(job)
    taskScheduler.add(job)
    
    await setReminderTime(ctx);
}

const setReminderTime = async (ctx: Context) => {
    const chatId = ctx.chat?.id;
    if(!chatId) return;

    await ctx.reply("Okay bitch, here's what you're going to do. You're going to give me two dates/times, one at a time. I'm going to use that to compute the pattern of how often to give you notifications.")
    await ctx.reply("Now give me the first date/time bitch.")
    
    database.data.userState[chatId] = {
        flag: 'setTime1'
    };
    await database.save()
}

const responseHandler = async (ctx: Context) => {
    const chatId = ctx.chat?.id;
    if(!chatId) return;

    switch(database.data.userState[chatId].flag) {
        case 'setTime1':
            ctx.reply("Good work. Now don't fuck this up, give me the second date/time.")

            database.data.userState[chatId] = {
                flag: 'setTime2',
                data: ctx.message.text
            };
            await database.save();

            break;
        case 'setTime2':
            const secondTime = new Date(chrono.parseDate(ctx.message.text).toISOString());

            const firstTime = new Date(chrono.parseDate(database.data.userState[chatId].data).toISOString());
            const timeDifference = secondTime.getTime() - firstTime.getTime()
            console.log('date portions', firstTime, secondTime)
           
            if(!firstTime || !secondTime) {
                ctx.reply("No comprendo, gordo. Try again. From the beginning, what's the first date/time?")
                database.data.userState[chatId] = {
                    flag: 'setTime1'
                };
                await database.save();
                return;
            }

            Object.assign(database.data.userState[chatId], {
                flag: 'standby',
                nextNotification: firstTime.getTime(),
                notificationInterval: timeDifference,
            })
            await database.save()

            ctx.reply(`Okay, I'll tell you what you need to hear. First time ${firstTime.toLocaleString} repeating with ${secondTime.toLocaleString()}. Of course times are in my timezone.`)
            break;
        default:
            ctx.reply("I can't understand you with a mouth full of food.")
    }
}

const removeUser = async (ctx: Context) => {
    const chatId = ctx.chat?.id;
    if(!chatId) return;
    console.log('chatId', chatId)
    database.removeJob('fatReminder-'+chatId)
    database.removeJob('fatInsulter-'+chatId)
}

// Listen for messages
bot.command("start", (ctx: Context) => ctx.reply("Hello, reply with /fattyfatty to get started."));
bot.command('fattyfatty', newUserSetup)
bot.command('reminderTime', setReminderTime)
bot.command('stop', removeUser)
bot.hears('remind me', newUserSetup)
bot.on("message:text", responseHandler);
// Launch!
bot.start();