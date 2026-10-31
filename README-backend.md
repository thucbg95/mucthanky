# Tài khoản, bình luận và lịch phim trên Cloudflare

Website đăng bình luận ngay sau khi gửi. Người dùng cần đăng nhập Google bằng email đã xác minh và vượt Turnstile; không có hàng chờ duyệt. Trang `/quan-tri/` chỉ dành cho Google admin. Trang `/nguyen-minh-duy/` là cổng riêng của chủ website, đăng nhập bằng tài khoản và mật khẩu đã cấu hình trong Cloudflare. Admin quản lý/xóa bình luận, xử lý báo cáo và khóa chat thành viên; chủ website có thêm quản lý vai trò tài khoản. Danh sách bình luận và tài khoản có tìm kiếm và phân trang. Xóa một bình luận gốc sẽ xóa cả các câu trả lời bên dưới.

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
- Pages runtime secret `ADMIN_TOKEN` — khóa ngẫu nhiên dài tối thiểu 32 byte để ký cookie phiên chủ website; không nhập khóa này vào trình duyệt
- Pages runtime secret `ADMIN_USERNAME` — tài khoản đăng nhập riêng của chủ website
- Pages runtime secret `ADMIN_PASSWORD` — mật khẩu mạnh, riêng biệt của chủ website

Mỗi bình luận cần tài khoản Google đã xác minh và Turnstile; nội dung được đăng công khai ngay. Bộ lọc ngôn từ chạy phía máy chủ trước khi lưu: không phân biệt chữ hoa/thường, không tự bỏ dấu hoặc tạo thêm dạng viết liền; chỉ so khớp chính xác các từ, token và cụm đã liệt kê (không chặn chuỗi con). Bình luận bị chặn trả về thông báo: “Bình luận chưa được gửi vì có từ ngữ không phù hợp. Vui lòng chỉnh sửa rồi thử lại.” Bình luận gốc được xếp mới nhất trước, trả lời nằm dưới bình luận gốc. Trang bình luận gốc được gắn làm liên kết ngữ cảnh trên toàn website.

Trước khi triển khai, hãy bảo đảm migrations `0003_admin_roles.sql`, `0004_chat_moderation.sql`, `0005_admin_audit.sql` và `0006_page_views.sql` đã chạy theo thứ tự. Migrations 0004 bật khóa chat; 0005 lưu lịch sử xóa bình luận và khóa/mở chat; 0006 tạo bộ đếm lượt xem dùng chung cho từng đường dẫn trang. Nhật ký chỉ chủ website xem được, có lọc hành động, chuyên mục, tìm kiếm và phân trang. Ở `/quan-tri/`, chỉ tài khoản Google đã được cấp quyền mới vào được. Tài khoản Google thường sẽ thấy thông báo không có quyền và nút quay về trang chủ/đổi tài khoản. Chủ website đăng nhập tại `/nguyen-minh-duy/` bằng `ADMIN_USERNAME` và `ADMIN_PASSWORD`; phiên được ký bằng `ADMIN_TOKEN`, đặt trong cookie `HttpOnly`, `Secure`, `SameSite=Strict`, hết hạn sau 12 giờ. Chỉ chủ website được cấp/gỡ vai trò tài khoản và xem nhật ký kiểm duyệt. Quản trị viên Google có thể tìm và xóa bình luận, xem báo cáo, khóa/mở chat của thành viên; không thể quản lý vai trò. Cả hai loại tài khoản có nút đăng xuất. Tài khoản admin Google đã đăng nhập sẽ thấy lối tắt Quản trị ở đầu menu công cụ nổi. Khi xóa bình luận gốc, hệ thống xóa cả các câu trả lời bên dưới và báo cáo liên quan.

Có thể chạy migration bằng Wrangler:

```sh
npx wrangler d1 execute data-mucthanky --remote --file=db/migrations/0003_admin_roles.sql
```

Nếu `0003_admin_roles.sql` chưa từng chạy, chạy lệnh trên trước một lần. Nếu đã chạy ở bản trước thì bỏ qua, không chạy lại. Sau đó chạy `0004_chat_moderation.sql` đúng một lần:

```sh
npx wrangler d1 execute data-mucthanky --remote --file=db/migrations/0004_chat_moderation.sql
```

Hoặc mở Cloudflare Dashboard → D1 → `data-mucthanky` → Console, dán nội dung file `0004_chat_moderation.sql` rồi bấm Execute. Đừng deploy bản mới trước khi migration hoàn tất.

