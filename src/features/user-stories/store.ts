import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  CriteriaCondition,
  Position,
  Priority,
  Status,
  type Schema,
} from "./validations";

export const sampleData: Schema = {
  metadata: {
    id: "STORY-001",
    story:
      "Là một người dùng đã đăng nhập, tôi muốn đặt lại mật khẩu của mình để có thể truy cập tài khoản khi quên mật khẩu.",
    context:
      "Người dùng quên mật khẩu và cần một luồng tự phục vụ để đặt lại mà không cần liên hệ hỗ trợ. Tính năng này giảm tải cho bộ phận hỗ trợ khách hàng và cải thiện trải nghiệm người dùng.",
    sprint: 3,
    priority: Priority.Must,
    assignee: [
      { name: "Nguyễn Văn A", position: Position.FE },
      { name: "Trần Thị B", position: Position.BE },
      { name: "Phạm Minh C", position: Position.FE },
      { name: "Lê Hoàng D", position: Position.BE },
    ],
    creator: "Lê Văn C",
    status: Status.InProgress,
  },
  conditions: {
    preconditions: [
      "Người dùng đã có tài khoản hợp lệ trong hệ thống",
      "Tài khoản chưa bị khóa hoặc vô hiệu hóa",
      "Email đăng ký còn hoạt động và có thể nhận thư",
      "Người dùng đang ở trang đăng nhập hoặc trang quên mật khẩu",
      "Hệ thống gửi email (SMTP/SES) đang hoạt động bình thường",
    ],
    trigger:
      "Người dùng nhấn vào liên kết 'Quên mật khẩu?' trên trang đăng nhập.",
  },
  flow: {
    mainFlow: [
      "Người dùng nhấn 'Quên mật khẩu?' trên trang đăng nhập",
      "Hệ thống hiển thị form nhập địa chỉ email",
      "Người dùng nhập email và nhấn 'Gửi'",
      "Hệ thống validate định dạng email phía client",
      "Hệ thống xác minh email tồn tại trong cơ sở dữ liệu",
      "Hệ thống tạo token đặt lại mật khẩu ngẫu nhiên (UUID v4) và lưu vào DB với thời gian hết hạn",
      "Hệ thống gửi email chứa liên kết đặt lại mật khẩu (có hiệu lực 15 phút)",
      "Hệ thống hiển thị thông báo: 'Kiểm tra hộp thư của bạn'",
      "Người dùng mở email và nhấn vào liên kết đặt lại",
      "Hệ thống xác minh token còn hiệu lực và chưa được sử dụng",
      "Hệ thống hiển thị form nhập mật khẩu mới",
      "Người dùng nhập mật khẩu mới và xác nhận mật khẩu",
      "Hệ thống validate mật khẩu theo quy tắc nghiệp vụ",
      "Hệ thống cập nhật mật khẩu mới (hash bcrypt) và vô hiệu hóa token",
      "Hệ thống tự động đăng xuất tất cả session hiện tại của tài khoản",
      "Hệ thống chuyển hướng đến trang đăng nhập với thông báo thành công",
    ],
    alternativeFlow: [
      {
        code: "ALT-01",
        steps: [
          "Email không tồn tại trong hệ thống",
          "Hệ thống hiển thị thông báo: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn' (tránh tiết lộ thông tin)",
          "Luồng kết thúc mà không gửi email",
        ],
      },
      {
        code: "ALT-02",
        steps: [
          "Người dùng đã gửi yêu cầu trong vòng 2 phút gần nhất",
          "Hệ thống hiển thị thông báo: 'Vui lòng chờ X giây trước khi gửi lại'",
          "Nút 'Gửi' bị vô hiệu hóa đếm ngược",
          "Sau khi đếm ngược kết thúc, người dùng có thể gửi lại",
        ],
      },
      {
        code: "ALT-03",
        steps: [
          "Người dùng nhập hai mật khẩu không khớp nhau",
          "Hệ thống hiển thị lỗi inline: 'Mật khẩu xác nhận không khớp'",
          "Form không được submit cho đến khi hai mật khẩu khớp",
        ],
      },
    ],
    exceptionFlow: [
      {
        code: "EXC-01",
        steps: [
          "Liên kết đặt lại mật khẩu đã hết hạn (> 15 phút)",
          "Hệ thống hiển thị trang thông báo lỗi: 'Liên kết đã hết hạn'",
          "Hệ thống cung cấp nút 'Gửi lại email đặt lại mật khẩu'",
          "Người dùng nhấn nút → quay lại bước 2 của luồng chính",
        ],
      },
      {
        code: "EXC-02",
        steps: [
          "Token đã được sử dụng trước đó",
          "Hệ thống hiển thị thông báo: 'Liên kết này đã được sử dụng'",
          "Hệ thống gợi ý người dùng kiểm tra email mới nhất hoặc yêu cầu lại",
        ],
      },
      {
        code: "EXC-03",
        steps: [
          "Dịch vụ gửi email bị lỗi hoặc timeout",
          "Hệ thống ghi log lỗi và hiển thị thông báo: 'Không thể gửi email, thử lại sau'",
          "Hệ thống không lưu token vào DB để tránh token mồ côi",
          "Người dùng có thể thử lại sau vài phút",
        ],
      },
    ],
  },
  acceptanceCriteria: [
    {
      code: "AC-001",
      criterias: [
        { type: CriteriaCondition.Given, step: "Người dùng ở trang đăng nhập" },
        {
          type: CriteriaCondition.When,
          step: "Người dùng nhấn 'Quên mật khẩu?' và nhập email hợp lệ đã đăng ký",
        },
        {
          type: CriteriaCondition.Then,
          step: "Email đặt lại mật khẩu được gửi trong vòng 30 giây",
        },
        {
          type: CriteriaCondition.And,
          step: "Liên kết trong email hết hạn sau 15 phút",
        },
        {
          type: CriteriaCondition.And,
          step: "Token trong liên kết chỉ được sử dụng một lần duy nhất",
        },
      ],
    },
    {
      code: "AC-002",
      criterias: [
        {
          type: CriteriaCondition.Given,
          step: "Người dùng có liên kết đặt lại mật khẩu hợp lệ chưa hết hạn",
        },
        {
          type: CriteriaCondition.When,
          step: "Người dùng nhập mật khẩu mới thỏa mãn quy tắc và xác nhận đúng",
        },
        {
          type: CriteriaCondition.Then,
          step: "Mật khẩu được cập nhật thành công",
        },
        {
          type: CriteriaCondition.And,
          step: "Tất cả session đang hoạt động bị đăng xuất",
        },
        {
          type: CriteriaCondition.And,
          step: "Người dùng được chuyển hướng đến trang đăng nhập",
        },
      ],
    },
    {
      code: "AC-003",
      criterias: [
        {
          type: CriteriaCondition.Given,
          step: "Người dùng nhập email không tồn tại trong hệ thống",
        },
        {
          type: CriteriaCondition.When,
          step: "Người dùng submit form quên mật khẩu",
        },
        {
          type: CriteriaCondition.Then,
          step: "Hệ thống hiển thị thông báo trung tính không tiết lộ email có tồn tại hay không",
        },
        {
          type: CriteriaCondition.And,
          step: "Không có email nào được gửi đi",
        },
      ],
    },
    {
      code: "AC-004",
      criterias: [
        {
          type: CriteriaCondition.Given,
          step: "Người dùng đã gửi yêu cầu đặt lại mật khẩu trong vòng 2 phút",
        },
        {
          type: CriteriaCondition.When,
          step: "Người dùng thử gửi yêu cầu lần thứ hai",
        },
        {
          type: CriteriaCondition.Then,
          step: "Hệ thống từ chối và hiển thị thời gian chờ còn lại",
        },
      ],
    },
  ],
  activityDiagram: "https://lucid.app/lucidchart/example-activity-diagram",
  references: {
    tdds: [],
    rules: [],
    dependencies: [],
  },
  nonFunctional: [
    "Thời gian phản hồi gửi email < 2 giây (P95)",
    "Liên kết đặt lại phải dùng HTTPS và token ngẫu nhiên an toàn (cryptographically secure)",
    "Không tiết lộ sự tồn tại của tài khoản qua thông báo lỗi (security by obscurity)",
    "Mật khẩu phải được hash bằng bcrypt với cost factor ≥ 12 trước khi lưu",
    "Tất cả hành động liên quan đến đặt lại mật khẩu phải được ghi vào audit log",
    "Giao diện phải đạt chuẩn WCAG 2.1 AA (accessibility)",
    "Tính năng phải hoạt động trên các trình duyệt: Chrome, Firefox, Safari, Edge (2 phiên bản mới nhất)",
  ],
  outOfScope: [
    "Đặt lại mật khẩu qua SMS/OTP",
    "Hỗ trợ đăng nhập bằng mạng xã hội (OAuth)",
    "Đặt lại mật khẩu dành cho tài khoản admin qua giao diện này",
    "Tính năng khóa tài khoản sau nhiều lần thất bại (thuộc STORY-045)",
    "Giao diện quản lý token phía admin",
  ],
};

