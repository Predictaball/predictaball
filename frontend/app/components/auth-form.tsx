'use client'

import React, {useState} from "react"
import {Button, Input} from "@nextui-org/react"
import {EyeFilledIcon, EyeSlashFilledIcon} from "@nextui-org/shared-icons"
import {setCookie} from "cookies-next"
import {LoginRequest, SignupRequest} from "@/client"
import {AUTH_CLIENT, REFRESH_TOKEN_COOKIE_KEY, TOKEN_COOKIE_KEY} from "@/app/api/api"
import {navigateTo} from "@/app/actions"
import {AUTH_INPUT_CLASS_NAMES, BUTTON_CLASS} from "@/app/util/css-classes"
import {doesContainDigit, doesContainLowerCase} from "@/app/util/regex"

const EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

type Mode = "email" | "login" | "signup"

interface AuthFormProps {
    callbackUrl?: string
    leagueId?: string
}

function PasswordRule({ok, label}: {ok: boolean; label: string}) {
    return (
        <p className="flex items-center gap-2">
            <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${ok ? "bg-green-500/20 text-green-700 dark:bg-green-400/20 dark:text-green-300" : "bg-red-500/20 text-red-700 dark:bg-red-400/20 dark:text-red-300"}`}>
                {ok ? "✓" : "×"}
            </span>
            <span className={ok ? "text-slate-700 dark:text-gray-300" : "text-slate-500 dark:text-gray-400"}>{label}</span>
        </p>
    )
}

export default function AuthForm({callbackUrl, leagueId}: AuthFormProps): React.JSX.Element {
    const [mode, setMode] = useState<Mode>("email")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [isVisible, setIsVisible] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [didFail, setDidFail] = useState(false)
    const [checkError, setCheckError] = useState(false)

    const validEmail = EMAIL_REGEX.test(email)
    const validLength = password.length >= 6
    const containsDigit = doesContainDigit(password)
    const containsLowerCase = doesContainLowerCase(password)

    const toggleVisibility = () => setIsVisible(v => !v)

    const subtitle = mode === "email"
        ? "Enter your email to get started"
        : email

    const handleContinue = async () => {
        if (!validEmail) return
        setIsLoading(true)
        setCheckError(false)
        try {
            const response = await AUTH_CLIENT.authApi.checkEmail({email})
            setMode(response._exists ? "login" : "signup")
        } catch {
            setCheckError(true)
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogin = async () => {
        const requestBody: LoginRequest = {email, password}
        setIsLoading(true)
        setDidFail(false)
        try {
            const response = await AUTH_CLIENT.authApi.login({loginRequest: requestBody})
            if (!response.idToken) {
                setDidFail(true)
                setIsLoading(false)
                return
            }
            setCookie(TOKEN_COOKIE_KEY, response.idToken, {maxAge: 60 * 60 * 24})
            if (response.refreshToken) {
                setCookie(REFRESH_TOKEN_COOKIE_KEY, response.refreshToken, {maxAge: 60 * 60 * 24 * 30})
            }
            await navigateTo(callbackUrl ?? (leagueId ? `app/league/${leagueId}/join` : "app"))
        } catch {
            setDidFail(true)
            setIsLoading(false)
        }
    }

    const handleSignup = async () => {
        const signupRequest: SignupRequest = {email, password, firstName, familyName: lastName}
        setIsLoading(true)
        try {
            await AUTH_CLIENT.userApi.signup({signupRequest})
            await handleLogin()
        } catch {
            setIsLoading(false)
        }
    }

    const signupInvalid = !validEmail
        || !validLength
        || !containsDigit
        || !containsLowerCase
        || firstName === ""
        || lastName === ""

    return (
        <div className="space-y-5">
            {mode !== "email" && (
                <button
                    type="button"
                    onClick={() => {
                        setMode("email")
                        setPassword("")
                        setDidFail(false)
                    }}
                    className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors"
                >
                    <span aria-hidden>←</span>
                    <span className="truncate">{subtitle}</span>
                </button>
            )}

            {mode === "email" && (
                <>
                    <p className="text-center text-sm text-slate-500 dark:text-gray-400 -mt-2 mb-2">{subtitle}</p>
                    <Input
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value.toLowerCase())
                            setCheckError(false)
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && validEmail) {
                                e.preventDefault()
                                handleContinue()
                            }
                        }}
                        type="email"
                        name="email"
                        id="email"
                        label="Email"
                        variant="bordered"
                        isInvalid={email.length > 0 && !validEmail}
                        classNames={AUTH_INPUT_CLASS_NAMES}
                        style={{fontSize: "18px"}}
                        autoFocus
                    />
                    {checkError && (
                        <p className="text-sm text-red-600 dark:text-red-400 text-center">
                            Something went wrong. Please try again.
                        </p>
                    )}
                    <Button
                        onPress={handleContinue}
                        isDisabled={!validEmail}
                        isLoading={isLoading}
                        type="button"
                        className={"w-full " + BUTTON_CLASS}
                    >
                        Continue
                    </Button>
                </>
            )}

            {mode === "login" && (
                <>
                    <Input
                        onChange={(e) => {
                            setPassword(e.target.value)
                            setDidFail(false)
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                handleLogin()
                            }
                        }}
                        type={isVisible ? "text" : "password"}
                        label="Password"
                        variant="bordered"
                        isInvalid={didFail}
                        classNames={AUTH_INPUT_CLASS_NAMES}
                        style={{fontSize: "18px"}}
                        autoFocus
                        endContent={
                            <button className="focus:outline-none" type="button" onClick={toggleVisibility}>
                                {isVisible
                                    ? <EyeSlashFilledIcon className="text-2xl text-slate-500 dark:text-gray-400 pointer-events-none"/>
                                    : <EyeFilledIcon className="text-2xl text-slate-500 dark:text-gray-400 pointer-events-none"/>}
                            </button>
                        }
                    />
                    <div className="flex items-center justify-end">
                        <a href="/reset" className="text-sm font-medium text-cyan-600 dark:text-cyan-300 hover:text-cyan-700 dark:hover:text-cyan-200 hover:underline">
                            Forgot password?
                        </a>
                    </div>
                    <Button
                        onPress={handleLogin}
                        isLoading={isLoading}
                        type="button"
                        className={"w-full " + BUTTON_CLASS}
                    >
                        Sign in
                    </Button>
                </>
            )}

            {mode === "signup" && (
                <>
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            onChange={(e) => setFirstName(e.target.value)}
                            type="text"
                            label="First name"
                            variant="bordered"
                            classNames={AUTH_INPUT_CLASS_NAMES}
                            style={{fontSize: "18px"}}
                            autoFocus
                        />
                        <Input
                            onChange={(e) => setLastName(e.target.value)}
                            type="text"
                            label="Last name"
                            variant="bordered"
                            classNames={AUTH_INPUT_CLASS_NAMES}
                            style={{fontSize: "18px"}}
                        />
                    </div>
                    <div>
                        <Input
                            onChange={(e) => setPassword(e.target.value)}
                            type={isVisible ? "text" : "password"}
                            label="Password"
                            variant="bordered"
                            classNames={AUTH_INPUT_CLASS_NAMES}
                            style={{fontSize: "18px"}}
                            endContent={
                                <button className="focus:outline-none" type="button" onClick={toggleVisibility}>
                                    {isVisible
                                        ? <EyeSlashFilledIcon className="text-2xl text-slate-500 dark:text-gray-400 pointer-events-none"/>
                                        : <EyeFilledIcon className="text-2xl text-slate-500 dark:text-gray-400 pointer-events-none"/>}
                                </button>
                            }
                        />
                        {password.length > 0 && (
                            <div className="mt-3 space-y-1 text-xs">
                                <PasswordRule ok={containsLowerCase} label="At least one lowercase letter"/>
                                <PasswordRule ok={containsDigit} label="At least one digit"/>
                                <PasswordRule ok={validLength} label="At least 6 characters"/>
                            </div>
                        )}
                    </div>
                    <Button
                        onPress={handleSignup}
                        isLoading={isLoading}
                        isDisabled={signupInvalid}
                        type="button"
                        className={"w-full " + BUTTON_CLASS}
                    >
                        Create account
                    </Button>
                </>
            )}
        </div>
    )
}
