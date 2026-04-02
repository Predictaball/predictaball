'use server'

import { redirect } from 'next/navigation'

export async function navigateTo(url: string) {
    redirect('/' + url)
}