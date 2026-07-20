import { create } from "zustand";
import { persist } from "zustand/middleware";

import { DocStatus, HttpMethod, type TddSchema } from "./validations";

export const sampleTddData: TddSchema = {
  documentInfo: {
    docId: "TDD-BAOKIM-001",
    feature: "Tích hợp thanh toán Baokim",
    author: "Trần Đình Thiên Tân",
    reviewer: "Tech Lead",
    status: DocStatus.Draft,
    version: "v1.0",
    updatedAt: "2026-07-13",
    relatedStories: [],
    businessRules: [],
  },
  contextGoals: {
    problem:
      "Khách đang chuyển khoản thủ công, admin đối soát tay → chậm, dễ sai. Cần tự động hoá xác nhận thanh toán qua cổng Baokim.",
    goals: [
      "Khách thanh toán qua Baokim, hệ thống tự xác nhận qua webhook.",
      "Frontend không giao tiếp trực tiếp với Baokim — mọi request qua backend.",
    ],
    nonGoals: [
      "Hoàn tiền (refund) — thiết kế ở tài liệu khác.",
      "Thanh toán trả góp.",
    ],
  },
  architecture: {
    description:
      "Backend là điểm trung gian duy nhất tiếp xúc Baokim. Frontend gọi backend, backend gọi Baokim và xử lý webhook.",
    mermaid: `flowchart LR
    FE[Frontend] -->|"REST"| BE[Backend]
    BE -->|"create order (JWT)"| BK[Baokim]
    BK -->|"webhook (async)"| BE
    BE --> DB[(Database)]
    RJ[Reconcile Job] -->|"đối soát định kỳ"| BK
    RJ -->|"vá webhook miss"| DB`,
    notes: [
      "Backend là điểm trung gian duy nhất tiếp xúc Baokim — FE không giữ secret.",
      "Reconcile job xử lý trường hợp webhook miss.",
    ],
  },
  sequenceDiagram: {
    description:
      "Luồng chính của tích hợp thanh toán — nhấn mạnh 'ai gọi ai, message gì'.",
    mermaid: `sequenceDiagram
    participant FE as Frontend
    participant BE as Backend
    participant BK as Baokim
    participant DB as Database

    FE->>BE: POST /payment/create (orderId, amount, returnUrl)
    BE->>DB: Kiểm tra order đang PENDING?

    alt Order không PENDING
        BE-->>FE: 409 ORDER_NOT_PENDING
    else Order PENDING
        BE->>BK: Tạo giao dịch (JWT sống 15 phút)
        alt Baokim không phản hồi
            BK-->>BE: timeout/error
            BE-->>FE: 502 BAOKIM_UNAVAILABLE
        else Baokim OK
            BK-->>BE: paymentUrl
            BE-->>FE: 200 {paymentUrl, expiresAt}
            FE->>BK: Redirect user sang trang thanh toán
            BK->>BE: POST /payment/webhook (txn_id, signature, ...)
            BE->>BE: Verify signature (HMAC)
            alt Signature không hợp lệ
                BE-->>BK: 401 INVALID_SIGNATURE
            else Signature hợp lệ
                BE->>DB: Update order=PAID + ghi transaction (1 DB transaction, idempotent theo bk_txn_id)
                BE-->>BK: 200 OK
            end
        end
    end`,
    notes: [],
  },
  activityDiagram: {
    description: "Logic xử lý webhook — nhấn mạnh 'các bước và nhánh rẽ'.",
    mermaid: `flowchart TD
    A[Nhận webhook từ Baokim] --> B{Verify signature hợp lệ?}
    B -- Không --> C[Trả 401 INVALID_SIGNATURE]
    B -- Có --> D{bk_txn_id đã xử lý trước đó?}
    D -- Rồi - idempotent --> E[Trả 200 OK, không xử lý lại]
    D -- Chưa --> F{Order đang PENDING?}
    F -- Không --> G[Log bất thường + Trả 200 OK]
    F -- Có --> H["Update order=PAID + Ghi transaction<br/>(cùng 1 DB transaction)"]
    H --> I[Trả 200 OK]`,
    notes: [],
  },
  stateDiagram: {
    description: "Vòng đời trạng thái của đơn hàng.",
    mermaid: `stateDiagram-v2
    [*] --> PENDING
    PENDING --> PAID: Webhook signature hợp lệ (BR-03)
    PENDING --> CANCELLED: Quá 24h chưa thanh toán (BR-07, auto-cancel)
    PAID --> [*]
    CANCELLED --> [*]`,
    notes: [],
  },
  dataModel: {
    description:
      "Bảng và quan hệ liên quan tới tính năng. Schema thật nằm ở migration trong repo, đây là bản mô tả thiết kế.",
    mermaid: `erDiagram
    ORDER ||--o{ PAYMENT_TRANSACTION : has
    ORDER {
        uuid order_id PK
        string status
        int amount
        datetime created_at
    }
    PAYMENT_TRANSACTION {
        uuid id PK
        uuid order_id FK
        string bk_txn_id UK
        string status
        int amount
        datetime created_at
    }`,
    notes: [
      "bk_txn_id UNIQUE — nền tảng cho idempotency của webhook.",
      "Update order và ghi transaction trong cùng một DB transaction.",
    ],
  },
  internalApi: {
    endpoints: [
      {
        endpoint: "/payment/create",
        method: HttpMethod.POST,
        description: "Tạo payment request, trả payment URL",
      },
      {
        endpoint: "/payment/webhook",
        method: HttpMethod.POST,
        description: "Nhận webhook kết quả từ Baokim",
      },
    ],
    examples: [
      {
        title: "POST /payment/create",
        content: [
          "Request:",
          "{",
          '  "orderId": "550e8400-...", // uuid, đơn phải đang PENDING',
          '  "amount": 350000, // VND, số nguyên, KHÔNG thập phân',
          '  "returnUrl": "https://.../result"',
          "}",
          "",
          "Response 200:",
          "{",
          '  "paymentUrl": "https://baokim.vn/pay/...",',
          '  "expiresAt": "2026-07-13T10:30:00+07:00" // JWT sống 15 phút',
          "}",
          "",
          "Response lỗi:",
          "{",
          '  "code": "ORDER_NOT_PENDING",',
          '  "message": "..."',
          "}",
        ].join("\n"),
      },
    ],
    errorCodes: [
      {
        code: "ORDER_NOT_PENDING",
        http: "409",
        when: "Tạo payment cho đơn đã PAID/CANCELLED",
      },
      {
        code: "INVALID_SIGNATURE",
        http: "401",
        when: "Webhook signature verify thất bại",
      },
      {
        code: "PAYMENT_EXPIRED",
        http: "410",
        when: "JWT payment request đã hết hạn",
      },
      {
        code: "BAOKIM_UNAVAILABLE",
        http: "502",
        when: "Baokim không phản hồi khi tạo giao dịch",
      },
    ],
  },
  externalApi: {
    endpoints: [
      {
        endpoint: "Baokim create order",
        purpose: "Tạo giao dịch",
        note: "cần JWT còn hạn",
      },
      {
        endpoint: "Baokim webhook",
        purpose: "Nhận kết quả",
        note: "gọi bất đồng bộ, verify signature",
      },
    ],
    fields: [
      {
        field: "signature",
        meaning: "Chữ ký HMAC",
        note: "verify bắt buộc trước mọi xử lý",
      },
      {
        field: "txn_id",
        meaning: "Mã giao dịch",
        note: "dùng làm khoá idempotency",
      },
    ],
    errorHandling:
      "Baokim không trả về mã lỗi chuẩn hoá. Cần map response.status_code sang mã nội bộ theo bảng ánh xạ trong repo/error-codes.md.",
    quirks: [
      "Nhanh.vn: filter parentId không chạy server-side → workaround client-side.",
      "Ahamove: total_fee mới là phí chính thức, không phải estimate.",
      "Ghi mọi hành vi bất ngờ để người sau không vấp lại.",
    ],
  },
  references: {
    userStories: ["HTM-142", "HTM-143"],
    businessRules: [
      "BR-03: đơn chỉ PAID khi signature hợp lệ",
      "BR-07: PENDING 24h → auto-cancel",
    ],
    useCases: ["UC-05: Thanh toán đơn hàng"],
    others: [
      "OpenAPI spec: repo/openapi.yaml",
      "Error code registry: repo/error-codes.md",
      "i18n messages: repo/locales/vi.json",
      "Tài liệu đối tác: link doc Baokim",
    ],
  },
  changeLog: [
    {
      date: "2026-07-13",
      version: "v1.0",
      change: "Tạo tài liệu",
      author: "Tân",
    },
    {
      date: "2026-07-13",
      version: "v1.1",
      change:
        "Tách state BE/FE + mapping; chuẩn hoá API Contract (error code registry, tách i18n, code vs message)",
      author: "Tân",
    },
  ],
};

