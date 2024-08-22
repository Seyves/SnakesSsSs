import React, { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Spinner from "@/components/Spinner"
import Button from "@/components/Button"
import * as api from "@/api.ts"

const MAX_SYMBOLS = 10000

export default function Editor() {
    const queryClient = useQueryClient()

    const [content, setContent] = useState("")

    const { mutate: createPost, isPending } = useMutation({
        mutationFn: (content: string) => api.createPost(content),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["posts"] })
            setContent("")
        },
    })

    function onSubmit(e: React.FormEvent) {
        if (content.length > MAX_SYMBOLS) return
        e.preventDefault()
        createPost(content)
    }

    function submitOnEnter(e: React.KeyboardEvent) {
        if (!e.shiftKey && e.key === "Enter") {
            onSubmit(e)
        }
    }

    const isMaxSymbolsReached = content.length > MAX_SYMBOLS

    return (
        <form onSubmit={onSubmit} className="px-4">
            <textarea
                onKeyDown={submitOnEnter}
                placeholder="Tell us sSsSsomething..."
                onChange={(e) => setContent(e.target.value)}
                value={content}
                cols={30}
                className="h-28 w-full resize-none rounded-2xl bg-zinc-200 p-4 outline-none transition-all duration-300 placeholder:text-zinc-500 dark:bg-zinc-800 md:h-40"
            ></textarea>
            <div className="mt-4 flex items-center justify-center">
                {
                    isMaxSymbolsReached && <div className="ml-auto mr-2 text-center text-xs font-bold text-red-500 md:text-sm">You have reached symbols limit (10000)</div>
                }
                <Button className="ml-auto" disabled={isMaxSymbolsReached}>{isPending ? <Spinner /> : "SsSsend"}</Button>
            </div>
        </form>
    )
}
