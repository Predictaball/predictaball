'use client'

import React, {useState} from "react";
import {LoginRequest} from "@/client";
import {AUTH_CLIENT, TOKEN_COOKIE_KEY, REFRESH_TOKEN_COOKIE_KEY} from "@/app/api/api";
import {navigateTo} from "@/app/actions";
import {Button, Input} from "@nextui-org/react";
import {EyeFilledIcon, EyeSlashFilledIcon} from "@nextui-org/shared-icons";
import {AUTH_INPUT_CLASS_NAMES, BUTTON_CLASS} from "@/app/util/css-classes";
import {setCookie} from "cookies-next";
import AuthShell from "@/app/components/auth-shell";

export default function Login({callbackUrl, leagueId}: {callbackUrl: string | undefined, leagueId: string | undefined}) {

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isVisible, setIsVisible] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [didFail, setDidFail] = useState(false)
    const [didSucceed, setDidSucceed] = useState(false)

    const toggleVisibility = () => setIsVisible(!isVisible);

    const handleEvent = async () => {

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
            setCookie(TOKEN_COOKIE_KEY, response.idToken, {maxAge: 60 * 60 * 24})
            if (response.refreshToken) {
                setCookie(REFRESH_TOKEN_COOKIE_KEY, response.refreshToken, {maxAge: 60 * 60 * 24 * 30})
            }
            setDidSucceed(true)
            await navigateTo(callbackUrl ?? (leagueId ? `app/league/${leagueId}/join` : "app"))
        } catch (error) {
            setIsLoading(false)
            setDidFail(true)
        }
    }

    const signUpLink = "/signup" + ((leagueId && `?leagueId=${leagueId}`) || "")

    return (
        <AuthShell title="Sign in to your account">
            <div className="space-y-5">
                <Input
                    onChange={(event) => {
                        setDidFail(false)
                        setEmail(event.target.value)
                    }}
                    type="email"
                    name="email"
                    id="email"
                    label="Email"
                    variant="bordered"
                    isInvalid={didFail && !didSucceed}
                    classNames={AUTH_INPUT_CLASS_NAMES}
                    style={{fontSize: "18px"}}
                />
                <Input
                    label="Password"
                    variant="bordered"
                    onChange={(event) => {
                        setPassword(event.target.value)
                        setDidFail(false)
                    }}
                    style={{fontSize: "18px"}}
                    classNames={AUTH_INPUT_CLASS_NAMES}
                    endContent={
                        <button className="focus:outline-none" type="button" onClick={toggleVisibility}>
                            {isVisible ? (
                                <EyeSlashFilledIcon className="text-2xl text-gray-400 pointer-events-none"/>
                            ) : (
                                <EyeFilledIcon className="text-2xl text-gray-400 pointer-events-none"/>
                            )}
                        </button>
                    }
                    type={isVisible ? "text" : "password"}
                    isInvalid={didFail && !didSucceed}
                />
                <div className="flex items-center justify-end">
                    <a href="/reset" className="text-sm font-medium text-cyan-300 hover:text-cyan-200 hover:underline">
                        Forgot password?
                    </a>
                </div>
                <Button
                    onPress={handleEvent}
                    isLoading={isLoading}
                    type="submit"
                    className={"w-full " + BUTTON_CLASS}>
                    Sign in
                </Button>
                <p className="text-center text-sm text-gray-400">
                    Don&apos;t have an account yet?{" "}
                    <a href={signUpLink} className="font-semibold text-cyan-300 hover:text-cyan-200 hover:underline">
                        Sign up
                    </a>
                </p>
            </div>
        </AuthShell>
    );
}
