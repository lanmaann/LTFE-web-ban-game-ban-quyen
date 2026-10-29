export const formatPrice = (price: number): string =>
    price === 0
        ? "Miễn phí"
        : new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
        }).format(price);
