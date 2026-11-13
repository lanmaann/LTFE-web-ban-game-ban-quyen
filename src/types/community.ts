export type CommunityPostType = "discussion" | "question" | "achievement";

export interface CommunityReply {
    id: string;
    userId: string;
    userName: string;
    content: string;
    createdAt: string;
}

export interface CommunityPost {
    id: string;
    userId: string;
    userName: string;
    type: CommunityPostType;
    title: string;
    content: string;
    gameId?: string;
    gameTitle?: string;
    gameCover?: string;
    likes: string[];
    replies: CommunityReply[];
    createdAt: string;
}

export interface CreateCommunityPostPayload {
    userId: string;
    userName: string;
    type: CommunityPostType;
    title: string;
    content: string;
    gameId?: string;
    gameTitle?: string;
    gameCover?: string;
}
