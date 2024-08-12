import React, { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Spinner from "@/components/Spinner"
import Button from "@/components/Button"
import * as api from "@/api.ts"

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
        e.preventDefault()
        createPost(content)
    }

    return (
        <form onSubmit={onSubmit} className="px-4">
            <textarea
                placeholder="Tell us ssSSssomething..."
                onChange={(e) => setContent(e.target.value)}
                value={content}
                cols={30}
                className="h-28 w-full resize-none rounded-2xl bg-zinc-200 p-4 outline-none transition-all duration-300 placeholder:text-zinc-500 dark:bg-zinc-800 md:h-40"
            ></textarea>
            <div className="mt-4 flex items-center justify-end">
                <Button>{isPending ? <Spinner /> : "SsSssend"}</Button>
            </div>
        </form>
    )
}
