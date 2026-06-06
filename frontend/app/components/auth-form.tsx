'use client'

import React, { useState } from "react"
import { Button, Checkbox, Input } from "@nextui-org/react"
import { EyeFilledIcon, EyeSlashFilledIcon } from "@nextui-org/shared-icons"
import { signIn } from "next-auth/react"
import { AUTH_CLIENT } from "@/app/api/api"
import { API_GATEWAY } from "@/app/api/constants"
import { AUTH_INPUT_CLASS_NAMES, BUTTON_CLASS } from "@/app/util/css-classes"
import GoogleIcon from "@/app/components/icons/google-icon"
import TeamPicker from "@/app/components/team-picker"
import { doesContainDigit, doesContainLowerCase } from "@/app/util/regex"

const EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

type Mode = "email" | "login" | "signup"

interface AuthFormProps {
    callbackUrl?: string
    leagueId?: string
    initialEmail?: string
    initialMode?: "email" | "login"
}

function PasswordRule({ ok, label }: { ok: boolean; label: string }) {
    return (
        <p className="flex items-center gap-2">
            <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${ok ? "bg-green-500/20 text-green-700 dark:bg-green-400/20 dark:text-green-300" : "bg-red-500/20 text-red-700 dark:bg-red-400/20 dark:text-red-300"}`}>
                {ok ? "✓" : "×"}
            </span>
            <span className={ok ? "text-slate-700 dark:text-gray-300" : "text-slate-500 dark:text-gray-400"}>{label}</span>
        </p>
    )
}

export default function AuthForm({ callbackUrl, leagueId, initialEmail, initialMode }: AuthFormProps): React.JSX.Element {
    const [mode, setMode] = useState<Mode>(initialMode ?? "email")
    const [email, setEmail] = useState(initialEmail ?? "")
    const [password, setPassword] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [supportedTeamId, setSupportedTeamId] = useState<string | null>(null)
    const [emailReminders, setEmailReminders] = useState(false)
    const [isVisible, setIsVisible] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [didFail, setDidFail] = useState(false)
    const [checkError, setCheckError] = useState(false)

    const [googleEmail, setGoogleEmail] = useState(false)

    const validEmail = EMAIL_REGEX.test(email)
    const validLength = password.length >= 6
    const containsDigit = doesContainDigit(password)
    const containsLowerCase = doesContainLowerCase(password)

    const toggleVisibility = () => setIsVisible(v => !v)

    const redirectTo = callbackUrl ?? (leagueId ? `/app/league/${leagueId}/join` : "/app")

    const subtitle = mode === "email"
        ? "Enter your email to get started"
        : email

    const handleContinue = async () => {
        if (!validEmail) return
        setIsLoading(true)
        setCheckError(false)
        setGoogleEmail(false)
        try {
            const res = await fetch(`${API_GATEWAY}/auth/check-email?email=${encodeURIComponent(email)}`)
            const data = await res.json() as { exists: boolean; provider?: string }
            if (data.exists && data.provider === "google") {
                setGoogleEmail(true)
            } else {
                setMode(data.exists ? "login" : "signup")
            }
        } catch {
            setCheckError(true)
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogin = async () => {
        setIsLoading(true)
        setDidFail(false)
        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        })
        if (result?.error) {
            setDidFail(true)
            setIsLoading(false)
        } else {
            window.location.href = redirectTo
        }
    }

    const handleSignup = async () => {
        setIsLoading(true)
        try {
            await AUTH_CLIENT.userApi.signup({ signupRequest: { email, password, firstName, familyName: lastName, emailReminders, supportedTeamId: supportedTeamId! } })
            await handleLogin()
        } catch {
            setIsLoading(false)
        }
    }

    const handleGoogleSignIn = () => {
        signIn("google", { callbackUrl: redirectTo })
    }

    const signupInvalid = !validEmail
        || !validLength
        || !containsDigit
        || !containsLowerCase
        || firstName === ""
        || lastName === ""
        || supportedTeamId === null

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
                    <Button
                        onPress={handleGoogleSignIn}
                        className="w-full bg-white text-gray-700 font-medium border border-gray-300"
                        startContent={<GoogleIcon />}
                    >
                        Continue with Google
                    </Button>
                    <div className="flex items-center gap-3 my-1">
                        <div className="flex-1 h-px bg-gray-700" />
                        <span className="text-xs text-gray-500 uppercase">or</span>
                        <div className="flex-1 h-px bg-gray-700" />
                    </div>
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
                        style={{ fontSize: "18px" }}
                        autoFocus
                    />
                    {checkError && (
                        <p className="text-sm text-red-600 dark:text-red-400 text-center">
                            Something went wrong. Please try again.
                        </p>
                    )}
                    {googleEmail && (
                        <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
                            This email is registered with Google. Use the button above to sign in.
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
                        style={{ fontSize: "18px" }}
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
                        <a href={`/reset?email=${encodeURIComponent(email)}`} className="text-sm font-medium text-cyan-600 dark:text-cyan-300 hover:text-cyan-700 dark:hover:text-cyan-200 hover:underline">
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
                            style={{ fontSize: "18px" }}
                            autoFocus
                        />
                        <Input
                            onChange={(e) => setLastName(e.target.value)}
                            type="text"
                            label="Last name"
                            variant="bordered"
                            classNames={AUTH_INPUT_CLASS_NAMES}
                            style={{ fontSize: "18px" }}
                        />
                    </div>
                    <div>
                        <Input
                            onChange={(e) => setPassword(e.target.value)}
                            type={isVisible ? "text" : "password"}
                            label="Password"
                            variant="bordered"
                            classNames={AUTH_INPUT_CLASS_NAMES}
                            style={{ fontSize: "18px" }}
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
                    <TeamPicker value={supportedTeamId} onSelect={setSupportedTeamId} />
                    <Checkbox
                        isSelected={emailReminders}
                        onValueChange={setEmailReminders}
                        size="sm"
                        classNames={{label: "text-sm text-slate-600 dark:text-gray-300"}}
                    >
                        Email me a reminder on match days if I haven&apos;t predicted yet
                    </Checkbox>
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
