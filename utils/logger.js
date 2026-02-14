import { config } from "../config.js";

export async function logAction(server, action, moderator, target, reason) {
    if (!config.moderation.logActions) {
        return;
    }

    try {
        const targetName = target.username || target.name || target.id || "Unknown";
        const targetId = target.id || "Unknown";
        const logMessage = `**[${action}]** ${targetName} (${targetId})\n` +
            `**Moderator:** ${moderator.username} (${moderator.id})\n` +
            `**Reason:** ${reason || "No reason provided"}\n` +
            `**Time:** ${new Date().toUTCString()}`;

        console.log(`[MODLOG] ${action}: ${targetName} by ${moderator.username} - ${reason}`);

        if (config.moderation.logChannelName && server.channels) {
            try {
                const logChannel = server.channels.find(
                    ch => ch.name === config.moderation.logChannelName
                );

                if (logChannel) {
                    await logChannel.sendMessage(logMessage);
                }
            } catch (e) {
                console.error("Could not send to log channel:", e);
            }
        }
    } catch (error) {
        console.error("Error logging action:", error);
    }
}

export function logInfo(message) {
    console.log(`[INFO] ${message}`);
}

export function logWarning(message) {
    console.warn(`[WARNING] ${message}`);
}

export function logError(message, error = null) {
    console.error(`[ERROR] ${message}`);
    if (error) {
        console.error(error);
    }
}
