import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as api from "@/api.ts"
import D from "@/definitions"
import LikeIcon from "@/components/icons/LikeIcon.tsx"
import ReplyIcon from "@/components/icons/ReplyIcon.tsx"
import ReplyLink from "@/components/ReplyLink.tsx"
import Expandable from "@/components/Expandable.tsx"

type Props = D.Comment & {
    original?: boolean
    postId: number
    reply: D.Reply
}

export default function Comment(props: Props) {
    const queryClient = useQueryClient()

    const authorName = props.author.split("-")[0]
    const isMine = props.author === api.uuid
    const date = new Date(props.createdAt)

    function invalidateComments() {
        queryClient.invalidateQueries({ queryKey: ["comments", props.postId] })
    }

    const { mutate: like } = useMutation({
        mutationFn: () => api.likeComment(props.id),
        onSuccess: invalidateComments,
    })

    const { mutate: unlike } = useMutation({
        mutationFn: () => api.unlikeComment(props.id),
        onSuccess: invalidateComments,
    })

    const dateStr = date.toLocaleString("en", {
        year: "numeric",
        weekday: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
    })

    return (
        <div
            id={props.original ? `comment-${props.id}` : undefined}
            className="p-2.5 pb-1.5 transition-colors duration-300 md:p-3"
        >
            <div className="flex items-center gap-1 text-xs md:text-sm">
                <h3 className="flex-shrink-0 whitespace-nowrap text-sm font-bold md:text-base">
                    Anon@{authorName}{" "}
                    {isMine && (
                        <span className="text-emerald-600 transition-colors duration-300 dark:text-green-300">
                            (you)
                        </span>
                    )}
                </h3>
                <span className="ml-2 min-w-0 flex-1 overflow-hidden text-ellipsis  whitespace-nowrap font-light">
                    {dateStr}
                </span>
            </div>
            <div className="my-2 text-justify">
                {props.replyCommentAuthor && props.replyCommentId && (
                    <ReplyLink
                        reply={props.reply}
                        author={props.replyCommentAuthor}
                        commentId={props.replyCommentId}
                        postId={props.postId}
                    />
                )}
                <div className="max-h-96 overflow-y-auto whitespace-pre-wrap pr-4">
                    <Expandable content={props.content}/>
                </div>
            </div>
            <div className="flex gap-6">
                <div
                    title="Like"
                    className="flex cursor-pointer items-center rounded-lg p-1.5 transition-all duration-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 md:p-2"
                    onClick={() => (props.isLiked ? unlike() : like())}
                >
                    <LikeIcon
                        className={`mr-3 h-4 w-4 md:h-5 md:w-5 ${props.isLiked ? "fill-red-500" : "fill-zinc-500"}`}
                    />
                    <span className="text-sm text-zinc-500">
                        {props.likesCount}
                    </span>
                </div>
                <div
                    title="Reply"
                    className="flex cursor-pointer items-center rounded-lg p-1 transition-all duration-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 md:p-2"
                    onClick={() =>
                        props.reply({ id: props.id, author: props.author })
                    }
                >
                    <ReplyIcon className="h-3 w-5 cursor-pointer stroke-zinc-500 md:h-4 md:w-6" />
                </div>
            </div>
        </div>
    )
}
