const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');

// Initialize Discord client
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

// Put your bot token directly here (replace with your actual token)
const BOT_TOKEN = 'MTM4MDQ4MTk5Mzc3MDI3MDcyMA.GGGZ0B.Wz7B0VLETU2bjw0ahksEy8bE_11S_w-WEa43I4';

// File to store birthdays
const BIRTHDAY_FILE = path.join(__dirname, 'birthdays.json');

// Birthday data
let birthdays = {};

// Load birthdays from file
function loadBirthdays() {
    try {
        if (fs.existsSync(BIRTHDAY_FILE)) {
            birthdays = JSON.parse(fs.readFileSync(BIRTHDAY_FILE));
            console.log(`Loaded ${Object.keys(birthdays).length} birthdays`);
        }
    } catch (err) {
        console.error('Error loading birthdays:', err);
    }
}

// Save birthdays to file
function saveBirthdays() {
    fs.writeFileSync(BIRTHDAY_FILE, JSON.stringify(birthdays, null, 2));
}

// Check for birthdays daily at 9AM
schedule.scheduleJob('0 9 * * *', () => {
    const today = new Date();
    const todayStr = `${today.getMonth() + 1}/${today.getDate()}`;
    
    Object.entries(birthdays).forEach(([userId, data]) => {
        if (data.date === todayStr) {
            const channel = client.channels.cache.get(data.channelId);
            if (channel) {
                const ageText = data.age ? `They're turning ${data.age + 1}!` : "Let's celebrate!";
                
                const embed = new EmbedBuilder()
                    .setColor('#FF69B4')
                    .setTitle('🎉 Happy Birthday! 🎉')
                    .setDescription(`Everyone wish <@${userId}> a happy birthday!`)
                    .addFields({ name: 'Age', value: ageText })
                    .setImage('https://media.giphy.com/media/3o85xkXpyQHQxQxqGc/giphy.gif')
                    .setFooter({ text: 'Birthday Bot 🎂' });
                
                channel.send({ 
                    content: `🎂 **HAPPY BIRTHDAY** <@${userId}>! 🎂`,
                    embeds: [embed] 
                });
                
                if (data.age !== undefined) {
                    birthdays[userId].age += 1;
                    saveBirthdays();
                }
            }
        }
    });
});

// Bot commands
client.on('messageCreate', message => {
    if (message.author.bot) return;
    
    if (message.content.startsWith('!setbirthday')) {
        const args = message.content.split(' ');
        if (args.length < 2) {
            return message.reply('Usage: !setbirthday MM/DD [age]');
        }
        
        const [month, day] = args[1].split('/').map(Number);
        if (isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
            return message.reply('Invalid date! Use MM/DD format (e.g., 12/25)');
        }
        
        const age = args[2] ? parseInt(args[2]) : null;
        
        birthdays[message.author.id] = {
            date: `${month}/${day}`,
            guildId: message.guild.id,
            channelId: message.channel.id,
            age: age
        };
        
        saveBirthdays();
        message.reply(`Your birthday (${month}/${day}) has been saved! ${age ? `You're currently ${age}.` : ''}`);
    }
    
    if (message.content === '!mybirthday') {
        const bday = birthdays[message.author.id];
        message.reply(bday 
            ? `Your birthday is set to ${bday.date}${bday.age ? ` and you're ${bday.age} years old` : ''}`
            : "You haven't set a birthday! Use !setbirthday MM/DD"
        );
    }
});

// Start the bot
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    loadBirthdays();
    client.user.setActivity('for birthdays!', { type: ActivityType.Watching });
});

client.login(BOT_TOKEN).catch(err => {
    console.error('Login failed:', err);
    console.log('Please check:');
    console.log('1. Your bot token is correct');
    console.log('2. All required intents are enabled at https://discord.com/developers');
    console.log('3. The bot has been invited to your server with proper permissions');
});