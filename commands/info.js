import { warnings, mutedUsers } from "../utils/storage.js";

export async function handleInfo(message, args) {
    const mentions = message.mentions;
    const targetUser = mentions && mentions.length > 0 ? mentions[0] : message.author;

    let infoText = `**👤 User Information**\n\n` +
        `**Username:** ${targetUser.username}\n` +
        `**User ID:** ${targetUser.id}\n` +
        `**Bot:** ${targetUser.bot ? "Yes" : "No"}\n`;

    if (message.server) {
        try {
            const member = await message.server.fetchMember(targetUser.id);
            if (member) {
                infoText += `**Server Nickname:** ${member.nickname || "None"}\n`;

                if (member.joinedAt) {
                    infoText += `**Joined Server:** ${new Date(member.joinedAt).toUTCString()}\n`;
                }

                if (member.roles && member.roles.length > 0) {
                    infoText += `**Roles:** ${member.roles.length}\n`;
                }
            }
        } catch (e) {
            console.error("Could not fetch member info:", e);
        }
    }

    const userWarnings = warnings.get(targetUser.id) || [];
    infoText += `**Warnings:** ${userWarnings.length}\n`;

    if (mutedUsers.has(targetUser.id)) {
        const muteData = mutedUsers.get(targetUser.id);
        const timeLeft = muteData.until - Date.now();
        const minutesLeft = Math.ceil(timeLeft / 1000 / 60);
        infoText += `**Muted:** Yes (${minutesLeft} minutes remaining)\n`;
        if (muteData.reason) {
            infoText += `**Mute Reason:** ${muteData.reason}\n`;
        }
    } else {
        infoText += `**Muted:** No\n`;
    }

    await message.reply(infoText);
}

export async function handleServerInfo(message) {
    if (!message.server) {
        return await message.reply("❌ This command can only be used in a server.");
    }

    const server = message.server;

    let infoText = `**Server Information**\n\n` +
        `**Name:** ${server.name}\n` +
        `**Server ID:** ${server.id}\n` +
        `**Owner:** <@${server.owner}>\n`;

    if (server.description) {
        infoText += `**Description:** ${server.description}\n`;
    }

    try {
        const memberCount = server.memberCount || "Unknown";
        infoText += `**Members:** ${memberCount}\n`;

        const channelCount = server.channels?.length || 0;
        infoText += `**Channels:** ${channelCount}\n`;

        const roleCount = server.roles ? Object.keys(server.roles).length : 0;
        infoText += `**Roles:** ${roleCount}\n`;

        if (server.flags) {
            infoText += `**Flags:** ${server.flags}\n`;
        }

        if (server.nsfw !== undefined) {
            infoText += `**NSFW:** ${server.nsfw ? "Yes" : "No"}\n`;
        }

        if (server.analytics !== undefined) {
            infoText += `**Analytics:** ${server.analytics ? "Enabled" : "Disabled"}\n`;
        }
    } catch (e) {
        console.error("Error fetching server stats:", e);
    }

    await message.reply(infoText);
}
