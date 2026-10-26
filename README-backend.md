# Tài khoản, thảo luận chung và lịch phim trên Cloudflare

Bản static dùng được ngay sau khi Pages build. Lịch phim tự lấy từ Bilibili qua Pages Function, không cần D1/Worker riêng. Tài khoản và bình luận vẫn cần D1, Google OAuth và Turnstile. Nếu Pages Function không chạy hoặc nguồn phim tạm lỗi, website dùng lịch JSON tĩnh dự phòng.

## 1. Tạo D1

Từ thư mục mã nguồn chạy:

```sh
npx wrangler d1 create mucthanky
```

Lưu ID trả về để gắn database vào Pages và điền vào `sync/wrangler.toml` khi bật Worker đồng bộ. Cấu hình Pages mặc định không gắn D1 để website tĩnh có thể triển khai ngay. Nếu D1 mới, khởi tạo:

```sh
npx wrangler d1 execute mucthanky --remote --file=db/schema.sql
```

Nếu bạn đã có D1 từ bản cũ, dùng migration một lần:

```sh
npx wrangler d1 execute mucthanky --remote --file=db/migrate-existing.sql
```

Không chạy migration cũ trên DB mới vừa khởi tạo bằng `schema.sql`.

Trong Cloudflare Pages → Settings → Functions → D1 database bindings, thêm binding `DB` trỏ tới database `mucthanky` cho Production. Thêm Preview binding riêng nếu muốn thử trên Preview.

## 2. Bật đăng nhập Google và xác minh email

Trong Google Cloud Console tạo OAuth Client loại Web application. Thêm Authorized redirect URI chính xác:

```text
https://mucthanky.com/api/auth/google/callback
```

Đặt `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` trong Pages → Settings → Variables and Secrets (secrets/runtime). Tên hiển thị lấy từ Google; email phải có trạng thái đã xác minh. Lần đăng nhập đầu tiên tự tạo tài khoản, các lần sau dùng cùng tài khoản. Session lưu bằng cookie `HttpOnly`, `Secure`, `SameSite=Lax`; email không xuất hiện công khai trong bình luận.

Nếu dùng domain `www` hoặc Pages preview, thêm redirect URI tương ứng trong Google và tạo cấu hình riêng cho hostname ấy.

## 3. Bật Turnstile cho bình luận

Tạo Turnstile widget cho `mucthanky.com`, sau đó cấu hình:

- Pages build variable `PUBLIC_TURNSTILE_SITE_KEY` (site key công khai; cần chạy lại build)
- Pages runtime secret `TURNSTILE_SECRET`
- Pages runtime secret `RATE_LIMIT_SALT` — chuỗi ngẫu nhiên dài tối thiểu 32 byte

API xác nhận hostname/action với Cloudflare. Mỗi bình luận cần session đã đăng nhập, Turnstile và chờ duyệt. Reply chỉ được lồng một cấp: bình luận gốc → trả lời. Trang trả lời được lưu để hiển thị link ngữ cảnh trên toàn website.

`ADMIN_TOKEN` vẫn dùng cho `/quan-tri/` để duyệt hàng chờ. Đặt token ngẫu nhiên dài tối thiểu 32 byte; không commit vào Git.

## 4. Lịch tập tự cập nhật trên Cloudflare Pages

Website không cần cấu hình D1 hoặc Worker riêng chỉ để cập nhật lịch phim. Route Pages Function GET /api/schedule đọc season chính thức 45969 từ Bilibili, chỉ lấy tập chính có số tập và link phát hợp lệ. Cloudflare cache kết quả khoảng một giờ; khi Bilibili tạm lỗi, route dùng cache cũ hoặc website chuyển về src/data/episode-schedule.json. Như vậy tập mới sẽ xuất hiện chậm nhất khoảng một giờ sau khi Bilibili công bố, miễn là bản deploy có thư mục functions/.

Worker và D1 bên dưới là tùy chọn nếu muốn lưu lịch thành dữ liệu bền vững, đồng bộ playlist YouTube hoặc xem lịch sử các lần đồng bộ. Tạo D1 rồi điền database ID trong sync/wrangler.toml; sau đó từ thư mục sync chạy:

```sh
npx wrangler secret put SYNC_TOKEN
npx wrangler deploy
```

Cron Worker chạy mỗi giờ. Nếu chỉ cần lịch tập mới trên website, không phải làm bước này.

## API và dữ liệu

- `GET /api/auth/me`: trạng thái đăng nhập, không trả email.
- `POST /api/auth/google`: tạo luồng OAuth; callback tạo session.
- `POST /api/auth/logout`: xóa session.
- `GET /api/comments`: tối đa 300 bình luận đã duyệt trên toàn website.
- `POST /api/comments`: cần tài khoản, trang ngữ cảnh và Turnstile; nội dung chờ duyệt.
- `GET /api/schedule`: đọc lịch tập chính thức từ Bilibili, cache khoảng một giờ; D1 là phương án dự phòng tùy chọn.
- `GET /api/episodes`: metadata video YouTube tùy chọn từ cấu hình cũ.
- `/quan-tri/`: công cụ duyệt; API kiểm tra `ADMIN_TOKEN`.

Bình luận gốc được xếp mới nhất trước; reply mới nhất nằm dưới bình luận gốc. Báo cáo spam được lưu cho quản trị viên. Giới hạn tốc độ áp dụng theo hash IP có salt, không lưu IP thô. Dữ liệu tài khoản gồm Google subject, email xác minh và tên hồ sơ; email không được trả về trong API công khai.

## Kiểm tra local

Sau khi thiết lập `.dev.vars` từ `.dev.vars.example`, tạo D1 local và chạy:

```sh
npx wrangler d1 execute mucthanky --local --file=db/schema.sql
npm run build
npx wrangler pages dev dist
```

Trang xem tĩnh `npm run dev` không chạy Pages Functions; dùng `wrangler pages dev` khi muốn thử OAuth/API.
