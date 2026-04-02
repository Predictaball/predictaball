import {User} from "@/client";

export function generateHistoryPageLinkForUser(user: User) {
    return `/app/user/${user.userId}/history`
}