import React, { useEffect, useRef, useState } from "react";

export interface SupportChannel {
    name: string;
    url: string;
    description?: string;
    icon?: string;
}

export interface SupportFaq {
    question: string;
    answer: string;
}

export interface SupportData {
    workingHours?: {
        start: string;
        end: string;
        days?: string;
    };
    avgReply?: string;
    channels?: SupportChannel[];
    faq?: SupportFaq[];
}

interface SupportPopupProps {
    isOpen: boolean;
    onClose: () => void;
    supportData?: SupportData;
    triggerRef?: React.RefObject<HTMLElement | null>;
    isOnlineFn?: () => boolean;
}

interface ChatMessage {
    id: string;
    sender: "bot" | "user";
    text: string;
    time: string;
}

function getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

const INITIAL_MESSAGES: ChatMessage[] = [
    {
        id: "init-1",
        sender: "bot",
        text: "Xin chào!",
        time: getCurrentTime(),
    },
    {
        id: "init-2",
        sender: "bot",
        text: "Bạn cần giải đáp về cách nhận key, kích hoạt Steam, bảo hành hay chính sách thanh toán? Bạn có thể nhập câu hỏi trực tiếp hoặc bấm chọn các chủ đề nhanh bên dưới nhé!",
        time: getCurrentTime(),
    },
];

const QUICK_PROMPTS = [
    { label: " Kích hoạt CD-Key", query: "Làm sao để nhận và kích hoạt CD-Key trên Steam?" },
    { label: " Chính sách bảo hành", query: "Chính sách bảo hành và đổi trả key như thế nào?" },
    { label: " Thời gian nhận key", query: "Sau khi thanh toán bao lâu thì nhận được key?" },
    { label: " Phương thức thanh toán", query: "Website hỗ trợ những phương thức thanh toán nào?" },
    { label: "Gặp nhân viên tư vấn", query: "Tôi muốn kết nối với nhân viên hỗ trợ trực tiếp" },
];

