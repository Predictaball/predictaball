'use client'

import React, {useState} from "react";
import {ResetPasswordConfirmRequest, ResetPasswordRequest} from "@/client";
import {AUTH_CLIENT} from "@/app/api/api";
import {navigateTo} from "@/app/actions";
import {Button, Input} from "@nextui-org/react";
import {EyeFilledIcon, EyeSlashFilledIcon} from "@nextui-org/shared-icons";
import {BUTTON_CLASS} from "@/app/util/css-classes";
import Link from "next/link";
import { doesContainDigit, doesContainLowerCase } from "../util/regex";
import toast, { Toaster } from "react-hot-toast";

export default function Reset() {

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [otp, setOtp] = useState("")
    const [isVisible, setIsVisible] = useState(false)
    const [isLoadingCode, setIsLoadingCode] = useState(false)
    const [isLoadingConfirmation, setIsLoadingConfirmation] = useState(false)
    const [isRequested, setIsRequested] = useState(false)
    const [didFail, setDidFail] = useState(false)

    const [validLength, setIsValidLength] = useState(false)
    const [containsDigit, setContainsDigit] = useState(false)
    const [containsLowerCase, setContainsLowerCase] = useState(false)

    const toggleVisibility = () => setIsVisible(!isVisible);

    function handlePasswordChange(val: string): void {
        setIsValidLength(val.length >= 6)
        setContainsDigit(doesContainDigit(val))
        setContainsLowerCase(doesContainLowerCase(val))
        setPassword(val)
    }

    function isPasswordValid(): boolean {
        return containsDigit && validLength && containsLowerCase
    }

    const handleVerificationCodeRequest: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
        e.preventDefault()

        const requestBody: ResetPasswordRequest = {
            email: email
        }

        setIsLoadingCode(true)

        try {
            await AUTH_CLIENT.authApi.resetPassword({resetPasswordRequest: requestBody})
            toast.success("Check your email for your reset verification code", {duration: 4000})
            setIsRequested(true)
        } catch (error) {
            toast.error("Failed to request reset. There is no user for this email address")
            setDidFail(true)
        }

        setIsLoadingCode(false)
    }

    const handlePasswordResetRequest: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
        e.preventDefault()

        if (!isPasswordValid()) return

        const requestBody: ResetPasswordConfirmRequest = {
            email: email,
            otp: otp,
            password: password
        }

        setIsLoadingConfirmation(true)

        try {
            await AUTH_CLIENT.authApi.resetPasswordConfirm({resetPasswordConfirmRequest: requestBody})
            await navigateTo("login")
        } catch (error) {
            toast.error("Failed to reset password. Double check your verification code")
            setDidFail(true)
        }

        setIsLoadingConfirmation(false)
    }

    return (
        <section>
            <Toaster/>
            <div className="bg-gray-900 flex flex-col items-center justify-center px-6 py-8 mx-auto h-screen lg:py-0">
                <h1 className="text-white pb-20">
                    <Link href="/">PREDICTABALL.LIVE</Link>
                </h1>
                <div
                    className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
                    <div className="p-6 space-y-4 items-center justify-between md:space-y-6 sm:p-8">
                        <h1 className="text-xl text-center font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                            Reset your password
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
                                disabled={isRequested}
                                value={email}
                            />
                        </div>
                        <Button
                            onClick={handleVerificationCodeRequest}
                            disabled={isRequested}
                            isLoading={isLoadingCode}
                            type="submit"
                            className={"w-full " + BUTTON_CLASS + " disabled:bg-gray-300"}>
                            Request Verification Code
                        </Button>
                        <div>
                                <Input
                                    onChange={(event) => {
                                        setDidFail(false)
                                        setOtp(event.target.value)
                                    }}
                                    type="text"
                                    name="verification code"
                                    id="otp"
                                    label="Verification Code"
                                    style={{fontSize: "18px"}}
                                    isDisabled={!isRequested}
                                />
                        </div>
                        <div>
                            <Input
                                label="New Password"
                                onChange={(event) => {
                                    handlePasswordChange(event.target.value)
                                    setDidFail(false)
                                }}
                                value={password}
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
                                isDisabled={!isRequested}
                            />
                            {password.length !== 0 &&
                                    <div className="p-2 text-xs">
                                        <p><span className="font-bold" style={containsLowerCase ? {"color": "green"} : {"color": "red"}}>{containsLowerCase ? "✓" : "x"}</span> At least one lowercase letter</p>
                                        <p><span className="font-bold" style={containsDigit ? {"color": "green"} : {"color": "red"}}>{containsDigit ? "✓" : "x"}</span> At least one digit</p>
                                        <p><span className="font-bold" style={validLength ? {"color": "green"} : {"color": "red"}}>{validLength ? "✓" : "x"}</span> At least 6 characters in length</p>
                                    </div>
                                }
                        </div>
                        <Button
                            disabled={!isRequested || !isPasswordValid()}
                            onClick={handlePasswordResetRequest}
                            isLoading={isLoadingConfirmation}
                            type="submit"
                            className={"w-full " + ((!isRequested || !isPasswordValid()) ? "bg-gray-300" : BUTTON_CLASS)}>
                            Reset Password
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
