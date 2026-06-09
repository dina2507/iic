import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const iconOptions = [
  { value: "Calendar", label: "Calendar (Events)" },
  { value: "Palette", label: "Palette (Design)" },
  { value: "FileText", label: "FileText (Editorial)" },
  { value: "Shield", label: "Shield (IPR)" },
  { value: "Briefcase", label: "Briefcase (Internships)" },
  { value: "Building2", label: "Building2 (Industry)" },
  { value: "Rocket", label: "Rocket (Startups)" },
  { value: "Zap", label: "Zap (Innovations)" },
];

const colorOptions = [
  { value: "262 83% 58%", label: "Purple (Events)" },
  { value: "330 81% 60%", label: "Pink (Design)" },
  { value: "199 89% 48%", label: "Blue (Editorial)" },
  { value: "142 71% 45%", label: "Green (IPR)" },
  { value: "43 96% 56%", label: "Yellow (Internships)" },
  { value: "220 65% 50%", label: "Navy (Industry)" },
  { value: "15 90% 55%", label: "Orange (Startups)" },
  { value: "280 70% 55%", label: "Violet (Innovations)" },
];

const domainSchema = z.object({
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().min(1, "Color is required"),
  head_name: z.string().optional(),
  head_role: z.string().optional(),
  coordinator_name: z.string().optional(),
  coordinator_role: z.string().optional(),
  display_order: z.coerce.number().int().min(0),
});

type DomainFormData = z.infer<typeof domainSchema>;

interface Domain {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  responsibilities: string[] | null;
  head_name: string | null;
  head_role: string | null;
  coordinator_name: string | null;
  coordinator_role: string | null;
  display_order: number;
}

interface DomainFormProps {
  domain?: Domain;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DomainForm({ domain, onSuccess, onCancel }: DomainFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [responsibilities, setResponsibilities] = useState<string[]>(
    domain?.responsibilities || []
  );
  const [newResponsibility, setNewResponsibility] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DomainFormData>({
    resolver: zodResolver(domainSchema),
    defaultValues: {
      slug: domain?.slug || "",
      name: domain?.name || "",
      description: domain?.description || "",
      icon: domain?.icon || "Zap",
      color: domain?.color || "262 83% 58%",
      head_name: domain?.head_name || "",
      head_role: domain?.head_role || "Domain Head",
      coordinator_name: domain?.coordinator_name || "",
      coordinator_role: domain?.coordinator_role || "Domain Coordinator",
      display_order: domain?.display_order || 0,
    },
  });

  const selectedIcon = watch("icon");
  const selectedColor = watch("color");

  const addResponsibility = () => {
    if (newResponsibility.trim()) {
      setResponsibilities([...responsibilities, newResponsibility.trim()]);
      setNewResponsibility("");
    }
  };

  const removeResponsibility = (index: number) => {
    setResponsibilities(responsibilities.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: DomainFormData) => {
    setLoading(true);

    const domainData = {
      slug: data.slug,
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
      head_name: data.head_name || null,
      head_role: data.head_role || null,
      coordinator_name: data.coordinator_name || null,
      coordinator_role: data.coordinator_role || null,
      display_order: data.display_order,
      responsibilities,
    };

    if (domain) {
      // Update existing domain
      const { error } = await supabase
        .from("domains")
        .update(domainData)
        .eq("id", domain.id);

      if (error) {
        console.error("Error updating domain:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to update domain",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Domain updated successfully",
        });
        onSuccess();
      }
    } else {
      // Create new domain
      const { error } = await supabase.from("domains").insert([domainData]);

      if (error) {
        console.error("Error creating domain:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to create domain",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Domain created successfully",
        });
        onSuccess();
      }
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Domain Name</Label>
          <Input id="name" {...register("name")} placeholder="Events" />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug (URL-friendly)</Label>
          <Input id="slug" {...register("slug")} placeholder="events" />
          {errors.slug && (
            <p className="text-sm text-destructive">{errors.slug.message}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Describe the domain's purpose and activities..."
          className="min-h-[100px]"
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Icon & Color */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Icon</Label>
          <Select value={selectedIcon} onValueChange={(val) => setValue("icon", val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select icon" />
            </SelectTrigger>
            <SelectContent>
              {iconOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Color</Label>
          <Select value={selectedColor} onValueChange={(val) => setValue("color", val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select color" />
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: `hsl(${option.value})` }}
                    />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Responsibilities */}
      <div className="space-y-2">
        <Label>Responsibilities</Label>
        <div className="flex gap-2">
          <Input
            value={newResponsibility}
            onChange={(e) => setNewResponsibility(e.target.value)}
            placeholder="Add a responsibility..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addResponsibility();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addResponsibility}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {responsibilities.length > 0 && (
          <div className="space-y-2 mt-2">
            {responsibilities.map((resp, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted"
              >
                <span className="flex-1 text-sm">{resp}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeResponsibility(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Info */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground">Team Information</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="head_name">Domain Head Name</Label>
            <Input id="head_name" {...register("head_name")} placeholder="John Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="head_role">Domain Head Role</Label>
            <Input id="head_role" {...register("head_role")} placeholder="Domain Head" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="coordinator_name">Coordinator Name</Label>
            <Input id="coordinator_name" {...register("coordinator_name")} placeholder="Jane Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coordinator_role">Coordinator Role</Label>
            <Input id="coordinator_role" {...register("coordinator_role")} placeholder="Domain Coordinator" />
          </div>
        </div>
      </div>

      {/* Display Order */}
      <div className="space-y-2">
        <Label htmlFor="display_order">Display Order</Label>
        <Input
          id="display_order"
          type="number"
          {...register("display_order")}
          className="w-24"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="gradient-innovation">
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {domain ? "Update Domain" : "Create Domain"}
        </Button>
      </div>
    </form>
  );
}
