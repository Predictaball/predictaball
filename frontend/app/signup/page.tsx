'use client'

import React, {Suspense, useState} from "react"
import {useSearchParams} from "next/navigation"
import {AUTH_CLIENT} from "../api/api"
import {SignupRequest} from "@/client";
import {navigateTo} from "@/app/actions";
import {Button, Input} from "@nextui-org/react";
import {AUTH_INPUT_CLASS_NAMES, BUTTON_CLASS} from "@/app/util/css-classes";
import {doesContainDigit, doesContainLowerCase} from "@/app/util/regex";
import {EyeFilledIcon, EyeSlashFilledIcon} from "@nextui-org/shared-icons";
import AuthShell from "@/app/components/auth-shell";

export default function SignUpPage() {
    return <Suspense><SignUp /></Suspense>
}

function PasswordRule({ok, label}: {ok: boolean; label: string}) {
    return (
        <p className="flex items-center gap-2">
            <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${ok ? "bg-green-400/20 text-green-300" : "bg-red-400/20 text-red-300"}`}>
                {ok ? "✓" : "×"}
            </span>
            <span className={ok ? "text-gray-300" : "text-gray-400"}>{label}</span>
        </p>
    )
}

function SignUp() {
    const searchParams = useSearchParams()
    const leagueId = searchParams.get("leagueId") ?? undefined
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [validEmail, setValidEmail] = useState(true)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [validLength, setIsValidLength] = useState(false)
    const [containsDigit, setContainsDigit] = useState(false)
    const [containsLowerCase, setContainsLowerCase] = useState(false)
    const [doPasswordsMatch, setDoPasswordsMatch] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [isVisible, setIsVisible] = useState(false)

    const logInLink = "/login" + ((leagueId && `?leagueId=${leagueId}`) || "")

    const toggleVisibility = () => setIsVisible(!isVisible);

    const handleEvent = async () => {

        const signupRequest: SignupRequest = {
            email: email,
            password: password,
            firstName: firstName,
            familyName: lastName
        }

        setIsLoading(true)

        try {
            await AUTH_CLIENT.userApi.signup({signupRequest})
            await navigateTo(logInLink)
        } catch (error) {
            setIsLoading(false)
        }
    }

    function handlePasswordChange(val: string): void {
        setIsValidLength(val.length >= 6)
        setContainsDigit(doesContainDigit(val))
        setContainsLowerCase(doesContainLowerCase(val))
        setPassword(val)
        setDoPasswordsMatch(val === confirmPassword)
    }

    function handleConfirmPasswordChange(val: string): void {
        setDoPasswordsMatch(val === password)
        setConfirmPassword(val)
    }

    function handleEmailChange(val: string): void {
        const lowerCaseEmail = val.toLowerCase()
        setEmail(lowerCaseEmail)
        setValidEmail(emailRegex.test(lowerCaseEmail))
    }

    function isFormInvalid(): boolean {
        return !doPasswordsMatch
            || !containsLowerCase
            || !containsDigit
            || !validLength
            || !validEmail
            || firstName === ""
            || lastName === "";
    }

    return (
        <AuthShell title="Create your account">
            <form className="space-y-5" action="#">
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        onChange={(input) => setFirstName(input.target.value)}
                        type="text"
                        name="firstname"
                        id="firstname"
                        label="First name"
                        variant="bordered"
                        classNames={AUTH_INPUT_CLASS_NAMES}
                        style={{fontSize: "18px"}}
                    />
                    <Input
                        onChange={(input) => setLastName(input.target.value)}
                        type="text"
                        name="lastname"
                        id="lastname"
                        label="Last name"
                        variant="bordered"
                        classNames={AUTH_INPUT_CLASS_NAMES}
                        style={{fontSize: "18px"}}
                    />
                </div>
                <Input
                    onChange={(input) => handleEmailChange(input.target.value)}
                    type="email"
                    name="email"
                    id="email"
                    label="Email"
                    variant="bordered"
                    isInvalid={!validEmail}
                    classNames={AUTH_INPUT_CLASS_NAMES}
                    style={{fontSize: "18px"}}
                />
                <div>
                    <Input
                        onChange={(input) => handlePasswordChange(input.target.value)}
                        type={isVisible ? "text" : "password"}
                        name="password"
                        id="password"
                        label="Password"
                        variant="bordered"
                        classNames={AUTH_INPUT_CLASS_NAMES}
                        style={{fontSize: "18px"}}
                        endContent={
                            <button className="focus:outline-none" type="button" onClick={toggleVisibility}>
                                {isVisible ? (
                                    <EyeSlashFilledIcon className="text-2xl text-gray-400 pointer-events-none"/>
                                ) : (
                                    <EyeFilledIcon className="text-2xl text-gray-400 pointer-events-none"/>
                                )}
                            </button>
                        }
                    />
                    {password.length !== 0 && (
                        <div className="mt-3 space-y-1 text-xs">
                            <PasswordRule ok={containsLowerCase} label="At least one lowercase letter"/>
                            <PasswordRule ok={containsDigit} label="At least one digit"/>
                            <PasswordRule ok={validLength} label="At least 6 characters"/>
                        </div>
                    )}
                </div>
                <Input
                    onChange={(input) => handleConfirmPasswordChange(input.target.value)}
                    type={isVisible ? "text" : "password"}
                    name="confirmpassword"
                    id="confirmpassword"
                    label="Confirm password"
                    variant="bordered"
                    isInvalid={!doPasswordsMatch}
                    classNames={AUTH_INPUT_CLASS_NAMES}
                    style={{fontSize: "18px"}}
                    endContent={
                        <button className="focus:outline-none" type="button" onClick={toggleVisibility}>
                            {isVisible ? (
                                <EyeSlashFilledIcon className="text-2xl text-gray-400 pointer-events-none"/>
                            ) : (
                                <EyeFilledIcon className="text-2xl text-gray-400 pointer-events-none"/>
                            )}
                        </button>
                    }
                />
                <Button
                    onPress={handleEvent}
                    isLoading={isLoading}
                    disabled={isFormInvalid()}
                    type="submit"
                    className={"w-full " + BUTTON_CLASS}>
                    Create account
                </Button>
                <p className="text-center text-sm text-gray-400">
                    Already have an account?{" "}
                    <a href={logInLink} className="font-semibold text-cyan-300 hover:text-cyan-200 hover:underline">
                        Sign in
                    </a>
                </p>
            </form>
        </AuthShell>
    )
}
