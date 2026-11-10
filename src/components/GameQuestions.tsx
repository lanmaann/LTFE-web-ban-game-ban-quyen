import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { MessageCircle, Send } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { questionService } from "../services/questionService";
import type { GameQuestion } from "../types/question";

interface GameQuestionsProps { gameId: string; gameTitle: string; }

function formatDate(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" });
}

export default function GameQuestions({ gameId }: GameQuestionsProps) {
    const { user } = useAuth();
    const location = useLocation();
    const [questions, setQuestions] = useState<GameQuestion[]>([]);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        void questionService.getByGame(gameId).then((items) => {
            if (active) setQuestions(items);
        }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [gameId]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const trimmed = content.trim();
        if (!user) return;
        if (trimmed.length < 5) {
            setError("Câu hỏi cần có ít nhất 5 ký tự.");
            return;
        }
        setSending(true);
        setError("");
        try {
            const created = await questionService.create(gameId, user.id, user.name, trimmed);
            setQuestions((items) => [created, ...items]);
            setContent("");
        } catch {
            setError("Chưa thể gửi câu hỏi. Vui lòng thử lại.");
        } finally {
            setSending(false);
        }
    }

    return (
        <section className="game-questions" aria-labelledby="game-questions-title">
            <div className="game-questions__heading">
                <MessageCircle size={21} />
                <div><h2 id="game-questions-title">Hỏi đáp</h2> </div>
            </div>
            {user ? (
                <form className="game-questions__form" onSubmit={handleSubmit}>
                    <label htmlFor={`question-${gameId}`} className="sr-only">Nội dung câu hỏi</label>
                    <textarea id={`question-${gameId}`} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Bạn muốn biết thêm điều gì về game này?" maxLength={1000} required />
                    <div className="game-questions__form-footer">
                        <span>Đang gửi với tên <strong>{user.name}</strong></span>
                        <button type="submit" disabled={sending || content.trim().length < 5}><Send size={16} />{sending ? "Đang gửi..." : "Gửi câu hỏi"}</button>
                    </div>
                    {error && <p className="game-questions__error" role="alert">{error}</p>}
                </form>
            ) : (
                <div className="game-questions__login">Vui lòng <Link to="/login" state={{ from: location }}>đăng nhập</Link> để đặt câu hỏi và tham gia thảo luận.</div>
            )}
            <div className="game-questions__list-heading"><h3>{questions.length} {questions.length === 1 ? "thảo luận" : "thảo luận"}</h3></div>
            {loading ? <p className="game-questions__empty">Đang tải thảo luận...</p> : questions.length === 0 ? (
                <div className="game-questions__empty">Chưa có câu hỏi nào. Hãy là người đầu tiên bắt đầu thảo luận!</div>
            ) : (
                <div className="game-questions__list">
                    {questions.map((question) => (
                        <article className="game-question" key={question.id}>
                            <div className="game-question__avatar" aria-hidden="true">{question.userName.trim().charAt(0).toLocaleUpperCase("vi") || "U"}</div>
                            <div className="game-question__content">
                                <div className="game-question__meta"><strong>{question.userName}</strong><time dateTime={question.createdAt}>{formatDate(question.createdAt)}</time></div>
                                <p>{question.content}</p>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
