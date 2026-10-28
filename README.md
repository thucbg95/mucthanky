# mucthanky.com

Website bách khoa Mục Thần Ký, tối ưu cho Cloudflare Pages: nhánh phim và truyện, hồ sơ nhân vật, ảnh/video, vật phẩm, cảnh giới, lịch chiếu Bilibili, tìm kiếm, giao diện sáng/tối và thiết kế co giãn cho điện thoại.

## Chạy thử

Cần Node.js 20 trở lên. Website tĩnh không cần cài thêm thư viện:

```sh
npm run build
npm run dev
```

Mở `http://127.0.0.1:4321`. Lệnh build tạo website trong `dist`.

## Đưa lên GitHub và Cloudflare Pages

Đưa mã nguồn thư mục này lên GitHub, gồm `src`, `public`, `scripts`, `functions`, `db`, `sync` và các file cấu hình. Không chỉ tải riêng `dist` lên Git vì Pages cần mã nguồn để dựng site.

Trong Cloudflare chọn **Workers & Pages → Create → Pages → Connect to Git** rồi nhập:

- Framework preset: **None**
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/` nếu mã nguồn ở thư mục gốc repo
- Deploy command: để trống

Sau khi build, website tĩnh và lịch tập đã lưu sẵn hoạt động ngay. Bật đăng nhập/bình luận dùng chung và tự đồng bộ tập mới cần làm thêm các bước trong [README-backend.md](README-backend.md). Bình luận được đăng ngay sau khi gửi; chủ website có thể xóa bình luận tại `/quan-tri/`. Nếu Cloudflare hỏi cấu hình Worker, hãy quay về chọn Pages; gói này xuất thư mục tĩnh `dist` và dùng Pages Functions cho API.

## Nội dung

Nguồn dữ liệu chính:

- `src/data/lore.json` — hồ sơ bách khoa nền
- `src/data/character-details.json` — hồ sơ nhân vật, tên gọi, gallery và video
- `src/data/world-details.json` — vật dụng, phương tiện, vũ khí và hồ sơ mở rộng
- `src/data/media.json` — hình ảnh và nguồn ghi công
- `src/data/episode-schedule.json` — lịch tĩnh dự phòng; Pages Function đọc trực tiếp lịch Bilibili và cache khoảng một giờ
- `src/data/novel-chapters.json` — mục lục và nội dung trang đọc tại `/truyen/`

### Bổ sung chương truyện

Trang Truyện tạo một trang riêng cho từng mục trong `novel-chapters.json`. Mỗi mục có `number`, `title`, `kind`, `summary`, `content`, `related` và `source`. Để đăng bản toàn văn, đặt `kind` thành `full` và đưa từng đoạn văn vào mảng `content`; chỉ thêm văn bản mà website có quyền xuất bản. Với mục tóm lược, dùng `kind: "summary"` và điền `summary`; trang đọc sẽ ghi rõ đó không phải toàn văn. Sau khi sửa dữ liệu, chạy `npm run build` rồi đẩy mã nguồn lên GitHub để Cloudflare Pages dựng lại website.

Ảnh nhân vật và hình phim có link nguồn ngay trên hồ sơ. Minh họa khái niệm được ghi rõ là minh họa, không giả làm ảnh chính thức. Favicon là minh họa vector ngọc bội chữ 秦. Tác phẩm, logo và ảnh phim thuộc chủ sở hữu tương ứng.

## Triển khai tính năng cộng đồng và tự cập nhật

Lịch tập tự cập nhật qua Pages Function, không cần D1/Worker riêng. Để mở tài khoản Google và bình luận chung, cần cấu hình D1, Google OAuth và Turnstile theo [README-backend.md](README-backend.md).

Quyền phát hành theo khu vực do Bilibili quyết định. Nút Vietsub mở truy vấn Google đúng cụm từ yêu cầu, không phát phim trên website.
