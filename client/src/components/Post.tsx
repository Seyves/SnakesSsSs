import { AnimatePresence } from "framer-motion"
import { useState } from "react"
import { ErrorBoundary } from "react-error-boundary"
import {
    useIsFetching,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query"
import * as api from "@/api.ts"
import D from "@/definitions"
import CommentSection from "@/components/CommentSection.tsx"
import ErrorFallback from "@/components/ErrorFallback.tsx"
import LikeIcon from "@/components/icons/LikeIcon.tsx"
import CommentIcon from "@/components/icons/CommentIcon.tsx"
import Spinner from "@/components/Spinner.tsx"

export default function Post(props: D.Post) {
    const queryClient = useQueryClient()

    const [isCommentsOpened, setIsCommentsOpened] = useState(false)

    const isCommentsFetching = useIsFetching({
        queryKey: ["comments", props.id],
    })

    function invalidatePosts() {
        queryClient.invalidateQueries({ queryKey: ["posts"] })
    }

    const { mutate: like } = useMutation({
        mutationFn: () => api.likePost(props.id),
        onSuccess: invalidatePosts,
    })

    const { mutate: unlike } = useMutation({
        mutationFn: () => api.unlikePost(props.id),
        onSuccess: invalidatePosts,
    })

    const authorName = props.author.split("-")[0]
    const isMine = props.author === api.uuid
    const date = new Date(props.createdAt)

    const dateStr = date.toLocaleString("en", {
        year: "numeric",
        weekday: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
    })

    return (
        <div className="md:rouded-3xl relative my-3 rounded-2xl border border-zinc-400 transition-colors duration-300 dark:border-zinc-700 md:my-4">
            <div
                className="p-3 pb-2 shadow-xl shadow-zinc-200/30 transition-shadow duration-300 dark:shadow-zinc-800/30 md:p-4 md:pb-3"
                id={`post-${props.id}`}
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
                <p className="my-2 whitespace-pre-wrap md:my-4">
                    {props.content}
                </p>
                <div className="flex gap-8">
                    <div
                        className="flex cursor-pointer select-none items-center justify-between rounded-xl px-2 py-2 text-zinc-500 transition-all duration-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        onClick={() => (props.isLiked ? unlike() : like())}
                    >
                        <LikeIcon
                            className={`h-5 w-5 ${props.isLiked ? "fill-red-500" : "fill-zinc-500"}`}
                        />
                        <span className="ml-4 ">
                            {props.likesCount}
                        </span>
                    </div>
                    <div
                        onClick={() => setIsCommentsOpened((prev) => !prev)}
                        className={`flex cursor-pointer select-none items-center justify-between rounded-xl px-2 py-2 transition-all duration-300 ${isCommentsOpened ? "bg-emerald-600 text-zinc-100 dark:bg-green-300 dark:text-zinc-900" : "text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800"}`}
                    >
                        {isCommentsFetching ? (
                            <div className="w-5">
                                <Spinner />
                            </div>
                        ) : (
                            <CommentIcon
                                className={`h-5 w-5 transition-all duration-300 ${isCommentsOpened ? "fill-zinc-100 dark:fill-zinc-900" : "fill-zinc-500"}`}
                            />
                        )}
                        <span className="ml-4">{props.commentsCount}</span>
                    </div>
                </div>
            </div>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
                <AnimatePresence>
                    {isCommentsOpened && <CommentSection postId={props.id} />}
                </AnimatePresence>
            </ErrorBoundary>
        </div>
    )
}
