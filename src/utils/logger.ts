import { config } from "../config.js";

export async function logAction(
    server: any,
    action: string,
    moderator: any,
    target: any,
    reason?: string
): Promise<void> {
    if (!config.moderation.logActions) {
        return;
    }

    try {
        const targetName =
            target.username || target.name || target.id || "Unknown";

        const targetId = target.id || "Unknown";

        const logMessage =
            `**[${action}]** ${targetName} (${targetId})\n` +
            `**Moderator:** ${moderator.username} (${moderator.id})\n` +
            `**Reason:** ${reason ?? "No reason provided"}\n` +
            `**Time:** ${new Date().toUTCString()}`;

        console.log(
            `[MODLOG] ${action}: ${targetName} by ${moderator.username} - ${reason}`
        );

        if (config.moderation.logChannelName && server.channels) {
            try {
                const logChannel = server.channels.find(
                    (ch: any) =>
                        ch.name === config.moderation.logChannelName
                );

                if (logChannel) {
                    await logChannel.sendMessage(logMessage);
                }
            } catch (e) {
                console.error("Could not send to log channel:", e);
            }
        }
    } catch (error: unknown) {
        console.error(
            "Error logging action:",
            error instanceof Error ? error.message : String(error)
        );
    }
}

export function logInfo(message: string): void {
    console.log(`[INFO] ${message}`);
}

export function logWarning(message: string): void {
    console.warn(`[WARNING] ${message}`);
}

export function logError(message: string, error?: unknown): void {
    console.error(`[ERROR] ${message}`);

    if (error !== undefined) {
        if (error instanceof Error) {
            console.error(error.stack ?? error.message);
        } else {
            console.error(error);
        }
    }
}
