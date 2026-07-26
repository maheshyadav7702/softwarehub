const ACCESS_TOKEN = 'access_token'
const REFRESH_TOKEN = 'refresh_token'

export const tokenService = {
  getAccessToken: () =>
    typeof window !== 'undefined'
      ? localStorage.getItem(ACCESS_TOKEN)
      : null,

  setAccessToken: (token: string) =>
    localStorage.setItem(ACCESS_TOKEN, token),

  removeAccessToken: () =>
    localStorage.removeItem(ACCESS_TOKEN),

  getRefreshToken: () =>
    typeof window !== 'undefined'
      ? localStorage.getItem(REFRESH_TOKEN)
      : null,

  setRefreshToken: (token: string) =>
    localStorage.setItem(REFRESH_TOKEN, token),

  removeRefreshToken: () =>
    localStorage.removeItem(REFRESH_TOKEN),

  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN)
    localStorage.removeItem(REFRESH_TOKEN)
  },
}