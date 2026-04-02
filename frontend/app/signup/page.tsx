'use client'

import React, {useState} from "react"
import {AUTH_CLIENT} from "../api/api"
import {SignupRequest} from "@/client";
import {navigateTo} from "@/app/actions";
import {Button, Input} from "@nextui-org/react";
import {BUTTON_CLASS} from "@/app/util/css-classes";
import Link from "next/link";
import {doesContainDigit, doesContainLowerCase} from "@/app/util/regex";
import {EyeFilledIcon, EyeSlashFilledIcon} from "@nextui-org/shared-icons";

export default function SignUp({
  params,
  searchParams,
}: {
  params: { }
  searchParams: { [key: string]: string | undefined }
}) {
    const leagueId = searchParams["leagueId"]
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

    const logInLink = "login" + ((leagueId && `?leagueId=${leagueId}`) || "")

    const toggleVisibility = () => setIsVisible(!isVisible);

    const handleEvent: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
        e.preventDefault()

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
        <section className="bg-gray-900 h-screen">
            <div className="bg-gray-900 flex flex-col items-center justify-center px-6 py-8 mx-auto h-screen lg:py-0">
                <h1 className="text-white pb-10">
                    <Link href="/">PREDICTABALL.LIVE</Link>
                </h1>
                <div
                    className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 bborder-gray-700 align-bottom">
                    <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                        <h1 className="text-center text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                            Sign Up For An Account
                        </h1>
                        <form className="space-y-4 md:space-y-6" action="#">
                            <div>
                                <Input
                                    onChange={(input) => setFirstName(input.target.value)}
                                    type="name"
                                    name="firstname"
                                    id="firstname"
                                    label="First Name"
                                    style={{fontSize: "18px"}}
                                />
                            </div>
                            <div>
                                <Input
                                    onChange={(input) => setLastName(input.target.value)}
                                    type="name"
                                    name="lastname"
                                    id="lastname"
                                    label="Last Name"
                                    style={{fontSize: "18px"}}
                                />
                            </div>
                            <div>
                                <Input
                                    onChange={(input) => handleEmailChange(input.target.value)}
                                    type="email"
                                    name="email"
                                    id="email"
                                    label="email"
                                    isInvalid={!validEmail}
                                    style={{fontSize: "18px"}}
                                />
                            </div>
                            <div>
                                <Input
                                    onChange={(input) => handlePasswordChange(input.target.value)}
                                    type={isVisible ? "text" : "password"}
                                    name="password"
                                    id="password"
                                    label="Password"
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
                                />
                                {password.length !== 0 &&
                                    <div className="p-2 text-xs">
                                        <p><span className="font-bold" style={containsLowerCase ? {"color": "green"} : {"color": "red"}}>{containsLowerCase ? "✓" : "x"}</span> At least one lowercase letter</p>
                                        <p><span className="font-bold" style={containsDigit ? {"color": "green"} : {"color": "red"}}>{containsDigit ? "✓" : "x"}</span> At least one digit</p>
                                        <p><span className="font-bold" style={validLength ? {"color": "green"} : {"color": "red"}}>{validLength ? "✓" : "x"}</span> At least 6 characters in length</p>
                                    </div>
                                }
                            </div>
                            <div>
                                <Input
                                    onChange={(input) => handleConfirmPasswordChange(input.target.value)}
                                    type={isVisible ? "text" : "password"}
                                    name="confirmpassword"
                                    id="confirmpassword"
                                    label="Confirm Password"
                                    isInvalid={!doPasswordsMatch}
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
                                />
                            </div>
                            <Button
                                onClick={handleEvent}
                                isLoading={isLoading}
                                disabled={isFormInvalid()}
                                type="submit"
                                className={"w-full " + BUTTON_CLASS}>
                                Create Account
                            </Button>
                            <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                                Already have an account? <a href={`/${logInLink}`}
                                                            className="font-medium text-indigo-600 hover:underline">Sign
                                In</a>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    )
}