import { useEffect, useMemo } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Upload,
  Linkedin,
  Twitter,
  Instagram,
  Github,
  MessageCircle,
  ShieldAlert,
  Globe,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { supabase } from "@/integrations/supabase/client";

type MemberType = "student" | "faculty" | null;

function memberTypeForEmail(email: string | undefined): MemberType {
  const e = (email || "").toLowerCase();
  if (e.endsWith("@vitstudent.ac.in")) return "student";
  if (e.endsWith("@vit.ac.in")) return "faculty";
  return null;
}

const SOCIAL_FIELDS = [
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, placeholder: "https://linkedin.com/in/..." },
  { key: "twitter", label: "Twitter / X", icon: Twitter, placeholder: "https://twitter.com/..." },
  { key: "instagram", label: "Instagram", icon: Instagram, placeholder: "https://instagram.com/..." },
  { key: "github", label: "GitHub", icon: Github, placeholder: "https://github.com/..." },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, placeholder: "https://wa.me/91..." },
] as const;

type SocialKey = (typeof SOCIAL_FIELDS)[number]["key"];

const urlField = z.string().url("Must be a valid URL").optional().or(z.literal(""));

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  phone_number: z.string().max(20, "Phone number is too long").optional().or(z.literal("")),
  about: z.string().max(500, "About must be 500 characters or fewer").optional().or(z.literal("")),
  // student
  domain: z.string().optional().or(z.literal("")),
  role: z.string().max(100, "Role is too long").optional().or(z.literal("")),
  // faculty
  designation: z.string().max(100, "Designation is too long").optional().or(z.literal("")),
  department: z.string().max(100, "Department is too long").optional().or(z.literal("")),
  image_url: urlField,
  linkedin_url: urlField,
  twitter_url: urlField,
  instagram_url: urlField,
  github_url: urlField,
  whatsapp_url: urlField,
  visibility: z.object({
    linkedin: z.boolean(),
    twitter: z.boolean(),
    instagram: z.boolean(),
    github: z.boolean(),
    whatsapp: z.boolean(),
  }),
});

type FormData = z.infer<typeof schema>;

const defaultVisibility = { linkedin: true, twitter: true, instagram: true, github: true, whatsapp: true };

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";
}

