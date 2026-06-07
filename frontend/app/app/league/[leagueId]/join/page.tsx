import { redirect } from "next/navigation"

// Legacy path. The canonical join URL is now /league/<id>/join (public, supports
// link previews and unauthenticated visitors). Anyone still hitting this path
// gets bounced to the public one — middleware would have already verified the
// session, which is fine: the public page joins-and-redirects for logged-in users.
export default async function Home({params}: {params: Promise<{leagueId: string}>}) {
    const { leagueId } = await params
    redirect(`/league/${leagueId}/join`)
}
