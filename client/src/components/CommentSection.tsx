import { useRef, useState } from "react"
import CommentEditor from "@/components/CommentEditor.tsx"
import ViewportCoverage from "@/components/ViewportCoverage.tsx"
import Organize from "@/components/Organize.tsx"
import D, { Nullable } from "@/definitions.ts"
import { motion } from "framer-motion"
import { HTTPError } from "ky"
import { useInfiniteQuery } from "@tanstack/react-query"
import * as api from "@/api.ts"
import Comment from "@/components/Comment"
import AnimateSlideIn from "@/components/animation/AnimateSlideIn.tsx"
import ErrorMessage from "@/components/ErrorFallback.tsx"
import { useContext } from "react"
import { settingContext } from "@/App"
import AnimateVerticalExpand from "./animation/AnimateVerticalExpand"

type Props = {
    postId: number
}

export default function CommentSection(props: Props) {
    const { isAnimationsEnabled } = useContext(settingContext)

    const [sortBy, setSortBy] = useState<D.SortType>(D.SORT_TYPES.DATEASC)
    const [search, setSearch] = useState("")

    const [isShortcutShown, setIsShortcutShown] = useState(false)
    const [replyTarget, setReplyTarget] =
        useState<Nullable<D.ReplyTarget>>(null)

    const queryKey = ["comments", props.postId, sortBy, search]

    let {
        data: comments,
        error,
        hasNextPage,
        fetchNextPage,
        isLoading,
    } = useInfiniteQuery<
        api.GetCommentsResp,
        HTTPError,
        D.Comment[],
        (string | number)[],
        number
    >({
        queryKey,
        getNextPageParam: (prevPage) => prevPage.nextOffset,
        initialPageParam: 0,
        queryFn: ({ signal, pageParam }) => {
            return api.getComments(
                signal,
                props.postId,
                sortBy,
                search,
                pageParam,
            )
        },
        placeholderData: (prev) => prev,
        select: (data) => {
            return data.pages.flatMap((page) => page.comments)
        },
    })

    const commentInputRef = useRef<HTMLTextAreaElement>(null)

    function scrollToPost() {
        const element = document.getElementById(`post-${props.postId}`)

        if (!element) return

        element.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "center",
        })
    }

    function reply(target: D.ReplyTarget) {
        setReplyTarget(target)

        if (commentInputRef.current) {
            commentInputRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "center",
            })
            commentInputRef.current.select()
        }
    }

    if (isLoading) {
        return <></>
    }

    if (error) {
        return <ErrorMessage error={error} />
    }

    comments = comments ?? []

    return (
        <AnimateVerticalExpand>
            <ViewportCoverage
                ratio={0.95}
                onChange={(value) => setIsShortcutShown(value)}
            />
            {isShortcutShown && (
                <div
                    className="p-2 md:p-4 cursor-pointer font-light rounded-xl fixed bottom-4 md:bottom-10 right-5 bg-normal-color md:right-20 shadow-zinc-300 dark:shadow-zinc-700 transition-shadow duration-300 shadow-2xl"
                    onClick={scrollToPost}
                >
                    Go to post
                </div>
            )}
            {(comments.length > 1 || search !== "") && (
                <div className="px-6 md:px-10">
                    <Organize
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        search={search}
                        setSearch={setSearch}
                    />
                </div>
            )}
            <div className="px-4 pt-2 md:px-8">
                {comments.map((comment, i) => (
                    <motion.div layout={isAnimationsEnabled} key={comment.id}>
                        <AnimateSlideIn key={comment.id}>
                            <Comment
                                {...comment}
                                original={true}
                                postId={props.postId}
                                reply={reply}
                            />
                        </AnimateSlideIn>
                        {i !== comments.length - 1 && (
                            <hr className="border-zinc-300 dark:border-zinc-800 transition-colors duration-300" />
                        )}
                    </motion.div>
                ))}
                {hasNextPage && (
                    <div
                        className="cursor-pointer bg-emerald-600 mt-4 dark:bg-green-300 font-bold h-8 md:h-10 rounded-xl text-zinc-100 dark:text-zinc-800 flex items-center justify-center"
                        onClick={() => fetchNextPage()}
                    >
                        Show more
                    </div>
                )}
            </div>
            <CommentEditor
                postId={props.postId}
                replyTarget={replyTarget}
                setReplyTarget={setReplyTarget}
                reply={reply}
                ref={commentInputRef}
            />
        </AnimateVerticalExpand>
    )
}
