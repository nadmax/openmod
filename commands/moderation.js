import { config } from "../config.js";
import { hasPermission } from "../utils/permissions.js";
import { logAction } from "../utils/logger.js";

export async function handleKick(message, args, member) {
    if (!message.server) {
        return await message.reply(config.messages.serverOnly);
    }

    if (!await hasPermission(member, "KickMembers")) {
        return await message.reply(config.messages.noPermission);
    }

    const mentions = message.mentions;
    if (!mentions || mentions.length === 0) {
        return await message.reply("❌ Please mention a user to kick.");
    }

    const targetUser = mentions[0];
    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
        await message.server.kickMember(targetUser.id);
        await logAction(message.server, "KICK", message.author, targetUser, reason);

        const successMsg = config.messages.kickSuccess
            .replace("{user}", targetUser.username);
        await message.reply(`${successMsg} Reason: ${reason}`);

        if (config.moderation.dmOnKick) {
            try {
                const dmChannel = await targetUser.openDM();
                const dmMsg = config.messages.dmKick
                    .replace("{server}", message.server.name)
                    .replace("{reason}", reason);
                await dmChannel.sendMessage(dmMsg);
            } catch (e) {
                console.log("Could not DM user about kick");
            }
        }
    } catch (error) {
        console.error("Error kicking user:", error);
        await message.reply("❌ Failed to kick user. Make sure I have the necessary permissions and the user is kickable.");
    }
}

export async function handleBan(message, args, member) {
    if (!message.server) {
        return await message.reply(config.messages.serverOnly);
    }

    if (!await hasPermission(member, "BanMembers")) {
        return await message.reply(config.messages.noPermission);
    }

    const mentions = message.mentions;
    if (!mentions || mentions.length === 0) {
        return await message.reply("❌ Please mention a user to ban.");
    }

    const targetUser = mentions[0];
    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
        if (config.moderation.dmOnBan) {
            try {
                const dmChannel = await targetUser.openDM();
                const dmMsg = config.messages.dmBan
                    .replace("{server}", message.server.name)
                    .replace("{reason}", reason);
                await dmChannel.sendMessage(dmMsg);
            } catch (e) {
                console.log("Could not DM user about ban");
            }
        }

        await message.server.banUser(targetUser.id, { reason });
        await logAction(message.server, "BAN", message.author, targetUser, reason);

        const successMsg = config.messages.banSuccess
            .replace("{user}", targetUser.username);
        await message.reply(`${successMsg} Reason: ${reason}`);
    } catch (error) {
        console.error("Error banning user:", error);
        await message.reply("❌ Failed to ban user. Make sure I have the necessary permissions.");
    }
}

export async function handleUnban(message, args, member) {
    if (!message.server) {
        return await message.reply(config.messages.serverOnly);
    }

    if (!await hasPermission(member, "BanMembers")) {
        return await message.reply(config.messages.noPermission);
    }

    const userId = args[0];
    if (!userId) {
        return await message.reply("❌ Please provide a user ID to unban.");
    }

    try {
        await message.server.unbanUser(userId);
        await message.reply(config.messages.unbanSuccess + ` User ID: ${userId}`);
    } catch (error) {
        console.error("Error unbanning user:", error);
        await message.reply("❌ Failed to unban user. Make sure the user is banned and I have the necessary permissions.");
    }
}
