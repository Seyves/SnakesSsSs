import { createContext, useEffect, useState } from "react"
import D from "@/definitions"
import {
    getStoragedAnimations,
    getStoragedTheme,
    setStorageAnimations,
    setStorageTheme,
} from "@/functions.ts"
import Feed from "@/components/Feed.tsx"
import Header from "@/components/Header"

type Settings = {
    isAnimationsEnabled: boolean
}

export const settingContext = createContext<Settings>({
    isAnimationsEnabled: true,
})

export default function App() {
    const [theme, setTheme] = useState<D.Theme>(getStoragedTheme())
    const [isAnimationsEnabled, setIsAnimationsEnabled] = useState(
        getStoragedAnimations(),
    )

    useEffect(() => {
        setStorageTheme(theme)

        const html = document.querySelector("html")

        if (html) {
            html.className = theme
        }
    }, [theme])

    function toggleTheme() {
        setTheme((prev) => {
            return prev === D.THEMES.DARK ? D.THEMES.LIGHT : D.THEMES.DARK
        })
    }

    function toggleAnimations() {
        setIsAnimationsEnabled((prev) => {
            setStorageAnimations(!prev)
            return !prev
        })
    }

    return (
        <settingContext.Provider value={{ isAnimationsEnabled }}>
            <div className="px-2 text-sm sm:px-20 md:px-40 md:text-base lg:px-60 xl:px-[20rem] 2xl:px-[30rem]">
                <div className="relative">
                    <div className="t-0 pointer-events-none absolute flex h-full w-full items-start justify-center">
                        <Header
                            theme={theme}
                            toggleTheme={toggleTheme}
                            isAnimationsEnabled={isAnimationsEnabled}
                            toggleAnimations={toggleAnimations}
                        />
                    </div>
                    <div className="pt-64 md:pt-[21rem]">
                        <Feed />
                    </div>
                </div>
            </div>
        </settingContext.Provider>
    )
}
