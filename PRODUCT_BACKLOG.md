# PRODUCT BACKLOG - GIA KẾ (FAMILY FINANCIAL MANAGEMENT)

| ID | Tên chức năng | Tác nhân | Ưu tiên | Trạng thái |
|---|---|---|---|---|
| **PB01** | Đăng nhập và Đăng xuất hệ thống | Người dùng | High | Cần hoàn thiện Logout |
| **PB02** | Đăng ký & Kích hoạt tài khoản | Người dùng | High | Đã hoàn thành |
| **PB03** | Quản lý thông tin cá nhân & Đổi mật khẩu | Người dùng | Medium | Cần xử lý |
| **PB04** | Quản lý Không gian (Tạo & Gia nhập) | Người dùng | High | Đã hoàn thành |
| **PB05** | Quản lý thành viên (Thêm/Mời) | Parent | High | Đã hoàn thành |
| **PB06** | Phân quyền & Sửa thông tin thành viên | Parent | Medium | Đã hoàn thành |
| **PB07** | Xóa thành viên khỏi nhóm | Parent | Medium | Đã hoàn thành |

---

### PB01: Đăng nhập và Đăng xuất hệ thống
**Tác nhân**: Người dùng  
**Mô tả**: Người dùng đăng nhập vào hệ thống để bắt đầu phiên làm việc và đăng xuất để kết thúc phiên nhằm bảo mật thông tin.

**Tiêu chí chấp nhận (Đăng nhập)**:
1. Nhấn chọn [Đăng Nhập] tại trang chủ.
2. Nhập Email (Username) và Mật khẩu.
3. Hệ thống kiểm tra:
   3.1. Nếu sai Email/Mật khẩu: Thông báo "Bạn nhập sai Username hoặc Password".
   3.2. Nếu chưa kích hoạt: Thông báo yêu cầu xác thực OTP.
   3.3. Nếu thành công: Lưu JWT Token và hiển thị Dashboard.

**Tiêu chí chấp nhận (Đăng xuất)**:
1. Nhấn chọn [Đăng xuất] từ Menu người dùng.
2. Hệ thống thực hiện:
   2.1. Xóa JWT Token khỏi Cookie/LocalStorage.
   2.2. Hủy phiên làm việc hiện tại.
   2.3. Chuyển hướng người dùng về trang Đăng nhập.

**Điều kiện trước**: Tài khoản đã được kích hoạt (cho đăng nhập) hoặc đang trong phiên (cho đăng xuất).  
**Điều kiện ràng buộc**: Sử dụng Bcrypt cho mật khẩu và JWT cho session. Logout phải xóa sạch thông tin nhạy cảm ở phía Client.

---

### PB02: Đăng ký & Kích hoạt tài khoản
**Tác nhân**: Người dùng (Khách chưa có tài khoản)  
**Mô tả**: Người dùng đăng ký tài khoản mới và xác thực qua email để tham gia hệ thống.  
**Tiêu chí chấp nhận**:
1. Nhập Họ tên, Email và Mật khẩu.
2. Hệ thống kiểm tra Email: Nếu đã tồn tại, hiển thị lỗi "Email đã được sử dụng".
3. Nhấn [Đăng Ký]: Hệ thống tạo tài khoản ở trạng thái `Inactive` và gửi mã OTP 6 số qua Email.
4. Chuyển sang màn hình xác thực: Nhập mã 6 số từ Email.
5. Kiểm tra mã:
   5.1. Nếu mã khớp và chưa hết hạn (5 phút), kích hoạt tài khoản và thông báo thành công.
   5.2. Nếu mã sai/hết hạn, cho phép nhấn [Gửi lại mã].
**Điều kiện trước**: Email hợp lệ.  
**Điều kiện ràng buộc**: Mã xác thực chỉ có hiệu lực trong thời gian ngắn (5 phút).

---

### PB03: Quản lý thông tin cá nhân & Đổi mật khẩu
**Tác nhân**: Người dùng  
**Mô tả**: Cập nhật thông tin nhận dạng cá nhân (Họ tên, Ảnh đại diện) và thay đổi mật khẩu đăng nhập để tăng tính bảo mật.

