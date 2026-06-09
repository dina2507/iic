import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StudentMember {
  id: string;
  name: string;
  role: string;
  domain: string | null;
  image_url: string | null;
  linkedin_url: string | null;
  whatsapp_url: string | null;
  display_order: number;
  is_active: boolean | null;
  is_core_member: boolean | null;
}

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
  const [formData, setFormData] = useState({
    name: member?.name || "",
    role: member?.role || "",
    domain: member?.domain || "",
    image_url: member?.image_url || "",
    linkedin_url: member?.linkedin_url || "",
    whatsapp_url: member?.whatsapp_url || "",
    display_order: member?.display_order || 0,
    is_active: member?.is_active ?? true,
    is_core_member: member?.is_core_member ?? false,
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    setFormData((prev) => ({ ...prev, image_url: urlData.publicUrl }));
    setIsUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      name: formData.name,
      role: formData.role,
      domain: formData.domain || null,
      image_url: formData.image_url || null,
      linkedin_url: formData.linkedin_url || null,
      whatsapp_url: formData.whatsapp_url || null,
      display_order: formData.display_order,
      is_active: formData.is_active,
      is_core_member: formData.is_core_member,
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Input
            id="role"
            value={formData.role}
            onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
            placeholder="e.g., President, Domain Lead"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="domain">Domain</Label>
        <Input
          id="domain"
          value={formData.domain}
          onChange={(e) => setFormData((prev) => ({ ...prev, domain: e.target.value }))}
          placeholder="e.g., Events, Design, Editorial"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Photo</Label>
        <div className="flex gap-2">
          <Input
            id="image_url"
            value={formData.image_url}
            onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
            placeholder="Image URL"
            className="flex-1"
          />
          <label className="cursor-pointer">
            <Input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <Button type="button" variant="outline" disabled={isUploading} asChild>
              <span>
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              </span>
            </Button>
          </label>
        </div>
        {formData.image_url && (
          <img src={formData.image_url} alt="Preview" className="w-20 h-20 rounded-full object-cover mt-2" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="linkedin">LinkedIn URL</Label>
          <Input
            id="linkedin"
            value={formData.linkedin_url}
            onChange={(e) => setFormData((prev) => ({ ...prev, linkedin_url: e.target.value }))}
            placeholder="https://linkedin.com/in/..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp URL</Label>
          <Input
            id="whatsapp"
            value={formData.whatsapp_url}
            onChange={(e) => setFormData((prev) => ({ ...prev, whatsapp_url: e.target.value }))}
            placeholder="https://wa.me/..."
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="display_order">Display Order</Label>
          <Input
            id="display_order"
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData((prev) => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch
            id="is_core_member"
            checked={formData.is_core_member}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_core_member: checked }))}
          />
          <Label htmlFor="is_core_member">Core Member</Label>
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
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
