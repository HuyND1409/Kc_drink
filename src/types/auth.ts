
export interface LoginRequest {
  usernameOrEmail: string
  password: string
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}