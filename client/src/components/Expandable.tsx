import { useState } from "react"

type Props = {
    content: string
}

export default function Expandable(props: Props) {
    const [isExpanded, setIsExpanded] = useState(false)

    const isEnoughLenght = props.content.length > 200

    if (isEnoughLenght && !isExpanded) {
        return (
            <span>
                <span>{props.content.slice(0, 200).trimEnd()}... </span>
                <span
                    className="cursor-pointer font-bold text-emerald-600 dark:text-green-400"
                    onClick={() => setIsExpanded(true)}
                >
                    Expand
                </span>
            </span>
        )
    }

    if (isEnoughLenght && isExpanded) {
        return (
            <span>
                <span>{props.content} </span>
                <span
                    className="cursor-pointer font-bold text-emerald-600 dark:text-green-400"
                    onClick={() => setIsExpanded(false)}
                >
                    Hide 
                </span>
            </span>
        )
    }

    return (
        <span>
            <span>{props.content}</span>
        </span>
    )
}
