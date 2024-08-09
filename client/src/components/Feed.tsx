import { useState } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { HTTPError } from "ky"
import { useInfiniteQuery } from "@tanstack/react-query"
import D from "@/definitions.ts"
import * as api from "@/api.ts"
import Post from "@/components/Post.tsx"
import AnimateSlideIn from "@/components/animation/AnimateSlideIn.tsx"
import Organize from "@/components/Organize.tsx"
import ErrorFallback from "@/components/ErrorFallback"
import SpinnerCentered from "./SpinnerCentered"

export default function Feed() {
    const [search, setSearch] = useState("")

    const [sortBy, setSortBy] = useState<D.SortType>(D.SORT_TYPES.DATEDESC)

    let {
        data: posts,
        fetchNextPage,
        isLoading,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery<
        api.GetPostsResp,
        HTTPError,
        D.Post[],
        (string | number)[],
        number
    >({
        queryKey: ["posts", sortBy, search],
        initialPageParam: 0,
        getNextPageParam: (prevPage) => prevPage.nextOffset,
        queryFn: ({ signal, pageParam }) =>
            api.getPosts(signal, sortBy, search.trim(), pageParam),
        select: (data) => {
            return data.pages.flatMap((page) => page.posts)
        },
    })

    posts = posts ?? []

    return (
        <div className="mt-4">
            <ErrorBoundary FallbackComponent={ErrorFallback}>
                <Organize
                    search={search}
                    setSearch={setSearch}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                />
                {isLoading ? (
                    <SpinnerCentered />
                ) : (
                    <div className="">
                        {posts.map((post) => (
                            <AnimateSlideIn key={post.id}>
                                <Post {...post} />
                            </AnimateSlideIn>
                        ))}
                        {isFetchingNextPage && <SpinnerCentered />}
                        {!isFetchingNextPage && hasNextPage && (
                            <div
                                className="cursor-pointer bg-emerald-600 my-4 dark:bg-green-300 font-bold h-8 md:h-10 rounded-xl text-zinc-100 dark:text-zinc-800 flex items-center justify-center"
                                onClick={() => fetchNextPage()}
                            >
                                Show more
                            </div>
                        )}
                    </div>
                )}
            </ErrorBoundary>
        </div>
    )
}
