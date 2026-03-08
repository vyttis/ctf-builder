"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { UserRole, Profile } from "@/types/game"
import { getRoleLabel } from "@/lib/auth/roles"
import { UserPlus, Loader2, Mail, User, School, Phone } from "lucide-react"

interface InviteUserDialogProps {
  currentUserRole: UserRole
  onUserInvited: (user: Profile) => void
}

export function InviteUserDialog({
  currentUserRole,
  onUserInvited,
}: InviteUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [school, setSchool] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState<UserRole>("teacher")
  const { toast } = useToast()

  function resetForm() {
    setEmail("")
    setFullName("")
    setSchool("")
    setPhone("")
    setRole("teacher")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          full_name: fullName.trim(),
          school: school.trim(),
          phone: phone.trim(),
          role,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Nepavyko pakviesti vartotojo")
      }

      toast({
        title: "Vartotojas pakviestas!",
        description: `Pakvietimas išsiųstas adresu ${email}`,
      })

      onUserInvited({
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.full_name,
        school: data.user.school,
        phone: data.user.phone,
        role: data.user.role,
        avatar_url: null,
        onboarding_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      resetForm()
      setOpen(false)
    } catch (error: unknown) {
      toast({
        title: "Klaida",
        description:
          error instanceof Error ? error.message : "Bandykite dar kartą",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Available roles depend on caller
  const availableRoles: UserRole[] =
    currentUserRole === "super_admin"
      ? ["teacher", "admin", "super_admin"]
      : ["teacher"]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25">
          <UserPlus className="h-4 w-4" />
          Pakviesti vartotoją
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-steam-dark">
            Pakviesti naują vartotoją
          </DialogTitle>
          <DialogDescription>
            Vartotojas gaus pakvietimą el. paštu ir galės prisijungti prie
            platformos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="invite-email" className="text-steam-dark font-medium">
              El. paštas
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="invite-email"
                type="email"
                placeholder="mokytojas@mokykla.lt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="invite-name"
              className="text-steam-dark font-medium"
            >
              Vardas Pavardė
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="invite-name"
                type="text"
                placeholder="Jonas Jonaitis"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10"
                required
                minLength={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="invite-school"
              className="text-steam-dark font-medium"
            >
              Mokykla
            </Label>
            <div className="relative">
              <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="invite-school"
                type="text"
                placeholder="Klaipėdos licėjus"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="pl-10"
                required
                minLength={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="invite-phone"
              className="text-steam-dark font-medium"
            >
              Telefono numeris
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="invite-phone"
                type="tel"
                placeholder="+370 600 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10"
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-steam-dark font-medium">Rolė</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as UserRole)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {getRoleLabel(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Atšaukti
            </Button>
            <Button
              type="submit"
              disabled={loading || !email || !fullName || !school || !phone}
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Pakviesti
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