function getBotReply(query: string, faqList?: SupportFaq[]): string {
    const text = query.toLowerCase().trim();

    if (faqList && faqList.length > 0) {
        for (const item of faqList) {
            const q = item.question.toLowerCase();
            const words = q.split(/\s+/).filter((w) => w.length > 2);
            const matchCount = words.filter((w) => text.includes(w)).length;
            if (matchCount >= 2) {
                return item.answer;
            }
        }
    }

    if (text.includes("kích hoạt") || text.includes("steam") || text.includes("nhận key") || text.includes("cd-key") || text.includes("key")) {
        return " **Hướng dẫn nhận & kích hoạt CD-Key:**\n\n1. Sau khi thanh toán thành công, mã CD-Key sẽ hiển thị ngay trong mục **Thư viện** của tài khoản và gửi về email đăng ký (trong vòng 1-5 phút).\n2. Khởi chạy phần mềm Steam trên máy tính > Chọn menu **Trò chơi (Games)** > Chọn **Kích hoạt sản phẩm trên Steam (Activate a Product on Steam)**.\n3. Nhập mã CD-Key đã mua và xác nhận để tải game vĩnh viễn.";
    }

    if (text.includes("bảo hành") || text.includes("lỗi") || text.includes("đổi trả") || text.includes("hoàn tiền") || text.includes("hỏng")) {
        return " **Chính sách bảo hành & Đổi trả:**\n\n• ATA GAMES cam kết **bảo hành trọn đời key** bản quyền chính hãng 100%.\n• Nếu key không kích hoạt được hoặc phát sinh lỗi kỹ thuật từ hệ thống, chúng mình sẽ kiểm tra và **đổi mới 1:1 ngay lập tức** cho bạn.";
    }

    if (text.includes("thời gian") || text.includes("bao lâu") || text.includes("mấy phút") || text.includes("giao hàng") || text.includes("chờ")) {
        return " **Thời gian nhận game:**\n\nHệ thống giao mã tự động vận hành liên tục **24/7**. Quá trình xác thực thanh toán và cấp mã CD-Key chỉ mất từ **1 đến 5 phút**. Bạn có thể vào mục **Thư viện** trên Header để xem mã bất cứ lúc nào.";
    }

    if (text.includes("thanh toán") || text.includes("chuyển khoản") || text.includes("momo") || text.includes("vnpay") || text.includes("ngân hàng") || text.includes("tiền") || text.includes("mua")) {
        return "**Phương thức thanh toán linh hoạt:**\n\n• Chuyển khoản ngân hàng qua mã VietQR (tự động xác nhận giao dịch trong 30 giây).\n• Ví điện tử MoMo, VNPay.\n• Thẻ ATM nội địa và thẻ thanh toán quốc tế Visa/Mastercard.";
    }

    if (text.includes("nhân viên") || text.includes("tư vấn") || text.includes("trực tiếp") || text.includes("gặp người") || text.includes("hotline") || text.includes("liên hệ")) {
        return " **Kết nối bộ phận hỗ trợ:**\n\nĐội ngũ chuyên viên CSKH của ATA GAMES trực tuyến giải đáp từ **08:00 - 22:00** hàng ngày.\nBạn có thể gửi câu hỏi kèm số điện thoại hoặc email tại đây, chuyên viên sẽ liên hệ phản hồi trực tiếp cho bạn sớm nhất!";
    }

    if (text.includes("giá") || text.includes("giảm giá") || text.includes("khuyến mãi") || text.includes("sale") || text.includes("rẻ")) {
        return " Các mức giảm giá tốt nhất đã được cập nhật trực tiếp trên trang sản phẩm. Bạn hãy bấm **Thêm vào giỏ hàng** hoặc **Mua ngay** để nhận ưu đãi hiện tại nhé!";
    }

    if (text.includes("chào") || text.includes("hello") || text.includes("hi") || text.includes("alo")) {
        return "Dạ chào bạn! Rất vui được hỗ trợ bạn. Bạn đang cần giải đáp về tựa game này hay quy trình nhận key ạ?";
    }

    if (text.includes("cảm ơn") || text.includes("cam on") || text.includes("thanks") || text.includes("thank")) {
        return "Dạ không có gì ạ! Rất hân hạnh được đồng hành cùng bạn tại ATA GAMES. Chúc bạn có những giờ phút chơi game thật thăng hoa! 🎮✨";
    }

    return `Cảm ơn câu hỏi của bạn! ATA Bot đã ghi nhận: "${query}".\nHiện tại câu hỏi đã được lưu vào hệ thống, bạn có thể tham khảo thêm các chủ đề gợi ý nhanh phía dưới để nhận câu trả lời tức thì nhé!`;
}

function renderFormattedMessage(text: string) {
    const parts = text.split("\n");
    return parts.map((line, idx) => {
        if (!line.trim()) return <br key={idx} />;
        const boldSplit = line.split(/(\*\*.*?\*\*)/g);
        return (
            <p key={idx} className="support-chat__paragraph">
                {boldSplit.map((chunk, cIdx) => {
                    if (chunk.startsWith("**") && chunk.endsWith("**")) {
                        return <strong key={cIdx}>{chunk.slice(2, -2)}</strong>;
                    }
                    return chunk;
                })}
            </p>
        );
    });
}

