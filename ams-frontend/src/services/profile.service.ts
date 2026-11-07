import api from "@/lib/axios"
import type { UserProfile } from "@/types"

export const profileService = {
  get: async () => (await api.get<UserProfile>("/users/me")).data,
  update: async (fullName: string) => (await api.patch<UserProfile>("/users/me", { fullName })).data,
  uploadAvatar: async (file: File) => {
    const body = new FormData(); body.append("file", file)
    return (await api.post<UserProfile>("/users/me/avatar", body, { headers: { "Content-Type": "multipart/form-data" } })).data
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    await api.post("/users/me/password", { currentPassword, newPassword })
  },
}
