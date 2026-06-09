import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const gallerySchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(200, "Title must be at most 200 characters"),
  description: z.string().max(500, "Description must be at most 500 characters").optional().or(z.literal("")),
  image_url: z.string().url("A valid image URL is required"),
  event_name: z.string().max(200, "Event name must be at most 200 characters").optional().or(z.literal("")),
  event_date: z.string().optional().or(z.literal("")),
  display_order: z.number().min(0, "Display order must be 0 or greater").optional(),
  is_featured: z.boolean(),
});

type GalleryFormData = z.infer<typeof gallerySchema>;

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

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<GalleryFormData>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      title: gallery?.title || "",
      description: gallery?.description || "",
      image_url: gallery?.image_url || "",
      event_name: gallery?.event_name || "",
      event_date: gallery?.event_date || "",
      display_order: gallery?.display_order || 0,
      is_featured: gallery?.is_featured || false,
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

      form.setValue("image_url", publicUrl);
      toast({ title: "Image uploaded successfully" });
    } catch (error: unknown) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: GalleryFormData) => {
    setIsLoading(true);

    try {
      const payload = {
        title: data.title,
        description: data.description || null,
        image_url: data.image_url,
        event_name: data.event_name || null,
        event_date: data.event_date || null,
        display_order: data.display_order ?? 0,
        is_featured: data.is_featured,
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
    } catch (error: unknown) {
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          {...form.register("title")}
        />
        {form.formState.errors.title && (
          <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...form.register("description")}
          rows={3}
        />
        {form.formState.errors.description && (
          <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Image *</Label>
        <div className="flex items-center gap-4">
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
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
          {form.watch("image_url") && (
            <img
              src={form.watch("image_url")}
              alt="Preview"
              className="w-16 h-16 object-cover rounded-lg"
            />
          )}
        </div>
        <Input
          placeholder="Or enter image URL"
          {...form.register("image_url")}
        />
        {form.formState.errors.image_url && (
          <p className="text-sm text-destructive">{form.formState.errors.image_url.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event_name">Event Name</Label>
          <Input
            id="event_name"
            {...form.register("event_name")}
          />
          {form.formState.errors.event_name && (
            <p className="text-sm text-destructive">{form.formState.errors.event_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="event_date">Event Date</Label>
          <Input
            id="event_date"
            type="date"
            {...form.register("event_date")}
          />
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

        <div className="flex items-center gap-3 pt-6">
          <Switch
            id="is_featured"
            checked={form.watch("is_featured")}
            onCheckedChange={(checked) => form.setValue("is_featured", checked)}
          />
          <Label htmlFor="is_featured">Featured</Label>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Saving..." : gallery ? "Update Image" : "Add Image"}
      </Button>
    </form>
  );
}
