'use client'

import React, {useState} from "react";
import {LoginRequest} from "@/client";
import {AUTH_CLIENT, TOKEN_COOKIE_KEY} from "@/app/api/api";
import {navigateTo} from "@/app/actions";
import {Button, Input} from "@nextui-org/react";
import {EyeFilledIcon, EyeSlashFilledIcon} from "@nextui-org/shared-icons";
import {BUTTON_CLASS} from "@/app/util/css-classes";
import {setCookie} from "cookies-next";
import Link from "next/link";

export default function Login({leagueId}: {leagueId: string | undefined}) {

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isVisible, setIsVisible] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [didFail, setDidFail] = useState(false)

    const toggleVisibility = () => setIsVisible(!isVisible);

    const handleEvent: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
        e.preventDefault()

        const requestBody: LoginRequest = {
            email: email,
            password: password
        }

        setIsLoading(true)

        try {
            const response = await AUTH_CLIENT.authApi.login({loginRequest: requestBody})
            if (!response.idToken) {
                setDidFail(true)
                return
            }
            setCookie(TOKEN_COOKIE_KEY, response.idToken, {maxAge: 60 * 60 * 24 * 7})
            await navigateTo((leagueId !== undefined) ? `app/league/${leagueId}/join`: "app")
        } catch (error) {
            setIsLoading(false)
            setDidFail(true)
        }
    }

    const signUpLink = "/signup" + ((leagueId && `?leagueId=${leagueId}`) || "")

    return (
        <section>
            <div className="bg-gray-900 flex flex-col items-center justify-center px-6 py-8 mx-auto h-screen lg:py-0">
                <h1 className="text-white pb-20">
                    <Link href="/">PREDICTABALL.LIVE</Link>
                </h1>
                <div
                    className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
                    <div className="p-6 space-y-4 items-center justify-between md:space-y-6 sm:p-8">
                        <h1 className="text-xl text-center font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                            Sign in to your account
                        </h1>
                        <div>
                            <Input
                                onChange={(event) => {
                                    setDidFail(false)
                                    setEmail(event.target.value)
                                }}
                                type="email"
                                name="email"
                                id="email"
                                label="Email"
                                isInvalid={didFail}
                                style={{fontSize: "18px"}}
                            />
                        </div>
                        <div>
                            <Input
                                label="Password"
                                onChange={(event) => {
                                    setPassword(event.target.value)
                                    setDidFail(false)
                                }}
                                style={{fontSize: "18px"}}
                                endContent={
                                    <button className="focus:outline-none" type="button" onClick={toggleVisibility}>
                                        {isVisible ? (
                                            <EyeSlashFilledIcon
                                                className="text-2xl text-default-400 pointer-events-none"/>
                                        ) : (
                                            <EyeFilledIcon
                                                className="text-2xl text-default-400 pointer-events-none"/>
                                        )}
                                    </button>
                                }
                                type={isVisible ? "text" : "password"}
                                isInvalid={didFail}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <a href="/reset"
                               className="text-sm font-medium text-indigo-600 hover:underline">
                                Forgot password?
                            </a>
                        </div>
                        <Button
                            onClick={handleEvent}
                            isLoading={isLoading}
                            type="submit"
                            className={"w-full " + BUTTON_CLASS}>
                            Sign in
                        </Button>
                        <p className="text-center text-sm font-light text-gray-500">
                            Don't have an account yet? <a href={signUpLink}
                                                          className="font-medium hover:underline text-indigo-600">Sign
                            up</a>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
