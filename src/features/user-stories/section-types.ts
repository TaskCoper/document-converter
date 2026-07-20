import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import type { Schema } from "./validations";

export type SectionProps = {
  register: UseFormRegister<Schema>;
  control: Control<Schema>;
  errors: FieldErrors<Schema>;
};

export type StringListName =
  | "conditions.preconditions"
  | "flow.mainFlow"
  | "nonFunctional"
  | "outOfScope";
