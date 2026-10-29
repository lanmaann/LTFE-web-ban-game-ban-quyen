import type { ReactNode } from "react";
import "./StateMessage.css";

interface StateMessageProps {
    variant: "loading" | "error" | "empty";
    title: string;
    message?: string;
    icon?: ReactNode;
    actionLabel?: string;
    onAction?: () => void;
}

export default function StateMessage({
                                         variant, title, message, icon, actionLabel, onAction,
                                     }: StateMessageProps) {
    return (
        <div className={`state-message state-message--${variant}`} role={variant === "error" ? "alert" : "status"}>
            {variant === "loading" ? <div className="state-message__spinner" /> : icon}
            <h3>{title}</h3>
            {message && <p>{message}</p>}
            {actionLabel && onAction && (
                <button type="button" className="state-message__button" onClick={onAction}>
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
