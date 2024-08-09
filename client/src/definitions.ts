export type Nullable<T> = T | null

namespace D {
    export type Post = {
        id: number
        author: string
        createdAt: string
        content: string
        likesCount: number
        commentsCount: number
        isLiked: boolean
    }

    export type Comment = {
        id: number
        author: string
        content: string
        createdAt: string
        likesCount: number
        isLiked: boolean
        replyCommentId: number | null
        replyCommentAuthor: string | null
    }

    type Values<T extends Object> = T[keyof T]

    export const THEMES = {
        LIGHT: "light",
        DARK: "dark"
    } as const

    export type Theme = Values<typeof THEMES>

    export const SORT_TYPES = {
        DATEASC: "dateasc",
        DATEDESC: "datedesc",
        TOPASC: "topasc",
    } as const

    export type SortType = Values<typeof SORT_TYPES>

    export type ReplyTarget = Pick<D.Comment, "id" | "author">

    export type Reply = (target: ReplyTarget) => void
}

export default D
