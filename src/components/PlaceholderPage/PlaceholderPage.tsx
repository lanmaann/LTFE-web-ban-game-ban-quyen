import { Construction } from "lucide-react";
import StateMessage from "../StateMessage/StateMessage";

export default function PlaceholderPage({ title }: { title: string }) {
    return (
        <div style={{ width: "min(1320px, 92%)", margin: "0 auto", padding: "48px 0" }}>
            <StateMessage
                variant="empty"
                icon={<Construction size={36} />}
                title={title}
                message="Trang này đang được phát triển."
            />
        </div>
    );
}