Sau đó chạy `0005_admin_audit.sql` đúng một lần bằng lệnh:

```sh
npx wrangler d1 execute data-mucthanky --remote --file=db/migrations/0005_admin_audit.sql
```

Hoặc dán nội dung file này vào D1 Console. Không chạy lại các migration đã hoàn tất.

Để bật bộ đếm lượt xem, chạy `0006_page_views.sql` đúng một lần:

```sh
npx wrangler d1 execute data-mucthanky --remote --file=db/migrations/0006_page_views.sql
```

Hoặc mở Cloudflare Dashboard → D1 → `data-mucthanky` → Console, dán nội dung file `db/migrations/0006_page_views.sql` rồi bấm Execute. Số lượt xem được lưu chung trong D1 theo từng URL; một trình duyệt chỉ cộng lại cùng trang sau 30 phút. Đây là bộ đếm lượt tải trang, không phải số người xem duy nhất.


### Hồ sơ đã lưu và trang tài khoản

Bản này có trang `/tai-khoan/` để đăng nhập Google, xem tên/email và quyền tài khoản, đăng xuất, xem hoặc bỏ lưu hồ sơ. Nút `Lưu vào tài khoản` yêu cầu đăng nhập và đồng bộ qua D1; dữ liệu theo tài khoản nên dùng được trên nhiều thiết bị. Các hồ sơ đã lưu cục bộ trong trình duyệt sẽ được chuyển lên D1 khi người dùng mở trang tài khoản sau khi đăng nhập.

Trước khi deploy bản này, chạy migration `db/migrations/0007_saved_pages.sql` đúng một lần trên D1 `data-mucthanky` (Cloudflare Dashboard → D1 → database → Console). Nếu dùng CLI:

```sh
npx wrangler d1 execute data-mucthanky --remote --file=db/migrations/0007_saved_pages.sql
```

API: `GET /api/saved-pages` đọc danh sách của tài khoản đang đăng nhập; `POST /api/saved-pages` nhận `{"action":"add","slug":"tan-muc"}`, `{"action":"remove","slug":"tan-muc"}` hoặc danh sách `{"action":"import","slugs":[...]}` để đồng bộ tối đa 80 hồ sơ cũ. Mọi thao tác đều gắn với session Google hiện tại; người chưa đăng nhập không thể đọc hoặc sửa danh sách.
Giới hạn tốc độ áp dụng theo hash IP có salt; website không lưu IP thô. Email không được trả về trong API công khai.

## 4. Lịch tập tự cập nhật trên Cloudflare Pages

Website không cần cấu hình D1 hoặc Worker riêng chỉ để cập nhật lịch phim. Route `GET /api/schedule` đọc season chính thức 45969 từ Bilibili, chỉ lấy tập chính có số tập và link phát hợp lệ. Cloudflare cache kết quả khoảng một giờ; khi Bilibili tạm lỗi, route dùng cache cũ hoặc website chuyển về `src/data/episode-schedule.json`. Tập mới sẽ xuất hiện chậm nhất khoảng một giờ sau khi Bilibili công bố, miễn là bản deploy có thư mục `functions/`.

Worker và D1 bên dưới là tùy chọn nếu muốn lưu lịch thành dữ liệu bền vững, đồng bộ playlist YouTube hoặc xem lịch sử các lần đồng bộ. Tạo D1 rồi điền database ID trong `sync/wrangler.toml`; sau đó từ thư mục `sync` chạy:

```sh
npx wrangler secret put SYNC_TOKEN
npx wrangler deploy
```

Cron Worker chạy mỗi giờ. Nếu chỉ cần lịch tập mới trên website, không phải làm bước này.

### Video YouTube theo thứ tự playlist

Trang `/phim/` đã có trang xem nội bộ cho tập 01–106. Số tập tương ứng với vị trí trong playlist `PLLHHjiXKHAhY`; trang phát video bằng YouTube IFrame Player. Các trang 100–106 có sẵn và hiện trạng chờ video cho đến khi playlist có đủ vị trí đó. Route dự phòng `/phim/tap-*` cho phép tập mới hơn cũng mở bằng cùng mẫu trang mà không phải tạo thủ công từng trang.

Để website tự phát hiện số video mới:

