import { useEffect, useRef } from "react"

type Props = {
    ratio?: number
    onChange: (value: boolean) => any
}

//Component for detecting when element is taking up {ratio} of viewport
export default function ViewportCoverage({ratio = 1, onChange}: Props) {
    const element = useRef<HTMLDivElement>(null)

    function processEntries(entries: IntersectionObserverEntry[]) {
        entries.forEach((entry) => {
            if (!element.current) return
            
            if (element.current.clientHeight < window.innerHeight) return

            onChange(entry.intersectionRatio >= ratio)
        })
    }

    useEffect(() => {
        if (!element.current) return

        const observer = new IntersectionObserver(processEntries, {
            threshold: [ratio],
        })

        observer.observe(element.current)

        return () => observer.disconnect()
    }, [])

    return (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 top-0">
            <div
                ref={element}
                className="pointer-events-none sticky left-0 top-0 h-[min(100vh,100%)] w-full"
            ></div>
        </div>
    )
}
