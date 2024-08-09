import { useEffect, useState } from "react"
import { createAPI } from "./api"
import App from "./App"

export default function Auth() {
    const [isL, setIsL] = useState(false)

    async function auth() {
        await createAPI()
        setIsL(true)
    }

    useEffect(() => {
        auth()
    }, [])

    if (isL) return <App />

    return <></>
}