1. Trong Google Cloud Console, bật **YouTube Data API v3** cho một project và tạo API key. Hạn chế key chỉ dùng API này.
2. Trong Cloudflare → Workers & Pages → dự án Pages của website → **Settings → Variables and Secrets**, thêm `YOUTUBE_API_KEY` dưới dạng **Secret** cho Production. Có thể thêm cùng secret cho Preview nếu cần.
3. Deploy lại Pages để Function nhận secret.

`GET /api/youtube-playlist` kiểm tra số video trong playlist, cache khoảng một giờ, rồi cập nhật số tập có video và liên kết nội bộ. Khi bạn thêm video vào cuối playlist, website tự nhận tập mới sau lần cache kế tiếp; không cần sửa danh sách bằng tay. Khi bỏ một video giữa playlist, các số tập phía sau dịch theo đúng vị trí mới, như quy ước bạn chọn. Nếu chưa cấu hình key, trang dùng mốc dự phòng 99 video và vẫn hiển thị sẵn danh sách đến tập 106.

## API và dữ liệu

- `GET /api/auth/me`: trạng thái đăng nhập, không trả email.
- `POST /api/auth/google`: tạo luồng OAuth; callback tạo session.
- `POST /api/auth/logout`: xóa session.
- `GET /api/comments?limit=10&offset=0&sort=newest&category=all`: phân trang bình luận cấp 1; `limit` chấp nhận 10, 20 hoặc 50; `sort` là `newest` hoặc `oldest`; `category` hỗ trợ `all`, `film`, `novel`, `encyclopedia` và `community`. Mỗi cuộc trò chuyện ban đầu hiển thị 2 câu trả lời gần nhất; khi có nhiều câu trả lời, người đọc có thể chuyển các phần cũ hơn/mới hơn theo nhóm 4. Phản hồi có tổng số cuộc trò chuyện để tính số trang.
- `GET /api/likes?type=post&id=/phim/`: đọc số lượt thích trang và trạng thái tài khoản hiện tại.
- `GET /api/page-views?page=/phim/` và `POST /api/page-views`: đọc/tăng số lượt xem trang; cần migration `0006_page_views.sql`.
- `POST /api/likes`: đăng nhập Google để thích hoặc bỏ thích một trang/bình luận.
- GET /api/saved-pages và POST /api/saved-pages: lưu, đồng bộ và xóa hồ sơ trên trang /tai-khoan/; cần migration  007_saved_pages.sql.
- `POST /api/comments`: cần tài khoản, trang ngữ cảnh và Turnstile; đăng công khai ngay.
- `POST /api/admin/comments`: bình luận có phân trang, bộ lọc theo chuyên mục và tìm theo tên/email/nội dung; dùng được với Google admin hoặc `ADMIN_TOKEN`.
- `POST /api/admin/users`: tài khoản có phân trang và tìm kiếm; chỉ `ADMIN_TOKEN`.
- `POST /api/admin/set-role`: cấp hoặc gỡ quyền thành viên/quản trị viên theo email Google; chỉ `ADMIN_TOKEN`.
- `POST /api/admin/set-lock`: khóa/mở chức năng chat của thành viên; dùng được với Google admin hoặc `ADMIN_TOKEN`.
- `POST /api/admin/audit`: nhật ký kiểm duyệt phân trang; chỉ `ADMIN_TOKEN`.
- `POST /api/admin/delete`: xóa bình luận; dùng được với Google admin hoặc `ADMIN_TOKEN`.
- `POST /api/admin/reports`: đọc báo cáo; dùng được với Google admin hoặc `ADMIN_TOKEN`.
- `GET /api/schedule`: đọc lịch tập chính thức từ Bilibili, cache khoảng một giờ.
- `GET /api/youtube-playlist`: đọc số video trong playlist YouTube đã cấu hình; cần Pages Secret `YOUTUBE_API_KEY`, nếu thiếu sẽ dùng mốc dự phòng 99.
- `GET /api/episodes`: metadata video YouTube tùy chọn từ cấu hình cũ.

## Kiểm tra local

Sau khi thiết lập `.dev.vars` từ `.dev.vars.example`, tạo D1 local và chạy:

```sh
npx wrangler d1 execute mucthanky --local --file=db/schema.sql
npm run build
npx wrangler pages dev dist
```

Trang tĩnh `npm run dev` không chạy Pages Functions; dùng `wrangler pages dev` khi muốn thử OAuth/API.
