import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Search, Shield, ShieldOff, UserCog, UserPlus, Layers, Download } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { getExistingDomainHead } from "@/lib/domainRoles";
import { downloadCsv } from "@/lib/export";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AppRole = Database["public"]["Enums"]["app_role"];
type DomainRole = Database["public"]["Enums"]["domain_role"];

interface UserWithRole {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role: AppRole | null;
}

export default function UserManagement() {
  const { toast } = useToast();
  const [searchEmail, setSearchEmail] = useState("");
  const [searchedUser, setSearchedUser] = useState<UserWithRole | null>(null);
  const [searching, setSearching] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string;
    newRole: AppRole | "remove";
    userName: string;
  }>({ open: false, userId: "", newRole: "user", userName: "" });

  // Domain role assignment state
  const [domainSearchEmail, setDomainSearchEmail] = useState("");
  const [domainSearchedUser, setDomainSearchedUser] = useState<{ id: string; full_name: string | null; email: string | null } | null>(null);
  const [domainSearching, setDomainSearching] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState<string>("");
  const [selectedDomainRole, setSelectedDomainRole] = useState<DomainRole>("member");

  // Fetch only users with roles (admins and moderators)
  const { data: usersWithRoles, isLoading, refetch } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .in("role", ["admin", "moderator"]);

      if (rolesError) throw rolesError;

      if (!roles || roles.length === 0) return [];

      // Fetch profiles for users with roles
      const userIds = roles.map(r => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRole = roles.find((r) => r.user_id === profile.id);
        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          role: userRole?.role || null,
        };
      });

      return usersWithRoles;
    },
  });

  // Fetch all domains for the selector
  const { data: allDomains } = useQuery({
    queryKey: ["all-domains-for-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("domains")
        .select("id, name")
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch all domain role assignments
  const { data: domainRoleAssignments, isLoading: domainRolesLoading, refetch: refetchDomainRoles } = useQuery({
    queryKey: ["domain-role-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_domain_roles")
        .select("id, user_id, domain_id, role, created_at");
      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch profiles
      const userIds = [...new Set(data.map((d) => d.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      // Fetch domain names
      const domainIds = [...new Set(data.map((d) => d.domain_id))];
      const { data: domains } = await supabase
        .from("domains")
        .select("id, name")
        .in("id", domainIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      const domainMap = new Map((domains || []).map((d) => [d.id, d.name]));

      return data.map((d) => ({
        ...d,
        userName: profileMap.get(d.user_id)?.full_name || "Unknown",
        userEmail: profileMap.get(d.user_id)?.email || "No email",
        domainName: domainMap.get(d.domain_id) || "Unknown",
      }));
    },
  });

  const searchUser = async () => {
    if (!searchEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    setSearchedUser(null);

    try {
      // Search for user by email in profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", searchEmail.trim().toLowerCase())
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        toast({
          title: "User Not Found",
          description: "No user found with that email address. Make sure they have signed up first.",
          variant: "destructive",
        });
        setSearching(false);
        return;
      }

      // Get user's role if any
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (roleError) throw roleError;

      setSearchedUser({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        role: roleData?.role || null,
      });
    } catch (error) {
      console.error("Error searching user:", error);
      toast({
        title: "Error",
        description: "Failed to search for user",
        variant: "destructive",
      });
    }

    setSearching(false);
  };

  const handleRoleChange = async (userId: string, newRole: AppRole | "remove") => {
    try {
      if (newRole === "remove") {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "User role removed successfully",
        });
      } else {
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingRole) {
          const { error } = await supabase
            .from("user_roles")
            .update({ role: newRole })
            .eq("user_id", userId);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("user_roles")
            .insert({ user_id: userId, role: newRole });

          if (error) throw error;
        }

        toast({
          title: "Success",
          description: `User role updated to ${newRole}`,
        });
      }

      // Refresh the searched user and users with roles list
      if (searchedUser && searchedUser.id === userId) {
        if (newRole === "remove") {
          setSearchedUser({ ...searchedUser, role: null });
        } else {
          setSearchedUser({ ...searchedUser, role: newRole });
        }
      }
      refetch();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
    
    setConfirmDialog({ open: false, userId: "", newRole: "user", userName: "" });
  };

  const getRoleBadge = (role: AppRole | null) => {
    if (!role) {
      return <Badge variant="outline" className="text-muted-foreground">No Role</Badge>;
    }
    switch (role) {
      case "admin":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Admin</Badge>;
      case "moderator":
        return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Moderator</Badge>;
      case "user":
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">User</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const today = () => new Date().toISOString().split("T")[0];

  const exportRoles = () => {
    if (!usersWithRoles?.length) {
      toast({ title: "Nothing to export", description: "No admins or moderators yet.", variant: "destructive" });
      return;
    }
    downloadCsv(
      `admins_moderators_${today()}.csv`,
      ["Name", "Email", "Role", "Joined"],
      usersWithRoles.map((u) => [u.full_name ?? "", u.email ?? "", u.role ?? "", formatDate(u.created_at)])
    );
  };

  const exportDomainRoles = () => {
    if (!domainRoleAssignments?.length) {
      toast({ title: "Nothing to export", description: "No domain roles assigned yet.", variant: "destructive" });
      return;
    }
    downloadCsv(
      `domain_roles_${today()}.csv`,
      ["User", "Email", "Domain", "Role", "Assigned"],
      domainRoleAssignments.map((a) => [a.userName, a.userEmail, a.domainName, a.role, formatDate(a.created_at)])
    );
  };

  // --- Domain Role Handlers ---
  const searchDomainUser = async () => {
    if (!domainSearchEmail.trim()) {
      toast({ title: "Error", description: "Please enter an email address", variant: "destructive" });
      return;
    }
    setDomainSearching(true);
    setDomainSearchedUser(null);
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("email", domainSearchEmail.trim().toLowerCase())
        .maybeSingle();
      if (error) throw error;
      if (!profile) {
        toast({ title: "User Not Found", description: "No user found with that email. Make sure they have signed up.", variant: "destructive" });
      } else {
        setDomainSearchedUser(profile);
      }
    } catch {
      toast({ title: "Error", description: "Failed to search for user", variant: "destructive" });
    }
    setDomainSearching(false);
  };

  const assignDomainRole = async () => {
    if (!domainSearchedUser || !selectedDomainId) return;

    // Enforce one Head per domain.
    if (selectedDomainRole === "head") {
      const currentHead = await getExistingDomainHead(selectedDomainId, domainSearchedUser.id);
      if (currentHead) {
        toast({
          title: "Domain already has a Head",
          description: `${currentHead.name} is the current Head. Demote them first, then assign a new Head.`,
          variant: "destructive",
        });
        return;
      }
    }

    // Check if already assigned
    const { data: existing } = await supabase
      .from("user_domain_roles")
      .select("id")
      .eq("user_id", domainSearchedUser.id)
      .eq("domain_id", selectedDomainId)
      .maybeSingle();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from("user_domain_roles")
        .update({ role: selectedDomainRole })
        .eq("id", existing.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Updated", description: `Role updated to ${selectedDomainRole}` });
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from("user_domain_roles")
        .insert({ user_id: domainSearchedUser.id, domain_id: selectedDomainId, role: selectedDomainRole });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Assigned", description: `${domainSearchedUser.full_name || domainSearchedUser.email} assigned as ${selectedDomainRole}` });
      }
    }
    setDomainSearchedUser(null);
    setDomainSearchEmail("");
    refetchDomainRoles();
  };

  const makeHead = async (assignment: { id: string; domain_id: string; user_id: string }) => {
    const currentHead = await getExistingDomainHead(assignment.domain_id, assignment.user_id);
    if (currentHead) {
      toast({
        title: "Domain already has a Head",
        description: `${currentHead.name} is the current Head. Demote them first, then promote a new Head.`,
        variant: "destructive",
      });
      return;
    }
    updateDomainRole(assignment.id, "head");
  };

  const updateDomainRole = async (id: string, newRole: DomainRole) => {
    const { error } = await supabase
      .from("user_domain_roles")
      .update({ role: newRole })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `Role updated to ${newRole}` });
      refetchDomainRoles();
    }
  };

  const removeDomainRole = async (id: string, userName: string) => {
    const { error } = await supabase
      .from("user_domain_roles")
      .delete()
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Removed", description: `${userName} removed from domain. They now have general user access only.` });
      refetchDomainRoles();
    }
  };

  const getDomainRoleBadge = (role: DomainRole) => {
    switch (role) {
      case "head":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Head</Badge>;
      case "coordinator":
        return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Coordinator</Badge>;
      case "member":
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Member</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const UserActions = ({ user }: { user: UserWithRole }) => (
    <div className="flex flex-wrap gap-2">
      {user.role !== "moderator" && user.role !== "admin" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setConfirmDialog({
              open: true,
              userId: user.id,
              newRole: "moderator",
              userName: user.full_name || user.email || "this user",
            })
          }
          className="gap-1"
        >
          <UserCog className="w-3 h-3" />
          Make Moderator
        </Button>
      )}
      {user.role !== "admin" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setConfirmDialog({
              open: true,
              userId: user.id,
              newRole: "admin",
              userName: user.full_name || user.email || "this user",
            })
          }
          className="gap-1"
        >
          <Shield className="w-3 h-3" />
          Make Admin
        </Button>
      )}
      {(user.role === "admin" || user.role === "moderator") && (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setConfirmDialog({
              open: true,
              userId: user.id,
              newRole: "remove",
              userName: user.full_name || user.email || "this user",
            })
          }
          className="gap-1 text-destructive hover:text-destructive"
        >
          <ShieldOff className="w-3 h-3" />
          Remove Role
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Add User by Email */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Add User Role
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Search for a user by their email address to assign admin or moderator roles.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Enter user email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchUser()}
              className="pl-9"
            />
          </div>
          <Button onClick={searchUser} disabled={searching}>
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            Search User
          </Button>
        </div>

        {/* Search Result */}
        {searchedUser && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-medium">{searchedUser.full_name || "Unknown"}</p>
                <p className="text-sm text-muted-foreground">{searchedUser.email}</p>
                <div className="mt-2">{getRoleBadge(searchedUser.role)}</div>
              </div>
              <UserActions user={searchedUser} />
            </div>
          </div>
        )}
      </div>

      {/* Current Admins & Moderators */}
      <div>
        <div className="flex items-center justify-between mb-4 gap-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Current Admins & Moderators
          </h3>
          <Button variant="outline" size="sm" onClick={exportRoles} disabled={!usersWithRoles?.length}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : !usersWithRoles || usersWithRoles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
            <UserCog className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No admins or moderators assigned yet.</p>
            <p className="text-sm mt-1">Use the search above to assign roles to users.</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersWithRoles.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || "Unknown"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email || "No email"}
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <UserActions user={user} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ─── Domain Roles Section ─── */}
      <div className="pt-4 border-t">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Domain Role Assignment
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Assign domain-level roles (Head, Coordinator, Member) to users. This controls their access in the Domain Panel.
        </p>

        {/* Search & Assign */}
        <div className="bg-card rounded-lg border p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Enter user email..."
                value={domainSearchEmail}
                onChange={(e) => setDomainSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchDomainUser()}
                className="pl-9"
              />
            </div>
            <Button onClick={searchDomainUser} disabled={domainSearching}>
              {domainSearching ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Search
            </Button>
          </div>

          {domainSearchedUser && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="font-medium">{domainSearchedUser.full_name || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">{domainSearchedUser.email}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <Select value={selectedDomainId} onValueChange={setSelectedDomainId}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {allDomains?.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedDomainRole} onValueChange={(v) => setSelectedDomainRole(v as DomainRole)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="head">Head</SelectItem>
                      <SelectItem value="coordinator">Coordinator</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={assignDomainRole} disabled={!selectedDomainId}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Assign Role
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Current Domain Role Assignments */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <h4 className="text-md font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Current Domain Roles
          </h4>
          <Button variant="outline" size="sm" onClick={exportDomainRoles} disabled={!domainRoleAssignments?.length}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
        {domainRolesLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : !domainRoleAssignments || domainRoleAssignments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
            <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No domain roles assigned yet.</p>
            <p className="text-sm mt-1">Use the search above to assign domain roles to users.</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domainRoleAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.userName}</TableCell>
                    <TableCell className="text-muted-foreground">{assignment.userEmail}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{assignment.domainName}</Badge>
                    </TableCell>
                    <TableCell>{getDomainRoleBadge(assignment.role as DomainRole)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(assignment.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {assignment.role === "member" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateDomainRole(assignment.id, "coordinator")}
                            className="gap-1"
                          >
                            <UserCog className="w-3 h-3" />
                            Promote
                          </Button>
                        )}
                        {assignment.role === "coordinator" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => makeHead(assignment)}
                              className="gap-1"
                            >
                              <UserCog className="w-3 h-3" />
                              Make Head
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateDomainRole(assignment.id, "member")}
                              className="gap-1"
                            >
                              <UserCog className="w-3 h-3" />
                              Demote
                            </Button>
                          </>
                        )}
                        {assignment.role === "head" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateDomainRole(assignment.id, "coordinator")}
                            className="gap-1"
                          >
                            <UserCog className="w-3 h-3" />
                            Demote
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeDomainRole(assignment.id, assignment.userName)}
                          className="gap-1 text-destructive hover:text-destructive"
                        >
                          <ShieldOff className="w-3 h-3" />
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog({ ...confirmDialog, open })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.newRole === "admin"
                ? "Grant Admin Access"
                : confirmDialog.newRole === "moderator"
                ? "Grant Moderator Access"
                : "Remove Role"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.newRole === "admin"
                ? `Are you sure you want to make ${confirmDialog.userName} an admin? They will have full access to manage events, domains, gallery, and user roles.`
                : confirmDialog.newRole === "moderator"
                ? `Are you sure you want to make ${confirmDialog.userName} a moderator? They will be able to manage events and gallery but not domains or users.`
                : `Are you sure you want to remove the role from ${confirmDialog.userName}? They will no longer be able to manage content.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                handleRoleChange(confirmDialog.userId, confirmDialog.newRole)
              }
              className={confirmDialog.newRole === "remove" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {confirmDialog.newRole === "admin" 
                ? "Grant Admin" 
                : confirmDialog.newRole === "moderator"
                ? "Grant Moderator"
                : "Remove Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}