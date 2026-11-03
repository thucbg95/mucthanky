# Rà soát bách khoa — 03/11/2026

Đã đối chiếu toàn bộ khóa ảnh cũ, dừng dùng ảnh minh họa chuyên mục để nhận diện một chủ thể cụ thể. Dữ liệu ảnh có danh sách chủ thể, loại ảnh, nguồn và ngày đối chiếu. Bản thiết kế / minh họa khái niệm được ghi rõ trên giao diện. Ảnh cũ giữ nguyên tệp để truy vết nhưng ảnh không đúng bị chặn khỏi hồ sơ.

- 228 hồ sơ; 44 hồ sơ có ảnh hoặc thiết kế đúng chủ thể; 184 hồ sơ hiện trạng thái đang cập nhật ảnh.
- 27 tệp ảnh mới: 21 ảnh chính thức Bilibili và 6 khung hình từ các tập phim tại máy.
- Đổi poster đầu trang Phim; lọc kho ảnh từng hồ sơ theo đúng chủ thể.
- Bổ sung 11 hồ sơ cũ; thêm Kiều Tinh Quân, Thượng Thương và Long Kiều Nam. Nội dung bổ sung đối chiếu các chương 1, 2, 91, 108, 152, 290, 291 trong thư viện nguyên tác đã có. Không lấy diễn biến nguyên tác làm bằng chứng phim đã chuyển thể.
- Chi tiết: src/data/content-audit.json; metadata: src/data/media.json.

## Giới hạn còn lại

Không phải mọi nhân vật nguyên tác đã có tạo hình hoạt hình chính thức. Không dùng ảnh nhân vật khác hoặc tạo hình tự tưởng tượng thay thế. Các mục còn ngắn được liệt kê ở thinProfiles trong báo cáo máy đọc; đợt này chưa hoàn thiện toàn bộ nội dung 228 hồ sơ.

## Kiểm tra

Build và audit nội dung đạt. Kiểm tra ảnh riêng chạy bằng node scripts/check-media.mjs. Bộ npm test đầy đủ vẫn vướng lỗi có sẵn về hai H1 ở trang quản trị /nguyen-minh-duy/; không sửa tính năng quản trị trong đợt này.

## Chức năng đăng phim

Chỉ khảo sát và tư vấn, chưa triển khai đăng phim / lưu video / API mới. Có thể mở rộng cổng chủ website hiện có để nhập tập, tên, ảnh, trailer và tải tệp hoặc dán mã nhúng; cần kho lưu trữ video và dữ liệu tập phim để xuất bản không sửa mã nguồn.

## Mở rộng theo toàn bộ tiểu thuyết — 03/11/2026

- Phạm vi đã được chủ website xác nhận: cả phim và toàn bộ nguyên tác.
- Bổ sung nội dung có đối chiếu chương cho 20 hồ sơ, dữ liệu ở src/data/novel-details.json.
- Sửa nhầm biệt danh Thái Dịch / chủ nhân Di La Cung; làm rõ Lam Ngự Điền / Ngự Thiên Tôn và Thất / Cửu Thiên Tôn.
- Chỉ mục tên xuyên 1.989 chương; 202 hồ sơ có chương nhắc tên, 1.172 liên kết tham khảo được chọn. Chỉ mục tự cập nhật trước npm run build. Đây là kết quả nhắc tên, không phải xác nhận mọi tình tiết hay tiến độ chuyển thể.
- Các phần được đánh dấu spoiler thu gọn mặc định; mục lục mở đúng phần khi người đọc chọn.
- Kiểm tra: build, audit nội dung, test:lore và check-media đạt. Còn 144 hồ sơ dưới 150 từ; chưa tuyên bố hoàn thiện toàn bộ nội dung.

