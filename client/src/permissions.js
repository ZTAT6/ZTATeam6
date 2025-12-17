export const TEACHER_PERMISSIONS = [
  "course:create",
  "course:edit",
  "course:publish",
  "content:manage_course_level",
  "class:create",
  "class:edit",
  "class:delete",
  "class:schedule",
  "content:assign_to_class",
  "student:view_list_by_class",
  "student:enroll_class",
  "student:progress_tracking_class",
  "grade:manage_class",
  "communication:send_notice_class",
  "student:view_list",
  "student:progress_tracking",
  "grade:manage",
  "discussion:moderate",
  "communication:send_notice"
];

export const PERMISSION_GROUPS = {
  "Course Management": [
    "course:create",
    "course:edit",
    "course:publish",
    "content:manage_course_level"
  ],
  "Class Management": [
    "class:create",
    "class:edit",
    "class:delete",
    "class:schedule",
    "content:assign_to_class"
  ],
  "Student & Grade Management": [
    "student:view_list_by_class",
    "student:enroll_class",
    "student:progress_tracking_class",
    "grade:manage_class",
    "communication:send_notice_class",
    "student:view_list",
    "student:progress_tracking",
    "grade:manage",
    "discussion:moderate",
    "communication:send_notice"
  ]
};

export const PERMISSION_LABELS = {
  "course:create": "Tạo khóa học",
  "course:edit": "Chỉnh sửa khóa học",
  "course:publish": "Xuất bản/Duyệt trạng thái khóa học",
  "content:manage_course_level": "Quản lý cấu trúc khóa học",
  "class:create": "Tạo lớp học",
  "class:edit": "Chỉnh sửa lớp học",
  "class:delete": "Xóa lớp học",
  "class:schedule": "Thiết lập lịch học",
  "content:assign_to_class": "Gán học liệu/bài kiểm tra cho lớp",
  "student:view_list_by_class": "Xem danh sách học viên theo lớp",
  "student:enroll_class": "Thêm/Xóa học viên khỏi lớp",
  "student:progress_tracking_class": "Theo dõi tiến độ học viên (lớp)",
  "grade:manage_class": "Quản lý điểm theo lớp",
  "communication:send_notice_class": "Gửi thông báo tới lớp",
  "student:view_list": "Xem danh sách học viên (khóa)",
  "student:progress_tracking": "Theo dõi tiến độ học viên (khóa)",
  "grade:manage": "Quản lý điểm theo khóa",
  "discussion:moderate": "Kiểm duyệt thảo luận khóa học",
  "communication:send_notice": "Gửi thông báo tới học viên khóa học"
};
