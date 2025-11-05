import { UseFormRegister } from "react-hook-form";

type FormValues = {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  accountType: string;
  gender: string,
};

export type inputFieldDataType = {
  placeholder?: string;
  title: string;
  required?: boolean;
  name: string;
  register: UseFormRegister<FormValues>;
  classname?: string;
  error: any;
  type?: string;
  children?: React.ReactNode;
  onclick?: () => void;
};
