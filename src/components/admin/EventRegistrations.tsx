import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Download, 
  Search, 
  Loader2, 
  UserCheck, 
  Calendar,
  Filter,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { downloadCsv } from "@/lib/export";

interface Registration {
  id: string;
  user_id: string;
  event_id: string;
  status: string;
  registered_at: string;
  event_title: string | null;
  event_date: string | null;
  user_name: string | null;
  user_email: string | null;
}

interface Event {
  id: string;
  title: string;
  date: string;
}

interface EventRegistrationsProps {
  eventId?: string;
}

export default function EventRegistrations({ eventId }: EventRegistrationsProps = {}) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>(eventId || "all");

  // Fetch all events for filter dropdown
  const { data: events } = useQuery({
    queryKey: ["admin-events-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, date")
        .order("date", { ascending: false });
      if (error) throw error;
      return data as Event[];
    },
  });

  // Fetch registrations with event details, then fetch profiles separately
  const { data: registrations, isLoading } = useQuery({
    queryKey: ["admin-registrations", selectedEvent],
    queryFn: async () => {
      let query = supabase
        .from("event_registrations")
        .select(`
          id,
          user_id,
          event_id,
          status,
          registered_at,
          event:events(id, title, date)
        `)
        .order("registered_at", { ascending: false });

      if (selectedEvent !== "all") {
        query = query.eq("event_id", selectedEvent);
      }

      const { data: regData, error: regError } = await query;
      if (regError) throw regError;

      if (!regData || regData.length === 0) return [];

      // Get unique user IDs
      const userIds = [...new Set(regData.map((r) => r.user_id))];
      
      // Fetch profiles for those users
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      if (profileError) throw profileError;

      // Create a map for quick lookup
      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      // Combine the data
      return regData.map((reg) => {
        const profile = profileMap.get(reg.user_id);
        const event = reg.event as { id: string; title: string; date: string } | null;
        return {
          id: reg.id,
          user_id: reg.user_id,
          event_id: reg.event_id,
          status: reg.status,
          registered_at: reg.registered_at,
          event_title: event?.title || null,
          event_date: event?.date || null,
          user_name: profile?.full_name || null,
          user_email: profile?.email || null,
        } as Registration;
      });
    },
  });

  const filteredRegistrations = registrations?.filter((reg) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      reg.user_name?.toLowerCase().includes(searchLower) ||
      reg.user_email?.toLowerCase().includes(searchLower) ||
      reg.event_title?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportToCSV = () => {
    if (!filteredRegistrations || filteredRegistrations.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no registrations to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Name", "Email", "Event", "Event Date", "Status", "Registered At"];
    const rows = filteredRegistrations.map((reg) => [
      reg.user_name || "N/A",
      reg.user_email || "N/A",
      reg.event_title || "N/A",
      reg.event_date ? formatDate(reg.event_date) : "N/A",
      reg.status,
      formatDateTime(reg.registered_at),
    ]);

    downloadCsv(
      `registrations_${selectedEvent === "all" ? "all" : "event"}_${new Date().toISOString().split("T")[0]}.csv`,
      headers,
      rows
    );

    toast({
      title: "Export successful",
      description: `Exported ${filteredRegistrations.length} registrations to CSV.`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "registered":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Registered</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "attended":
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">Attended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Calculate stats
  const totalRegistrations = registrations?.length || 0;
  const uniqueEvents = new Set(registrations?.map((r) => r.event_id)).size;
  const todayRegistrations = registrations?.filter((r) => {
    const today = new Date().toDateString();
    return new Date(r.registered_at).toDateString() === today;
  }).length || 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <UserCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalRegistrations}</p>
              <p className="text-sm text-muted-foreground">Total Registrations</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Calendar className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{uniqueEvents}</p>
              <p className="text-sm text-muted-foreground">Events with Registrations</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <UserCheck className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todayRegistrations}</p>
              <p className="text-sm text-muted-foreground">Today's Registrations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events?.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedEvent !== "all" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedEvent("all")}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      {!filteredRegistrations || filteredRegistrations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No registrations found.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Event Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegistrations.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{reg.user_name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">{reg.user_email || "N/A"}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{reg.event_title || "Unknown Event"}</p>
                  </TableCell>
                  <TableCell>
                    {reg.event_date ? formatDate(reg.event_date) : "N/A"}
                  </TableCell>
                  <TableCell>{getStatusBadge(reg.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(reg.registered_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
