"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { useToast } from "@/lib/use-toast"
import { useI18n } from "@/i18n"
import { profileService } from "@/services/profile.service"
import { useAuthStore } from "@/stores/authStore"

export default function ProfilePage() {
  const { t } = useI18n(); const { toast } = useToast(); const queryClient = useQueryClient()
  const updateLocal = useAuthStore(s => s.updateProfile)
  const { data: profile, isLoading } = useQuery({ queryKey: ["my-profile"], queryFn: profileService.get })
  const [fullName, setFullName] = useState(""); const [current, setCurrent] = useState("")
  const [next, setNext] = useState(""); const [confirm, setConfirm] = useState("")
  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    try { const updated = await profileService.update(fullName || profile?.fullName || ""); updateLocal(updated); await queryClient.invalidateQueries({ queryKey: ["my-profile"] }); toast({ title: t("common.profile.saved"), variant: "success" }) }
    catch { toast({ title: t("common.actions.tryAgain"), variant: "destructive" }) }
  }
  const upload = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) { toast({ title: t("common.profile.avatar"), description: "Image must be 5 MB or smaller", variant: "destructive" }); return }
    try { const updated = await profileService.uploadAvatar(file); updateLocal(updated); await queryClient.invalidateQueries({ queryKey: ["my-profile"] }) }
    catch { toast({ title: t("common.actions.tryAgain"), variant: "destructive" }) }
  }
  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault()
    if (next !== confirm) { toast({ title: t("common.profile.mismatch"), variant: "destructive" }); return }
    try { await profileService.changePassword(current, next); setCurrent(""); setNext(""); setConfirm(""); toast({ title: t("common.profile.passwordChanged"), variant: "success" }) }
    catch (error: any) { toast({ title: error.response?.data?.message || t("common.actions.tryAgain"), variant: "destructive" }) }
  }
  if (isLoading || !profile) return <p>{t("common.labels.loading")}</p>
  return <div className="mx-auto max-w-2xl space-y-6"><h1 className="text-2xl font-semibold">{t("common.profile.title")}</h1>
    <form onSubmit={saveProfile} className="space-y-4 rounded-xl border bg-card p-6"><div className="flex items-center gap-4"><Avatar name={profile.fullName} src={profile.avatarUrl} size="lg"/><label className="space-y-1 text-sm"><span>{t("common.profile.avatar")}</span><Input type="file" accept="image/*" onChange={e => upload(e.target.files?.[0])}/></label></div>
      <label className="block space-y-1 text-sm"><span>{t("common.profile.fullName")}</span><Input required value={fullName || profile.fullName} onChange={e => setFullName(e.target.value)}/></label>
      <label className="block space-y-1 text-sm"><span>{t("common.profile.username")}</span><Input readOnly value={profile.username}/></label>
      <label className="block space-y-1 text-sm"><span>{t("common.profile.email")}</span><Input readOnly value={profile.email}/></label>
      <Button>{t("common.profile.save")}</Button>
    </form>
    <form onSubmit={changePassword} className="space-y-4 rounded-xl border bg-card p-6"><h2 className="text-lg font-semibold">{t("common.profile.changePassword")}</h2><p className="text-sm text-muted-foreground">{t("common.profile.passwordRules")}</p><Input type="password" autoComplete="current-password" required value={current} onChange={e => setCurrent(e.target.value)} placeholder={t("common.profile.currentPassword")}/><Input type="password" minLength={10} autoComplete="new-password" required value={next} onChange={e => setNext(e.target.value)} placeholder={t("common.profile.newPassword")}/><Input type="password" minLength={10} autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder={t("common.profile.confirmPassword")}/><Button>{t("common.profile.changePassword")}</Button></form>
  </div>
}