**Tiêu chí chấp nhận (Cập nhật Profile)**:
1. Truy cập trang [Thông tin cá nhân].
2. Chỉnh sửa Họ tên, Tải lên Ảnh đại diện mới.
3. Nhấn [Lưu thay đổi].
4. Hệ thống cập nhật thông tin vào Database và hiển thị thông báo thành công.

**Tiêu chí chấp nhận (Đổi mật khẩu)**:
1. Truy cập phần [Đổi mật khẩu].
2. Nhập Mật khẩu hiện tại, Mật khẩu mới và Xác nhận mật khẩu mới.
3. Hệ thống kiểm tra:
   3.1. Nếu mật khẩu hiện tại sai: Báo lỗi "Mật khẩu hiện tại không đúng".
   3.2. Nếu mật khẩu mới không khớp xác nhận: Báo lỗi.
   3.3. Nếu thành công: Cập nhật mật khẩu đã mã hóa và yêu cầu đăng nhập lại (tùy chọn).

**Điều kiện trước**: Đã đăng nhập.

---

### PB04: Quản lý Không gian (Space) (Tạo & Gia nhập)
**Tác nhân**: Người dùng  
**Mô tả**: Tạo một không gian gia đình mới hoặc tham gia vào không gian đã có qua mã mời.  
**Tiêu chí chấp nhận**:
1. Trường hợp **Tạo phòng**:
   1.1. Nhập tên phòng (Gia đình).
   1.2. Hệ thống tạo phòng, sinh mã mời (Invite Code) 6 ký tự.
   1.3. Gán Role `parent` cho người tạo.
2. Trường hợp **Gia nhập phòng**:
   2.1. Nhập mã mời 6 ký tự được cung cấp bởi thành viên khác.
   2.2. Hệ thống kiểm tra mã: Nếu khớp, thêm người dùng vào phòng với role `member`.
   2.3. Nếu mã sai, báo lỗi "Mã mời không tồn tại".
**Điều kiện trước**: Người dùng chưa thuộc bất kỳ phòng nào.  
**Điều kiện ràng buộc**: Một người dùng tại một thời điểm chỉ thuộc một phòng duy nhất.

---

### PB05: Quản lý thành viên (Thêm/Mời)
**Tác nhân**: Parent (Chủ phòng), Member  
**Mô tả**: Chia sẻ mã mời để các thành viên khác gia nhập nhóm gia đình.  
**Tiêu chí chấp nhận**:
1. Vào trang [Quản lý nhóm].
2. Hệ thống hiển thị Mã mời của phòng.
3. Cho phép sao chép mã mời này để gửi cho người thân.
4. Danh sách thành viên hiện tại được hiển thị đầy đủ (Tên, Email, Vai trò).
**Điều kiện trước**: Đã thuộc một phòng.

---

### PB06: Phân quyền & Sửa vai trò thành viên
**Tác nhân**: Parent  
**Mô tả**: Thay đổi quyền hạn của thành viên (Ví dụ: Chuyển Member thành Parent để cùng quản lý).  
**Tiêu chí chấp nhận**:
1. Tại danh sách thành viên, Parent chọn chức năng [Đổi vai trò].
2. Thay đổi giữa `Parent` (Quản trị) và `Member` (Thành viên).
3. Hệ thống kiểm tra: Không thể tự đổi vai trò của chính mình.
4. Cập nhật thành công Role của thành viên trong Database.
**Điều kiện trước**: Phải là `Parent` mới thấy chức năng này.

---

### PB07: Xóa thành viên khỏi nhóm
**Tác nhân**: Parent  
**Mô tả**: Loại bỏ một thành viên không còn thuộc nhóm gia đình.  
**Tiêu chí chấp nhận**:
1. Nhấn nút [Xóa] cạnh tên thành viên trong danh sách.
2. Hiển thị hộp thoại xác nhận "Bạn có chắc chắn muốn xóa?".
3. Sau khi xác nhận:
   3.1. Xóa ID thành viên khỏi danh sách `members` của phòng.
   3.2. Reset thông tin `spaceId` và `role` của thành viên bị xóa về `null`.
