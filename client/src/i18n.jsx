import React from 'react'

const messages = {
  vi: {
    brand: 'EduLearn Pro',
    login: 'Đăng nhập',
    signup: 'Đăng ký',
    emailOrUsername: 'Email hoặc tên đăng nhập',
    password: 'Mật khẩu',
    forgotPasswordQ: 'Quên mật khẩu?',
    emailAddress: 'Địa chỉ email',
    confirmPassword: 'Xác nhận mật khẩu',
    
    usernameOptional: 'Tên đăng nhập (tuỳ chọn; mặc định là email)',
    verifyEmailTitle: 'Xác thực Email',
    resendCode: 'Gửi lại mã',
    confirm: 'Xác nhận',
    backHome: 'Về trang chủ',
    menu_intro: 'Giới thiệu',
    menu_courses: 'Các khóa học',
    menu_teachers: 'Giáo viên',
    menu_fee: 'Học phí',
    menu_exam: 'Phòng thi',
    menu_support: 'Hỗ trợ',
    hero_title_generic: 'Học trực tuyến thông minh, linh hoạt mọi lúc mọi nơi',
    hero_desc_generic: 'Khám phá khoá học chất lượng với lộ trình cá nhân hoá',
    cta_explore: 'Khám phá ngay',
    banner1_title: 'Teen 2001',
    banner1_desc: 'Tiết lộ bí kíp ôn thi đại học nhàn tênh!',
    banner2_title: 'Khóa tốt lớp 3–9',
    banner2_desc: 'Tự tin bút pháp, điểm giỏi 9, 10',
    banner3_title: 'Tiếng Anh giao tiếp',
    banner3_desc: 'Kỹ năng vững vàng với giáo viên nước ngoài',
    search_placeholder: 'Tìm kiếm khóa học...',
    search_btn: 'Tìm kiếm',
    social_like: 'Yêu thích EduLearn Pro',
    social_count: 'Thích 12K',
    news_title: 'Bảng tin EduLearn Pro',
    chat_greet: 'Xin chào! Chúng tôi luôn sẵn sàng hỗ trợ.',
    lang_label: 'Ngôn ngữ',
    // About
    about_title: 'Giới thiệu EduLearn Pro',
    about_mission: 'Sứ mệnh: giúp học sinh học thông minh và hiệu quả.',
    about_vision: 'Tầm nhìn: nền tảng học trực tuyến cá nhân hoá cho mọi người.',
    about_values: 'Giá trị: chất lượng, minh bạch, lấy người học làm trung tâm.',
    about_cta: 'Khám phá khóa học',
    // Courses
    courses_title: 'Các khóa học',
    courses_desc: 'Danh mục khoá học tiêu biểu từ cơ bản đến nâng cao.',
    course_enroll: 'Đăng ký',
    course_view: 'Xem chi tiết',
    course_math: 'Toán cơ bản',
    course_lit: 'Văn học Việt Nam',
    course_eng: 'Tiếng Anh giao tiếp',
    course_phys: 'Vật lý đại cương',
    level_beginner: 'Cơ bản',
    level_intermediate: 'Trung cấp',
    level_advanced: 'Nâng cao',
    // Add course form
    add_course_title: 'Thêm khóa học',
    add_course_name_label: 'Tên khóa học',
    add_course_level_label: 'Cấp độ',
    add_course_add_btn: 'Thêm',
    add_course_added: 'Đã thêm khóa học!',
    add_course_invalid: 'Vui lòng nhập tên khóa học hợp lệ',
  },
  en: {
    brand: 'EduLearn Pro',
    login: 'Login',
    signup: 'Sign Up',
    emailOrUsername: 'Email or username',
    password: 'Password',
    forgotPasswordQ: 'Forgot password?',
    emailAddress: 'Email address',
    confirmPassword: 'Confirm password',
    
    usernameOptional: 'Username (optional; defaults to email)',
    verifyEmailTitle: 'Verify Email',
    resendCode: 'Resend Code',
    confirm: 'Confirm',
    backHome: 'Back to Home',
    menu_intro: 'About',
    menu_courses: 'Courses',
    menu_teachers: 'Teachers',
    menu_fee: 'Tuition',
    menu_exam: 'Exams',
    menu_support: 'Support',
    hero_title_generic: 'Smart online learning, flexible anytime, anywhere',
    hero_desc_generic: 'Explore high‑quality courses with personalized pathways',
    cta_explore: 'Explore now',
    banner1_title: 'Teen 2001',
    banner1_desc: 'Reveal tips to ace university exams effortlessly!',
    banner2_title: 'Best courses grade 3–9',
    banner2_desc: 'Confident writing, score 9 and 10',
    banner3_title: 'English communication',
    banner3_desc: 'Solid skills with native teachers',
    search_placeholder: 'Search courses...',
    search_btn: 'Search',
    social_like: 'Love EduLearn Pro',
    social_count: '12K Likes',
    news_title: 'EduLearn Pro News',
    chat_greet: 'Hello! We are ready to help.',
    lang_label: 'Language',
    // About
    about_title: 'About EduLearn Pro',
    about_mission: 'Mission: help learners study smarter and more effectively.',
    about_vision: 'Vision: personalized online learning for everyone.',
    about_values: 'Values: quality, transparency, learner‑centric.',
    about_cta: 'Explore courses',
    // Courses
    courses_title: 'Courses',
    courses_desc: 'Featured courses from beginner to advanced.',
    course_enroll: 'Enroll',
    course_view: 'View details',
    course_math: 'Basic Mathematics',
    course_lit: 'Vietnamese Literature',
    course_eng: 'English Communication',
    course_phys: 'General Physics',
    level_beginner: 'Beginner',
    level_intermediate: 'Intermediate',
    level_advanced: 'Advanced',
    // Add course form
    add_course_title: 'Add Course',
    add_course_name_label: 'Course name',
    add_course_level_label: 'Level',
    add_course_add_btn: 'Add',
    add_course_added: 'Course added!',
    add_course_invalid: 'Please enter a valid course name',
  }
}

const I18nContext = React.createContext({
  lang: 'vi',
  t: (k) => messages['vi'][k] || k,
  setLang: () => {},
})

export function I18nProvider({ children }) {
  const [lang, setLang] = React.useState(() => localStorage.getItem('lang') || 'vi')
  const t = React.useCallback((key) => {
    const table = messages[lang] || messages.vi
    return table[key] ?? key
  }, [lang])
  const onSet = React.useCallback((l) => { setLang(l); try { localStorage.setItem('lang', l) } catch { void 0 } }, [])
  return (
    <I18nContext.Provider value={{ lang, t, setLang: onSet }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return React.useContext(I18nContext)
}
