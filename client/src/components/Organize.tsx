import { FormEvent, useState } from "react"
import D from "@/definitions"
import MagnifierIcon from "@/components/icons/MagnifierIcon"
import Spinner from "@/components/Spinner"

type Props = {
    sortBy: D.SortType
    setSortBy: (type: D.SortType) => any
    search: string
    setSearch: (value: string) => any
    isSearchLoading?: boolean
}

export default function Organize(props: Props) {
    const [value, setValue] = useState("")

    function set(type: D.SortType) {
        props.setSortBy(type)
    }

    function onSearchSubmit(e: FormEvent) {
        e.preventDefault()
        props.setSearch(value)
    }

    return (
        <div className="flex items-center gap-2 pt-3 md:gap-3 md:pt-4">
            <div className="mr-5">
                <div className="flex items-center gap-2 font-light md:gap-3">
                <SortButton
                        type={D.SORT_TYPES.DATEDESC}
                        sortBy={props.sortBy}
                        setSortBy={set}
                    >
                        New
                    </SortButton>
                    <SortButton
                        type={D.SORT_TYPES.DATEASC}
                        sortBy={props.sortBy}
                        setSortBy={set}
                    >
                        Old
                    </SortButton>
                    <SortButton
                        type={D.SORT_TYPES.TOPASC}
                        sortBy={props.sortBy}
                        setSortBy={set}
                    >
                        Top
                    </SortButton>
                </div>
            </div>
            <form
                className="min-w-4 flex h-8 flex-shrink items-center rounded-2xl bg-zinc-200 transition-all duration-300 dark:bg-zinc-800 md:h-9 "
                onSubmit={onSearchSubmit}
            >
                <input
                    placeholder="Search sSsSsomething..."
                    value={value}
                    className="mx-2 min-w-0 bg-zinc-200 p-1 outline-none transition-all duration-300 placeholder:text-zinc-500 dark:bg-zinc-800 "
                    onChange={(e) => setValue(e.target.value)}
                />
                <button className="mr-2 flex items-center justify-center rounded-xl bg-zinc-300 px-2 py-1 font-bold text-zinc-100 transition-colors duration-300 dark:bg-zinc-700 dark:text-zinc-800">
                    {props.isSearchLoading ? (
                        <Spinner />
                    ) : (
                        <MagnifierIcon className="h-5 w-5 fill-zinc-900 transition-colors duration-300 dark:fill-zinc-100 md:h-6 md:w-6" />
                    )}
                </button>
            </form>
        </div>
    )
}

type SortButtonProps = {
    type: D.SortType
    children: React.ReactNode
    sortBy: D.SortType
    setSortBy: (type: D.SortType) => any
}

function SortButton(props: SortButtonProps) {
    return (
        <div
            className={`cursor-pointer rounded-lg p-2 transition-colors duration-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 ${props.sortBy === props.type ? "bg-zinc-200 dark:bg-zinc-800" : ""}`}
            onClick={() => props.setSortBy(props.type)}
        >
            {props.children}
        </div>
    )
}