export function MemberProfileForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { uploadAvatar, isUploading } = useAvatarUpload();

  const memberType = useMemo(() => memberTypeForEmail(user?.email), [user?.email]);
  const table = memberType === "faculty" ? "faculty_members" : "student_members";

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone_number: "",
      about: "",
      domain: "",
      role: "",
      designation: "",
      department: "",
      image_url: "",
      linkedin_url: "",
      twitter_url: "",
      instagram_url: "",
      github_url: "",
      whatsapp_url: "",
      visibility: defaultVisibility,
    },
  });

  // Domains (for the student domain select)
  const { data: domainOptions = [] } = useQuery({
    queryKey: ["domains-names"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("domains")
        .select("name")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data.map((d) => d.name);
    },
    enabled: memberType === "student",
  });

  // The member's own row (own-row SELECT policy permits this).
  const { data: myRow, isLoading: rowLoading } = useQuery({
    queryKey: ["my-member-row", user?.id, memberType],
    queryFn: async () => {
      if (!user?.id || !memberType) return null;
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!memberType,
  });

  // Prefill once the row is loaded.
  useEffect(() => {
    if (!myRow) {
      // No row yet: seed the name from the auth metadata if available.
      const metaName =
        (user?.user_metadata?.full_name as string) || (user?.user_metadata?.name as string) || "";
      if (metaName) form.setValue("name", metaName);
      return;
    }
    const vis = (myRow.social_visibility ?? {}) as Record<string, boolean>;
    form.reset({
      name: myRow.name ?? "",
      phone_number: myRow.phone_number ?? "",
      about: myRow.about ?? "",
      domain: "domain" in myRow ? (myRow.domain ?? "") : "",
      role: "role" in myRow ? (myRow.role ?? "") : "",
      designation: "designation" in myRow ? (myRow.designation ?? "") : "",
      department: "department" in myRow ? (myRow.department ?? "") : "",
      image_url: myRow.image_url ?? "",
      linkedin_url: myRow.linkedin_url ?? "",
      twitter_url: myRow.twitter_url ?? "",
      instagram_url: myRow.instagram_url ?? "",
      github_url: myRow.github_url ?? "",
      whatsapp_url: myRow.whatsapp_url ?? "",
      visibility: {
        linkedin: vis.linkedin ?? true,
        twitter: vis.twitter ?? true,
        instagram: vis.instagram ?? true,
        github: vis.github ?? true,
        whatsapp: vis.whatsapp ?? true,
      },
    });
  }, [myRow, user, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase.rpc("upsert_my_member_profile", {
        p_name: data.name,
        p_phone_number: data.phone_number || null,
        p_about: data.about || null,
        p_domain: memberType === "student" ? data.domain || null : null,
        p_role: memberType === "student" ? data.role || null : null,
        p_designation: memberType === "faculty" ? data.designation || null : null,
        p_department: memberType === "faculty" ? data.department || null : null,
        p_image_url: data.image_url || null,
        p_linkedin_url: data.linkedin_url || null,
        p_twitter_url: data.twitter_url || null,
        p_instagram_url: data.instagram_url || null,
        p_github_url: data.github_url || null,
        p_whatsapp_url: data.whatsapp_url || null,
        p_social_visibility: data.visibility,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-member-row"] });
      queryClient.invalidateQueries({ queryKey: ["student-members-home"] });
      queryClient.invalidateQueries({ queryKey: ["faculty-members-home"] });
      queryClient.invalidateQueries({ queryKey: ["member-directory"] });
      toast({
        title: "Profile saved",
        description: myRow
          ? "Your changes are live."
          : "Submitted! Your profile will appear once an admin approves it.",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadAvatar(file);
    if (url) form.setValue("image_url", url, { shouldDirty: true });
  };

  if (!memberType) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ShieldAlert className="w-10 h-10 text-amber-500 mb-3" />
        <p className="text-muted-foreground max-w-md">
          Member profiles are only available to IIC students (@vitstudent.ac.in) and faculty
          (@vit.ac.in). Your account doesn't match either domain.
        </p>
      </div>
    );
  }

  if (rowLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const imageUrl = form.watch("image_url");
  const aboutValue = form.watch("about") || "";

  return (
    <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
      {/* Pending approval banner */}
      {myRow && myRow.is_active === false && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-sm text-amber-600 dark:text-amber-400">
          Your profile is awaiting admin approval and is not yet visible on the public Members page.
          You can keep editing it in the meantime.
        </div>
      )}

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative group rounded-full overflow-hidden w-20 h-20 border-2 border-accent flex-shrink-0">
          <Avatar className="w-full h-full rounded-none">
            <AvatarImage src={imageUrl || ""} alt={form.watch("name")} className="object-cover" />
            <AvatarFallback className="text-lg bg-accent/20 rounded-none">
              {getInitials(form.watch("name") || "")}
            </AvatarFallback>
          </Avatar>
          <label
            className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
            title="Upload photo"
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageUpload}
              disabled={isUploading}
            />
            {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
          </label>
        </div>
        <div>
          <p className="font-medium">Profile photo</p>
          <p className="text-sm text-muted-foreground">Hover the photo to upload. JPEG/PNG/WebP, max 5MB.</p>
        </div>
      </div>

      {/* Core fields */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone_number">Contact number</Label>
          <Input id="phone_number" {...form.register("phone_number")} placeholder="+91..." />
          <p className="text-xs text-muted-foreground">Visible only to logged-in members.</p>
        </div>
      </div>

      {/* Type-specific fields */}
      {memberType === "student" ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Select
              value={form.watch("domain") || "none"}
              onValueChange={(v) => form.setValue("domain", v === "none" ? "" : v, { shouldDirty: true })}
            >
              <SelectTrigger id="domain">
                <SelectValue placeholder="Select domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No domain</SelectItem>
                {domainOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input id="role" {...form.register("role")} placeholder="e.g., Member, Domain Lead" />
            <p className="text-xs text-muted-foreground">
              Your head/coordinator title is assigned by an admin.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="designation">Designation *</Label>
            <Input id="designation" {...form.register("designation")} placeholder="e.g., Faculty Coordinator" />
            {form.formState.errors.designation && (
              <p className="text-sm text-destructive">{form.formState.errors.designation.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <Input id="department" {...form.register("department")} placeholder="e.g., School of Computer Science" />
            {form.formState.errors.department && (
              <p className="text-sm text-destructive">{form.formState.errors.department.message}</p>
            )}
          </div>
        </div>
      )}

      {/* About */}
      <div className="space-y-2">
        <Label htmlFor="about">About</Label>
        <Textarea id="about" {...form.register("about")} className="min-h-[100px]" maxLength={500} />
        <div className="flex justify-between">
          {form.formState.errors.about ? (
            <p className="text-sm text-destructive">{form.formState.errors.about.message}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted-foreground">{aboutValue.length}/500</span>
        </div>
      </div>

      {/* Socials with per-handle visibility */}
      <div className="space-y-3">
        <div>
          <Label>Social handles</Label>
          <p className="text-xs text-muted-foreground">
            Toggle each handle <strong>Public</strong> (everyone) or <strong>Members only</strong> (visible
            only to logged-in IIC members).
          </p>
        </div>
        {SOCIAL_FIELDS.map(({ key, label, icon: Icon, placeholder }) => {
          const urlName = `${key}_url` as const;
          const isPublic = form.watch(`visibility.${key as SocialKey}`);
          return (
            <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2 sm:w-40 shrink-0">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{label}</span>
              </div>
              <Input
                {...form.register(urlName)}
                placeholder={placeholder}
                className="flex-1"
              />
              <div className="flex items-center gap-2 sm:w-44 shrink-0">
                <Switch
                  checked={isPublic}
                  onCheckedChange={(c) =>
                    form.setValue(`visibility.${key as SocialKey}`, c, { shouldDirty: true })
                  }
                  aria-label={`${label} visibility`}
                />
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  {isPublic ? (
                    <><Globe className="w-3 h-3" /> Public</>
                  ) : (
                    <><Lock className="w-3 h-3" /> Members only</>
                  )}
                </span>
              </div>
            </div>
          );
        })}
        {(form.formState.errors.linkedin_url ||
          form.formState.errors.twitter_url ||
          form.formState.errors.instagram_url ||
          form.formState.errors.github_url ||
          form.formState.errors.whatsapp_url) && (
          <p className="text-sm text-destructive">Please enter valid URLs (including https://).</p>
        )}
      </div>

      <Button type="submit" className="w-full gradient-innovation" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {myRow ? "Save changes" : "Submit profile"}
      </Button>
    </form>
  );
}
