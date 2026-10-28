import fs from 'node:fs';

const file = 'src/data/character-details.json';
const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
const have = new Set(rows.map(item => item.slug));
const sources = [
  { title: 'Nguyên tác Mục Thần Ký — hồi Đại Khư và 漓江五老', url: 'https://www.hetushu.com/book/4402/3283940.html' },
  { title: 'Danh sách nhân vật lồng tiếng Mục Thần Ký', url: 'https://zh.moegirl.org.cn/%E7%89%A7%E7%A5%9E%E8%AE%B0' },
  { title: 'Thư Viện Anime — tổng hợp Mục Thần Ký', url: 'https://thuvienanime.net/muc-than-ky/' },
];
const C = (slug, title, summary, aliases, facts, sections, related = []) => ({
  slug, title, category: 'nhan-vat', summary, aliases, spoiler: false, sources,
  facts: facts.map(([label, value]) => ({ label, value })),
  body: sections[0][2],
  sections: sections.map(([id, heading, paragraphs]) => ({ id, title: heading, paragraphs, spoiler: false })),
  related,
});

const additions = [
  C('khuc-su-huynh', 'Khúc sư huynh', 'Đệ tử của phái Ly Giang, đối thủ đầu tiên buộc Tần Mục vận dụng võ học thực chiến.', ['曲师兄', 'Khúc sư huynh'], [['Thế lực', 'Ly Giang Ngũ Lão'], ['Vai trò', 'Đối thủ ở chặng đầu'], ['Liên hệ', 'Tình sư tỷ']], [
    ['chan-dung', 'Chân dung', ['Khúc sư huynh là một đệ tử trẻ của Ly Giang Ngũ Lão. Trong lần truy đuổi Tần Mục ở Đại Khư, hắn dựa vào nguyên khí và tốc độ để áp đảo người mới bước vào con đường tu luyện.']],
    ['tran-chien', 'Cuộc chạm trán ở Đại Khư', ['Trận đấu với Tần Mục cho thấy chênh lệch giữa kinh nghiệm tu luyện và khả năng ứng biến. Đây là một trong những lần đầu Tần Mục phải đọc thế đánh, giữ nhịp và tìm cách hóa giải đối thủ thay vì chỉ dựa vào sức mạnh.']],
  ], ['tan-muc', 'tinh-su-ty']),
  C('tinh-su-ty', 'Tình sư tỷ', 'Đệ tử nữ của Ly Giang Ngũ Lão, xuất hiện trong nhóm truy đuổi Tần Mục ở Đại Khư.', ['晴师姐', 'Tình sư tỷ'], [['Thế lực', 'Ly Giang Ngũ Lão'], ['Vai trò', 'Đối thủ ở chặng đầu'], ['Liên hệ', 'Khúc sư huynh']], [
    ['chan-dung', 'Chân dung', ['Tình sư tỷ là đệ tử của Ly Giang Ngũ Lão, tham gia cuộc truy đuổi Tần Mục. Cô có nền tảng tu luyện và kinh nghiệm hơn cậu ở thời điểm hai bên gặp nhau.']],
    ['vai-tro', 'Vai trò trong hồi đầu', ['Sự xuất hiện của Tình sư tỷ giúp câu chuyện giới thiệu môi trường môn phái bên ngoài Tàn Lão Thôn. Cuộc đối đầu cũng cho thấy Tần Mục phải học cách xử lý nhiều đối thủ và tình huống cùng lúc.']],
  ], ['tan-muc', 'khuc-su-huynh']),
  C('te-nhan-bang', 'Tề Nhạn Băng', 'Nhân vật thuộc tuyến Ly Giang, xuất hiện trong phần mở đầu hành trình của Tần Mục.', ['齐雁冰', 'Tề Nhạn Băng'], [['Thế lực liên hệ', 'Ly Giang'], ['Mạch truyện', 'Những cuộc gặp đầu ở Đại Khư']], [
    ['chan-dung', 'Chân dung', ['Tề Nhạn Băng là nhân vật có tên được ghi nhận trong tuyến nhân vật đầu truyện và danh sách vai của bản hoạt hình. Hồ sơ giữ ở phạm vi vai trò đã xác định, không tự gán thêm cảnh giới hay chiến tích khi dữ liệu đối chiếu chưa thống nhất.']],
    ['vai-tro', 'Vị trí trong mạch truyện', ['Nhân vật thuộc lớp người mà Tần Mục gặp khi rời phạm vi an toàn của Tàn Lão Thôn. Có thể dùng tên Hán tự trong phần tên gọi khác để tra cứu các bản dịch và danh sách vai.']],
  ], ['tan-muc', 'khuc-su-huynh']),
  C('tien-thanh-nhi', 'Tiên Thanh Nhi', 'Yêu vật bị trấn áp ở một ngôi miếu hoang tại ốc đảo ven Dũng Giang.', ['仙清儿', 'Ngô Nữ', '蜈女'], [['Chủng tộc', 'Yêu vật dạng ngô công'], ['Địa điểm', 'Miếu hoang ven Dũng Giang'], ['Lần gặp', 'Chặng đầu của Tần Mục']], [
    ['chan-dung', 'Chân dung', ['Tiên Thanh Nhi, còn được gọi là Ngô Nữ trong một số danh sách, là yêu vật bị phong ấn tại miếu hoang. Hình thái và khả năng biến hóa khiến cuộc gặp ban đầu trở thành bài học về việc không thể tin ngay vẻ ngoài của sinh vật ở Đại Khư.']],
    ['vai-tro', 'Cuộc gặp ở ốc đảo', ['Tuyến của Tiên Thanh Nhi nằm trong những chặng đầu Tần Mục đi qua Dũng Giang. Nhân vật góp phần mở rộng hệ sinh vật và các nguy cơ ngoài vùng cư trú của Tàn Lão Thôn.']],
  ], ['tan-muc', 'dai-khu', 'dung-giang']),
  C('moc-bi-phong', 'Mộc Bi Phong', 'Nhân vật xuất hiện trong tuyến biến cố ở Trấn Ương Cung và phần đầu cuộc phiêu lưu tại Đại Khư.', ['沐悲风', 'Mộc Bi Phong'], [['Địa điểm liên hệ', 'Trấn Ương Cung'], ['Mạch truyện', 'Đại Khư']], [
    ['chan-dung', 'Chân dung', ['Mộc Bi Phong là nhân vật được ghi nhận trong danh sách vai của bản hoạt hình và tuyến sự kiện quanh Trấn Ương Cung. Thông tin hiện được trình bày thận trọng vì các bản tóm lược thứ cấp không thống nhất về chi tiết thân thế.']],
    ['vai-tro', 'Bối cảnh xuất hiện', ['Các tư liệu giới thiệu gắn nhân vật với một biến cố tại Trấn Ương Cung. Đặt hồ sơ cạnh Đại Khư và Trấn Ương Cung giúp người đọc tra cứu địa điểm mà không nhập nhằng với nhân vật có tên gần giống.']],
  ], ['tan-muc', 'tran-uong-cung']),
  C('trang-liep-ho', 'Trương Liệp Hộ', 'Thợ săn xuất hiện trong các hồi đầu, đại diện cho những người sống dựa vào kỹ năng sinh tồn ở Đại Khư.', ['张猎户', 'Thợ săn họ Trương'], [['Địa bàn', 'Đại Khư'], ['Vai trò', 'Nhân vật phụ ở chặng đầu']], [
    ['chan-dung', 'Chân dung', ['Trương Liệp Hộ là một nhân vật phụ được ghi tên trong danh sách vai của bản hoạt hình. Nhân vật thuộc lớp cư dân và người đi lại ở Đại Khư, nơi hiểu địa hình, dấu vết và tập tính dị thú có ý nghĩa sống còn.']],
    ['boi-canh', 'Đời sống ở Đại Khư', ['Hồ sơ ghi nhận vai trò phụ trợ thay vì tự mở rộng thành tiểu sử lớn. Nhân vật giúp bản đồ thế giới có thêm những người bình thường bên cạnh các cường giả và nhân vật trung tâm.']],
  ], ['dai-khu', 'tan-muc']),
];

let added = 0;
for (const entry of additions) {
  if (have.has(entry.slug)) continue;
  rows.push(entry);
  have.add(entry.slug);
  added++;
}
fs.writeFileSync(file, `${JSON.stringify(rows, null, 2)}\n`);
console.log(`Added ${added} early-story profiles; ${rows.length} character profiles total.`);

