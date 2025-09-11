export interface LoginRequest{
  account: string;
  password: string;
}

export interface RegisterRequest{
  username: string;
  email: string;
  password: string;
  captchaCode: string;
  captchaId: string;
}
