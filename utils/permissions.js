export async function hasPermission(member, permission) {
    try {
        if (!member || !member.server) return false;
        if (member.server.owner.id === member.user.id) return true;

        const permissions = member.permissions;
        if (!permissions) return false;

        return permissions.has(permission);
    } catch (error) {
        console.error("Error checking permissions:", error);
        return false;
    }
}

export async function hasAnyPermission(member, permissionList) {
    for (const permission of permissionList) {
        if (await hasPermission(member, permission)) {
            return true;
        }
    }

    return false;
}

export async function hasAllPermissions(member, permissionList) {
    for (const permission of permissionList) {
        if (!await hasPermission(member, permission)) {
            return false;
        }
    }

    return true;
}
