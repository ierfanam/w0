import { authService } from "@/api/auth"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { FREE_ACCESS_ENABLED, createFreeAccessUser, withFreeAccessQuota } from "@/utils/freeAccess"

export enum TierType {
  FREE = "free",
  PRO = "pro",
  PROMAX = "promax",
}
export interface TierMessage {
  startTime: Date
  tier: TierType
  resetTime: Date
}

export interface User {
  id: string
  username: string
  error?: any
  email: string
  githubId: string
  wechatId: string
  avatar?: string
  userQuota: {
    // 用户当前拥有的配额
    quota: number
    resetTime: Date
    tierType: TierType
    // 加油包的配额
    refillQuota: number
    // 该周期的额度
    usedQuota: number
    quotaTotal: number

  }
}

interface UserState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  rememberMe: boolean
  isLoginModalOpen: boolean
  setRememberMe: (remember: boolean) => void
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  openLoginModal: () => void
  closeLoginModal: () => void
  fetchUser: () => Promise<User>
  isLoading: boolean
}

const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: FREE_ACCESS_ENABLED ? createFreeAccessUser() : null,
      token: null,
      isAuthenticated: FREE_ACCESS_ENABLED,
      rememberMe: false,
      isLoginModalOpen: false,
      isLoading: false,

      setRememberMe: (remember) => {
        localStorage.setItem("rememberMe", remember.toString())
        set({ rememberMe: remember })
      },

      setUser: (user) => {
        if (user) {
          localStorage.setItem("user", JSON.stringify(user))
        } else {
          localStorage.removeItem("user")
        }

        set(() => ({
          user: user && FREE_ACCESS_ENABLED ? withFreeAccessQuota(user) : user,
          isAuthenticated: FREE_ACCESS_ENABLED || !!user,
        }))
      },

      setToken: (token) => {
        if (token) {
          localStorage.setItem("token", token)
        } else {
          localStorage.removeItem("token")
        }
        set(() => ({ token }))
      },

      fetchUser: async () => {
        if (FREE_ACCESS_ENABLED && !localStorage.getItem("token")) {
          const freeUser = createFreeAccessUser()
          set(() => ({ user: freeUser, isAuthenticated: true, isLoading: false }))
          return freeUser
        }
        set(() => ({ isLoading: true }))
        try {
          const token = localStorage.getItem("token")
          if (token) {
            const user = await authService.getUserInfo(token)
            if (user.error) {
              localStorage.removeItem("user")
              localStorage.removeItem("token")
              localStorage.removeItem("rememberMe")
              localStorage.removeItem("user-storage")
              fetch("/api/logout");
              document.cookie =
              "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure=true;";
              set(() => ({
                user: FREE_ACCESS_ENABLED ? createFreeAccessUser() : null,
                token: null,
                isAuthenticated: FREE_ACCESS_ENABLED,
                rememberMe: false,
              }))
            } else {
              get().setUser(user)
            }
            return user
          }
        } catch (error) {
          console.error(error)
        } finally {
          set(() => ({ isLoading: false }))
        }
        const freeUser = createFreeAccessUser()
        if (FREE_ACCESS_ENABLED) {
          set(() => ({ user: freeUser, isAuthenticated: true }))
        }
        return freeUser
      },

      login: (user, token) => {
        localStorage.setItem("user", JSON.stringify(user))
        localStorage.setItem("token", token)

        set(() => ({
          user: FREE_ACCESS_ENABLED ? withFreeAccessQuota(user) : user,
          token,
          isAuthenticated: true,
          isLoginModalOpen: false,
        }))
      },

      logout: () => {
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        localStorage.removeItem("rememberMe")
        localStorage.removeItem("user-storage")
        if (!window.electron) {
          document.cookie =
            "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;"
          if (process.env.NODE_ENV === "production") {
            document.cookie =
              "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure=true;"
          }
          fetch('/api/logout')
        }
        set(() => ({
          user: FREE_ACCESS_ENABLED ? createFreeAccessUser() : null,
          token: null,
          isAuthenticated: FREE_ACCESS_ENABLED,
          rememberMe: false,
        }))
      },

      updateUser: (userData) =>
        set((state) => {
          const newUser = state.user ? (FREE_ACCESS_ENABLED ? withFreeAccessQuota({ ...state.user, ...userData }) : { ...state.user, ...userData }) : null
          localStorage.setItem("user", JSON.stringify(newUser))

          return { user: newUser }
        }),

      openLoginModal: () =>
        set(() => ({
          isLoginModalOpen: true,
        })),

      closeLoginModal: () =>
        set(() => ({
          isLoginModalOpen: false,
        })),
    }),
    {
      name: "user-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        rememberMe: state.rememberMe,
      }),
      version: 1,
      onRehydrateStorage: () => (state) => {
        const rememberMe = localStorage.getItem("rememberMe") === "true"
        if (rememberMe) {
          const storedUser = localStorage.getItem("user")
          const storedToken = localStorage.getItem("token")
          if (storedUser && storedToken) {
            state?.setUser(JSON.parse(storedUser))
            state?.setToken(storedToken)
            state?.setRememberMe(true)
          }
        }
        if (FREE_ACCESS_ENABLED && state) {
          state.setUser(createFreeAccessUser())
        }
      },
    }
  )
)

export default useUserStore
