import { useQuery } from "@tanstack/react-query"
import { HTTPError } from "ky"

type Props = {
    error: Error
}

export default function ErrorFallback(props: Props) {
    return (
        <div>
            <div className="p-2 font-bold text-red-500 flex items-center text-center flex-col justify-center">
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
