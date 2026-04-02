import { isAdmin } from "@/app/auth/jtw-handler";
import SignOutButton from "@/app/components/sign-out-button";
import LiveMatches from "@/app/components/ticket/live-matches";
import { BUTTON_CLASS } from "@/app/util/css-classes";
import { Button } from "@nextui-org/react";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";
import { Toaster } from "react-hot-toast";

const Admin = async () => {
    const isUserAdmin = await isAdmin()
    if (!isUserAdmin) redirect("/app")

    return (
        <main className="flex min-h-screen flex-col items-center justify-between bg-gray-900">
            <Toaster position="top-center"/>
            <div className="absolute right-4 top-3">
                <Link href="/"><SignOutButton/></Link>
            </div>
            <p className="text-xl font-bold mt-4 text-white">PREDICTABALL</p>
            <div className="max-w-3xl absolute text-center pt-40">
                <LiveMatches admin/>
                <Link href="/app"><Button size="sm" className={"mt-10 " + BUTTON_CLASS}>Back to App</Button></Link>
            </div>
        </main>
    )
}

export default Admin