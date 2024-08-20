type Props = {
    children?: React.ReactNode
} & React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
>

export default function Button(props: Props) {
    return (
        <button
            {...props}
            className={`flex h-8 w-20 items-center justify-center rounded-2xl bg-emerald-600 font-bold text-zinc-100 transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-300 dark:text-zinc-800 md:h-10 md:w-24 ${props.className ?? ""}`}
        >
            {props.children}
        </button>
    )
}
