import { ValidatorFn } from "@angular/forms";

export interface FieldConfig {
  disabled?: boolean;
  label?: string;
  name: string;
  options?: string[];
  placeholder?: string;
  type: string;
  validation?: ValidatorFn[];
  value?: any;
  info?: string;
  inputType?: string;
  // select
  selectOptions?: any[];
  text?: string;

  // map
  featureType?: string;
}
