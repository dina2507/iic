import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const facultyMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be at most 100 characters"),
  designation: z.string().min(2, "Designation must be at least 2 characters").max(100, "Designation must be at most 100 characters"),
  department: z.string().min(2, "Department must be at least 2 characters").max(100, "Department must be at most 100 characters"),
  phone_number: z.string().max(20, "Phone number is too long").optional().or(z.literal("")),
  about: z.string().max(500, "About must be 500 characters or fewer").optional().or(z.literal("")),
  image_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  email: z.string().email("Must be a valid email").optional().or(z.literal("")),
  linkedin_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  whatsapp_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  twitter_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  instagram_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  github_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  display_order: z.number().min(0, "Display order must be 0 or greater"),
  is_active: z.boolean(),
});

type FacultyMemberFormData = z.infer<typeof facultyMemberSchema>;

interface FacultyMember {
  id: string;
  name: string;
  designation: string;
  department: string;
  phone_number?: string | null;
  about?: string | null;
  image_url: string | null;
  email: string | null;
  linkedin_url: string | null;
  whatsapp_url?: string | null;
  twitter_url?: string | null;
  instagram_url?: string | null;
  github_url?: string | null;
  display_order: number;
  is_active: boolean | null;
}

interface FacultyMemberFormProps {
  member?: FacultyMember;
  onSuccess: () => void;
  onCancel: () => void;
}

export function FacultyMemberForm({ member, onSuccess, onCancel }: FacultyMemberFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<FacultyMemberFormData>({
    resolver: zodResolver(facultyMemberSchema),
    defaultValues: {
      name: member?.name || "",
      designation: member?.designation || "",
      department: member?.department || "",
      phone_number: member?.phone_number || "",
      about: member?.about || "",
      image_url: member?.image_url || "",
      email: member?.email || "",
      linkedin_url: member?.linkedin_url || "",
      whatsapp_url: member?.whatsapp_url || "",
      twitter_url: member?.twitter_url || "",
      instagram_url: member?.instagram_url || "",
      github_url: member?.github_url || "",
      display_order: member?.display_order || 0,
      is_active: member?.is_active ?? true,
    },
  });

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
    const fileName = `faculty-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file);

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setIsUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
    form.setValue("image_url", urlData.publicUrl);
    setIsUploading(false);
  };

  const onSubmit = async (data: FacultyMemberFormData) => {
    setIsLoading(true);

    const payload = {
      name: data.name,
      designation: data.designation,
      department: data.department,
      phone_number: data.phone_number || null,
      about: data.about || null,
      image_url: data.image_url || null,
      email: data.email || null,
      linkedin_url: data.linkedin_url || null,
      whatsapp_url: data.whatsapp_url || null,
      twitter_url: data.twitter_url || null,
      instagram_url: data.instagram_url || null,
      github_url: data.github_url || null,
      display_order: data.display_order,
      is_active: data.is_active,
    };

    let error;
    if (member) {
      const { error: updateError } = await supabase
        .from("faculty_members")
        .update(payload)
        .eq("id", member.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("faculty_members")
        .insert(payload);
      error = insertError;
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: member ? "Faculty member updated" : "Faculty member added" });
      queryClient.invalidateQueries({ queryKey: ["admin-faculty"] });
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
          <Label htmlFor="designation">Designation *</Label>
          <Input
            id="designation"
            {...form.register("designation")}
            placeholder="e.g., Faculty Coordinator"
          />
          {form.formState.errors.designation && (
            <p className="text-sm text-destructive">{form.formState.errors.designation.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="department">Department *</Label>
        <Input
          id="department"
          {...form.register("department")}
          placeholder="e.g., School of Computer Science"
        />
        {form.formState.errors.department && (
          <p className="text-sm text-destructive">{form.formState.errors.department.message}</p>
        )}
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
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...form.register("email")}
            placeholder="email@vit.ac.in"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="github">GitHub URL</Label>
          <Input id="github" {...form.register("github_url")} placeholder="https://github.com/..." />
          {form.formState.errors.github_url && (
            <p className="text-sm text-destructive">{form.formState.errors.github_url.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="twitter">Twitter URL</Label>
          <Input id="twitter" {...form.register("twitter_url")} placeholder="https://twitter.com/..." />
          {form.formState.errors.twitter_url && (
            <p className="text-sm text-destructive">{form.formState.errors.twitter_url.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="instagram">Instagram URL</Label>
          <Input id="instagram" {...form.register("instagram_url")} placeholder="https://instagram.com/..." />
          {form.formState.errors.instagram_url && (
            <p className="text-sm text-destructive">{form.formState.errors.instagram_url.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp URL</Label>
          <Input id="whatsapp" {...form.register("whatsapp_url")} placeholder="https://wa.me/..." />
          {form.formState.errors.whatsapp_url && (
            <p className="text-sm text-destructive">{form.formState.errors.whatsapp_url.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone_number">Contact number</Label>
          <Input id="phone_number" {...form.register("phone_number")} placeholder="+91..." />
          {form.formState.errors.phone_number && (
            <p className="text-sm text-destructive">{form.formState.errors.phone_number.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="about">About</Label>
          <Textarea id="about" {...form.register("about")} maxLength={500} className="min-h-[40px]" />
          {form.formState.errors.about && (
            <p className="text-sm text-destructive">{form.formState.errors.about.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
          {member ? "Update" : "Add"} Faculty Member
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
