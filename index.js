import { Client } from "revolt.js";
import { config } from "./config.js";
import { handleCommand } from "./commands/index.js";
import { AntiSpam, AutoMod } from "./automod.js";
import {
    warnings,
    mutedUsers,
    saveWarnings,
    saveMutedUsers,
    saveReactionRoles
} from "./utils/storage.js";
import { handleReactionAdd, handleReactionRemove } from "./utils/roles.js";

const client = new Client();
const autoMod = new AutoMod({
    antiSpam: config.antiSpam,
    bannedWords: config.badWords.words,
    enabled: config.autoMod.enabled,
    exemptRoles: config.autoMod.exemptRoles
});

client.on("ready", async () => {
    console.info(`✅ Logged in as ${client.user.username}!`);
    console.info(`🤖 Bot ID: ${client.user.id}`);
    console.info(`📝 Command prefix: ${config.prefix}`);
    console.info(`🔧 Ready to moderate!`);

    // Log enabled features
    const enabledFeatures = Object.entries(config.features)
        .filter(([_, enabled]) => enabled)
        .map(([feature]) => feature);
    console.info(`✨ Enabled features: ${enabledFeatures.join(", ")}`);
});

client.on("messageCreate", async (message) => {
    try {
        if (message.author?.bot) return;
        if (!message.content) return;

        if (message.content.startsWith(config.prefix)) {
            await handleCommand(message, client);
            return;
        }
    } catch (error) {
        console.error("Error handling message:", error);
        try {
            await message.reply(config.messages.error);
        } catch (e) {
            console.error("Could not send error message:", e);
        }
    }
});

client.on("messageCreate", async (message) => {
    try {
        if (message.author?.bot) return;
        if (!message.server) return;
        if (!config.autoMod.enabled) return;

        const muteData = mutedUsers.get(message.author.id);
        if (muteData && muteData.serverId === message.server.id) {
            if (Date.now() < muteData.until) {
                try {
                    await message.delete();

                    const lastNotified = muteData.lastNotified || 0;
                    if (Date.now() - lastNotified > 60000) {
                        const timeLeft = muteData.until - Date.now();
                        const minutesLeft = Math.ceil(timeLeft / 1000 / 60);
                        const warning = await message.channel.sendMessage(
                            `🔇 ${message.author.username}, you are muted for ${minutesLeft} more minute(s).`
                        );
                        muteData.lastNotified = Date.now();

                        setTimeout(() => warning.delete().catch(() => { }), 5000);
                    }
                } catch (e) {
                    console.error("Could not delete muted user's message:", e);
                }
            } else {
                mutedUsers.delete(message.author.id);
                saveMutedUsers();
            }
            return;
        }

        const result = await autoMod.processMessage(message, client);

        if (result.action === "spam_detected") {
            try {
                await message.delete();

                const warning = await message.channel.sendMessage(
                    `⚠️ ${message.author.username}, please slow down! (${result.reason})`
                );

                setTimeout(() => warning.delete().catch(() => { }), 5000);

                if (config.antiSpam.muteOnSpam) {
                    const duration = config.antiSpam.muteDuration;
                    const match = duration.match(/^(\d+)([mhd])$/);
                    if (match) {
                        const amount = parseInt(match[1]);
                        const unit = match[2];
                        let milliseconds = 0;

                        switch (unit) {
                            case 'm': milliseconds = amount * 60 * 1000; break;
                            case 'h': milliseconds = amount * 60 * 60 * 1000; break;
                            case 'd': milliseconds = amount * 24 * 60 * 60 * 1000; break;
                        }

                        const until = Date.now() + milliseconds;
                        mutedUsers.set(message.author.id, {
                            until,
                            serverId: message.server.id
                        });
                        saveMutedUsers();

                        setTimeout(() => {
                            mutedUsers.delete(message.author.id);
                            saveMutedUsers();
                        }, milliseconds);

                        await message.channel.sendMessage(
                            `🔇 ${message.author.username} has been automatically muted for ${duration} due to spam.`
                        );
                    }
                }
            } catch (e) {
                console.error("Error handling spam:", e);
            }
        } else if (result.action === "bad_word_detected") {
            try {
                await message.delete();

                const warning = await message.channel.sendMessage(
                    `⚠️ ${message.author.username}, your message was removed (inappropriate content).`
                );

                setTimeout(() => warning.delete().catch(() => { }), 5000);
            } catch (e) {
                console.error("Error handling bad word:", e);
            }
        }
    } catch (error) {
        console.error("Error in auto-moderation:", error);
    }
});

client.on("error", (error) => {
    console.error("Client error:", error);
});

client.on("messageReact", async (message, userId, emoji) => {
    try {
        await handleReactionAdd(message, userId, emoji);
    } catch (error) {
        console.error("Error handling reaction add:", error);
    }
});

client.on("messageUnreact", async (message, userId, emoji) => {
    try {
        await handleReactionRemove(message, userId, emoji);
    } catch (error) {
        console.error("Error handling reaction remove:", error);
    }
});

process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down bot...");
    saveWarnings();
    saveMutedUsers();
    saveReactionRoles();
    process.exit(0);
});

process.on("SIGTERM", () => {
    console.log("\n🛑 Shutting down bot...");
    saveWarnings();
    saveMutedUsers();
    saveReactionRoles();
    process.exit(0);
});

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
    console.error("❌ BOT_TOKEN not found in environment variables!");
    console.error("Please set BOT_TOKEN in your .env file");
    process.exit(1);
}

console.log("🚀 Starting bot...");
client.loginBot(BOT_TOKEN).catch((error) => {
    console.error("❌ Failed to login:", error);
    process.exit(1);
});

export { client, autoMod };
