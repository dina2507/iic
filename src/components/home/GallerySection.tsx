import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Camera, X, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function GallerySection() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const { data: images, isLoading } = useQuery({
    queryKey: ["gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const navigateImage = (direction: "prev" | "next") => {
    if (selectedImage === null || !images) return;
    if (direction === "prev") {
      setSelectedImage(selectedImage === 0 ? images.length - 1 : selectedImage - 1);
    } else {
      setSelectedImage(selectedImage === images.length - 1 ? 0 : selectedImage + 1);
    }
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
              <Camera className="w-4 h-4" />
              Gallery
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Moments & Memories</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!images || images.length === 0) {
    return (
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
              <Camera className="w-4 h-4" />
              Gallery
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Moments & Memories</h2>
            <p className="text-muted-foreground">Photos from our events coming soon!</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <Camera className="w-4 h-4" />
            Gallery
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Moments & Memories</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Relive the highlights from our past events, workshops, and activities.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              onClick={() => setSelectedImage(index)}
              className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
            >
              <img
                src={image.image_url}
                alt={image.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-semibold text-foreground text-sm line-clamp-1">{image.title}</h3>
                  {image.event_name && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{image.event_name}</p>
                  )}
                </div>
              </div>
              {image.is_featured && (
                <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  Featured
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Lightbox */}
        <Dialog open={selectedImage !== null} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-5xl p-0 bg-background/95 backdrop-blur-xl border-border">
            {selectedImage !== null && images[selectedImage] && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-10 bg-background/50 hover:bg-background/80"
                  onClick={() => setSelectedImage(null)}
                >
                  <X className="w-5 h-5" />
                </Button>

                <div className="relative aspect-video">
                  <img
                    src={images[selectedImage].image_url}
                    alt={images[selectedImage].title}
                    className="w-full h-full object-contain"
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80"
                    onClick={() => navigateImage("prev")}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80"
                    onClick={() => navigateImage("next")}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{images[selectedImage].title}</h3>
                  {images[selectedImage].description && (
                    <p className="text-muted-foreground mb-2">{images[selectedImage].description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {images[selectedImage].event_name && (
                      <span>{images[selectedImage].event_name}</span>
                    )}
                    {images[selectedImage].event_date && (
                      <span>{format(new Date(images[selectedImage].event_date), "MMM d, yyyy")}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
