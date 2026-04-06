import {redirect} from "next/navigation";

export default async function Home() {
    redirect("/app/league/global/leaderboard")
}
