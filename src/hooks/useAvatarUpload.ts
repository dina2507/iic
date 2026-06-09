import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Uploads an image to the public `avatars` bucket and returns its public URL.
 * Validation (type/size) is handled here; persistence is left to the caller.
 */
export function useAvatarUpload() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (file.size > MAX_BYTES) {
      toast({ title: "File too large", description: "Image must be less than 5MB", variant: "destructive" });
      return null;
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Only JPEG, PNG, and WebP images are allowed", variant: "destructive" });
      return null;
    }

    setIsUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? "anon";
      const fileExt = file.name.split(".").pop();
      const fileName = `${uid}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file);
      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        return null;
      }

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      return urlData.publicUrl;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadAvatar, isUploading };
}
