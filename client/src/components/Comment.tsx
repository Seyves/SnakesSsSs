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
            className="p-2.5 pb-1.5 md:p-3 transition-colors duration-300"
        >
            <div className="flex gap-1 items-center text-xs md:text-sm">
                <h3 className="font-bold whitespace-nowrap text-sm md:text-base flex-shrink-0">
                    Anon@{authorName}{" "}
                    {isMine && (
                        <span className="text-emerald-600 dark:text-green-300 transition-colors duration-300">
                            (you)
                        </span>
                    )}
                </h3>
                <span className="font-light ml-2 min-w-0 flex-1 text-ellipsis  whitespace-nowrap overflow-hidden">
                    {dateStr}
                </span>
            </div>
            <div className="text-justify my-2">
                {props.replyCommentAuthor && props.replyCommentId && (
                    <ReplyLink
                        reply={props.reply}
                        author={props.replyCommentAuthor}
                        commentId={props.replyCommentId}
                        postId={props.postId}
                    />
                )}
                <div className="pr-4 max-h-96 overflow-y-auto whitespace-pre-wrap">
                    <Expandable content={props.content} />
                </div>
            </div>
            <div className="flex gap-6">
                <div
                    title="Like"
                    className="flex items-center p-1.5 md:p-2 cursor-pointer rounded-lg transition-all duration-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                    onClick={() => (props.isLiked ? unlike() : like())}
                >
                    <LikeIcon
                        className={`mr-3 w-4 h-4 md:w-5 md:h-5 ${props.isLiked ? "fill-red-500" : "fill-zinc-500"}`}
                    />
                    <span className="text-zinc-500 text-sm">
                        {props.likesCount}
                    </span>
                </div>
                <div
                    title="Reply"
                    className="flex items-center p-1 md:p-2 cursor-pointer rounded-lg transition-all duration-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                    onClick={() =>
                        props.reply({ id: props.id, author: props.author })
                    }
                >
                    <ReplyIcon className="w-5 h-3 md:w-6 md:h-4 stroke-zinc-500 cursor-pointer" />
                </div>
            </div>
        </div>
    )
}
