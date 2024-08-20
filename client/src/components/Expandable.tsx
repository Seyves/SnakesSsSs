import { useEffect, useRef, useState } from "react"

type Props = {
    content: string
}

export default function Expandable(props: Props) {
    const [isLargeEnough, setIsLargeEnough] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)

    const contentRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        if (!contentRef.current) return

        const clientRect = contentRef.current.getClientRects()

        setIsLargeEnough(clientRect.length > 6)
    }, [])

    return (
        <span>
            <span
                className={isLargeEnough && !isExpanded ? "line-clamp-6" : ""}
                ref={contentRef}
            >
                {props.content}
            </span>
            {isLargeEnough && (
                <div
                    className="mt-2 cursor-pointer font-bold text-emerald-600 dark:text-green-400"
                    onClick={() => setIsExpanded((prev) => !prev)}
                >
                    {isExpanded ? "Hide" : "Expand"}
                </div>
            )}
        </span>
    )
}
