import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import D, { Nullable } from "@/definitions.ts"
import * as api from "@/api.ts"
import Button from "@/components/Button"
import Spinner from "@/components/Spinner"
import ReplyLink from "@/components/ReplyLink.tsx"
import { convertPixelsToRem } from "@/functions"

type Props = {
    postId: number
    replyTarget: Nullable<D.ReplyTarget>
    setReplyTarget: React.Dispatch<
        React.SetStateAction<Nullable<D.ReplyTarget>>
    >
    reply: D.Reply
}

const MAX_SYMBOLS = 10000

export default forwardRef(function CommentEditor(
    props: Props,
    ref: React.ForwardedRef<HTMLTextAreaElement>,
) {
    const [content, setContent] = useState("")

    const queryClient = useQueryClient()

    const innerRef = useRef<HTMLTextAreaElement>(null)

    const { mutateAsync: createComment, isPending } = useMutation({
        mutationFn: api.createComment,
        onSuccess: () => {
            props.setReplyTarget(null)
            setContent("")
            queryClient.invalidateQueries({ queryKey: ["posts"] })
            queryClient.invalidateQueries({
                queryKey: ["comments", props.postId],
            })
        },
    })

    // Providing local ref to forward ref
    useImperativeHandle(ref, () => innerRef.current!)

    // For textarea to autoresize based on content
    useEffect(() => {
        console.log(innerRef.current)
        if (!innerRef.current) return

        const textarea = innerRef.current

        textarea.style.height = "auto"
        textarea.style.height = `${convertPixelsToRem(textarea.scrollHeight)}rem`
    }, [innerRef, content])

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        await createComment({
            postId: props.postId,
            content,
            reply: props.replyTarget?.id,
        })
    }

    function submitOnEnter(e: React.KeyboardEvent) {
        if (!e.shiftKey && e.key === "Enter") {
            onSubmit(e)
        }
    }

    function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        setContent(e.currentTarget.value)
    }

    const isMaxSymbolsReached = content.length > MAX_SYMBOLS

    return (
        <div className="px-6 py-4 md:px-10 md:pb-6 md:pt-2">
            {props.replyTarget && (
                <div className="mb-2">
                    <ReplyLink
                        author={props.replyTarget.author}
                        commentId={props.replyTarget.id}
                        postId={props.postId}
                        reply={props.reply}
                    />
                </div>
            )}
            <form className="flex" onSubmit={onSubmit}>
                <textarea
                    onKeyDown={submitOnEnter}
                    placeholder="I think..."
                    value={content}
                    onChange={onChange}
                    rows={1}
                    ref={innerRef}
                    className="md-p-2 mr-4 max-h-24 md:max-h-32 grow resize-none rounded-md bg-transparent bg-zinc-200 p-1 outline-none transition-colors duration-300 dark:bg-zinc-800 md:p-2"
                ></textarea>
                <Button disabled={isMaxSymbolsReached}>{isPending ? <Spinner /> : "SsSsend"}</Button>
            </form>
            {
                isMaxSymbolsReached && <div className="mt-4 text-center text-xs font-bold text-red-500 md:text-sm">You have reached symbols limit (10000)</div>
            }
        </div>
    )
})
