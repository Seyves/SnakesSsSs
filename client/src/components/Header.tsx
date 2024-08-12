import D from "@/definitions"
import ToggleSwitch from "@/components/ToggleSwitch"
import Logo from "@/components/Logo"
import { useContext, useEffect, useState } from "react"
import { settingContext } from "@/App"
import { useDebounce } from "@/hooks"
import { motion } from "framer-motion"
import Editor from "@/components/Editor"

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
            if (window.scrollY > 20) return true
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
            className={`pointer-events-auto sticky top-0 z-10 rounded-b-3xl border border-zinc-400 transition-all duration-300 dark:border-zinc-700 ${isShrinked ? "w-full bg-zinc-100/30 shadow-md shadow-zinc-300/30 backdrop-blur-md dark:bg-zinc-900/30 dark:shadow-zinc-700/30 md:w-[max(50%,400px)]" : "w-full bg-zinc-100 transition-all duration-300 dark:bg-zinc-900"} ${transitionClass}`}
        >
            <div
                className={`flex items-center  justify-between border-b-0 duration-300 ${isShrinked ? "p-2 md:p-3" : "p-3 md:p-4"} ${transitionClass}`}
            >
                <a href="#root">
                    <Logo
                        className={`box-content fill-zinc-700 duration-300 dark:fill-zinc-300 ${isShrinked ? "md-w-12 h-9 w-9 md:w-12" : "h-12 w-12 md:h-14 md:w-14"} ${transitionClass}`}
                    />
                </a>
                <div className="flex items-center gap-3">
                    <p className="mb-1 font-light">Dark theme</p>
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
                transition={{ duration: isAnimationsEnabled ? 0.3 : 0 }}
                className={`grid min-h-0 overflow-hidden rounded-b-3xl border-t-0 dark:border-zinc-700 ${isShrinked ? "p-0" : "py-4"} ${transitionClass}`}
            >
                <div className="min-h-0 overflow-hidden">
                    <Editor/>
                </div>
            </motion.div>
        </div>
    )
}
