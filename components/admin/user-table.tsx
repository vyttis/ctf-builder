"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Profile, UserRole } from "@/types/game"
import { getRoleLabel, getRoleBadgeColor } from "@/lib/auth/roles"
import { Shield, ShieldCheck, GraduationCap, Loader2 } from "lucide-react"

interface UserTableProps {
  users: Profile[]
  currentUserRole: UserRole
  currentUserId: string
}

export function UserTable({ users, currentUserRole, currentUserId }: UserTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [userList, setUserList] = useState(users)
  const { toast } = useToast()

  async function handleRoleChange(userId: string, newRole: UserRole) {
    setUpdatingId(userId)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Nepavyko pakeisti rolės")
      }

      setUserList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      )

      toast({
        title: "Rolė pakeista",
        description: `Vartotojo rolė pakeista į ${getRoleLabel(newRole)}`,
      })
    } catch (error: unknown) {
      toast({
        title: "Klaida",
        description: error instanceof Error ? error.message : "Nežinoma klaida",
        variant: "destructive",
      })
    } finally {
      setUpdatingId(null)
    }
  }

  function getRoleIcon(role: UserRole) {
    switch (role) {
      case "super_admin":
        return <ShieldCheck className="h-3.5 w-3.5" />
      case "admin":
        return <Shield className="h-3.5 w-3.5" />
      default:
        return <GraduationCap className="h-3.5 w-3.5" />
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">
              Vartotojas
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">
              El. paštas
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">
              Rolė
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">
              Prisijungė
            </th>
            {currentUserRole === "super_admin" && (
              <th className="text-right text-xs font-medium text-muted-foreground py-3 px-4">
                Veiksmai
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {userList.map((user) => (
            <tr
              key={user.id}
              className="border-b border-border/30 hover:bg-muted/30 transition-colors"
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {(user.full_name || user.email)[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-steam-dark">
                    {user.full_name || "—"}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-muted-foreground">
                  {user.email}
                </span>
              </td>
              <td className="py-3 px-4">
                <Badge
                  variant="outline"
                  className={`gap-1 ${getRoleBadgeColor(user.role)}`}
                >
                  {getRoleIcon(user.role)}
                  {getRoleLabel(user.role)}
                </Badge>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString("lt-LT")}
                </span>
              </td>
              {currentUserRole === "super_admin" && (
                <td className="py-3 px-4 text-right">
                  {user.id === currentUserId ? (
                    <span className="text-xs text-muted-foreground">Jūs</span>
                  ) : updatingId === user.id ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                  ) : (
                    <Select
                      value={user.role}
                      onValueChange={(value) =>
                        handleRoleChange(user.id, value as UserRole)
                      }
                    >
                      <SelectTrigger className="w-[160px] h-8 text-xs ml-auto">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teacher">Mokytojas</SelectItem>
                        <SelectItem value="admin">Administratorius</SelectItem>
                        <SelectItem value="super_admin">
                          Super admin
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {userList.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">Nėra vartotojų</p>
        </div>
      )}
    </div>
  )
}
