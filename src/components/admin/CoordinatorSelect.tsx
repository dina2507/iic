import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Coordinator {
  id: string;
  name: string;
  designation: string;
}

interface CoordinatorSelectProps {
  memberType: "faculty" | "student";
  values?: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export function CoordinatorSelect({
  memberType,
  values = [],
  onChange,
  placeholder = "Select coordinators...",
}: CoordinatorSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCoordinators, setSelectedCoordinators] = useState<Coordinator[]>([]);

  const queryKey = memberType === "faculty" ? ["directory-faculty"] : ["directory-students"];

  // Fetch all potential coordinators using React Query and the member_directory view
  const { data: coordinators = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_directory")
        .select("id, name, designation, role")
        .eq("member_type", memberType)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching coordinators:", error);
        return [];
      }

      return (data || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        designation: memberType === "faculty" ? d.designation : d.role,
      }));
    },
  });

  // Sync selected coordinators
  useEffect(() => {
    if (coordinators.length > 0 && values.length > 0) {
      setSelectedCoordinators(coordinators.filter(c => values.includes(c.id)));
    } else if (values.length === 0) {
      setSelectedCoordinators([]);
    }
  }, [coordinators, values]);

  const filteredCoordinators = coordinators.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.designation?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleCoordinator = (coordinator: Coordinator) => {
    const isSelected = values.includes(coordinator.id);
    const newValues = isSelected 
      ? values.filter(v => v !== coordinator.id)
      : [...values, coordinator.id];
    
    onChange(newValues);
  };

  const removeCoordinator = (idToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(values.filter(id => id !== idToRemove));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal text-left min-h-10 h-auto py-2"
        >
          {selectedCoordinators.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedCoordinators.map(c => (
                <Badge key={c.id} variant="secondary" className="mr-1 mb-1">
                  {c.name}
                  <button
                    className="ml-1 hover:bg-muted rounded-full"
                    onClick={(e) => removeCoordinator(c.id, e)}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={`Search ${memberType} members...`} 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading...
                </div>
              ) : (
                "No members found."
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredCoordinators.map((coordinator) => {
                const isSelected = values.includes(coordinator.id);
                return (
                  <CommandItem
                    key={coordinator.id}
                    value={coordinator.id}
                    onSelect={() => toggleCoordinator(coordinator)}
                  >
                    <div className="flex items-center w-full">
                      <div className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                      )}>
                        <Check className={cn("h-4 w-4")} />
                      </div>
                      <div className="flex flex-col">
                        <span>{coordinator.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {coordinator.designation}
                        </span>
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