export const initialTddData: TddSchema = {
  documentInfo: {
    docId: "",
    feature: "",
    author: "",
    reviewer: "",
    status: DocStatus.Draft,
    version: "v1.0",
    updatedAt: "",
    relatedStories: [],
    businessRules: [],
  },
  contextGoals: {
    problem: "",
    goals: [""],
    nonGoals: [],
  },
  architecture: { description: "", mermaid: "", notes: [] },
  sequenceDiagram: { description: "", mermaid: "", notes: [] },
  activityDiagram: { description: "", mermaid: "", notes: [] },
  stateDiagram: { description: "", mermaid: "", notes: [] },
  dataModel: { description: "", mermaid: "", notes: [] },
  internalApi: { endpoints: [], examples: [], errorCodes: [] },
  externalApi: { endpoints: [], fields: [], errorHandling: "", quirks: [] },
  references: {
    userStories: [],
    businessRules: [],
    useCases: [],
    others: [],
  },
  changeLog: [],
};

type TddFormStore = {
  step: number;
  data: TddSchema;
  setStep: (step: number) => void;
  setData: (data: TddSchema) => void;
  reset: () => void;
};

export const useTddFormStore = create<TddFormStore>()(
  persist(
    (set) => ({
      step: 0,
      data: initialTddData,
      setStep: (step) => set({ step }),
      setData: (data) => set({ data }),
      reset: () => set({ step: 0, data: initialTddData }),
    }),
    { name: "vnz-converter-tdd-form", version: 1 },
  ),
);
