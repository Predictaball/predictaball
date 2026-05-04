'use client'

import React, { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ResetPasswordConfirmRequest, ResetPasswordRequest } from "@/client"
import { AUTH_CLIENT } from "@/app/api/api"
import { navigateTo } from "@/app/actions"
import { Button, Input } from "@nextui-org/react"
import { EyeFilledIcon, EyeSlashFilledIcon } from "@nextui-org/shared-icons"
import { AUTH_INPUT_CLASS_NAMES, BUTTON_CLASS } from "@/app/util/css-classes"
import { doesContainDigit, doesContainLowerCase } from "../util/regex"
import toast, { Toaster } from "react-hot-toast"
import AuthShell from "@/app/components/auth-shell"

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

export default function ResetPage() {
    return (
        <Suspense>
            <Reset />
        </Suspense>
    )
}

function Reset() {
    const searchParams = useSearchParams()
    const [email, setEmail] = useState(searchParams.get("email") ?? "")
    const [password, setPassword] = useState("")
    const [otp, setOtp] = useState("")
    const [isVisible, setIsVisible] = useState(false)
    const [isLoadingCode, setIsLoadingCode] = useState(false)
    const [isLoadingConfirmation, setIsLoadingConfirmation] = useState(false)
    const [isRequested, setIsRequested] = useState(false)
    const [didFail, setDidFail] = useState(false)

    const validLength = password.length >= 6
    const containsDigit = doesContainDigit(password)
    const containsLowerCase = doesContainLowerCase(password)

    const handleVerificationCodeRequest = async () => {
        setIsLoadingCode(true)
        try {
            const requestBody: ResetPasswordRequest = { email }
            await AUTH_CLIENT.authApi.resetPassword({ resetPasswordRequest: requestBody })
            toast.success("Check your email for your reset code", { duration: 4000 })
            setIsRequested(true)
        } catch {
            toast.error("Failed to request reset. Check the email address is correct.")
            setDidFail(true)
        }
        setIsLoadingCode(false)
    }

    const handlePasswordResetRequest = async () => {
        if (!containsDigit || !validLength || !containsLowerCase) return
        setIsLoadingConfirmation(true)
        try {
            const requestBody: ResetPasswordConfirmRequest = { email, otp, password }
            await AUTH_CLIENT.authApi.resetPasswordConfirm({ resetPasswordConfirmRequest: requestBody })
            toast.success("Password reset successfully")
            await navigateTo("login")
        } catch {
            toast.error("Failed to reset password. Double check your verification code.")
            setDidFail(true)
        }
        setIsLoadingConfirmation(false)
    }

    return (
        <>
            <Toaster />
            <AuthShell title="Reset your password">
                <div className="space-y-5">
                    <Input
                        onChange={(e) => {
                            setDidFail(false)
                            setEmail(e.target.value.toLowerCase())
                        }}
                        type="email"
                        label="Email"
                        variant="bordered"
                        isInvalid={didFail}
                        classNames={AUTH_INPUT_CLASS_NAMES}
                        style={{ fontSize: "18px" }}
                        isDisabled={isRequested}
                        value={email}
                        autoFocus={!email}
                    />
                    {!isRequested && (
                        <Button
                            onPress={handleVerificationCodeRequest}
                            isLoading={isLoadingCode}
                            isDisabled={!email}
                            className={"w-full " + BUTTON_CLASS}
                        >
                            Send Reset Code
                        </Button>
                    )}
                    {isRequested && (
                        <>
                            <Input
                                onChange={(e) => {
                                    setDidFail(false)
                                    setOtp(e.target.value)
                                }}
                                type="text"
                                label="Verification Code"
                                variant="bordered"
                                classNames={AUTH_INPUT_CLASS_NAMES}
                                style={{ fontSize: "18px" }}
                                autoFocus
                            />
                            <div>
                                <Input
                                    label="New Password"
                                    onChange={(e) => setPassword(e.target.value)}
                                    value={password}
                                    variant="bordered"
                                    classNames={AUTH_INPUT_CLASS_NAMES}
                                    style={{ fontSize: "18px" }}
                                    isInvalid={didFail}
                                    endContent={
                                        <button className="focus:outline-none" type="button" onClick={() => setIsVisible(v => !v)}>
                                            {isVisible
                                                ? <EyeSlashFilledIcon className="text-2xl text-slate-500 dark:text-gray-400 pointer-events-none" />
                                                : <EyeFilledIcon className="text-2xl text-slate-500 dark:text-gray-400 pointer-events-none" />}
                                        </button>
                                    }
                                    type={isVisible ? "text" : "password"}
                                />
                                {password.length > 0 && (
                                    <div className="mt-3 space-y-1 text-xs">
                                        <PasswordRule ok={containsLowerCase} label="At least one lowercase letter" />
                                        <PasswordRule ok={containsDigit} label="At least one digit" />
                                        <PasswordRule ok={validLength} label="At least 6 characters" />
                                    </div>
                                )}
                            </div>
                            <Button
                                onPress={handlePasswordResetRequest}
                                isLoading={isLoadingConfirmation}
                                isDisabled={!containsDigit || !validLength || !containsLowerCase || !otp}
                                className={"w-full " + BUTTON_CLASS}
                            >
                                Reset Password
                            </Button>
                        </>
                    )}
                    <div className="text-center">
                        <a href={`/login?email=${encodeURIComponent(email)}&mode=login`} className="text-sm font-medium text-cyan-600 dark:text-cyan-300 hover:text-cyan-700 dark:hover:text-cyan-200 hover:underline">
                            Back to sign in
                        </a>
                    </div>
                </div>
            </AuthShell>
        </>
    )
}
