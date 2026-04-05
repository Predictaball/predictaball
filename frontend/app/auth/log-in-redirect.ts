import {isLoggedIn} from "@/app/auth/jwt-handler";
import {redirect} from "next/navigation";

export async function redirectIfLoggedOut(currentPath?: string) {
    const loggedIn = await isLoggedIn()
    if (!loggedIn) {
        const callbackUrl = currentPath ? `?callbackUrl=${encodeURIComponent(currentPath)}` : ""
        redirect(`/login${callbackUrl}`)
    }
}
