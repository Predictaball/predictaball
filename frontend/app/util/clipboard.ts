'use client'

export const copyToClipboard = async (text: string): Promise<boolean> => {
    if (!navigator.clipboard) {
        console.error('Clipboard API not supported')
        return false
    }
    try {
        await navigator.clipboard.writeText(text)
        return true
    } catch (err) {
        return false
    }
};
