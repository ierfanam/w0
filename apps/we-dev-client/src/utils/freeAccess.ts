import type { User } from "@/stores/userSlice";

export const FREE_ACCESS_ENABLED = process.env.WE_DEV_FREE_ACCESS !== "false";

export const createFreeAccessUser = (): User => ({
  id: "free-access",
  username: "Free Access",
  email: "free@local.app",
  githubId: "",
  wechatId: "",
  userQuota: {
    quota: Number.MAX_SAFE_INTEGER,
    resetTime: new Date("2099-12-31T23:59:59.999Z"),
    tierType: "promax" as User["userQuota"]["tierType"],
    refillQuota: Number.MAX_SAFE_INTEGER,
    usedQuota: 0,
    quotaTotal: Number.MAX_SAFE_INTEGER,
  },
});

export const withFreeAccessQuota = (user: User): User => ({
  ...user,
  userQuota: {
    ...createFreeAccessUser().userQuota,
    ...user.userQuota,
    quota: Number.MAX_SAFE_INTEGER,
    refillQuota: Number.MAX_SAFE_INTEGER,
    usedQuota: 0,
    quotaTotal: Number.MAX_SAFE_INTEGER,
    tierType: "promax" as User["userQuota"]["tierType"],
    resetTime: new Date("2099-12-31T23:59:59.999Z"),
  },
});
