import React from "react"
import ReactDOM from "react-dom/client"
import Auth from "./Auth.tsx"
import "./index.css"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 0,
            throwOnError: true,
            retryDelay: 1,
        },
    },
})

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <Auth />
        </QueryClientProvider>
    </React.StrictMode>,
)
