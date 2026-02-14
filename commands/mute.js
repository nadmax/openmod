import { config } from "../config.js";
import { hasPermission } from "../utils/permissions.js";
import { logAction } from "../utils/logger.js";
import { mutedUsers, saveMutedUsers } from "../utils/storage.js";

export async function handleMute(message, args, member, silent = false) {
    if (!message.server) {
        return await message.reply(config.messages.serverOnly);
    }

    if (!await hasPermission(member, "KickMembers")) {
        return await message.reply(config.messages.noPermission);
    }

    const mentions = message.mentions;
    if (!mentions || mentions.length === 0) {
        return await message.reply("❌ Please mention a user to mute.");
    }

    const targetUser = mentions[0];
    const duration = args[1];
    const reason = args.slice(2).join(" ") || "No reason provided";

    if (!duration) {
        return await message.reply("❌ Please provide a duration (e.g., 10m, 1h, 1d).");
    }

    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
        return await message.reply("❌ Invalid duration format. Use: 30s, 10m, 1h, or 1d");
    }

    const amount = parseInt(match[1]);
    const unit = match[2];
    let milliseconds = 0;

    const multipliers = {
        's': 1000,
        'm': 60 * 1000,
        'h': 60 * 60 * 1000,
        'd': 24 * 60 * 60 * 1000
    };

    if (!multipliers[unit]) {
        return await message.reply("❌ Invalid time unit. Use: s, m, h, or d");
    }

    milliseconds = amount * multipliers[unit];

    const maxDurationMatch = config.mute.maxDuration.match(/^(\d+)([smhd])$/);
    if (maxDurationMatch) {
        const maxMs = parseInt(maxDurationMatch[1]) * multipliers[maxDurationMatch[2]];
        if (milliseconds > maxMs) {
            return await message.reply(`❌ Maximum mute duration is ${config.mute.maxDuration}.`);
        }
    }

    const until = Date.now() + milliseconds;

    mutedUsers.set(targetUser.id, {
        until,
        serverId: message.server.id,
        reason
    });

    saveMutedUsers();

    await logAction(message.server, "MUTE", message.author, targetUser, `${duration} - ${reason}`);

    if (!silent) {
        const successMsg = config.messages.muteSuccess
            .replace("{user}", targetUser.username)
            .replace("{duration}", duration);
        await message.reply(`${successMsg} Reason: ${reason}`);
    }

    setTimeout(() => {
        mutedUsers.delete(targetUser.id);
        saveMutedUsers();
        console.log(`Auto-unmuted ${targetUser.username}`);
    }, milliseconds);

    if (config.moderation.dmOnMute) {
        try {
            const dmChannel = await targetUser.openDM();
            const dmMsg = config.messages.dmMute
                .replace("{server}", message.server.name)
                .replace("{duration}", duration)
                .replace("{reason}", reason);
            await dmChannel.sendMessage(dmMsg);
        } catch (e) {
            console.log("Could not DM user about mute");
        }
    }
}

export async function handleUnmute(message, args, member) {
    if (!message.server) {
        return await message.reply(config.messages.serverOnly);
    }

    if (!await hasPermission(member, "KickMembers")) {
        return await message.reply(config.messages.noPermission);
    }

    const mentions = message.mentions;
    if (!mentions || mentions.length === 0) {
        return await message.reply("❌ Please mention a user to unmute.");
    }

    const targetUser = mentions[0];
    if (!mutedUsers.has(targetUser.id)) {
        return await message.reply(`${targetUser.username} is not muted.`);
    }

    mutedUsers.delete(targetUser.id);
    saveMutedUsers();

    const successMsg = config.messages.unmuteSuccess
        .replace("{user}", targetUser.username);
    await message.reply(successMsg);

    await logAction(message.server, "UNMUTE", message.author, targetUser, "Manual unmute");
}
