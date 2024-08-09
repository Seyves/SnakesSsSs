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
import CommentSection from "./CommentSection.tsx"
import ErrorFallback from "@/components/ErrorFallback.tsx"
import LikeIcon from "@/components/icons/LikeIcon.tsx"
import CommentIcon from "@/components/icons/CommentIcon.tsx"
import Spinner from "./Spinner.tsx"

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
        <div className="my-3 md:my-4 border border-zinc-400 dark:border-zinc-700 transition-colors duration-300 rounded-2xl md:rouded-3xl relative">
            <div
                className="p-3 pb-2 md:p-4 md:pb-3 shadow-zinc-200/30 dark:shadow-zinc-800/30 transition-shadow duration-300 shadow-xl"
                id={`post-${props.id}`}
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
                <p className="whitespace-pre-wrap my-2 md:my-4">
                    {props.content}
                </p>
                <div className="flex gap-8">
                    <div
                        className="flex items-center h-10 w-16 justify-between px-2 cursor-pointer select-none hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all duration-300 rounded-xl"
                        onClick={() => (props.isLiked ? unlike() : like())}
                    >
                        <LikeIcon
                            className={`w-5 h-5 ${props.isLiked ? "fill-red-500" : "fill-zinc-500"}`}
                        />
                        <span className="text-zinc-500">
                            {props.likesCount}
                        </span>
                    </div>
                    <div
                        onClick={() => setIsCommentsOpened((prev) => !prev)}
                        className={`flex items-center h-10 w-16 px-2 justify-between cursor-pointer rounded-xl select-none transition-all duration-300 ${isCommentsOpened ? "bg-emerald-600 dark:bg-green-300 text-zinc-100 dark:text-zinc-900" : "text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800"}`}
                    >
                        {isCommentsFetching ? (
                            <Spinner />
                        ) : (
                            <CommentIcon
                                className={`transition-all duration-300 ${isCommentsOpened ? "fill-zinc-100 dark:fill-zinc-900" : "fill-zinc-500"}`}
                            />
                        )}
                        <span className="">{props.commentsCount}</span>
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
