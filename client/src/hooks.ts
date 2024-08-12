import { useCallback } from "react"
import { debounce, throttle } from "@/functions"

export function useThrottle<P extends any[]>(
    callback: (...props: P) => any,
    timeout: number,
) {
    return useCallback(throttle(callback, timeout), [])
}

export function useDebounce<P extends any[]>(
    callback: (...props: P) => any,
    timeout: number,
) {
    return useCallback(debounce(callback, timeout), [])
}
