import { useRef, useState } from "react"
import CommentEditor from "@/components/CommentEditor.tsx"
import ViewportCoverage from "@/components/ViewportCoverage.tsx"
import Organize from "@/components/Organize.tsx"
import D, { Nullable } from "@/definitions.ts"
import { AnimatePresence, motion } from "framer-motion"
import { HTTPError } from "ky"
import { useInfiniteQuery } from "@tanstack/react-query"
import * as api from "@/api.ts"
import Comment from "@/components/Comment"
import AnimateSlideIn from "@/components/animation/AnimateSlideIn.tsx"
import ErrorMessage from "@/components/ErrorFallback.tsx"
import { useContext } from "react"
import { settingContext } from "@/App"
import AnimateVerticalExpand from "@/components/animation/AnimateVerticalExpand"

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
                search.trim(),
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
            <AnimatePresence>
                {isShortcutShown && (
                    <motion.div
                        initial={{
                            bottom: "-4rem"
                        }}
                        animate={{
                            bottom: "2rem"
                        }}
                        exit={{
                            bottom: "-4rem"
                        }}
                        transition={{duration: 0.3}}
                        className="fixed right-5 cursor-pointer rounded-xl border border-zinc-400 bg-zinc-100 p-2 font-light dark:border-zinc-700 dark:bg-zinc-900 md:right-20 md:p-4"
                        onClick={scrollToPost}
                    >
                        Go to post
                    </motion.div>
                )}
            </AnimatePresence>
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
                            <hr className="border-zinc-300 transition-colors duration-300 dark:border-zinc-800" />
                        )}
                    </motion.div>
                ))}
                {hasNextPage && (
                    <div
                        className="mt-4 flex h-8 cursor-pointer items-center justify-center rounded-xl bg-emerald-600 font-bold text-zinc-100 dark:bg-green-300 dark:text-zinc-800 md:h-10"
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
