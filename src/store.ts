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
      "Người dùng quên mật khẩu và cần một luồng tự phục vụ để đặt lại mà không cần liên hệ hỗ trợ.",
    sprint: 3,
    priority: Priority.Must,
    assignee: [
      { name: "Nguyễn Văn A", position: Position.FE },
      { name: "Trần Thị B", position: Position.BE },
    ],
    creator: "Lê Văn C",
    status: Status.Documentation,
  },
  conditions: {
    preconditions: [
      "Người dùng đã có tài khoản hợp lệ trong hệ thống",
      "Tài khoản chưa bị khóa",
      "Email đăng ký còn hoạt động",
    ],
    trigger:
      "Người dùng nhấn vào liên kết 'Quên mật khẩu?' trên trang đăng nhập.",
  },
  flow: {
    mainFlow: [
      "Người dùng nhấn 'Quên mật khẩu?' trên trang đăng nhập",
      "Hệ thống hiển thị form nhập địa chỉ email",
      "Người dùng nhập email và nhấn 'Gửi'",
      "Hệ thống xác minh email tồn tại trong cơ sở dữ liệu",
      "Hệ thống gửi email chứa liên kết đặt lại mật khẩu (có hiệu lực 15 phút)",
      "Người dùng mở email và nhấn vào liên kết",
      "Hệ thống hiển thị form nhập mật khẩu mới",
      "Người dùng nhập mật khẩu mới và xác nhận",
      "Hệ thống cập nhật mật khẩu và chuyển hướng đến trang đăng nhập",
    ],
    alternativeFlow: [
      {
        code: "ALT-01",
        steps: [
          "Email không tồn tại trong hệ thống",
          "Hệ thống hiển thị thông báo: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn' (bảo mật)",
          "Luồng kết thúc",
        ],
      },
    ],
    exceptionFlow: [
      {
        code: "EXC-01",
        steps: [
          "Liên kết đặt lại mật khẩu đã hết hạn (> 15 phút)",
          "Hệ thống hiển thị thông báo lỗi và nút 'Gửi lại email'",
          "Người dùng nhấn 'Gửi lại email' → quay lại bước 2 của luồng chính",
        ],
      },
    ],
  },
  acceptanceCriteria: {
    code: "AC-001",
    criterias: [
      {
        type: CriteriaCondition.Given,
        step: "Người dùng ở trang đăng nhập",
      },
      {
        type: CriteriaCondition.When,
        step: "Người dùng nhấn 'Quên mật khẩu?' và nhập email hợp lệ",
      },
      {
        type: CriteriaCondition.Then,
        step: "Email đặt lại mật khẩu được gửi trong vòng 30 giây",
      },
      {
        type: CriteriaCondition.And,
        step: "Liên kết trong email hết hạn sau 15 phút",
      },
    ],
  },
  activityDiagram: "https://lucid.app/lucidchart/example-activity-diagram",
  references: {
    businessRules: ["BR-05: Mật khẩu phải có ít nhất 8 ký tự, gồm chữ và số"],
    dependencies: [
      "STORY-002: Xác thực email người dùng",
      "STORY-010: Gửi email thông báo",
    ],
  },
  nonFunctional: [
    "Thời gian phản hồi gửi email < 2 giây (P95)",
    "Liên kết đặt lại phải dùng HTTPS và token ngẫu nhiên an toàn",
    "Không tiết lộ sự tồn tại của tài khoản qua thông báo lỗi",
  ],
  outOfScope: [
    "Đặt lại mật khẩu qua SMS/OTP",
    "Hỗ trợ đăng nhập bằng mạng xã hội",
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
  acceptanceCriteria: {
    code: "",
    criterias: [{ type: CriteriaCondition.Given, step: "" }],
  },
  activityDiagram: "",
  references: {
    businessRules: [],
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
    { name: "vnz-converter-form", version: 1 },
  ),
);
