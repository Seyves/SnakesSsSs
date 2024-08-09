import D from "@/definitions"
import ToggleSwitch from "./ToggleSwitch"
import Logo from "@/components/Logo"
import { useContext, useEffect, useState } from "react"
import { settingContext } from "@/App"
import { useDebounce } from "@/hooks"
import { motion } from "framer-motion"
import Editor from "./Editor"

type Props = {
    theme: D.Theme
    toggleTheme: () => void
    isAnimationsEnabled: boolean
    toggleAnimations: () => void
}

export default function Header(props: Props) {
    const { isAnimationsEnabled } = useContext(settingContext)

    const [isShrinked, setIsShrinked] = useState(false)

    const shrinkOnScroll = useDebounce(() => {
        setIsShrinked(() => {
            if (window.scrollY > 50) return true
            return false
        })
    }, 10)

    useEffect(() => {
        addEventListener("scroll", shrinkOnScroll)

        return () => removeEventListener("scroll", shrinkOnScroll)
    }, [])

    const transitionClass = isAnimationsEnabled
        ? "transition-all"
        : "transition-colors"

    return (
        <div
            className={`pointer-events-auto transition-all sticky top-0 z-10 border border-zinc-400 dark:border-zinc-700 duration-300 rounded-b-3xl ${isShrinked ? "md:w-[max(50%,400px)] bg-zinc-100/30 dark:bg-zinc-900/30 backdrop-blur-md w-full shadow-md shadow-zinc-300/30 dark:shadow-zinc-700/30" : "bg-normal-color w-full"} ${transitionClass}`}
        >
            <div
                className={`flex justify-between  items-center border-b-0 duration-300 ${isShrinked ? "p-2 md:p-3" : "p-3 md:p-4"} ${transitionClass}`}
            >
                <a href="#root">
                    <Logo
                        className={`box-content duration-300 fill-zinc-700 dark:fill-zinc-300 ${isShrinked ? "w-9 h-9 md:w-12 md-w-12" : "w-12 h-12 md:w-14 md:h-14"} ${transitionClass}`}
                    />
                </a>
                <div className="flex gap-3 items-center">
                    <p className="mb-1 font-light">Theme</p>
                    <ToggleSwitch
                        checked={props.theme === D.THEMES.DARK}
                        toggle={props.toggleTheme}
                    />
                    <p className="mb-1 font-light">Smooth</p>
                    <ToggleSwitch
                        checked={props.isAnimationsEnabled}
                        toggle={props.toggleAnimations}
                    />
                </div>
            </div>
            <motion.div
                initial={false}
                animate={
                    isShrinked
                        ? { gridTemplateRows: ["1fr", "0fr"] }
                        : { gridTemplateRows: ["0fr", "1fr"] }
                }
                transition={{ duration: isAnimationsEnabled ? 0.1 : 0 }}
                className={`grid min-h-0 overflow-hidden rounded-b-3xl dark:border-zinc-700 border-t-0 ${isShrinked ? "p-0" : "p-4"} ${transitionClass}`}
            >
                <div className="overflow-hidden min-h-0">
                    <Editor/>
                </div>
            </motion.div>
        </div>
    )
}
