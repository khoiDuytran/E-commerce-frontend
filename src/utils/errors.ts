import { AuthError } from "next-auth";

export class InvalidEmailPasswordError extends AuthError {
  static type = "Email/Password không hợp lệ";
}

export class InactiveAccountError extends AuthError {
  static type = "Tài khoản chưa được kích hoạt";
}

export class DisabledAccountError extends AuthError {
  static type = "Tài khoản đã bị vô hiệu hóa";
}
