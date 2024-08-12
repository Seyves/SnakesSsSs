import { useQuery } from "@tanstack/react-query"
import { HTTPError } from "ky"

type Props = {
    error: Error
}

export default function ErrorFallback(props: Props) {
    return (
        <div>
            <div className="flex flex-col items-center justify-center p-2 text-center font-bold text-red-500">
                <p>Oops, an error has occured :(</p>
                <div>
                    {props.error instanceof HTTPError ? (
                        <HttpErrorMessage error={props.error} />
                    ) : (
                        props.error.message
                    )}
                </div>
            </div>
        </div>
    )
}

function HttpErrorMessage(props: { error: HTTPError }) {
    const { data } = useQuery({
        queryKey: [props.error],
        queryFn: () => props.error.response.clone().json(),
    })

    return <span>HttpResponse: {data ? data.error : ""}</span>
}
