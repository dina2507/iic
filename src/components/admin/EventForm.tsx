import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CoordinatorSelect } from "./CoordinatorSelect";

const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title is too long"),
  description: z.string().max(1000, "Description is too long").optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().optional(),
  venue: z.string().max(200, "Venue is too long").optional(),
  mode: z.enum(["online", "offline", "hybrid"]),
  eligibility: z.enum(["internal", "external", "both"]),
  registration_link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  is_featured: z.boolean(),
  is_active: z.boolean(),
  display_order: z.number().min(0),
  faculty_coordinator_ids: z.array(z.string()).optional().default([]),
  student_coordinator_ids: z.array(z.string()).optional().default([]),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  event?: {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    date: string;
    time: string | null;
    venue: string | null;
    mode: string | null;
    eligibility: string | null;
    registration_link: string | null;
    is_featured: boolean | null;
    is_active: boolean | null;
    display_order: number | null;
    faculty_coordinator_ids: string[] | null;
    student_coordinator_ids: string[] | null;
  };
  onSuccess: () => void;
  onCancel: () => void;
  /** When provided (e.g. from Domain Panel), pre-selects these domain IDs for new events */
  domainIds?: string[];
}

export function EventForm({ event, onSuccess, onCancel, domainIds }: EventFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(event?.image_url || null);
  const [isUploading, setIsUploading] = useState(false);
  const [domains, setDomains] = useState<{ id: string; name: string }[]>([]);
  const [selectedDomainIds, setSelectedDomainIds] = useState<string[]>(domainIds && !event?.id ? domainIds : []);

  useEffect(() => {
    const loadDomains = async () => {
      const { data } = await supabase
        .from("domains")
        .select("id, name")
        .order("display_order", { ascending: true });
      if (data) setDomains(data);
    };
    loadDomains();
  }, []);

  useEffect(() => {
    if (!event?.id) return;
    const loadEventDomains = async () => {
      const { data } = await supabase
        .from("event_domains")
        .select("domain_id")
        .eq("event_id", event.id);
      if (data) setSelectedDomainIds(data.map((row) => row.domain_id));
    };
    loadEventDomains();
  }, [event?.id]);

  const toggleDomain = (id: string) => {
    setSelectedDomainIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title || "",
      description: event?.description || "",
      date: event?.date || "",
      time: event?.time || "",
      venue: event?.venue || "",
      mode: (event?.mode as "online" | "offline" | "hybrid") || "offline",
      eligibility: (event?.eligibility as "internal" | "external" | "both") || "both",
      registration_link: event?.registration_link || "",
      is_featured: event?.is_featured ?? true,
      is_active: event?.is_active ?? true,
      display_order: event?.display_order ?? 0,
      faculty_coordinator_ids: event?.faculty_coordinator_ids || [],
      student_coordinator_ids: event?.student_coordinator_ids || [],
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 2MB",
          variant: "destructive",
        });
        return;
      }
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `events/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("event-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("event-images").getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error: any) {
      toast({
        title: "Error uploading image",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    try {
      let imageUrl = event?.image_url || null;

      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          setIsLoading(false);
          return;
        }
      }

      const eventData = {
        title: data.title,
        description: data.description || null,
        image_url: imageUrl,
        date: data.date,
        time: data.time || null,
        venue: data.venue || null,
        mode: data.mode,
        eligibility: data.eligibility,
        registration_link: data.registration_link || null,
        is_featured: data.is_featured,
        is_active: data.is_active,
        display_order: data.display_order,
        faculty_coordinator_ids: data.faculty_coordinator_ids?.length ? data.faculty_coordinator_ids : null,
        student_coordinator_ids: data.student_coordinator_ids?.length ? data.student_coordinator_ids : null,
      };

      let eventId = event?.id;

      if (event?.id) {
        const { error } = await supabase
          .from("events")
          .update(eventData)
          .eq("id", event.id);

        if (error) throw error;

        toast({
          title: "Event updated",
          description: "The event has been successfully updated.",
        });
      } else {
        const { data: inserted, error } = await supabase
          .from("events")
          .insert(eventData)
          .select("id")
          .single();

        if (error) throw error;
        eventId = inserted.id;

        toast({
          title: "Event created",
          description: "The event has been successfully created.",
        });
      }

      // Sync the event <-> domain links (organized-by)
      if (eventId) {
        const { error: deleteError } = await supabase
          .from("event_domains")
          .delete()
          .eq("event_id", eventId);
        if (deleteError) throw deleteError;

        if (selectedDomainIds.length > 0) {
          const { error: insertError } = await supabase
            .from("event_domains")
            .insert(
              selectedDomainIds.map((domain_id) => ({ event_id: eventId, domain_id }))
            );
          if (insertError) throw insertError;
        }
      }

      onSuccess();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Image Upload */}
      <div className="space-y-2">
        <Label>Event Image</Label>
        <div className="flex items-start gap-4">
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-40 h-24 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={removeImage}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-40 h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="h-6 w-6 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Upload Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          {...form.register("title")}
          placeholder="Event title"
        />
        {form.formState.errors.title && (
          <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...form.register("description")}
          placeholder="Event description"
          rows={3}
        />
        {form.formState.errors.description && (
          <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
        )}
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            {...form.register("date")}
          />
          {form.formState.errors.date && (
            <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <Input
            id="time"
            type="time"
            {...form.register("time")}
          />
        </div>
      </div>

      {/* Venue */}
      <div className="space-y-2">
        <Label htmlFor="venue">Venue</Label>
        <Input
          id="venue"
          {...form.register("venue")}
          placeholder="Event venue"
        />
      </div>

      {/* Organized by (Domains) */}
      <div className="space-y-2">
        <Label>Organized by (Domains)</Label>
        <p className="text-xs text-muted-foreground">
          Select one or more domains. The event appears on each selected domain's page.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {domains.length === 0 ? (
            <span className="text-sm text-muted-foreground">No domains available.</span>
          ) : (
            domains.map((domain) => {
              const selected = selectedDomainIds.includes(domain.id);
              return (
                <Badge
                  key={domain.id}
                  variant={selected ? "default" : "outline"}
                  className="cursor-pointer select-none"
                  onClick={() => toggleDomain(domain.id)}
                >
                  {domain.name}
                </Badge>
              );
            })
          )}
        </div>
      </div>

      {/* Coordinators */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Faculty Coordinators</Label>
          <CoordinatorSelect
            memberType="faculty"
            values={form.watch("faculty_coordinator_ids") || []}
            onChange={(vals) => form.setValue("faculty_coordinator_ids", vals, { shouldDirty: true })}
            placeholder="Assign Faculty Coordinators..."
          />
        </div>
        <div className="space-y-2">
          <Label>Student Coordinators</Label>
          <CoordinatorSelect
            memberType="student"
            values={form.watch("student_coordinator_ids") || []}
            onChange={(vals) => form.setValue("student_coordinator_ids", vals, { shouldDirty: true })}
            placeholder="Assign Student Coordinators..."
          />
        </div>
      </div>

      {/* Mode and Eligibility */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Mode</Label>
          <Select
            value={form.watch("mode")}
            onValueChange={(value: "online" | "offline" | "hybrid") => form.setValue("mode", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Eligibility</Label>
          <Select
            value={form.watch("eligibility")}
            onValueChange={(value: "internal" | "external" | "both") => form.setValue("eligibility", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both">Open for All</SelectItem>
              <SelectItem value="internal">VIT Only</SelectItem>
              <SelectItem value="external">External Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Registration Link */}
      <div className="space-y-2">
        <Label htmlFor="registration_link">Registration Link</Label>
        <Input
          id="registration_link"
          type="url"
          {...form.register("registration_link")}
          placeholder="https://..."
        />
        {form.formState.errors.registration_link && (
          <p className="text-sm text-destructive">{form.formState.errors.registration_link.message}</p>
        )}
      </div>

      {/* Display Order */}
      <div className="space-y-2">
        <Label htmlFor="display_order">Display Order</Label>
        <Input
          id="display_order"
          type="number"
          {...form.register("display_order", { valueAsNumber: true })}
          min={0}
        />
      </div>

      {/* Toggles */}
      <div className="flex gap-8">
        <div className="flex items-center gap-2">
          <Switch
            id="is_featured"
            checked={form.watch("is_featured")}
            onCheckedChange={(checked) => form.setValue("is_featured", checked)}
          />
          <Label htmlFor="is_featured">Featured in Hero</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="is_active"
            checked={form.watch("is_active")}
            onCheckedChange={(checked) => form.setValue("is_active", checked)}
          />
          <Label htmlFor="is_active">Active</Label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="gradient-innovation" disabled={isLoading || isUploading}>
          {(isLoading || isUploading) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {event?.id ? "Update Event" : "Create Event"}
        </Button>
      </div>
    </form>
  );
}
