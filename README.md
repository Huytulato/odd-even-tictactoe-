# 🎮 Odd vs Even Tic-Tac-Toe - Setup Guide

Multiplayer 5x5 Tic-Tac-Toe game với WebSocket real-time!

## 📦 Requirements

- Node.js (v14 trở lên)
- npm hoặc yarn

## 🚀 Quick Start

### 1️⃣ Setup Server

```bash
# Tạo thư mục project
mkdir oddeven-tictactoe
cd oddeven-tictactoe

# Khởi tạo npm
npm init -y

# Cài đặt WebSocket
npm install ws

# Tạo file server.js và paste code từ artifact "WebSocket Server"
```

**Chạy server:**
```bash
node server.js
```

Bạn sẽ thấy: `WebSocket server running on ws://localhost:8080`

---

### 2️⃣ Setup Client (React)

**Option A: Sử dụng Create React App**

```bash
# Tạo React app
npx create-react-app oddeven-client
cd oddeven-client

# Thay thế src/App.js bằng code từ artifact "Odd/Even Tic-Tac-Toe Game"
# Cài lucide-react cho icons
npm install lucide-react

# Chạy client
npm start
```

**Option B: Sử dụng Vite (nhanh hơn)**

```bash
# Tạo Vite React app
npm create vite@latest oddeven-client -- --template react
cd oddeven-client

# Cài dependencies
npm install
npm install lucide-react

# Thay thế src/App.jsx bằng code artifact
# Chạy
npm run dev
```

---

### 3️⃣ Test Game

1. **Mở 2 browser windows** (hoặc 2 tabs)
2. Truy cập `http://localhost:3000` (hoặc `http://localhost:5173` nếu dùng Vite)
3. Window 1 sẽ là **ODD Player** (màu xanh dương)
4. Window 2 sẽ là **EVEN Player** (màu xanh lá)
5. **Chơi!** Click vào ô bất kỳ để tăng số

---

## 🎯 Game Rules

- **Board:** 5x5 (25 ô), bắt đầu từ 0
- **Odd Player:** Thắng khi có 5 số lẻ liên tiếp (hàng/cột/chéo)
- **Even Player:** Thắng khi có 5 số chẵn liên tiếp
- **No turns!** Cả 2 người chơi đều có thể click bất kỳ ô nào
- Click để **tăng số lên 1**: 0→1→2→3→4...

---

## 🌪️ Chaos Mode (Testing Race Conditions)

Bật **Chaos Mode** để test:
- Thêm random delay 0-1000ms cho mỗi message
- Giúp test race conditions (2 người click cùng lúc)
- Click nhanh ở cả 2 windows để thấy hiệu ứng!

---

## 🏗️ Architecture

### Server Authority Pattern
```
Client 1          Server          Client 2
   |                |                |
   |--INCREMENT---->|                |
   |                |---UPDATE------>|
   |<---UPDATE------|                |
   |                |<--INCREMENT----|
   |<---UPDATE------|                |
   |                |---UPDATE------>|
```

### Operational Transform
✅ **ĐÚNG:** Gửi operation (INCREMENT)
```javascript
{ type: 'INCREMENT', square: 12 }
// Server: board[12] += 1
```

❌ **SAI:** Gửi state (SET_VALUE)
```javascript
{ type: 'SET_VALUE', square: 12, value: 6 }
// Problem: Concurrent clicks overwrite each other!
```

---

## 📁 File Structure

```
project/
├── server.js              # WebSocket server
├── package.json
└── oddeven-client/
    ├── src/
    │   └── App.jsx       # React client
    ├── package.json
    └── ...
```

---

## 🐛 Troubleshooting

**Problem:** "WebSocket connection failed"
- ✅ Kiểm tra server đang chạy: `node server.js`
- ✅ Kiểm tra port 8080 không bị block
- ✅ Kiểm tra URL trong code: `ws://localhost:8080`

**Problem:** "Game is full"
- Chỉ cho phép 2 người chơi
- Đóng 1 tab và mở lại

**Problem:** Số không cập nhật
- Bật Console (F12) để xem errors
- Kiểm tra WebSocket connection status

---

## 🎓 Key Concepts Learned

1. **Server Authority:** Server là nguồn chân lý duy nhất
2. **Operational Transforms:** Gửi operations thay vì states
3. **WebSocket:** Real-time bidirectional communication
4. **Race Conditions:** Xử lý concurrent actions
5. **Distributed Systems:** Challenges khi có nhiều clients

---

## 🌟 Bonus Features (Optional)

- [ ] Optimistic updates (update UI ngay, không đợi server)
- [ ] Highlight winning line với animation
- [ ] Sound effects khi click
- [ ] Game rooms (nhiều rooms khác nhau)
- [ ] Spectator mode cho người thứ 3
- [ ] Reconnection handling
- [ ] Move history/replay

---

## 📝 Notes

- Assignment này **không chấm chi tiết**, focus vào **learning**
- Best submissions sẽ được share với class
- Có thể dùng Socket.io thay vì raw WebSocket
- In-memory storage (không cần database)

---

## 🎉 Have Fun!

Đây là bài tập về **distributed systems fundamentals** - kiến thức này áp dụng cho:
- Google Docs
- Figma
- Multiplayer games
- Real-time collaboration tools

Good luck! 🚀