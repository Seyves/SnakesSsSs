type Props = {
    checked: boolean
    toggle: () => void
}

export default function ToggleSwitch(props: Props) {
    return (
        <label
            className="relative block h-4 w-8 md:h-5 md:w-10"
            onClick={() => props.toggle()}
        >
            <input
                className="peer absolute h-0 w-0 opacity-0"
                type="checkbox"
                checked={props.checked}
                readOnly
                onClick={(e) => e.stopPropagation()}
            />
            <span className="flex h-full w-full cursor-pointer rounded-full border-2 border-solid border-zinc-300 bg-zinc-300 transition-colors duration-300 before:duration-200 after:aspect-[1/1] after:rounded-[50%] after:bg-zinc-800 after:transition-[0.2s] peer-checked:before:grow dark:border-zinc-700 dark:bg-zinc-700 dark:after:bg-zinc-100"></span>
        </label>
    )
}
