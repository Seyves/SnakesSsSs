import { FormEvent, useState } from "react"
import D from "../definitions"
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
        <div className="flex items-center pt-3 md:pt-4 gap-2 md:gap-3">
            <div className="mr-5">
                <div className="flex gap-2 md:gap-3 items-center font-light">
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
                className="flex items-center flex-shrink min-w-4 h-8 md:h-9 bg-accent-color rounded-2xl "
                onSubmit={onSearchSubmit}
            >
                <input
                    placeholder="Search sssSSsomething..."
                    value={value}
                    className="placeholder:text-zinc-500 outline-none min-w-0 bg-accent-color mx-2 p-1 "
                    onChange={(e) => setValue(e.target.value)}
                />
                <button className="bg-zinc-300 dark:bg-zinc-700 py-1 px-2 rounded-xl mr-2 text-zinc-100 dark:text-zinc-800 font-bold flex items-center justify-center transition-colors duration-300">
                    {props.isSearchLoading ? (
                        <Spinner />
                    ) : (
                        <MagnifierIcon className="transition-colors duration-300 w-5 h-5 md:w-6 md:h-6 dark:fill-zinc-100 fill-zinc-900" />
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
            className={`cursor-pointer transition-colors duration-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 p-2 rounded-lg ${props.sortBy === props.type ? "bg-zinc-200 dark:bg-zinc-800" : ""}`}
            onClick={() => props.setSortBy(props.type)}
        >
            {props.children}
        </div>
    )
}
