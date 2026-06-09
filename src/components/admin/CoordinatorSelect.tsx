import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";

interface Coordinator {
  user_id: string;
  name: string;
  designation: string;
  email: string | null;
}

interface CoordinatorSelectProps {
  memberType: "faculty" | "student";
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function CoordinatorSelect({
  memberType,
  value,
  onChange,
  placeholder = "Select coordinator...",
}: CoordinatorSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState<Coordinator | null>(null);

  // Fetch initial selected user if a value is provided
  useEffect(() => {
    if (value && !selectedValue) {
      const fetchSelected = async () => {
        const table = memberType === "faculty" ? "faculty_members" : "student_members";
        const { data } = await supabase
          .from(table as any)
          .select("user_id, name, " + (memberType === "faculty" ? "designation" : "role"))
          .eq("user_id", value)
          .single();
          
        if (data) {
          setSelectedValue({
            user_id: data.user_id,
            name: data.name,
            designation: (data as any).designation || (data as any).role,
            email: null,
          });
        }
      };
      fetchSelected();
    }
  }, [value, memberType]);

  useEffect(() => {
    const fetchCoordinators = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.rpc("search_potential_coordinators", {
        search_query: searchQuery,
        member_type: memberType,
      });

      if (!error && data) {
        setCoordinators(data);
      }
      setIsLoading(false);
    };

    // Debounce search
    const timer = setTimeout(() => {
      fetchCoordinators();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, memberType]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal text-left"
        >
          {selectedValue ? (
            <div className="flex flex-col items-start truncate">
              <span className="truncate">{selectedValue.name}</span>
              <span className="text-xs text-muted-foreground truncate">
                {selectedValue.designation} {selectedValue.email ? `(${selectedValue.email})` : ""}
              </span>
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
            placeholder={`Search ${memberType} by name or email...`} 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Searching...
                </div>
              ) : (
                "No coordinators found."
              )}
            </CommandEmpty>
            <CommandGroup>
              {coordinators.map((coordinator) => (
                <CommandItem
                  key={coordinator.user_id}
                  value={coordinator.user_id}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setSelectedValue(currentValue === value ? null : coordinator);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === coordinator.user_id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{coordinator.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {coordinator.designation} {coordinator.email ? `• ${coordinator.email}` : ""}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
