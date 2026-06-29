import {User} from "@/client";

export function generateHistoryPageLinkForUser(user: Pick<User, "userId">) {
    return `/app/user/${user.userId}/history`
}