import { create } from "zustand";
import { persist } from "zustand/middleware";

import { RuleStatus, type RuleSchema } from "./validations";

export const sampleRuleData: RuleSchema = {
  ruleId: "BR-07",
  name: "Phụ phí VAT khách doanh nghiệp",
  category: "Tax / Pricing",
  statement:
    "Đơn của khách doanh nghiệp có yêu cầu xuất hóa đơn VAT bị cộng thêm 8% phụ phí trên giá trị hàng hóa (trước phí ship).",
  when: "Loại khách = Doanh nghiệp VÀ chọn 'Xuất hóa đơn VAT'",
  then: "Cộng 8% × giá hàng vào tổng; hiển thị dòng phụ phí riêng; ghi note đơn gửi Nhanh.vn",
  except:
    "Khách cá nhân: không áp dụng. Không yêu cầu VAT: không áp dụng. Không tính trên phí ship.",
  source: "Chính sách kế toán nội bộ Hoa Theo Mùa",
  owner: "Kế toán trưởng",
  relatedStories: [],
  status: RuleStatus.Active,
  version: "v1.1",
  effectiveDate: "2026-07-01",
  notes: "Làm tròn VND SAU khi cộng surcharge (xem BR-03)",
};

export const initialRuleData: RuleSchema = {
  ruleId: "",
  name: "",
  category: "",
  statement: "",
  when: "",
  then: "",
  except: "",
  source: "",
  owner: "",
  relatedStories: [],
  status: RuleStatus.Draft,
  version: "v1.0",
  effectiveDate: "",
  notes: "",
};

type RuleFormStore = {
  step: number;
  data: RuleSchema;
  setStep: (step: number) => void;
  setData: (data: RuleSchema) => void;
  reset: () => void;
};

export const useRuleFormStore = create<RuleFormStore>()(
  persist(
    (set) => ({
      step: 0,
      data: initialRuleData,
      setStep: (step) => set({ step }),
      setData: (data) => set({ data }),
      reset: () => set({ step: 0, data: initialRuleData }),
    }),
    { name: "vnz-converter-rule-form", version: 1 },
  ),
);
