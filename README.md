# E-commerce Frontend

Giao diện web của hệ thống thương mại điện tử, viết bằng Next.js 16 (App Router), React 19 và NextAuth v5. Một app gồm hai phần:

- **Cửa hàng** cho khách (`src/app/(store)`): giao diện tối giản đen trắng, dùng Tailwind CSS 4.
- **Trang quản trị** (`src/app/(admin)/dashboard`): dùng Ant Design 6, chỉ tài khoản có role `ADMIN` vào được.

Dữ liệu lấy từ backend NestJS trong thư mục `../E-commerce-backend` (mặc định chạy ở cổng 8088, prefix `/api`).

## Yêu cầu

- Node.js 20 trở lên
- Backend đang chạy và truy cập được từ frontend

## Cài đặt và chạy

```bash
npm install
# tạo file .env (xem mục bên dưới)
npm run dev
```

Mở http://localhost:3000.

## Biến môi trường

Tạo file `.env` ở thư mục gốc của frontend:

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `AUTH_SECRET` | Có | Khóa mã hóa JWT phiên của NextAuth. Tạo bằng `npx auth secret` hoặc `openssl rand -base64 32`. |
| `NEXT_PUBLIC_BACKEND_URL` | Có | URL gốc của backend, **không** kèm `/api`. Ví dụ: `http://localhost:8088`. |
| `NEXT_PUBLIC_STORE_NAME` | Không | Tên cửa hàng hiển thị trên header, footer. |
| `NEXT_PUBLIC_FACEBOOK_URL` | Không | Link Facebook ở footer. |
| `NEXT_PUBLIC_INSTAGRAM_URL` | Không | Link Instagram ở footer. |

Không commit file `.env`.

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy dev server ở cổng 3000 |
| `npm run build` | Build bản production |
| `npm run start` | Chạy bản đã build |
| `npx tsc --noEmit` | Kiểm tra kiểu |
| `npx eslint src` | Lint |

Hiện chưa có test tự động.

## Tính năng

**Cửa hàng**

- Trang chủ, danh sách sản phẩm có lọc (`/shop`), chi tiết sản phẩm và biến thể (`/product/[slug]`), danh sách cửa hàng (`/stockists`)
- Giỏ hàng lưu ở `localStorage`, khách chưa đăng nhập vẫn dùng được
- Đặt hàng (cần đăng nhập), chọn địa chỉ từ sổ địa chỉ, áp mã giảm giá, thanh toán qua VNPay và thanh toán lại đơn chưa trả (`/checkout`, `/checkout/result`)
- Đăng ký, đăng nhập, kích hoạt tài khoản qua mã xác thực, quên mật khẩu (`/auth/*`, `/verify/[id]`)
- Tài khoản: hồ sơ, đơn hàng, sổ địa chỉ, danh sách yêu thích (`/account/*`)
- Thông báo thời gian thực qua Socket.IO và Web Push (service worker `public/sw.js`)

**Quản trị** (`/dashboard`)

- Thống kê tổng quan
- Quản lý người dùng, danh mục, sản phẩm và biến thể (kèm tải ảnh), mã giảm giá, đơn hàng
- Chuông thông báo đơn hàng mới

## Cấu trúc thư mục

```
src/
├── app/
│   ├── (store)/                 # Trang cho khách
│   ├── (admin)/dashboard/       # Trang quản trị
│   ├── api/auth/[...nextauth]/  # Route của NextAuth
│   └── session/socket-ticket/   # Cấp vé mở kết nối WebSocket
├── components/
│   ├── store/                   # Component cửa hàng (Tailwind)
│   ├── admin/                   # Bảng, form, modal quản trị (Ant Design)
│   └── layout/                  # Layout trang quản trị
├── library/                     # Giỏ hàng, wishlist, thông báo, web push
├── utils/                       # Gọi API, server actions, xử lý session và token
├── types/                       # Kiểu dữ liệu dùng chung
├── auth.ts                      # Cấu hình NextAuth
└── proxy.ts                     # Làm mới token, chặn /dashboard với người không phải admin
```

## Xác thực

- Đăng nhập bằng Credentials của NextAuth, gọi API đăng nhập của backend. Access token và refresh token của backend nằm trong JWT đã mã hóa của NextAuth, lưu trong cookie `httpOnly`.
- `src/proxy.ts` chạy trước mỗi request: làm mới access token sắp hết hạn và chuyển hướng về `/auth/login` nếu người không phải admin vào `/dashboard`.
- Access token không được gửi xuống trình duyệt. Mọi lời gọi API cần đăng nhập đều đi từ server component, server action (`src/utils/actions.ts`) hoặc route handler.
