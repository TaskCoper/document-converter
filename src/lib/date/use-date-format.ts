import { useMemo } from "react";
import {
  formatDate as formatDateRaw,
  formatDateTime as formatDateTimeRaw,
  formatRelative as formatRelativeRaw,
  formatTime as formatTimeRaw,
  type FormatInput,
  type RelativeFormatOptions,
} from "./format";
import type { DateFormatPreset } from "./presets";

type PresetArg = DateFormatPreset | (string & {});

const LOCALE = "vi-VN" as const;

export const useDateFormat = () => {
  return useMemo(
    () => ({
      locale: LOCALE,
      formatDate: (input: FormatInput, preset?: PresetArg) =>
        formatDateRaw(input, preset, { locale: LOCALE }),
      formatTime: (input: FormatInput, preset?: PresetArg) =>
        formatTimeRaw(input, preset, { locale: LOCALE }),
      formatDateTime: (input: FormatInput, preset?: PresetArg) =>
        formatDateTimeRaw(input, preset, { locale: LOCALE }),
      formatRelative: (
        input: FormatInput,
        opts?: Omit<RelativeFormatOptions, "locale">,
      ) => formatRelativeRaw(input, { ...opts, locale: LOCALE }),
    }),
    [],
  );
};
