import type { CommunityPost, CommunityReply, CreateCommunityPostPayload } from "../types/community";

const STORAGE_KEY = "ata_community_posts";

const EXAMPLE_POSTS: CommunityPost[] = [
    {
        id: "sample-community-1",
        userId: "ata-community-sample",
        userName: "Minh Anh",
        type: "discussion",
        title: "Stardew Valley đúng kiểu chơi một ngày trong game mà quay ra đã hết buổi tối",
        content: "Ban đầu mình chỉ định tưới cây rồi đi ngủ sớm, cuối cùng lại lang thang xuống mỏ rồi tranh thủ ghé lễ hội. Mọi người thường ưu tiên nâng cấp nông trại hay đi khám phá trước vậy?",
        gameId: "413150",
        gameTitle: "Stardew Valley",
        gameCover: "/images/games/413150-cover.jpg",
        likes: [],
        replies: [],
        createdAt: "2026-11-01T10:00:00.000Z",
    },
    {
        id: "sample-community-2",
        userId: "ata-community-sample",
        userName: "Quốc Bảo",
        type: "question",
        title: "Mới vào Elden Ring thì nên khám phá hướng nào trước?",
        content: "Mình vừa bắt đầu chơi lần đầu, đang hơi choáng vì bản đồ rộng quá. Có khu vực nào nên khám phá trước để làm quen game mà không bị spoil cốt truyện không?",
        gameId: "1245620",
        gameTitle: "Elden Ring",
        gameCover: "/images/games/1245620-cover.jpg",
        likes: [],
        replies: [],
        createdAt: "2026-11-02T10:00:00.000Z",
    },
    {
        id: "sample-community-3",
        userId: "ata-community-sample",
        userName: "Hoàng Nam",
        type: "achievement",
        title: "Cuối cùng cũng dành cả buổi tối dạo hết Night City",
        content: "Mình cứ định làm thêm một nhiệm vụ phụ rồi lại bị cuốn sang một góc khác của thành phố. Khu vực nào trong game là nơi mọi người thích quay lại ngắm cảnh nhất?",
        gameId: "1091500",
        gameTitle: "Cyberpunk 2077",
        gameCover: "/images/games/1091500-cover.jpg",
        likes: [],
        replies: [],
        createdAt: "2026-11-03T10:00:00.000Z",
    },
];

function readLocalPosts(): CommunityPost[] {
    try {
        const stored: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
        if (!Array.isArray(stored)) {
            console.warn("Dữ liệu bài viết cộng đồng trong trình duyệt không hợp lệ.");
            return [];
        }
        return stored.filter((post): post is CommunityPost =>
            typeof post === "object" && post !== null &&
            "id" in post && typeof post.id === "string" &&
            "userId" in post && typeof post.userId === "string" &&
            "userName" in post && typeof post.userName === "string" &&
            "type" in post && (post.type === "discussion" || post.type === "question" || post.type === "achievement") &&
            "title" in post && typeof post.title === "string" &&
            "content" in post && typeof post.content === "string" &&
            "createdAt" in post && typeof post.createdAt === "string"
        ).map((post) => ({
            ...post,
            likes: Array.isArray(post.likes) ? post.likes.filter((id): id is string => typeof id === "string") : [],
            replies: Array.isArray(post.replies)
                ? post.replies.filter((reply) =>
                    typeof reply === "object" && reply !== null &&
                    "id" in reply && typeof reply.id === "string" &&
                    "userId" in reply && typeof reply.userId === "string" &&
                    "userName" in reply && typeof reply.userName === "string" &&
                    "content" in reply && typeof reply.content === "string" &&
                    "createdAt" in reply && typeof reply.createdAt === "string"
                )
                : [],
        }));
    } catch (error) {
        console.warn("Không thể đọc bài viết cộng đồng đã lưu.", error);
        return [];
    }
}

function saveLocalPosts(posts: CommunityPost[]): boolean {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
        return true;
    } catch (error) {
        console.error("Không thể lưu bài viết cộng đồng trên thiết bị.", error);
        return false;
    }
}

function mergePosts(...groups: CommunityPost[][]): CommunityPost[] {
    const map = new Map<string, CommunityPost>();
    groups.flat().forEach((post) => map.set(post.id, post));
    return Array.from(map.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const communityService = {
    async getPosts(): Promise<CommunityPost[]> {
        const seeds = new Map(EXAMPLE_POSTS.map((post) => [post.id, post]));
        const localPosts = readLocalPosts().map((post) => {
            const seed = seeds.get(post.id);
            return seed ? { ...seed, likes: post.likes, replies: post.replies } : post;
        });
        return mergePosts(EXAMPLE_POSTS, localPosts);
    },

    async createPost(payload: CreateCommunityPostPayload): Promise<CommunityPost> {
        const post: CommunityPost = {
            ...payload,
            id: `community-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            likes: [],
            replies: [],
            createdAt: new Date().toISOString(),
        };
        if (!saveLocalPosts(mergePosts(readLocalPosts(), [post]))) {
            throw new Error("Không thể lưu bài viết trên thiết bị này. Vui lòng thử lại.");
        }
        return post;
    },

    async toggleLike(post: CommunityPost, userId: string): Promise<CommunityPost> {
        const likes = post.likes.includes(userId)
            ? post.likes.filter((id) => id !== userId)
            : [...post.likes, userId];
        const updated = { ...post, likes };
        const localPosts = readLocalPosts();
        const merged = mergePosts(localPosts.filter((item) => item.id !== post.id), [updated]);
        if (!saveLocalPosts(merged)) {
            throw new Error("Không thể lưu thay đổi lượt thích trên thiết bị.");
        }
        return updated;
    },

    async addReply(
        post: CommunityPost,
        replyPayload: Omit<CommunityReply, "id" | "createdAt">
    ): Promise<CommunityPost> {
        const reply: CommunityReply = {
            ...replyPayload,
            id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            createdAt: new Date().toISOString(),
        };
        const updated = { ...post, replies: [...post.replies, reply] };
        const localPosts = readLocalPosts();
        if (!saveLocalPosts(mergePosts(localPosts.filter((item) => item.id !== post.id), [updated]))) {
            throw new Error("Không thể lưu câu trả lời trên thiết bị.");
        }
        return updated;
    },
};
