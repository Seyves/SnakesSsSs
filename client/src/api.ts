import ky from "ky"
import D from "@/definitions"

const serverUrl = import.meta.env.VITE_SERVER_URL

export let token = ""
export let uuid = ""
export let client = ky.create({})

export type GetPostsResp = { posts: D.Post[]; nextOffset: number }
export type GetCommentsResp = { comments: D.Comment[]; nextOffset: number }

export async function getPosts(
    signal: AbortSignal,
    sortBy: D.SortType,
    search: string,
    offset: number,
) {
    const resp = await client.get(`posts`, {
        signal,
        searchParams: {
            sortBy,
            search,
            offset,
        },
    })

    return resp.json<GetPostsResp>()
}

export async function createPost(content: string) {
    await client.post(`posts`, { body: JSON.stringify({ content }) })
}

export async function likePost(postId: number) {
    await client.post(`posts/${postId}/like`)
}

export async function unlikePost(postId: number) {
    await client.delete(`posts/${postId}/like`)
}

export async function getComments(
    signal: AbortSignal,
    postId: number,
    sortBy: D.SortType,
    search: string,
    offset: number,
) {
    const resp = await client.get(`posts/${postId}/comments`, {
        signal,
        searchParams: {
            sortBy,
            search,
            offset,
        },
    })

    return resp.json<GetCommentsResp>()
}

export async function getComment(signal: AbortSignal, commentId: number) {
    const resp = await client.get(`comments/${commentId}`, { signal })

    return resp.json<D.Comment>()
}

export async function createComment({
    postId,
    content,
    reply,
}: {
    postId: number
    content: string
    reply?: number
}) {
    const body: { content: string; reply?: number } = { content }

    if (reply) {
        body.reply = reply
    }

    await client.post(`posts/${postId}/comments`, {
        body: JSON.stringify(body),
    })
}

export async function likeComment(commentId: number) {
    await client.post(`comments/${commentId}/like`)
}

export async function unlikeComment(commentId: number) {
    await client.delete(`comments/${commentId}/like`)
}

type AuthResp = {
    uuid: string
    token: string
}

export async function createAPI() {
    const resp = await client.post(`${serverUrl}/auth`)

    const json = await resp.json<AuthResp>()

    uuid = json.uuid
    token = json.token

    client = ky.create({
        retry: 0,
        throwHttpErrors: true,
        prefixUrl: serverUrl,
        headers: {
            Authorization: token,
        },
    })
}
