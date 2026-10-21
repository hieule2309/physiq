# THÔNG TIN DỰ ÁN: FITTRACK - PERSONAL CUTTING TRACKER

## 1. Mục tiêu dự án

Dự án là một ứng dụng Web (Next.js) cá nhân dùng để theo dõi quá trình Siết mỡ (Cutting), quản lý dinh dưỡng, thực phẩm bổ sung và lịch tập luyện. Ứng dụng phải có tính động (dynamic), hoàn toàn không hardcode thông số cá nhân.

## 2. Luồng Khởi Tạo & Tính Toán Động (Onboarding & Calculations)

Xây dựng một màn hình Onboarding / Settings để thu thập dữ liệu đầu vào và tự động tính toán chỉ số:

- **Input Form:** Tuổi, Giới tính, Chiều cao (cm), Cân nặng (kg), Mức độ vận động (Activity Level).
- **Tính toán TDEE:** Áp dụng công thức Mifflin-St Jeor để tính BMR và nhân với hệ số vận động để ra TDEE.
- **Thiết lập Calo Siết (Target Calories):** Cho phép người dùng nhập mức thâm hụt (ví dụ: -500 kcal, -700 kcal) hoặc nhập thẳng số Calo mục tiêu.
- **Tự động phân bổ Macro (Auto-calculate Macros):** Từ lượng Target Calories, tự động chia Macro theo công thức:
  - **Protein:** Tính toán tự động ở mức tối thiểu 2.2g / kg cân nặng hiện tại.
  - **Fat:** Tính toán tự động ở mức 20% - 25% tổng Target Calories (ưu tiên mức an toàn cho nội tiết).
  - **Carbs:** Tính toán tự động từ lượng Calo còn lại sau khi đã trừ đi Calo của Protein và Fat (1g Pro = 4 kcal, 1g Fat = 9 kcal, 1g Carb = 4 kcal).

## 3. Thực phẩm bổ sung (Supplement Stack)

Cần có một Checklist mỗi ngày để theo dõi:

- 5g Creatine (Uống sau tập hoặc buổi sáng ngày nghỉ).
- 2 viên OstroVit Omega 3 Extreme (1500mg EPA+DHA) -> Uống chia làm 2 lần (Sau bữa ăn).

## 4. Lịch tập luyện (Workout Split)

Tần suất: 4 buổi/tuần (Ưu tiên tập tạ nặng - Heavy Weight).

- Buổi 1: Push (Ưu tiên Ngực)
- Buổi 2: Pull (Lưng, Tay trước)
- Buổi 3: Leg (Chân, Bụng)
- Buổi 4: Push (Ưu tiên Vai)

## 5. Yêu cầu Công nghệ & Giao diện (Tech Stack & UI)

- **Framework:** Next.js (App Router), Tailwind CSS.
- **UI Components:** Shadcn UI, Lucide Icons, React Hook Form (cho luồng Onboarding).
- **Design System:**
  - Giao diện mặc định là Dark Mode.
  - Màu nhấn (Accent color): Xanh lá Neon (hiển thị năng lượng/hoàn thành) và các màu nổi (Xanh dương cho Protein, Cam cho Carb, Hồng cho Fat).
- **Responsive Strict:** Bắt buộc áp dụng Mobile-first. Tuy nhiên TRÊN DESKTOP (breakpoint md trở lên) phải chuyển sang dạng Dashboard: có Sidebar trái cố định, layout nội dung chia Grid nhiều cột, không được để giao diện mobile thu hẹp lơ lửng giữa màn hình Desktop.
