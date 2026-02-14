import fs from "fs";
import path from "path";

interface MuteData {
    until: number;
    reason?: string;
    moderatorId?: string;
}

const DATA_DIR = "./data";
const WARNINGS_FILE = path.join(DATA_DIR, "warnings.json");
const MUTES_FILE = path.join(DATA_DIR, "mutes.json");
const REACTION_ROLES_FILE = path.join(DATA_DIR, "roles.json");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const warnings = new Map();
export const mutedUsers = new Map();
export const reactionRoleMessages = new Map();

export function loadWarnings() {
    try {
        if (fs.existsSync(WARNINGS_FILE)) {
            const data = JSON.parse(fs.readFileSync(WARNINGS_FILE, "utf8"));
            warnings.clear();
            for (const [userId, userWarnings] of Object.entries(data)) {
                warnings.set(userId, userWarnings);
            }

            console.log(`✅ Loaded ${warnings.size} users with warnings`);
        }
    } catch (error) {
        console.error("Error loading warnings:", error);
    }
}

export function loadMutedUsers(): void {
    try {
        if (fs.existsSync(MUTES_FILE)) {
            const data = JSON.parse(
                fs.readFileSync(MUTES_FILE, "utf8")
            ) as Record<string, MuteData>;

            mutedUsers.clear();

            const now = Date.now();
            let activeCount = 0;

            for (const [userId, muteData] of Object.entries(data)) {
                if (muteData.until > now) {
                    mutedUsers.set(userId, muteData);
                    activeCount++;

                    const timeLeft = muteData.until - now;

                    setTimeout(() => {
                        mutedUsers.delete(userId);
                        saveMutedUsers();
                        console.log(`Auto-unmuted user ${userId}`);
                    }, timeLeft);
                }
            }

            console.log(`✅ Loaded ${activeCount} active mutes`);
        }
    } catch (error: unknown) {
        console.error(
            "Error loading muted users:",
            error instanceof Error ? error.message : String(error)
        );
    }
}

export function loadReactionRoles() {
    try {
        if (fs.existsSync(REACTION_ROLES_FILE)) {
            const data = JSON.parse(fs.readFileSync(REACTION_ROLES_FILE, "utf8"));
            reactionRoleMessages.clear();

            for (const [messageId, config] of Object.entries(data)) {
                reactionRoleMessages.set(messageId, config);
            }
            console.log(`✅ Loaded ${reactionRoleMessages.size} reaction role message(s)`);
        }
    } catch (error) {
        console.error("Error loading reaction roles:", error);
    }
}

export function saveReactionRoles() {
    try {
        const data = Object.fromEntries(reactionRoleMessages);
        fs.writeFileSync(REACTION_ROLES_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error saving reaction roles:", error);
    }
}

export function saveWarnings() {
    try {
        const data = Object.fromEntries(warnings);
        fs.writeFileSync(WARNINGS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error saving warnings:", error);
    }
}

export function saveMutedUsers() {
    try {
        const data = Object.fromEntries(mutedUsers);
        fs.writeFileSync(MUTES_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error saving muted users:", error);
    }
}

loadWarnings();
loadMutedUsers();
loadReactionRoles();

setInterval(() => {
    saveWarnings();
    saveMutedUsers();
    saveReactionRoles();
}, 5 * 60 * 1000);
