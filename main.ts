import { Bot, Context } from 'grammy';
import fs from 'fs'
import later from 'later';
import Bree from 'bree';

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
        userState: {[key: number]: string}
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

    save() {
        fs.writeFileSync(this.filePath, JSON.stringify(this.data))
    }
}
const database = new BasicDatabase('database.json');

// Create bot object
const bot = new Bot(token); // <-- place your bot token inside this string

const bree = new Bree({
    root: false,
    jobs: Object.values(database.data.jobs)
});


bree.start();

const newUserSetup = async (ctx: Context) => {
    if(!ctx.chat) return;
    const chatId = ctx.chat.id;

    if(database.hasJob('fatReminder-'+chatId)) {
        await ctx.reply('I know you are a fatty, but you\'ve already registered.')
        return;
    }
    database.data.userState[chatId] = 'setTime';
    await ctx.reply('you made the right choice.')
    await ctx.reply('give me an interval like "every hour" or "mondays at 4pm" and I will remind you how fat you are.')

    const job: JobOptions = {
        name: 'fatReminder-'+chatId,
        path: './jobs/fatReminder.mjs',
        interval: later.parse.text('every day at 8am'),
        worker: {
            workerData: {
                chatId
            }
        }
    }
    database.addJob(job)
    bree.add(job)
    bree.start('fatReminder-'+chatId)
}

const responseHandler = async (ctx: Context) => {
    if(!ctx.chat) return;
    const chatId = ctx.chat.id;
    switch(database.data.userState[chatId]) {
        case 'setTime':
            if(!ctx.message?.text)return;
            const timeInterval:string = ctx.message.text;

            if(database.hasJob('fatInsulter-'+chatId)) return;

            const job: JobOptions = {
                name: 'fatInsulter-'+chatId,
                path: './jobs/fatInsulter.mjs',
                interval: later.parse.text(ctx.message.text),
                worker: {
                    workerData: {
                        chatId
                    }
                }
            }
            database.addJob(job)
            bree.add(job)
            bree.start('fatInsulter-'+chatId)
            database.data.userState[chatId] = 'standby';

            ctx.reply(`Okay, I'll tell you what you need to hear: ${ctx.message.text}`)
            break;
        default:
            ctx.reply("I can't understand you with a mouth full of food.")
    }
}

// Listen for messages
bot.command("start", (ctx: Context) => ctx.reply("Hello, reply with /fattyfatty to get started."));
bot.command('fattyfatty', newUserSetup)
bot.hears('remind me', newUserSetup)
bot.on("message:text", responseHandler);
// Launch!
bot.start();