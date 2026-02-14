import { config } from "../config.js";
import { hasPermission } from "../utils/permissions.js";
import { logAction } from "../utils/logger.js";
import { warnings, saveWarnings } from "../utils/storage.js";
import { handleMute } from "./mute.js";

export async function handleWarn(message, args, member) {
    if (!message.server) {
        return await message.reply(config.messages.serverOnly);
    }

    if (!await hasPermission(member, "KickMembers")) {
        return await message.reply(config.messages.noPermission);
    }

    const mentions = message.mentions;
    if (!mentions || mentions.length === 0) {
        return await message.reply("❌ Please mention a user to warn.");
    }

    const targetUser = mentions[0];
    const reason = args.slice(1).join(" ");
    if (!reason) {
        return await message.reply("❌ Please provide a reason for the warning.");
    }

    if (!warnings.has(targetUser.id)) {
        warnings.set(targetUser.id, []);
    }

    const userWarnings = warnings.get(targetUser.id);
    userWarnings.push({
        reason,
        moderator: message.author.username,
        timestamp: Date.now(),
        serverId: message.server.id
    });

    saveWarnings();

    await logAction(message.server, "WARN", message.author, targetUser, reason);

    const successMsg = config.messages.warnSuccess
        .replace("{user}", targetUser.username)
        .replace("{count}", userWarnings.length);
    await message.reply(`${successMsg}\nReason: ${reason}`);

    if (config.moderation.dmOnWarn) {
        try {
            const dmChannel = await targetUser.openDM();
            const dmMsg = config.messages.dmWarn
                .replace("{server}", message.server.name)
                .replace("{reason}", reason)
                .replace("{count}", userWarnings.length);
            await dmChannel.sendMessage(dmMsg);
        } catch (e) {
            console.log("Could not DM user about warning");
        }
    }

    if (config.moderation.maxWarnings > 0 && userWarnings.length >= config.moderation.maxWarnings) {
        const action = config.moderation.maxWarningsAction;

        if (action === "mute") {
            const duration = config.moderation.maxWarningsMuteDuration;
            await message.channel.sendMessage(
                `⚠️ ${targetUser.username} has reached ${config.moderation.maxWarnings} warnings and will be automatically muted for ${duration}.`
            );

            const muteArgs = [targetUser.mention, duration, "Maximum warnings reached"];
            await handleMute(message, muteArgs, member, true);
        } else if (action === "kick") {
            try {
                await message.server.kickMember(targetUser.id);
                await message.channel.sendMessage(
                    `⚠️ ${targetUser.username} has been automatically kicked for reaching ${config.moderation.maxWarnings} warnings.`
                );
            } catch (e) {
                console.error("Failed to auto-kick user:", e);
            }
        } else if (action === "ban") {
            try {
                await message.server.banUser(targetUser.id, {
                    reason: `Maximum warnings reached (${config.moderation.maxWarnings})`
                });
                await message.channel.sendMessage(
                    `⚠️ ${targetUser.username} has been automatically banned for reaching ${config.moderation.maxWarnings} warnings.`
                );
            } catch (e) {
                console.error("Failed to auto-ban user:", e);
            }
        }
    }
}

export async function handleWarnings(message, args) {
    const mentions = message.mentions;
    const targetUser = mentions && mentions.length > 0 ? mentions[0] : message.author;

    const userWarnings = warnings.get(targetUser.id) || [];

    if (userWarnings.length === 0) {
        return await message.reply(`${targetUser.username} has no warnings.`);
    }

    let warningText = `**⚠️ Warnings for ${targetUser.username}** (${userWarnings.length} total)\n\n`;

    userWarnings.forEach((warn, index) => {
        const date = new Date(warn.timestamp).toUTCString();
        warningText += `**${index + 1}.** ${warn.reason}\n` +
            `   Moderator: ${warn.moderator} | Date: ${date}\n\n`;
    });

    if (warningText.length > 2000) {
        const chunks = warningText.match(/[\s\S]{1,1900}/g) || [];
        for (const chunk of chunks) {
            await message.reply(chunk);
        }
    } else {
        await message.reply(warningText);
    }
}

export async function handleClearWarnings(message, args, member) {
    if (!message.server) {
        return await message.reply(config.messages.serverOnly);
    }

    if (!await hasPermission(member, "KickMembers")) {
        return await message.reply(config.messages.noPermission);
    }

    const mentions = message.mentions;
    if (!mentions || mentions.length === 0) {
        return await message.reply("❌ Please mention a user to clear warnings for.");
    }

    const targetUser = mentions[0];
    const clearedCount = (warnings.get(targetUser.id) || []).length;
    warnings.delete(targetUser.id);
    saveWarnings();

    await message.reply(`✅ Cleared ${clearedCount} warning(s) for ${targetUser.username}.`);
}
