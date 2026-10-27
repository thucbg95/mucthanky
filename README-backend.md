# Tài khoản, bình luận và lịch phim trên Cloudflare

Website đăng bình luận ngay sau khi gửi. Người dùng cần đăng nhập Google bằng email đã xác minh và vượt Turnstile; không có hàng chờ duyệt. Trang `/quan-tri/` hỗ trợ Google admin và chủ website đăng nhập bằng `ADMIN_TOKEN`. Admin quản lý/xóa bình luận, xử lý báo cáo và khóa chat thành viên; chủ website có thêm quản lý vai trò tài khoản. Danh sách bình luận và tài khoản có tìm kiếm và phân trang. Xóa một bình luận gốc sẽ xóa cả các câu trả lời bên dưới.

Lịch phim tự lấy từ Bilibili qua Pages Function, không cần D1/Worker riêng. Nếu Pages Function không chạy hoặc nguồn phim tạm lỗi, website dùng lịch JSON tĩnh dự phòng.

## 1. Tạo D1

Từ thư mục mã nguồn chạy:

```sh
npx wrangler d1 create mucthanky
```

Lưu ID trả về để gắn database vào Pages và điền vào `sync/wrangler.toml` khi bật Worker đồng bộ. Cấu hình Pages mặc định không gắn D1 để website tĩnh có thể triển khai ngay. Nếu D1 mới, khởi tạo:

```sh
npx wrangler d1 execute mucthanky --remote --file=db/schema.sql
```

Nếu đã có D1 từ bản cũ, dùng migration một lần:

```sh
npx wrangler d1 execute mucthanky --remote --file=db/migrate-existing.sql
```

Đã có D1 từ phiên bản trước thì cần tạo bảng lượt thích một lần trước khi cập nhật mã website. Trong Cloudflare Dashboard → D1 → chọn database → Console, chạy nội dung của `db/migrations/0002_likes.sql`. Bản build mới truy vấn bảng này để đếm lượt thích trang và bình luận.

API mới cũng tự hiển thị các bình luận cũ đang ở trạng thái chờ duyệt. Nếu muốn chuẩn hóa trạng thái trong D1, có thể chạy migration một lần:

```sh
npx wrangler d1 execute mucthanky --remote --file=db/migrate-comments-public.sql
```

Nếu không dùng lệnh, mở Cloudflare Dashboard → D1 → chọn database → Console, dán và chạy câu SQL:

```sql
UPDATE comments SET status='approved' WHERE status='pending';
```

Migration này là tùy chọn. Không chạy migration `migrate-existing.sql` trên database mới vừa khởi tạo bằng `schema.sql`.

Trong Cloudflare Pages → Settings → Functions → D1 database bindings, thêm binding `DB` trỏ tới database `mucthanky` cho Production. Thêm Preview binding riêng nếu muốn thử trên Preview.

## 2. Bật đăng nhập Google

Trong Google Cloud Console tạo OAuth Client loại Web application. Thêm Authorized redirect URI chính xác:

```text
https://mucthanky.com/api/auth/google/callback
```

Đặt `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` trong Pages → Settings → Variables and Secrets (runtime). Email Google phải được xác minh. Lần đăng nhập đầu tiên tự tạo tài khoản; các lần sau dùng cùng tài khoản. Session lưu bằng cookie `HttpOnly`, `Secure`, `SameSite=Lax`; email không xuất hiện công khai trong bình luận.

Nếu dùng domain `www` hoặc Pages preview, thêm redirect URI tương ứng trong Google và tạo cấu hình riêng cho hostname ấy.

## 3. Chống spam và quyền quản trị

Tạo Turnstile widget cho `mucthanky.com`, sau đó cấu hình:

- Pages build variable `PUBLIC_TURNSTILE_SITE_KEY` (site key công khai; cần chạy lại build)
- Pages runtime secret `TURNSTILE_SECRET`
- Pages runtime secret `RATE_LIMIT_SALT` — chuỗi ngẫu nhiên dài tối thiểu 32 byte
- Pages runtime secret `ADMIN_TOKEN` — token ngẫu nhiên dài tối thiểu 32 byte, chỉ chủ website giữ

Mỗi bình luận cần tài khoản Google đã xác minh và Turnstile; nội dung được đăng công khai ngay. Bình luận gốc được xếp mới nhất trước, trả lời nằm dưới bình luận gốc. Trang bình luận gốc được gắn làm liên kết ngữ cảnh trên toàn website.

Trước khi triển khai, hãy bảo đảm migration `0003_admin_roles.sql` đã chạy trước đây, rồi chạy thêm migration `db/migrations/0004_chat_moderation.sql` một lần để bật khóa chat. Ở `/quan-tri/`, chủ website có thể đăng nhập bằng `ADMIN_TOKEN` hoặc tài khoản Google đã là admin. Tài khoản Google thường không có quyền sẽ thấy thông báo “chưa được cấp quyền” và nút về trang chủ. Chỉ phiên `ADMIN_TOKEN` được cấp/gỡ vai trò tài khoản. Quản trị viên Google có thể tìm và xóa bình luận, xem báo cáo, khóa/mở chat của thành viên; không thể quản lý vai trò. Hai loại phiên đều có nút đăng xuất. Tài khoản admin Google đã đăng nhập sẽ thấy lối tắt Quản trị ở đầu menu công cụ nổi. Khi xóa bình luận gốc, hệ thống xóa cả các câu trả lời bên dưới và báo cáo liên quan.

