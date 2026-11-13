import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    Gamepad2,
    Heart,
    ImagePlus,
    MessageCircle,
    MessageSquareText,
    Search,
    Send,
    Sparkles,
    Trophy,
    UsersRound,
} from "lucide-react";
import type { CommunityPost, CommunityPostType } from "../types/community";
import { communityService } from "../services/communityService";
import { useAuth } from "../auth/useAuth";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchGames, selectGames, selectGamesStatus } from "../store/gamesSlice";

type FeedFilter = "all" | CommunityPostType;
const PAGE_LOADED_AT = Date.now();

const postTypes: { id: CommunityPostType; label: string; icon: typeof MessageCircle }[] = [
    { id: "discussion", label: "Thảo luận", icon: MessageCircle },
    { id: "question", label: "Hỏi đáp", icon: MessageSquareText },
    { id: "achievement", label: "Thành tích", icon: Trophy },
];

const filterTabs: { id: FeedFilter; label: string }[] = [
    { id: "all", label: "Tất cả" },
    ...postTypes,
];

function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("vi-VN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
}

function getPostTypeLabel(type: CommunityPostType) {
    return postTypes.find((item) => item.id === type)?.label ?? "Thảo luận";
}

export default function Community() {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const games = useAppSelector(selectGames);
    const gamesStatus = useAppSelector(selectGamesStatus);
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [filter, setFilter] = useState<FeedFilter>("all");
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [composerOpen, setComposerOpen] = useState(false);
    const [postType, setPostType] = useState<CommunityPostType>("discussion");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [selectedGameId, setSelectedGameId] = useState("");
    const [sending, setSending] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyDraft, setReplyDraft] = useState("");
    const [busyAction, setBusyAction] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    useEffect(() => {
        let active = true;
        void communityService.getPosts().then((loadedPosts) => {
            if (!active) return;
            setPosts(loadedPosts);
            setLoading(false);
        });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (gamesStatus === "idle") void dispatch(fetchGames());
    }, [dispatch, gamesStatus]);

    const normalizedQuery = query.trim().toLocaleLowerCase("vi");
    const visiblePosts = useMemo(() => posts.filter((post) => {
        const matchesFilter = filter === "all" || post.type === filter;
        const searchable = `${post.title} ${post.content} ${post.userName} ${post.gameTitle ?? ""}`.toLocaleLowerCase("vi");
        return matchesFilter && (!normalizedQuery || searchable.includes(normalizedQuery));
    }), [filter, normalizedQuery, posts]);

    const upcomingGames = useMemo(() => games
        .filter((game) => {
            const releaseTime = new Date(game.releaseDate).getTime();
            return Number.isFinite(releaseTime) && releaseTime > PAGE_LOADED_AT;
        })
        .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate))
        .slice(0, 3), [games]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!user) return;
        const cleanTitle = title.trim();
        const cleanContent = content.trim();
        if (cleanTitle.length < 5 || cleanContent.length < 10) {
            setError("Tiêu đề cần ít nhất 5 ký tự và nội dung ít nhất 10 ký tự.");
            return;
        }
        const game = games.find((item) => item.id === selectedGameId);
        setSending(true);
        setError("");
        setNotice("");
        try {
            const createdPost = await communityService.createPost({
                userId: user.id,
                userName: user.name,
                type: postType,
                title: cleanTitle,
                content: cleanContent,
                ...(game ? {
                    gameId: game.id,
                    gameTitle: game.title,
                    gameCover: game.coverImage,
                } : {}),
            });
            setPosts((current) => [createdPost, ...current.filter((post) => post.id !== createdPost.id)]);
            setNotice("Đã đăng bài viết. Bài được lưu trên thiết bị hiện tại.");
            setTitle("");
            setContent("");
            setSelectedGameId("");
            setPostType("discussion");
            setComposerOpen(false);
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Không thể đăng bài. Vui lòng thử lại.");
        } finally {
            setSending(false);
        }
    }

    async function handleLike(post: CommunityPost) {
        if (!user) {
            navigate("/login", { state: { from: location } });
            return;
        }
        setBusyAction(`like-${post.id}`);
        setError("");
        try {
            const updatedPost = await communityService.toggleLike(post, user.id);
            setPosts((current) => current.map((item) => item.id === post.id ? updatedPost : item));
        } catch (actionError) {
            setError(actionError instanceof Error ? actionError.message : "Không thể cập nhật lượt thích.");
        } finally {
            setBusyAction("");
        }
    }

    async function handleReply(event: FormEvent<HTMLFormElement>, post: CommunityPost) {
        event.preventDefault();
        if (!user) return;
        const cleanReply = replyDraft.trim();
        if (cleanReply.length < 2) {
            setError("Câu trả lời cần có ít nhất 2 ký tự.");
            return;
        }
        setBusyAction(`reply-${post.id}`);
        setError("");
        try {
            const updatedPost = await communityService.addReply(post, {
                userId: user.id,
                userName: user.name,
                content: cleanReply,
            });
            setPosts((current) => current.map((item) => item.id === post.id ? updatedPost : item));
            setReplyDraft("");
            setReplyingTo(null);
            setNotice("Đã gửi câu trả lời. Nội dung được lưu trên thiết bị hiện tại.");
        } catch (replyError) {
            setError(replyError instanceof Error ? replyError.message : "Không thể gửi câu trả lời.");
        } finally {
            setBusyAction("");
        }
    }

    return (
        <div className="community-page">
            <header className="community-hero">
                <div className="community-hero__copy">
                    <span className="community-eyebrow"><UsersRound size={15} /> ATA GAMES · CỘNG ĐỒNG</span>
                    <h1>Chơi game vui hơn<br /><span>khi có đồng đội.</span></h1>
                    <p>Chia sẻ câu chuyện, hỏi đáp và cùng nhau khám phá thế giới game.</p>
                    {user ? (
                        <button className="community-primary-button" type="button" onClick={() => setComposerOpen(true)}>
                            <ImagePlus size={17} /> Tạo bài viết
                        </button>
                    ) : (
                        <Link className="community-primary-button" to="/login" state={{ from: location }}>
                            <UsersRound size={17} /> Tham gia cộng đồng
                        </Link>
                    )}
                </div>
                <div className="community-hero__art" aria-hidden="true">
                    <div className="community-hero__game community-hero__game--back"><img src="/images/games/1091500-banner.jpg" alt="" /></div>
                    <div className="community-hero__game community-hero__game--front"><img src="/images/games/1245620-banner.jpg" alt="" /></div>
                </div>
            </header>

            <div className="community-highlights">
                <div><span className="community-highlight__icon"><MessageCircle size={19} /></span><span><strong>Thảo luận</strong><small>Chia sẻ góc nhìn game</small></span></div>
                <div><span className="community-highlight__icon"><MessageSquareText size={19} /></span><span><strong>Hỏi đáp</strong><small>Cùng nhau tìm câu trả lời</small></span></div>
                <div><span className="community-highlight__icon"><Trophy size={19} /></span><span><strong>Thành tích</strong><small>Khoe những khoảnh khắc đáng nhớ</small></span></div>
                <div><span className="community-highlight__icon"><Sparkles size={19} /></span><span><strong>Sắp ra mắt</strong><small>Theo dõi game mới trong cửa hàng</small></span></div>
            </div>

            <div className="community-layout">
                <main className="community-feed">
                    <section className="community-composer">
                        {user ? (
                            <>
                                <div className="community-composer__prompt">
                                    <span className="community-avatar">{user.name.trim().charAt(0).toLocaleUpperCase("vi") || "G"}</span>
                                    <button type="button" onClick={() => setComposerOpen((open) => !open)}>Bạn đang nghĩ gì về game?</button>
                                </div>
                                <div className="community-composer__actions">
                                    <button type="button" onClick={() => { setPostType("discussion"); setComposerOpen(true); }}><MessageCircle size={17} /> Thảo luận</button>
                                    <button type="button" onClick={() => { setPostType("question"); setComposerOpen(true); }}><MessageSquareText size={17} /> Đặt câu hỏi</button>
                                    <button type="button" onClick={() => { setPostType("achievement"); setComposerOpen(true); }}><Trophy size={17} /> Khoe thành tích</button>
                                </div>
                                {composerOpen && (
                                    <form className="community-post-form" onSubmit={handleSubmit}>
                                        <label className="community-field"><span>Loại bài viết</span>
                                            <select value={postType} onChange={(event) => setPostType(event.target.value as CommunityPostType)}>
                                                {postTypes.map((type) => <option value={type.id} key={type.id}>{type.label}</option>)}
                                            </select>
                                        </label>
                                        <label className="community-field"><span>Gắn với game </span>
                                            <select value={selectedGameId} onChange={(event) => setSelectedGameId(event.target.value)}>
                                                <option value="">Chọn game</option>
                                                {games.map((game) => <option value={game.id} key={game.id}>{game.title}</option>)}
                                            </select>
                                        </label>
                                        <label className="community-field"><span>Tiêu đề</span>
                                            <input value={title} onChange={(event) => setTitle(event.target.value)} minLength={5} maxLength={100} placeholder={postType === "question" ? "Bạn muốn hỏi cộng đồng điều gì?" : postType === "achievement" ? "Bạn vừa đạt được thành tích gì?" : "Đặt tiêu đề cho bài viết"} required />
                                        </label>
                                        <label className="community-field"><span>Nội dung</span>
                                            <textarea value={content} onChange={(event) => setContent(event.target.value)} minLength={10} maxLength={1500} placeholder="Chia sẻ thêm chi tiết với mọi người..." required />
                                        </label>
                                        <div className="community-post-form__footer">
                                            <span>{content.length}/1500 ký tự</span>
                                            <button type="button" className="community-secondary-button" onClick={() => setComposerOpen(false)}>Hủy</button>
                                            <button type="submit" className="community-primary-button" disabled={sending || title.trim().length < 5 || content.trim().length < 10}>
                                                <Send size={15} /> {sending ? "Đang đăng..." : "Đăng bài"}
                                            </button>
                                        </div>
                                        {error && <p className="community-message community-message--error" role="alert">{error}</p>}
                                    </form>
                                )}
                            </>
                        ) : (
                            <div className="community-login-prompt">
                                <span className="community-avatar"><Gamepad2 size={19} /></span>
                                <div><strong>Cùng tham gia cuộc trò chuyện</strong><p>Đăng nhập để đăng bài, đặt câu hỏi và chia sẻ thành tích.</p></div>
                                <Link to="/login" state={{ from: location }}>Đăng nhập</Link>
                            </div>
                        )}
                    </section>

                    {notice && <p className="community-message community-message--notice" role="status"><CheckCircle2 size={16} />{notice}</p>}
                    {error && !composerOpen && <p className="community-message community-message--error" role="alert">{error}</p>}
                    <div className="community-feed__heading">
                        <div><span className="community-eyebrow">GÓC CỦA GAME THỦ</span><h2>Bảng tin cộng đồng</h2></div>
                        <label className="community-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm bài viết..." aria-label="Tìm bài viết trong cộng đồng" /></label>
                    </div>

                    <div className="community-tabs" role="tablist" aria-label="Lọc bài viết">
                        {filterTabs.map((tab) => (
                            <button type="button" role="tab" aria-selected={filter === tab.id} className={filter === tab.id ? "is-active" : ""} key={tab.id} onClick={() => setFilter(tab.id)}>{tab.label}</button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="community-empty"><Gamepad2 size={27} /><p>Đang tải bảng tin...</p></div>
                    ) : visiblePosts.length === 0 ? (
                        <div className="community-empty"><MessageCircle size={28} /><h3>Chưa có bài viết phù hợp</h3><p>Hãy thử từ khóa khác hoặc bắt đầu cuộc trò chuyện đầu tiên.</p></div>
                    ) : (
                        <div className="community-post-list">
                            {visiblePosts.map((post) => {
                                const TypeIcon = postTypes.find((item) => item.id === post.type)?.icon ?? MessageCircle;
                                const isLiked = Boolean(user && post.likes.includes(user.id));
                                return (
                                    <article className="community-post" key={post.id}>
                                        <header className="community-post__header">
                                            <span className="community-avatar">{post.userName.trim().charAt(0).toLocaleUpperCase("vi") || "G"}</span>
                                            <div className="community-post__author">
                                                <strong>{post.userName}</strong>
                                                <span><CalendarDays size={13} /> {formatDate(post.createdAt)}</span>
                                            </div>
                                            <span className={`community-post__type community-post__type--${post.type}`}><TypeIcon size={14} />{getPostTypeLabel(post.type)}</span>
                                        </header>
                                        <h3>{post.title}</h3>
                                        <p className="community-post__body">{post.content}</p>
                                        {post.gameTitle && (
                                            <Link to={post.gameId ? `/games/${post.gameId}` : "/store"} className="community-post__game">
                                                {post.gameCover && <img src={post.gameCover} alt="" loading="lazy" />}
                                                <span><small>ĐANG NÓI VỀ</small><strong>{post.gameTitle}</strong></span>
                                                <ArrowRight size={16} />
                                            </Link>
                                        )}
                                        <div className="community-post__actions">
                                            <button type="button" className={isLiked ? "is-liked" : ""} aria-pressed={isLiked} disabled={busyAction === `like-${post.id}`} onClick={() => void handleLike(post)}>
                                                <Heart size={17} fill={isLiked ? "currentColor" : "none"} /> Thích <span>{post.likes.length || ""}</span>
                                            </button>
                                            <button type="button" onClick={() => { setReplyingTo(replyingTo === post.id ? null : post.id); setError(""); }}>
                                                <MessageCircle size={17} /> Trả lời <span>{post.replies.length || ""}</span>
                                            </button>
                                        </div>
                                        {post.replies.length > 0 && (
                                            <div className="community-replies">
                                                {post.replies.map((reply) => (
                                                    <div className="community-reply" key={reply.id}>
                                                        <span className="community-avatar community-avatar--small">{reply.userName.trim().charAt(0).toLocaleUpperCase("vi") || "G"}</span>
                                                        <p><strong>{reply.userName}</strong><span>{reply.content}</span></p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {replyingTo === post.id && (
                                            user ? (
                                                <form className="community-reply-form" onSubmit={(event) => void handleReply(event, post)}>
                                                    <input value={replyDraft} onChange={(event) => setReplyDraft(event.target.value)} maxLength={500} placeholder="Viết câu trả lời..." aria-label="Viết câu trả lời" required />
                                                    <button type="submit" aria-label="Gửi câu trả lời" disabled={busyAction === `reply-${post.id}`}><Send size={16} /></button>
                                                </form>
                                            ) : (
                                                <p className="community-reply-login">Hãy <Link to="/login" state={{ from: location }}>đăng nhập</Link> để trả lời bài viết.</p>
                                            )
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </main>

                <aside className="community-sidebar">
                    <section className="community-side-card community-upcoming">
                        <div className="community-side-card__heading"><span><Sparkles size={17} /></span><div><h2>Game sắp ra mắt</h2></div></div>
                        {upcomingGames.length > 0 ? (
                            <div className="community-upcoming__list">
                                {upcomingGames.map((game) => (
                                    <Link to={`/games/${game.id}`} className="community-upcoming__item" key={game.id}>
                                        <img src={game.coverImage} alt="" loading="lazy" />
                                        <span><strong>{game.title}</strong><small><CalendarDays size={12} /> {formatDate(game.releaseDate)}</small></span>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="community-upcoming__empty"><CalendarDays size={21} /><p>Chưa có ngày phát hành sắp tới được công bố trong cửa hàng.</p></div>
                        )}
                        <Link className="community-side-card__link" to="/store">Khám phá cửa hàng <ArrowRight size={15} /></Link>
                    </section>

                    <section className="community-side-card community-guidelines">
                        <div className="community-side-card__heading"><span><UsersRound size={17} /></span><div><h2>Cùng chơi đẹp</h2></div></div>
                        <ul>
                            <li>Tôn trọng ý kiến và trải nghiệm khác nhau.</li>
                            <li>Giữ nội dung liên quan đến game và cộng đồng.</li>
                            <li>Không chia sẻ mã kích hoạt hoặc thông tin cá nhân.</li>
                        </ul>
                        <Link className="community-side-card__link" to="/support/policies">Xem điều khoản cộng đồng <ArrowRight size={15} /></Link>
                    </section>

                    <div className="community-sidebar__foot"><Gamepad2 size={16} /> Cùng nhau xây dựng cộng đồng game tích cực.</div>
                </aside>
            </div>
        </div>
    );
}