export const initialData: Schema = {
  metadata: {
    id: "",
    story: "",
    context: "",
    sprint: 1,
    priority: Priority.Must,
    assignee: [{ name: "", position: Position.FE }],
    creator: "",
    status: Status.Documentation,
  },
  conditions: {
    preconditions: [""],
    trigger: "",
  },
  flow: {
    mainFlow: [""],
    alternativeFlow: [],
    exceptionFlow: [],
  },
  acceptanceCriteria: [
    { code: "", criterias: [{ type: CriteriaCondition.Given, step: "" }] },
  ],
  activityDiagram: "",
  references: {
    tdds: [],
    rules: [],
    dependencies: [],
  },
  nonFunctional: [],
  outOfScope: [],
};

type FormStore = {
  step: number;
  data: Schema;
  setStep: (step: number) => void;
  setData: (data: Schema) => void;
  reset: () => void;
};

export const useFormStore = create<FormStore>()(
  persist(
    (set) => ({
      step: 0,
      data: initialData,
      setStep: (step) => set({ step }),
      setData: (data) => set({ data }),
      reset: () => set({ step: 0, data: initialData }),
    }),
    { name: "vnz-converter-form", version: 4 },
  ),
);

type AuthorStore = {
  name: string;
  setName: (name: string) => void;
};

export const useAuthorStore = create<AuthorStore>()(
  persist(
    (set) => ({
      name: "",
      setName: (name) => set({ name: name.trim() }),
    }),
    { name: "vnz-converter-author", version: 1 },
  ),
);
