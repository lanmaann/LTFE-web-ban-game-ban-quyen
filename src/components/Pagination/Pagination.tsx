import "./Pagination.css";

interface PaginationProps {
    page: number;
    totalPages: number;
    onChange: (page: number) => void;
}

function getPageItems(page: number, totalPages: number): (number | "ellipsis-left" | "ellipsis-right")[] {
    const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
    const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

    const items: (number | "ellipsis-left" | "ellipsis-right")[] = [];
    sorted.forEach((p, index) => {
        const prev = sorted[index - 1];
        if (prev !== undefined && p - prev > 1) {
            items.push(index < sorted.length / 2 ? "ellipsis-left" : "ellipsis-right");
        }
        items.push(p);
    });
    return items;
}

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <nav className="pagination" aria-label="Phân trang">
            <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)}>
                Trước
            </button>

            {getPageItems(page, totalPages).map((item) =>
                typeof item === "string" ? (
                    <span key={item} className="pagination__ellipsis">…</span>
                ) : (
                    <button
                        type="button"
                        key={item}
                        className={item === page ? "pagination__active" : ""}
                        aria-current={item === page ? "page" : undefined}
                        onClick={() => onChange(item)}
                    >
                        {item}
                    </button>
                )
            )}

            <button type="button" disabled={page === totalPages} onClick={() => onChange(page + 1)}>
                Sau
            </button>
        </nav>
    );
}
