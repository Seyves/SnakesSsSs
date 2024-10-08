import { useCallback, useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AnimatePresence } from "framer-motion"
import D from "@/definitions"
import * as api from "@/api.ts"
import Comment from "@/components/Comment"
import AnimateSlideIn from "@/components/animation/AnimateSlideIn.tsx"
import { convertPixelsToRem } from "@/functions"

type Props = {
    commentId: number
    author: string
    postId: number
    reply: D.Reply
}

export default function ReplyLink(props: Props) {
    const [isShown, setIsShown] = useState(false)

    const isEnoughSpaceForPopup = window.innerWidth > 768 

    const { data: comment } = useQuery({
        enabled: isEnoughSpaceForPopup,
        queryKey: ["comment", props.commentId],
        queryFn: ({ signal }) => api.getComment(signal, props.commentId),
    })

    //for proper popup position
    const onPopupAppear = useCallback((node: HTMLDivElement | null) => {
        if (node === null) return

        const parent = node.closest(".reply")
        if (parent === null) return

        const rect = node.getBoundingClientRect()
        const parentRect = node.getBoundingClientRect()

        if (rect.bottom > window.innerHeight) {
            node.style.bottom = "0rem"
        } else {
            node.style.top = "1.5rem"
        }

        if (rect.right > window.innerWidth) {
            if (parentRect.left < rect.width) {
                const px = rect.width - parentRect.right
                node.style.left = `${convertPixelsToRem(px)}rem`
            } else {
                node.style.right = "-5rem"
            }
        } else {
            node.style.left = "0.5rem"
        }
    }, [])

    useEffect(() => {
        function clickListener() {
            setIsShown(false)
        }

        document.addEventListener("click", clickListener)

        return () => document.removeEventListener("click", clickListener)
    }, [])

    const scrollToReplied = () => {
        const comment = document.getElementById(`comment-${props.commentId}`)

        if (comment) {
            comment.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "center",
            })
        }
    }

    return (
        <div
            className="reply relative flex"
            onMouseLeave={() => {
                setIsShown(false)
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <div
                className="-mx-2 -mt-2 cursor-pointer select-none p-2 text-xs text-emerald-600 transition-colors duration-300 dark:text-green-300 md:text-sm"
                onClick={() => {
                    if (isEnoughSpaceForPopup) {
                        setIsShown((prev) => !prev)
                    } else {
                        scrollToReplied()
                    }
                }}
            >
                To @{props.author.split("-")[0]}:
            </div>
            <AnimatePresence>
                {isShown && comment && (
                    <AnimateSlideIn
                        className="absolute z-20"
                        duration={0.3}
                        exit={true}
                    >
                        <div
                            ref={onPopupAppear}
                            className="absolute box-content min-w-[400px] p-2 "
                        >
                            <div
                                className={`popup rounded-xl border border-zinc-400 bg-zinc-100 p-1 transition-colors duration-300 dark:border-zinc-600 dark:bg-zinc-900`}
                            >
                                <Comment
                                    {...comment}
                                    postId={props.postId}
                                    reply={props.reply}
                                />
                            </div>
                        </div>
                    </AnimateSlideIn>
                )}
            </AnimatePresence>
        </div>
    )
}
