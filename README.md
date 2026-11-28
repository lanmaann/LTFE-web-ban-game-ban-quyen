# ATA Games

Ứng dụng web bán game bản quyền (Front-end), xây dựng bằng React + TypeScript + Vite.

## Chạy dự án

```bash
npm install
npm run dev
```

Sau đó mở địa chỉ hiển thị trong terminal (mặc định `http://localhost:5173`).

> Yêu cầu: Node.js bản LTS mới (khuyến nghị 20.19 trở lên).

## Tính năng

**Mua sắm**
- Trang chủ với banner chạy tự động, danh sách game nổi bật.
- Cửa hàng: tìm kiếm có gợi ý và lịch sử tìm kiếm, lọc theo thể loại, sắp xếp, phân trang.
- Chi tiết game: video/ảnh giới thiệu, cấu hình yêu cầu, thông tin giá và giảm giá, game liên quan.
- Yêu thích, giỏ hàng, mã giảm giá.

**Thanh toán và đơn hàng**
- Thanh toán thử nghiệm (sandbox): thẻ, VietQR, ví điện tử.
- Lịch sử đơn hàng, chi tiết đơn hàng, yêu cầu hoàn tiền.
- Thư viện game đã mua.

**Tương tác**
- Đánh giá game, hỏi đáp trên trang chi tiết.
- Cộng đồng: đăng bài, bình luận, thích.
- Vòng quay may mắn nhận voucher.
- Thông báo, hồ sơ cá nhân, đăng nhập / đăng ký.

**Hỗ trợ và giao diện**
- Trung tâm hỗ trợ: hướng dẫn, câu hỏi thường gặp, chính sách.
- Đa ngôn ngữ và đổi tiền tệ.
- Giao diện sáng / tối 

## Công nghệ

| Nhóm | Thư viện |
|---|---|
| Giao diện | React 19, TypeScript, CSS thuần |
| Build tool | Vite |
| Quản lý state | Redux Toolkit, React Redux |
| Điều hướng | React Router 7 |
| Gọi API | Axios |
| Biểu tượng | Lucide React |
| Kiểm thử | Vitest, Testing Library, jsdom |
| Chất lượng mã | ESLint, typescript-eslint |

## Các lệnh

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy dự án ở chế độ phát triển |
| `npm run build` | Kiểm tra kiểu TypeScript và build bản production |
| `npm run preview` | Xem thử bản build |
| `npm run lint` | Kiểm tra mã bằng ESLint |
| `npm run test` | Chạy kiểm thử với Vitest |
| `npm run api` | Chạy API giả lập (json-server, dữ liệu `data/db.json`, cổng 3001) |
| `npm run images` | Tải ảnh game bằng `scripts/download-images.mjs` |

## Ghi chú

- Đây là dự án Front-end. Phần thanh toán chỉ là mô phỏng, không phát sinh giao dịch thật.
- Chỉ cần `npm run dev` để chạy giao diện. `npm run api` và `npm run images` là các lệnh phụ trợ.
