import type { AppLocale } from "./locale";

export type DateFormatPreset =
  | "dateShort"
  | "dateShort2y"
  | "dateMedium"
  | "dateLong"
  | "dateWithWeekday"
  | "dayMonth"
  | "monthYear"
  | "monthShort"
  | "monthLong"
  | "dayOfMonth"
  | "hourShort"
  | "time"
  | "timeWithSeconds"
  | "dateTimeShort"
  | "dateTimeMedium"
  | "dateTimeLong"
  | "iso";

export const DATE_PATTERNS: Record<
  AppLocale,
  Record<DateFormatPreset, string>
> = {
  "en-US": {
    dateShort: "MM/dd/yyyy",
    dateShort2y: "MM/dd/yy",
    dateMedium: "MMM d, yyyy",
    dateLong: "MMMM d, yyyy",
    dateWithWeekday: "EEE, MMM d, yyyy",
    dayMonth: "MM/dd",
    monthYear: "MMMM yyyy",
    monthShort: "MMM",
    monthLong: "MMMM",
    dayOfMonth: "d",
    hourShort: "h a",
    time: "h:mm a",
    timeWithSeconds: "h:mm:ss a",
    dateTimeShort: "h:mm a, MM/dd/yyyy",
    dateTimeMedium: "MMM d, yyyy 'at' h:mm a",
    dateTimeLong: "'at' h:mm a 'on' MMMM d, yyyy",
    iso: "yyyy-MM-dd",
  },
  "vi-VN": {
    dateShort: "dd/MM/yyyy",
    dateShort2y: "dd/MM/yy",
    dateMedium: "dd MMM yyyy",
    dateLong: "dd MMMM yyyy",
    dateWithWeekday: "EEE, dd/MM/yyyy",
    dayMonth: "dd/MM",
    monthYear: "MMMM yyyy",
    monthShort: "MMM",
    monthLong: "MMMM",
    dayOfMonth: "d",
    hourShort: "H'h'",
    time: "HH:mm",
    timeWithSeconds: "HH:mm:ss",
    dateTimeShort: "HH:mm, dd/MM/yyyy",
    dateTimeMedium: "dd MMM yyyy, HH:mm",
    dateTimeLong: "'lúc' HH:mm 'ngày' dd/MM/yyyy",
    iso: "yyyy-MM-dd",
  },
};
