import { config } from "../config.js";
import { hasPermission } from "../utils/permissions.js";
import { logAction } from "../utils/logger.js";

export async function handlePurge(message, args, member) {
    if (!message.server) {
        return await message.reply(config.messages.serverOnly);
    }

    if (!await hasPermission(member, "ManageMessages")) {
        return await message.reply(config.messages.noPermission);
    }

    const amount = parseInt(args[0]);

    if (isNaN(amount) || amount < 1 || amount > config.purge.maxMessages) {
        return await message.reply(`❌ Please provide a number between 1 and ${config.purge.maxMessages}.`);
    }

    try {
        const messages = await message.channel.fetchMessages({ limit: amount + 1 });
        let deleted = 0;
        for (const msg of messages) {
            if (msg.id !== message.id) {
                try {
                    await msg.delete();
                    deleted++;
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (e) {
                    console.error("Could not delete message:", e);
                }
            }
        }

        const successMsg = config.messages.purgeSuccess
            .replace("{count}", deleted);
        const response = await message.reply(successMsg);

        await logAction(
            message.server,
            "PURGE",
            message.author,
            message.channel,
            `Deleted ${deleted} messages`
        );

        setTimeout(async () => {
            try {
                await response.delete();
                await message.delete();
            } catch (e) {
                console.error("Could not delete purge messages:", e);
            }
        }, config.purge.deleteDelay);
    } catch (error) {
        console.error("Error purging messages:", error);
        await message.reply("❌ Failed to purge messages. Make sure I have the necessary permissions.");
    }
}

export async function handleSlowmode(message, args, member) {
    if (!message.server) {
        return await message.reply(config.messages.serverOnly);
    }

    if (!await hasPermission(member, "ManageChannels")) {
        return await message.reply(config.messages.noPermission);
    }

    const seconds = parseInt(args[0]);

    if (isNaN(seconds) || seconds < 0 || seconds > config.slowmode.maxDuration) {
        return await message.reply(`❌ Please provide a number between 0 and ${config.slowmode.maxDuration} seconds.`);
    }

    try {
        // Note: Revolt API might not support slowmode directly through revolt.js
        // This is a placeholder - you may need to use the REST API directly
        // or wait for revolt.js to add this feature

        await message.reply(
            `⚠️ Slowmode feature is currently not fully supported by revolt.js. ` +
            `You may need to set this manually in channel settings.\n` +
            `Requested slowmode: ${seconds === 0 ? 'disabled' : `${seconds} seconds`}`
        );

        await logAction(
            message.server,
            "SLOWMODE",
            message.author,
            message.channel,
            `${seconds} seconds`
        );
    } catch (error) {
        console.error("Error setting slowmode:", error);
        await message.reply("❌ Failed to set slowmode.");
    }
}

export async function handleLockdown(message, args, member) {
    if (!message.server) {
        return await message.reply(config.messages.serverOnly);
    }

    if (!await hasPermission(member, "ManageChannels")) {
        return await message.reply(config.messages.noPermission);
    }

    try {
        // Note: Lockdown functionality requires managing channel permissions
        // This is a placeholder implementation
        // You'll need to implement this based on your server's role structure

        await message.reply(
            `🔒 Channel lockdown feature requires custom implementation based on your server's role structure.\n` +
            `To implement lockdown:\n` +
            `1. Store the current channel permissions\n` +
            `2. Remove 'Send Messages' permission for @everyone role\n` +
            `3. Toggle back to restore permissions\n\n` +
            `This feature will be available in a future update when revolt.js adds better permission management.`
        );

        await logAction(
            message.server,
            "LOCKDOWN_ATTEMPT",
            message.author,
            message.channel,
            "Lockdown toggled (feature in development)"
        );
    } catch (error) {
        console.error("Error toggling lockdown:", error);
        await message.reply("❌ Failed to toggle lockdown.");
    }
}
