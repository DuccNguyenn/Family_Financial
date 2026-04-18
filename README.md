# 👨‍👩‍👧‍👦 Family Financial Management (Family Finance)

> Hệ thống quản lý tài chính gia đình thông minh, giúp theo dõi chi tiêu, lập kế hoạch ngân sách và gắn kết các thành viên.

[![NestJS](https://img.shields.io/badge/Backend-NestJS-%23E0234E?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-%23000000?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-%2347A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%204-%2306B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

---

## 🌟 Tổng quan dự án

**Family Financial Management** là một ứng dụng web hiện đại được thiết kế để giúp các gia đình quản lý tài chính một cách minh bạch và hiệu quả. Hệ thống cho phép các thành viên trong gia đình cùng chung tay quản lý các khoản thu chi, thiết lập mục tiêu ngân sách và nhận được các cảnh báo kịp thời khi chi tiêu vượt ngưỡng.

## ✨ Tính năng chính

### 📂 Quản lý không gian (Spaces)
*   **Family Spaces:** Tạo không gian gia đình riêng tư, mời thành viên tham gia qua mã code độc nhất.
*   **Role-based Management:** Phân quyền giữa `Parent` (Quản trị viên) và `Member` (Thành viên).

### 💰 Quản lý ngân sách (Budgeting)
*   **Smart Limits:** Thiết lập hạn mức chi tiêu hàng tháng cho từng danh mục (Ăn uống, Di chuyển, Mua sắm...).
*   **Hard-limit & Alerts:** Tùy chọn khóa giao dịch khi vượt 100% ngân sách hoặc nhận cảnh báo qua hệ thống/email khi đạt ngưỡng 80%.

### 📊 Giao dịch & Dashboard
*   **Transaction Tracking:** Ghi chép chi tiết các khoản thu nhập và chi tiêu.
*   **Interactive Charts:** Dashboard trực quan sử dụng Area Charts để theo dõi xu hướng tài chính trong 6 tháng.
*   **Warning Cards:** Thẻ cảnh báo hiển thị ngay trên Dashboard khi ngân sách sắp cạn.

### 🔐 Tài khoản & Bảo mật
*   **Secure Auth:** Đăng nhập an toàn với JWT và mã hóa mật khẩu Bcrypt.
*   **Profile Management:** Cập nhật thông tin cá nhân, thay đổi ảnh đại diện (avatar) và mật khẩu.

---

## 🛠 Công nghệ sử dụng

| Thành phần | Công nghệ |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router), React 19, Tailwind CSS 4, Radix UI, Shadcn UI |
| **Backend** | NestJS, TypeScript, Passport.js (JWT), Nodemailer |
| **Database** | MongoDB (Mongoose ODM) |
| **State Management** | TanStack Query (Server State), Zustand (Client State) |
| **Visualization** | Recharts |
| **Icons** | Phosphor Icons |

---

## 📂 Cơ cấu thư mục

```text
.
├── family-finance-fe/   # Mã nguồn Frontend (Next.js)
├── family-finance-be/   # Mã nguồn Backend (NestJS)
├── DOCUMEMT/            # Tài liệu đặc tả, kế hoạch dự án
└── README.md            # Tài liệu hướng dẫn chính
```

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy

### Điều kiện tiên quyết
- Node.js (phiên bản 18 trở lên)
- MongoDB (Local hoặc Atlas)
- npm hoặc yarn

### 1. Cài đặt Backend
```bash
cd family-finance-be
npm install
```
*   **Cấu hình:** Tạo file `.env` dựa trên các biến môi trường cần thiết (DB_URI, JWT_SECRET, MAIL_CONFIG...).
*   **Chạy:** `npm run start:dev`

### 2. Cài đặt Frontend
```bash
cd family-finance-fe
npm install
```
*   **Cấu hình:** Tạo file `.env` (NEXT_PUBLIC_API_URL...).
*   **Chạy:** `npm run dev`

---

## 📄 Giấy phép
Dự án được phát triển phục vụ mục đích học tập và làm Đồ án tốt nghiệp.

---

## 👥 Thành viên thực hiện
*   **Nguyễn Văn Đức** - *Software Engineer*
*   Phát triển bởi team **GR94**

---
<p align="center">Made with ❤️ for a better financial future</p>