export default function SupportPopup({
    isOpen,
    onClose,
    supportData,
    triggerRef,
}: SupportPopupProps) {
    const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    const popupRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            const timer = window.setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            return () => window.clearTimeout(timer);
        } else {
            triggerRef?.current?.focus();
        }
    }, [isOpen, triggerRef]);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isTyping, isOpen]);

    const msgIdCounter = useRef(0);

    const handleSendMessage = (textToSend?: string) => {
        const content = (textToSend ?? inputValue).trim();
        if (!content || isTyping) return;

        msgIdCounter.current += 1;
        const currentCount = msgIdCounter.current;
        const userMsg: ChatMessage = {
            id: `user-${currentCount}`,
            sender: "user",
            text: content,
            time: getCurrentTime(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputValue("");
        setIsTyping(true);

        window.setTimeout(() => {
            const reply = getBotReply(content, supportData?.faq);
            msgIdCounter.current += 1;
            const botMsg: ChatMessage = {
                id: `bot-${msgIdCounter.current}`,
                sender: "bot",
                text: reply,
                time: getCurrentTime(),
            };
            setMessages((prev) => [...prev, botMsg]);
            setIsTyping(false);
        }, 550);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSendMessage();
    };

    const handleResetChat = () => {
        setMessages(INITIAL_MESSAGES);
        setInputValue("");
        setIsTyping(false);
        inputRef.current?.focus();
    };

    if (!isOpen) return null;

    return (
        <div className="support-overlay" onClick={onClose} aria-hidden="true">
            <div
                ref={popupRef}
                className="support-popup support-popup--chat"
                role="dialog"
                aria-modal="true"
                aria-labelledby="support-chat-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="support-popup__drag-handle" aria-hidden="true" />

                <header className="support-popup__header">
                    <div className="support-popup__bot-profile">
                        <div className="support-popup__bot-avatar">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="12" x="3" y="8" rx="2" />
                                <path d="M12 2v6" />
                                <path d="M8 14h.01" />
                                <path d="M16 14h.01" />
                            </svg>
                            <span className="support-popup__online-status" />
                        </div>
                        <div>
                            <h2 id="support-chat-title" className="support-popup__title">
                                Hỗ trợ ATA GAMES
                            </h2>
                        </div>
                    </div>

                    <div className="support-popup__header-actions">
                        <button
                            type="button"
                            className="support-popup__icon-action"
                            onClick={handleResetChat}
                            aria-label="Làm mới đoạn chat"
                            title="Làm mới đoạn chat"
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                <path d="M3 3v5h5" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className="support-popup__close-btn"
                            onClick={onClose}
                            aria-label="Đóng khung chat"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </header>

                <div className="support-chat__body">
                    <div className="support-chat__messages-list">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`support-chat__message-row support-chat__message-row--${msg.sender}`}
                            >
                                {msg.sender === "bot" && (
                                    <div className="support-chat__msg-avatar" aria-hidden="true">
                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect width="18" height="12" x="3" y="8" rx="2" />
                                            <path d="M12 2v6" />
                                            <path d="M8 14h.01" />
                                            <path d="M16 14h.01" />
                                        </svg>
                                    </div>
                                )}
                                <div className="support-chat__bubble-container">
                                    <div className="support-chat__bubble">
                                        {renderFormattedMessage(msg.text)}
                                    </div>
                                    <span className="support-chat__time">{msg.time}</span>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="support-chat__message-row support-chat__message-row--bot">
                                <div className="support-chat__msg-avatar" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect width="18" height="12" x="3" y="8" rx="2" />
                                        <path d="M12 2v6" />
                                        <path d="M8 14h.01" />
                                        <path d="M16 14h.01" />
                                    </svg>
                                </div>
                                <div className="support-chat__bubble support-chat__bubble--typing">
                                    <span className="support-chat__typing-dot" />
                                    <span className="support-chat__typing-dot" />
                                    <span className="support-chat__typing-dot" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="support-chat__quick-prompts">
                        <span className="support-chat__quick-label">Gợi ý câu hỏi nhanh:</span>
                        <div className="support-chat__quick-scroll">
                            {QUICK_PROMPTS.map((prompt) => (
                                <button
                                    key={prompt.label}
                                    type="button"
                                    className="support-chat__quick-chip"
                                    onClick={() => handleSendMessage(prompt.query)}
                                    disabled={isTyping}
                                >
                                    {prompt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <form className="support-chat__footer-form" onSubmit={handleFormSubmit}>
                    <input
                        ref={inputRef}
                        type="text"
                        className="support-chat__input"
                        placeholder="Nhập câu hỏi cần hỗ trợ..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={isTyping}
                        aria-label="Nội dung câu hỏi hỗ trợ"
                    />
                    <button
                        type="submit"
                        className="support-chat__send-btn"
                        disabled={!inputValue.trim() || isTyping}
                        aria-label="Gửi tin nhắn"
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
}
