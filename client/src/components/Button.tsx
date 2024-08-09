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
            className="bg-emerald-600 dark:bg-green-300 text-zinc-100 dark:text-zinc-800 font-bold rounded-2xl w-20 h-8 md:w-24 md:h-10 flex items-center justify-center transition-colors duration-300"
        >
            {props.children}
        </button>
    )
}
