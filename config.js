export const config = {
    prefix: process.env.PREFIX || "!",

    antiSpam: {
        enabled: true,
        spamThreshold: 5,
        spamTimeWindow: 5000,
        duplicateThreshold: 3,
        muteOnSpam: true,
        muteDuration: "10m"
    },

    badWords: {
        enabled: true,
        words: [
        ],
        action: "delete"
    },

    moderation: {
        maxWarnings: 3,
        maxWarningsAction: "mute",
        maxWarningsMuteDuration: "1h",

        logActions: true,
        logChannelName: "mod-logs",

        dmOnWarn: true,
        dmOnMute: true,
        dmOnKick: true,
        dmOnBan: true
    },

    autoMod: {
        enabled: true,
        exemptRoles: [
        ]
    },

    rateLimiting: {
        enabled: true,
        defaultLimit: 5,
        defaultWindow: 10000
    },

    purge: {
        maxMessages: 100,
        deleteDelay: 5000
    },

    slowmode: {
        maxDuration: 21600
    },

    mute: {
        formats: ["s", "m", "h", "d"],
        maxDuration: "7d"
    },

    features: {
        antiSpam: true,
        badWordFilter: true,
        autoMod: true,
        rateLimiting: true,
        warnings: true,
        mute: true,
        kick: true,
        ban: true,
        purge: true,
        slowmode: true,
        lockdown: true
    },

    messages: {
        noPermission: "❌ You don't have permission to use this command.",
        serverOnly: "❌ This command can only be used in a server.",
        invalidArgs: "❌ Invalid arguments. Use `{prefix}help` for usage information.",
        error: "❌ An error occurred while executing the command.",
        rateLimited: "⏱️ You're doing that too fast! Try again in {time} seconds.",

        kickSuccess: "✅ Successfully kicked {user}.",
        banSuccess: "✅ Successfully banned {user}.",
        unbanSuccess: "✅ Successfully unbanned user.",
        warnSuccess: "✅ Warned {user}. They now have {count} warning(s).",
        muteSuccess: "✅ Muted {user} for {duration}.",
        unmuteSuccess: "✅ Unmuted {user}.",
        purgeSuccess: "✅ Deleted {count} message(s).",

        dmWarn: "⚠️ You have been warned in **{server}**.\nReason: {reason}\nTotal warnings: {count}",
        dmMute: "🔇 You have been muted in **{server}** for {duration}.\nReason: {reason}",
        dmKick: "👋 You have been kicked from **{server}**.\nReason: {reason}",
        dmBan: "🔨 You have been banned from **{server}**.\nReason: {reason}"
    },

    colors: {
        success: "#00ff00",
        error: "#ff0000",
        warning: "#ffaa00",
        info: "#00aaff"
    }
};

export default config;
