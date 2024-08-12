import { forwardRef, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import D, { Nullable } from "@/definitions.ts"
import * as api from "@/api.ts"
import Button from "@/components/Button"
import Spinner from "@/components/Spinner"
import ReplyLink from "@/components/ReplyLink.tsx"

type Props = {
    postId: number
    replyTarget: Nullable<D.ReplyTarget>
    setReplyTarget: React.Dispatch<
        React.SetStateAction<Nullable<D.ReplyTarget>>
    >
    reply: D.Reply
}

export default forwardRef(function CommentEditor(
    props: Props,
    ref: React.ForwardedRef<HTMLTextAreaElement>,
) {
    const [content, setContent] = useState("")

    const queryClient = useQueryClient()

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

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        await createComment({
            postId: props.postId,
            content,
            reply: props.replyTarget?.id,
        })
    }
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
            <form className="flex " onSubmit={onSubmit}>
                <textarea
                    placeholder="I think..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    ref={ref}
                    className="md-p-2 mr-4 h-8 grow resize-none rounded-md bg-transparent bg-zinc-200 p-1 outline-none transition-colors duration-300 dark:bg-zinc-800 md:h-10"
                ></textarea>
                <Button>{isPending ? <Spinner /> : "SsSssend"}</Button>
            </form>
        </div>
    )
})