4. Thông báo hoàn tất.
**Điều kiện trước**: Phải là `Parent`. Không thể tự xóa chính mình.


---

### PB04: Quản lý thông tin cá nhân
**Tác nhân**: Người dùng  
**Mô tả**: Cập nhật thông tin nhận dạng cá nhân như Họ tên, Ảnh đại diện.  
**Tiêu chí chấp nhận**:
1. Truy cập trang [Thông tin cá nhân].
2. Chỉnh sửa Họ tên, Tải lên Ảnh đại diện mới.
3. Nhấn [Lưu thay đổi].
4. Hệ thống cập nhật thông tin vào Database và hiển thị thông báo thành công.
5. Dữ liệu trên thanh điều hướng (Avatar, Tên) được cập nhật ngay lập tức.
**Điều kiện trước**: Đã đăng nhập.

---

### PB05: Tạo và Gia nhập phòng (Space)
**Tác nhân**: Người dùng  
**Mô tả**: Tạo một không gian gia đình mới hoặc tham gia vào không gian đã có qua mã mời.  
**Tiêu chí chấp nhận**:
1. Trường hợp **Tạo phòng**:
   1.1. Nhập tên phòng (Gia đình).
   1.2. Hệ thống tạo phòng, sinh mã mời (Invite Code) 6 ký tự.
   1.3. Gán Role `parent` cho người tạo.
2. Trường hợp **Gia nhập phòng**:
   2.1. Nhập mã mời 6 ký tự được cung cấp bởi thành viên khác.
   2.2. Hệ thống kiểm tra mã: Nếu khớp, thêm người dùng vào phòng với role `member`.
   2.3. Nếu mã sai, báo lỗi "Mã mời không tồn tại".
**Điều kiện trước**: Người dùng chưa thuộc bất kỳ phòng nào.  
**Điều kiện ràng buộc**: Một người dùng tại một thời điểm chỉ thuộc một phòng duy nhất.

---

### PB06: Thêm và Quản lý thành viên (Add/Join Members)
**Tác nhân**: Parent (Chủ phòng), Member  
**Mô tả**: Chia sẻ mã mời để các thành viên khác gia nhập nhóm gia đình.  
**Tiêu chí chấp nhận**:
1. Vào trang [Quản lý nhóm].
2. Hệ thống hiển thị Mã mời của phòng.
3. Cho phép sao chép mã mời này để gửi cho người thân.
4. Danh sách thành viên hiện tại được hiển thị đầy đủ (Tên, Email, Vai trò).
**Điều kiện trước**: Đã thuộc một phòng.

---

### PB07: Phân quyền & Sửa vai trò thành viên
**Tác nhân**: Parent  
**Mô tả**: Thay đổi quyền hạn của thành viên (Ví dụ: Chuyển Member thành Parent để cùng quản lý).  
**Tiêu chí chấp nhận**:
1. Tại danh sách thành viên, Parent chọn chức năng [Đổi vai trò].
2. Thay đổi giữa `Parent` (Quản trị) và `Member` (Thành viên).
3. Hệ thống kiểm tra: Không thể tự đổi vai trò của chính mình.
4. Cập nhật thành công Role của thành viên trong Database.
**Điều kiện trước**: Phải là `Parent` mới thấy chức năng này.

---

### PB08: Xóa thành viên khỏi nhóm
**Tác nhân**: Parent  
**Mô tả**: Loại bỏ một thành viên không còn thuộc nhóm gia đình.  
**Tiêu chí chấp nhận**:
1. Nhấn nút [Xóa] cạnh tên thành viên trong danh sách.
2. Hiển thị hộp thoại xác nhận "Bạn có chắc chắn muốn xóa?".
3. Sau khi xác nhận:
   3.1. Xóa ID thành viên khỏi danh sách `members` của phòng.
   3.2. Reset thông tin `spaceId` và `role` của thành viên bị xóa về `null`.
4. Thông báo hoàn tất.
**Điều kiện trước**: Phải là `Parent`. Không thể tự xóa chính mình.
