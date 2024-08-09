import { settingContext } from "@/App"
import { motion } from "framer-motion"
import { useContext } from "react"

type Props = {
    children: React.ReactNode
    exit?: boolean
    className?: string
    duration?: number
}

export default function AnimateSlideIn(props: Props) {
    const { isAnimationsEnabled } = useContext(settingContext)

    const exit = {
        opacity: [1, 0],
        x: [0, -20, 200],
        transition: {
            duration: isAnimationsEnabled ? props.duration ?? 0.5 : 0,
            ease: "easeIn",
        },
    }

    return (
        <motion.div
            initial={isAnimationsEnabled}
            animate={{ x: [200, -20, 0], opacity: [0, 1] }}
            exit={props.exit ? exit : {}}
            transition={{ duration: isAnimationsEnabled ? props.duration ?? 0.5 : 0, ease: "easeOut" }}
            className={props.className}
        >
            {props.children}
        </motion.div>
    )
}