Có thể chạy migration bằng Wrangler:

```sh
npx wrangler d1 execute data-mucthanky --remote --file=db/migrations/0003_admin_roles.sql
```

Nếu `0003_admin_roles.sql` chưa từng chạy, chạy lệnh trên trước một lần. Nếu đã chạy ở bản trước thì bỏ qua, không chạy lại. Sau đó chạy `0004_chat_moderation.sql` đúng một lần:

```sh
npx wrangler d1 execute data-mucthanky --remote --file=db/migrations/0004_chat_moderation.sql
```

Hoặc mở Cloudflare Dashboard → D1 → `data-mucthanky` → Console, dán nội dung file `0004_chat_moderation.sql` rồi bấm Execute. Đừng deploy bản mới trước khi migration hoàn tất.

Giới hạn tốc độ áp dụng theo hash IP có salt; website không lưu IP thô. Email không được trả về trong API công khai.

## 4. Lịch tập tự cập nhật trên Cloudflare Pages

Website không cần cấu hình D1 hoặc Worker riêng chỉ để cập nhật lịch phim. Route `GET /api/schedule` đọc season chính thức 45969 từ Bilibili, chỉ lấy tập chính có số tập và link phát hợp lệ. Cloudflare cache kết quả khoảng một giờ; khi Bilibili tạm lỗi, route dùng cache cũ hoặc website chuyển về `src/data/episode-schedule.json`. Tập mới sẽ xuất hiện chậm nhất khoảng một giờ sau khi Bilibili công bố, miễn là bản deploy có thư mục `functions/`.

Worker và D1 bên dưới là tùy chọn nếu muốn lưu lịch thành dữ liệu bền vững, đồng bộ playlist YouTube hoặc xem lịch sử các lần đồng bộ. Tạo D1 rồi điền database ID trong `sync/wrangler.toml`; sau đó từ thư mục `sync` chạy:

```sh
npx wrangler secret put SYNC_TOKEN
npx wrangler deploy
```

Cron Worker chạy mỗi giờ. Nếu chỉ cần lịch tập mới trên website, không phải làm bước này.

## API và dữ liệu

- `GET /api/auth/me`: trạng thái đăng nhập, không trả email.
- `POST /api/auth/google`: tạo luồng OAuth; callback tạo session.
- `POST /api/auth/logout`: xóa session.
- `GET /api/comments?limit=10&offset=0&sort=newest&category=all`: phân trang bình luận cấp 1; `limit` chấp nhận 10, 20 hoặc 50; `sort` là `newest` hoặc `oldest`; `category` hỗ trợ `all`, `film`, `novel`, `encyclopedia` và `community`. Mỗi cuộc trò chuyện ban đầu hiển thị 2 câu trả lời gần nhất; khi có nhiều câu trả lời, người đọc có thể chuyển các phần cũ hơn/mới hơn theo nhóm 4. Phản hồi có tổng số cuộc trò chuyện để tính số trang.
- `GET /api/likes?type=post&id=/phim/`: đọc số lượt thích trang và trạng thái tài khoản hiện tại.
- `POST /api/likes`: đăng nhập Google để thích hoặc bỏ thích một trang/bình luận.
- `POST /api/comments`: cần tài khoản, trang ngữ cảnh và Turnstile; đăng công khai ngay.
- `POST /api/admin/comments`: bình luận có phân trang, bộ lọc theo chuyên mục và tìm theo tên/email/nội dung; dùng được với Google admin hoặc `ADMIN_TOKEN`.
- `POST /api/admin/users`: tài khoản có phân trang và tìm kiếm; chỉ `ADMIN_TOKEN`.
- `POST /api/admin/set-role`: cấp hoặc gỡ quyền thành viên/quản trị viên theo email Google; chỉ `ADMIN_TOKEN`.
- `POST /api/admin/set-lock`: khóa/mở chức năng chat của thành viên; dùng được với Google admin hoặc `ADMIN_TOKEN`.
- `POST /api/admin/delete`: xóa bình luận; dùng được với Google admin hoặc `ADMIN_TOKEN`.
- `POST /api/admin/reports`: đọc báo cáo; dùng được với Google admin hoặc `ADMIN_TOKEN`.
- `GET /api/schedule`: đọc lịch tập chính thức từ Bilibili, cache khoảng một giờ.
- `GET /api/episodes`: metadata video YouTube tùy chọn từ cấu hình cũ.

## Kiểm tra local

Sau khi thiết lập `.dev.vars` từ `.dev.vars.example`, tạo D1 local và chạy:

```sh
npx wrangler d1 execute mucthanky --local --file=db/schema.sql
npm run build
npx wrangler pages dev dist
```

Trang tĩnh `npm run dev` không chạy Pages Functions; dùng `wrangler pages dev` khi muốn thử OAuth/API.
