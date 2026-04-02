import {TOKEN_COOKIE_KEY} from "@/app/api/api";
import {redirect} from "next/navigation";
import {getCookie} from "cookies-next";

export function redirectIfTokenExists(): void {
    if (getCookie(TOKEN_COOKIE_KEY)) {
        redirect("/app")
    }
}