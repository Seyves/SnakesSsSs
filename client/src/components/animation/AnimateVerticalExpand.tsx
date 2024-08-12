import { settingContext } from "@/App"
import { HTMLMotionProps, motion } from "framer-motion"
import { useContext, useState } from "react"

type Props = {
    children: React.ReactNode
} & HTMLMotionProps<"div">

export default function AnimateVerticalExpand(props: Props) {
    const { isAnimationsEnabled } = useContext(settingContext)

    const [inAnimation, setInAnimation] = useState(true)

    return (
        <motion.div
            {...props}
            initial={isAnimationsEnabled}
            transition={{duration: isAnimationsEnabled ? 0.3 : 0, delay: isAnimationsEnabled ? 0.1 : 0}}
            animate={{ gridTemplateRows: ["0fr", "1fr"] }}
            exit={{ gridTemplateRows: ["1fr", "0fr"] }}
            className={`relative grid ${props.className ? props.className : ""}`}
            onAnimationStart={() => setInAnimation(true)}
            onAnimationComplete={() => setInAnimation(false)}
        >
            <div className={`min-w-0 ${inAnimation ? "overflow-hidden" : ""}`}>
                {props.children}
            </div>
        </motion.div>
    )
}
