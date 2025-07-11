const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
const { MessageFlags } = require('discord.js');
const locale = require("./util/Locale");
const MusicChannel = require('./music/MusicChannel');
require("dotenv").config();

const client = new Client({ intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();
MusicChannel.setclient(client);

const commandFiles = fs.readdirSync(path.join(__dirname, "commands")).filter(f => f.endsWith('js'));
for (const file of commandFiles) {
    const command = require(path.join(__dirname, "commands", file));
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[경고] ${filePath} 명령어가 제대로 설정되지 않았습니다.`);
    }
}

client.once(Events.ClientReady, readyClient => {
    console.log(`[자석이] ${readyClient.user.tag}, 온라인!`);
})

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
            console.error(`${interaction.commandName} 명령어가 존재하지 않으나, 실행이 시도되었습니다.`);
            return interaction.reply({content: await locale.getLanguage(lang, "error_no_such_command") ?? "I don’t recognize that command. Could you try again?", flags: MessageFlags.Ephemeral});
        }

        try {
            await command.execute(interaction);
        } catch (err) {
            let errorMessage = await locale.getLanguage(interaction.locale, "error_while_command") ?? "😵 Oops! Something went wrong while running the command.";
            console.error("명령어 실행 중 에러가 발생했습니다 : " + err);
            if (interaction.replied || interaction.deferred) 
                await interaction.followUp({content: errorMessage, flags: MessageFlags.Ephemeral})
            else
                await interaction.reply({content: errorMessage, flags: MessageFlags.Ephemeral})
        }
    } else if (interaction.isButton()) {
        const command = interaction.client.commands.get(interaction.customId);
        if (command) 
            try {
                await command.execute(interaction);
                setTimeout(async () => {
                    try {
                        const reply = await interaction.fetchReply();
                        await reply.delete();
                    } catch (err) {
                        console.error("메시지 삭제 실패:", err);
                    }
                }, 10000);
            } catch (err) {
                let errorMessage = await locale.getLanguage(interaction.locale, "error_while_command") ?? "😵 Oops! Something went wrong while running the command.";
                console.error("명령어 실행 중 에러가 발생했습니다 : " + err);
                if (interaction.replied || interaction.deferred) 
                    await interaction.followUp({content: errorMessage, flags: MessageFlags.Ephemeral})
                else
                    await interaction.reply({content: errorMessage, flags: MessageFlags.Ephemeral})
            }
    }
})

client.login(process.env.DISCORD_BOT_TOKEN);