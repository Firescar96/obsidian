import { Bot, Context } from 'grammy';
import fs from 'fs'
import later from '@breejs/later';
import Bree from 'bree';
import * as chrono from 'chrono-node';

const token = fs.readFileSync('token.secret').toString()

interface JobOptions {
    name: string,
    path: string,
    interval: later.ScheduleData
    worker: object
}

interface BasicDatabase {
    filePath: string,
    data: {
        jobs: {[key: string]: JobOptions},
        userState: {[key: number]: {[flag: string]: string}}
    }
}

class BasicDatabase implements BasicDatabase {
    constructor(filePath:string) {
        this.filePath = filePath;
        const rawData = fs.readFileSync(this.filePath).toString();
        if(rawData) {
            this.data = JSON.parse(rawData) 
        } else {
            this.data = {jobs: {}, userState: {}}
            this.save();
        }
    }

    hasJob(name:string) {
        return !!this.data.jobs[name];
    }

    addJob(job: JobOptions) {
        this.data.jobs[job.name] = job;
        this.save();
    }

    removeJob(jobName: string) {
        delete this.data.jobs[jobName];
        this.save();
    }

    save() {
        fs.writeFileSync(this.filePath, JSON.stringify(this.data))
    }
}
const database = new BasicDatabase('database.json');


// Create bot object
const bot = new Bot(token); // <-- place your bot token inside this string

const bree = new Bree({
    root: false,
    jobs: Object.values(database.data.jobs),
});


bree.start();

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
        interval: later.parse.text('8:00'),
        worker: {
            workerData: {
                chatId
            }
        }
    }
    database.addJob(job)
    bree.add(job)
    bree.start('fatReminder-'+chatId)
    
    await setReminderTime(ctx);
}

const setReminderTime = async (ctx: Context) => {
    const chatId = ctx.chat.id;
    await ctx.reply("Okay bitch, here's what you're going to do. You're going to give me two dates/times, one at a time. I'm going to use that to compute the pattern of how often to give you notifications.")
    await ctx.reply("Now give me the first date/time bitch.")
    
    database.data.userState[chatId] = {
        flag: 'setTime1'
    };
    await database.save()
}

const responseHandler = async (ctx: Context) => {
    const chatId = ctx.chat.id;

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
            const secondTime = chrono.parseDate(ctx.message.text).toISOString();

            const firstTime = chrono.parseDate(database.data.userState[chatId].data).toISOString();
            const interval = later.schedule(later.parse.recur().on(firstTime, secondTime).second())
            if(!interval.isValid()) {
                ctx.reply("No comprendo, gordo. Try again. From the beginning, what's the first date/time?")
                database.data.userState[chatId] = {
                    flag: 'setTime1'
                };
                await database.save();
                return;
            }

            console.log('interval', interval.isValid(), interval.next())
            return;
            if(database.hasJob('fatInsulter-'+chatId)) {
                database.removeJob('fatInsulter-'+chatId);
                await bree.remove('fatInsulter-'+chatId)
            };

            const job: JobOptions = {
                name: 'fatInsulter-'+chatId,
                path: './jobs/fatInsulter.mjs',
                interval,
                worker: {
                    workerData: {
                        chatId
                    }
                }
            }
            database.addJob(job)
            bree.add(job)
            bree.start('fatInsulter-'+chatId)
            database.data.userState[chatId] = {flag: 'standby'};
            await database.save()

            ctx.reply(`Okay, I'll tell you what you need to hear. You've scheduled me for ${later.schedule(interval).next(1)}.`)
            break;
        default:
            ctx.reply("I can't understand you with a mouth full of food.")
    }
}

const removeUser = async (ctx: Context) => {
    const chatId = ctx.chat.id;
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