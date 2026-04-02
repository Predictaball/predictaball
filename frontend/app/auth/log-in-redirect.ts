import {isLoggedIn} from "@/app/auth/jtw-handler";
import {redirect} from "next/navigation";

export async function redirectIfLoggedOut() {
    const loggedIn = await isLoggedIn()
    if (!loggedIn) {
        redirect("/login")
    }
}