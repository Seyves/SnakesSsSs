import D, { Nullable } from "@/definitions"

export function throttle<P extends any[]>(
    callback: (...props: P) => any,
    timeout: number,
) {
    let canCall = true

    return function (...props: P) {
        if (!canCall) return
        canCall = false
        setTimeout(() => (canCall = true), timeout)
        callback(...props)
    }
}

export function debounce<P extends any[]>(
    callback: (...props: P) => any,
    timeout: number,
) {
    let scheduled = Infinity

    return function (...props: P) {
        clearTimeout(scheduled)
        scheduled = setTimeout(() => callback(...props), timeout)
    }
}

export function convertPixelsToRem(px: number) {
    return px / parseFloat(getComputedStyle(document.documentElement).fontSize)
}

export function getStoragedTheme() {
    const theme = localStorage.getItem("theme") as Nullable<D.Theme>

    if (theme) return theme

    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    if (isDark) return D.THEMES.DARK

    return D.THEMES.LIGHT
}

export function setStorageTheme(theme: D.Theme) {
    localStorage.setItem("theme", theme)
}

export function getStoragedAnimations() {
    const animations = localStorage.getItem("animations") as Nullable<"0" | "1">

    if (animations === "0") {
        return false
    }

    if (animations === "1") {
        return true 
    }

    return true
}

export function setStorageAnimations(value: boolean) {
    localStorage.setItem("animations", value ? "1" : "0")
}
