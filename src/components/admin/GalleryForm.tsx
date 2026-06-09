import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";

interface GalleryFormProps {
  gallery?: {
    id: string;
    title: string;
    description: string | null;
    image_url: string;
    event_name: string | null;
    event_date: string | null;
    display_order: number;
    is_featured: boolean | null;
  };
  onSuccess: () => void;
}

export function GalleryForm({ gallery, onSuccess }: GalleryFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: gallery?.title || "",
    description: gallery?.description || "",
    image_url: gallery?.image_url || "",
    event_name: gallery?.event_name || "",
    event_date: gallery?.event_date || "",
    display_order: gallery?.display_order || 0,
    is_featured: gallery?.is_featured || false,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("event-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("event-images")
        .getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
      toast({ title: "Image uploaded successfully" });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description || null,
        image_url: formData.image_url,
        event_name: formData.event_name || null,
        event_date: formData.event_date || null,
        display_order: formData.display_order,
        is_featured: formData.is_featured,
      };

      if (gallery) {
        const { error } = await supabase
          .from("gallery")
          .update(payload)
          .eq("id", gallery.id);
        if (error) throw error;
        toast({ title: "Gallery image updated successfully" });
      } else {
        const { error } = await supabase.from("gallery").insert([payload]);
        if (error) throw error;
        toast({ title: "Gallery image added successfully" });
      }

      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Image *</Label>
        <div className="flex items-center gap-4">
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isUploading}
            className="hidden"
            id="image-upload"
          />
          <Label
            htmlFor="image-upload"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-input bg-background hover:bg-secondary cursor-pointer transition-colors"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {isUploading ? "Uploading..." : "Upload Image"}
          </Label>
          {formData.image_url && (
            <img
              src={formData.image_url}
              alt="Preview"
              className="w-16 h-16 object-cover rounded-lg"
            />
          )}
        </div>
        <Input
          placeholder="Or enter image URL"
          value={formData.image_url}
          onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event_name">Event Name</Label>
          <Input
            id="event_name"
            value={formData.event_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, event_name: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="event_date">Event Date</Label>
          <Input
            id="event_date"
            type="date"
            value={formData.event_date}
            onChange={(e) => setFormData((prev) => ({ ...prev, event_date: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="display_order">Display Order</Label>
          <Input
            id="display_order"
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData((prev) => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
          />
        </div>

        <div className="flex items-center gap-3 pt-6">
          <Switch
            id="is_featured"
            checked={formData.is_featured}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_featured: checked }))}
          />
          <Label htmlFor="is_featured">Featured</Label>
        </div>
      </div>

      <Button type="submit" disabled={isLoading || !formData.title || !formData.image_url} className="w-full">
        {isLoading ? "Saving..." : gallery ? "Update Image" : "Add Image"}
      </Button>
    </form>
  );
}
