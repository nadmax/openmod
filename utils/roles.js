import { reactionRoleMessages, saveReactionRoles } from "./storage.js";
import { logAction, logInfo, logError } from "./logger.js";

export const emojiRoleMap = new Map([
    ["🌹", "01KHC8XC2M75GGCA5B0MTB9MSY"],
    ["🟣", "01KHCEHE0P4S2ZTHDMQYGDH3NA"],
    ["🔵", "01KHCEH7J27BDZ30H78SPCQN09"],
    ["📘", "01KHCEGY9C8YSAPZZKGC9H8C4P"],
    ["🟢", "01KHCEKEKX9K4MPYS4W9QFCD63"],
    ["🟡", "01KHCEKKSFV9Q949GMEHNQEZ9Y"],
    ["🟠", "01KHCEQGJ6CZM1M9PPYMMSQ0K0"],
    ["🟤", "01KHCEM0T986MG4FF8BBNCP1CZ"],
    ["🔴", "01KHCEKSG2MM9A128M4JN62V01"],
]);

export const revoltEmojiMap = new Map([
    ["rose", "01KHC8XC2M75GGCA5B0MTB9MSY"],
    ["purple_circle", "01KHCEHE0P4S2ZTHDMQYGDH3NA"],
    ["large_blue_circle", "01KHCEH7J27BDZ30H78SPCQN09"],
    ["blue_book", "01KHCEGY9C8YSAPZZKGC9H8C4P"],
    ["green_circle", "01KHCEKEKX9K4MPYS4W9QFCD63"],
    ["yellow_circle", "01KHCEKKSFV9Q949GMEHNQEZ9Y"],
    ["orange_circle", "01KHCEQGJ6CZM1M9PPYMMSQ0K0"],
    ["brown_circle", "01KHCEM0T986MG4FF8BBNCP1CZ"],
    ["red_circle", "01KHCEKSG2MM9A128M4JN62V01"],
]);

export function getRoleForEmoji(emoji) {
    if (emojiRoleMap.has(emoji)) {
        return emojiRoleMap.get(emoji);
    }

    if (revoltEmojiMap.has(emoji)) {
        return revoltEmojiMap.get(emoji);
    }

    return null;
}

export function getRoleNameForEmoji(emoji) {
    const roleNames = {
        "🌹": "Rose",
        "🟣": "Violet",
        "🔵": "Bleu foncé",
        "📘": "Bleu clair",
        "🟢": "Vert",
        "🟡": "Jaune",
        "🟠": "Orange",
        "🟤": "Marron",
        "🔴": "Rouge",
    };

    return roleNames[emoji] || "Unknown Role";
}

export async function handleReactionAdd(message, userId, emoji) {
    try {
        const messageConfig = reactionRoleMessages.get(message.id);
        if (!messageConfig) {
            return;
        }

        if (!message.server || message.server.id !== messageConfig.serverId) {
            return;
        }

        const roleId = getRoleForEmoji(emoji);
        if (!roleId) {
            logInfo(`Emoji ${emoji} not configured for reaction roles`);
            return;
        }

        const member = await message.server.fetchMember(userId);
        if (!member) {
            logError(`Could not fetch member ${userId}`);
            return;
        }

        if (member.roles && member.roles.includes(roleId)) {
            logInfo(`User ${member.user.username} already has role ${roleId}`);
            return;
        }

        const currentRoles = member.roles || [];
        const newRoles = [...currentRoles, roleId];

        await member.edit({ roles: newRoles });

        const roleName = getRoleNameForEmoji(emoji);
        logInfo(`Added role ${roleName} to ${member.user.username}`);

        if (messageConfig.notifyUsers) {
            try {
                const dmChannel = await member.user.openDM();
                await dmChannel.sendMessage(
                    `✅ You have been assigned the **${roleName}** role in ${message.server.name}!`
                );
            } catch (e) {
                logInfo(`Could not DM user ${member.user.username} about role assignment`);
            }
        }

    } catch (error) {
        logError("Error handling reaction add:", error);
    }
}

export async function handleReactionRemove(message, userId, emoji) {
    try {
        const messageConfig = reactionRoleMessages.get(message.id);
        if (!messageConfig) {
            return;
        }

        if (!message.server || message.server.id !== messageConfig.serverId) {
            return;
        }

        const roleId = getRoleForEmoji(emoji);
        if (!roleId) {
            return;
        }

        const member = await message.server.fetchMember(userId);
        if (!member) {
            logError(`Could not fetch member ${userId}`);
            return;
        }

        if (!member.roles || !member.roles.includes(roleId)) {
            logInfo(`User ${member.user.username} doesn't have role ${roleId}`);
            return;
        }

        const newRoles = member.roles.filter(r => r !== roleId);

        await member.edit({ roles: newRoles });

        const roleName = getRoleNameForEmoji(emoji);
        logInfo(`Removed role ${roleName} from ${member.user.username}`);

        if (messageConfig.notifyUsers) {
            try {
                const dmChannel = await member.user.openDM();
                await dmChannel.sendMessage(
                    `❌ The **${roleName}** role has been removed in ${message.server.name}.`
                );
            } catch (e) {
                logInfo(`Could not DM user ${member.user.username} about role removal`);
            }
        }

    } catch (error) {
        logError("Error handling reaction remove:", error);
    }
}

export function isReactionRoleMessage(messageId) {
    return reactionRoleMessages.has(messageId);
}

export function addReactionRoleMessage(messageId, serverId, options = {}) {
    reactionRoleMessages.set(messageId, {
        serverId,
        notifyUsers: options.notifyUsers !== false,
        createdAt: Date.now()
    });
    saveReactionRoles();
}

export function removeReactionRoleMessage(messageId) {
    const deleted = reactionRoleMessages.delete(messageId);
    if (deleted) {
        saveReactionRoles();
    }

    return deleted;
}

export function getAllReactionRoleMessages() {
    return Array.from(reactionRoleMessages.entries());
}
