import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const studentMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be at most 100 characters"),
  role: z.string().min(2, "Role must be at least 2 characters").max(100, "Role must be at most 100 characters"),
  domain: z.string().optional(),
  domain_role: z.enum(["head", "coordinator", "member"], { required_error: "Select a designation" }),
  image_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  linkedin_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  whatsapp_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  display_order: z.number().min(0, "Display order must be 0 or greater"),
  is_core_member: z.boolean(),
  is_active: z.boolean(),
});

type StudentMemberFormData = z.infer<typeof studentMemberSchema>;

interface StudentMember {
  id: string;
  name: string;
  role: string;
  domain: string | null;
  domain_role: string | null;
  image_url: string | null;
  linkedin_url: string | null;
  whatsapp_url: string | null;
  display_order: number;
  is_active: boolean | null;
  is_core_member: boolean | null;
}

const designationOptions = [
  { value: "head", label: "Domain Head" },
  { value: "coordinator", label: "Domain Coordinator" },
  { value: "member", label: "Member" },
];

interface StudentMemberFormProps {
  member?: StudentMember;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StudentMemberForm({ member, onSuccess, onCancel }: StudentMemberFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [domainOptions, setDomainOptions] = useState<string[]>([]);

  const form = useForm<StudentMemberFormData>({
    resolver: zodResolver(studentMemberSchema),
    defaultValues: {
      name: member?.name || "",
      role: member?.role || "",
      domain: member?.domain || "",
      domain_role: (member?.domain_role as "head" | "coordinator" | "member") || "member",
      image_url: member?.image_url || "",
      linkedin_url: member?.linkedin_url || "",
      whatsapp_url: member?.whatsapp_url || "",
      display_order: member?.display_order || 0,
      is_active: member?.is_active ?? true,
      is_core_member: member?.is_core_member ?? false,
    },
  });

  useEffect(() => {
    const fetchDomains = async () => {
      const { data } = await supabase
        .from("domains")
        .select("name")
        .order("display_order", { ascending: true });
      if (data) setDomainOptions(data.map((d) => d.name));
    };
    fetchDomains();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Only JPEG, PNG, WebP, and GIF images are allowed", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `student-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("event-images")
      .upload(fileName, file);

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setIsUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(fileName);
    form.setValue("image_url", urlData.publicUrl);
    setIsUploading(false);
  };

  const onSubmit = async (data: StudentMemberFormData) => {
    setIsLoading(true);

    const payload = {
      name: data.name,
      role: data.role,
      domain: data.domain || null,
      domain_role: data.domain_role || "member",
      image_url: data.image_url || null,
      linkedin_url: data.linkedin_url || null,
      whatsapp_url: data.whatsapp_url || null,
      display_order: data.display_order,
      is_active: data.is_active,
      is_core_member: data.is_core_member,
    };

    let error;
    if (member) {
      const { error: updateError } = await supabase
        .from("student_members")
        .update(payload)
        .eq("id", member.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("student_members")
        .insert(payload);
      error = insertError;
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: member ? "Student member updated" : "Student member added" });
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      onSuccess();
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Input
            id="role"
            {...form.register("role")}
            placeholder="e.g., President, Domain Lead"
          />
          {form.formState.errors.role && (
            <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="domain">Domain</Label>
          <Select
            value={form.watch("domain") || "none"}
            onValueChange={(value) =>
              form.setValue("domain", value === "none" ? "" : value)
            }
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
          <Label htmlFor="domain_role">Designation</Label>
          <Select
            value={form.watch("domain_role")}
            onValueChange={(value: "head" | "coordinator" | "member") => form.setValue("domain_role", value)}
          >
            <SelectTrigger id="domain_role">
              <SelectValue placeholder="Select designation" />
            </SelectTrigger>
            <SelectContent>
              {designationOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.domain_role && (
            <p className="text-sm text-destructive">{form.formState.errors.domain_role.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Photo</Label>
        <div className="flex gap-2">
          <Input
            id="image_url"
            {...form.register("image_url")}
            placeholder="Image URL"
            className="flex-1"
          />
          <label className="cursor-pointer">
            <Input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImageUpload} />
            <Button type="button" variant="outline" disabled={isUploading} asChild>
              <span>
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              </span>
            </Button>
          </label>
        </div>
        {form.formState.errors.image_url && (
          <p className="text-sm text-destructive">{form.formState.errors.image_url.message}</p>
        )}
        {form.watch("image_url") && (
          <img src={form.watch("image_url")} alt="Preview" className="w-20 h-20 rounded-full object-cover mt-2" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="linkedin">LinkedIn URL</Label>
          <Input
            id="linkedin"
            {...form.register("linkedin_url")}
            placeholder="https://linkedin.com/in/..."
          />
          {form.formState.errors.linkedin_url && (
            <p className="text-sm text-destructive">{form.formState.errors.linkedin_url.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp URL</Label>
          <Input
            id="whatsapp"
            {...form.register("whatsapp_url")}
            placeholder="https://wa.me/..."
          />
          {form.formState.errors.whatsapp_url && (
            <p className="text-sm text-destructive">{form.formState.errors.whatsapp_url.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="display_order">Display Order</Label>
          <Input
            id="display_order"
            type="number"
            {...form.register("display_order", { valueAsNumber: true })}
          />
          {form.formState.errors.display_order && (
            <p className="text-sm text-destructive">{form.formState.errors.display_order.message}</p>
          )}
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch
            id="is_core_member"
            checked={form.watch("is_core_member")}
            onCheckedChange={(checked) => form.setValue("is_core_member", checked)}
          />
          <Label htmlFor="is_core_member">Core Member</Label>
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch
            id="is_active"
            checked={form.watch("is_active")}
            onCheckedChange={(checked) => form.setValue("is_active", checked)}
          />
          <Label htmlFor="is_active">Active</Label>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {member ? "Update" : "Add"} Student Member
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
