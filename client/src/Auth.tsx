import { createAPI } from "@/api"
import App from "@/App"
import { useMutation } from "@tanstack/react-query"
import { useEffect } from "react"

export default function Auth() {
    const { isSuccess, mutate } = useMutation({
        mutationKey: ["auth"],
        mutationFn: createAPI,
    })

    useEffect(() => {
        mutate()
    }, [])

    if (isSuccess) return <App />

    return <></>
}
