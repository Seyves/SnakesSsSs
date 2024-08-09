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
        <form onSubmit={onSubmit}>
            <textarea
                placeholder="Tell us ssSSssomething..."
                onChange={(e) => setContent(e.target.value)}
                value={content}
                cols={30}
                className="w-full h-28 md:h-40 placeholder:text-zinc-500 resize-none outline-none bg-zinc-200 dark:bg-zinc-800 transition-all duration-300 p-4 rounded-2xl"
            ></textarea>
            <div className="mt-4 flex justify-end items-center">
                <Button>{isPending ? <Spinner /> : "SsSssend"}</Button>
            </div>
        </form>
    )
}
