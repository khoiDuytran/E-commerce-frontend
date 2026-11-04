@AGENTS.md

# Frontend

Thêm trang quản trị: dùng skill `add-admin-page`. Thêm trang cửa hàng: dùng skill `add-store-page`.

## Auth và token

- Chỉ làm mới token trong [src/proxy.ts](src/proxy.ts). Server component không ghi được cookie, nên không refresh trong callback `jwt` của NextAuth hay trong page.
- Refresh token chỉ nằm trong JWT mã hóa của NextAuth. Không đưa nó vào session.
- Không truyền `session` hoặc access token xuống client component, vì props nằm trong HTML gửi cho trình duyệt. Chỉ truyền field cần hiển thị.
- `/api/auth/session` cố ý bỏ access token (xem [route.ts](src/app/api/auth/[...nextauth]/route.ts)). `auth()` phía server thì có token. Không dùng `SessionProvider`/`useSession()`: lần fetch session của nó đi ngoài proxy và có thể ghi đè phiên vừa làm mới. Client cần thông tin người dùng thì nhận qua props đã lọc.
- Gọi API cần token từ phía server: server component hoặc server action trong [actions.ts](src/utils/actions.ts). Lấy token qua `getSessionToken`/`getAuthHeader` trong [session.ts](src/utils/session.ts); token chỉ nằm ở `session.access_token`, không có trong `session.user`.
- So sánh lỗi auth theo `type`, không theo tên class: tên class có thể đổi khi minify ở bản production.
- Matcher của proxy bỏ qua trang chủ `/`, nên server action gọi từ trang chủ không được làm mới token. Việc nào cần token còn hạn ở mọi trang (như vé WebSocket thông báo) thì gọi route handler nằm ngoài `/api`, ví dụ [/session/socket-ticket](src/app/session/socket-ticket/route.ts).

## Cửa hàng cho khách

- Trang trong `src/app/(store)`, component trong `src/components/store`. Giao diện tối giản đen trắng, dùng Tailwind, không dùng Ant Design. Trang đăng nhập, đăng ký và xác thực cũng thuộc nhóm này.
- Giỏ hàng lưu ở `localStorage` ([cart.store.ts](src/library/cart.store.ts)) để khách chưa đăng nhập vẫn dùng được; không dùng module cart của backend. Giá trong giỏ chỉ để hiển thị, backend tính lại khi tạo đơn.
- Đặt hàng yêu cầu đăng nhập vì backend yêu cầu JWT. Địa chỉ giao hàng chọn từ sổ địa chỉ (`AddressBook`, dùng chung với `/account/addresses`), địa chỉ mới luôn được lưu vào sổ.
- Trang tài khoản nằm trong `src/app/(store)/account`, đọc dữ liệu qua [account.api.ts](src/utils/account.api.ts).
- Đọc catalog qua [store.api.ts](src/utils/store.api.ts), luôn lọc `isActive: true`. Giá trị từ URL phải được kiểm tra định dạng trước khi đưa vào query của backend.
- Hiển thị tiền bằng `formatVnd`, ảnh sản phẩm bằng `StoreImage` (dữ liệu cũ có thể chứa URL không hợp lệ).
- Tên cửa hàng và link mạng xã hội cấu hình qua `NEXT_PUBLIC_STORE_NAME`, `NEXT_PUBLIC_FACEBOOK_URL`, `NEXT_PUBLIC_INSTAGRAM_URL`.

## Quy ước

- Không dùng `any`. ESLint và typecheck đang ở mức 0 lỗi, cần giữ nguyên.
- Lấy props của client component từ dữ liệu server đã lọc; kiểu dùng chung đặt trong [backend.d.ts](src/types/backend.d.ts).
- `InputNumber` có `min={0}` kèm `parser` cần ghi rõ `<InputNumber<number>>`, nếu không TypeScript suy ra kiểu `0`.
- Không gọi `setState` đồng bộ trong `useEffect`. Reset state theo prop ngay lúc render, hoặc set sau khi promise hoàn tất.
- API list của backend trả `{ meta, results }`, không phải `result` như trong `IModelPaginate`.
