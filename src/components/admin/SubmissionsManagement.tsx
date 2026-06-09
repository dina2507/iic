import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, MessageSquare, Check, X, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface JoinRequest {
  id: string;
  name: string;
  email: string;
  reason: string;
  status: string;
  created_at: string;
}

interface IdeaSubmission {
  id: string;
  name: string;
  email: string;
  idea: string;
  status: string;
  created_at: string;
}

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export default function SubmissionsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: joinRequests, isLoading: loadingJoins } = useQuery({
    queryKey: ['join_requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('join_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as JoinRequest[];
    }
  });

  const { data: ideaSubmissions, isLoading: loadingIdeas } = useQuery({
    queryKey: ['idea_submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('idea_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as IdeaSubmission[];
    }
  });

  const { data: contactSubmissions, isLoading: loadingContacts } = useQuery({
    queryKey: ['contact_submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ContactSubmission[];
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ table, id, status }: { table: string, id: string, status: string }) => {
      const { error } = await supabase
        .from(table)
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [variables.table] });
      toast({ title: "Status updated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <Badge className="bg-blue-500">New</Badge>;
      case 'reviewed': return <Badge className="bg-yellow-500">Reviewed</Badge>;
      case 'accepted': return <Badge className="bg-green-500">Accepted</Badge>;
      case 'rejected': return <Badge className="bg-red-500">Rejected</Badge>;
      case 'resolved': return <Badge className="bg-green-500">Resolved</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="joins">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="joins">Team Joins</TabsTrigger>
          <TabsTrigger value="ideas">Ideas</TabsTrigger>
          <TabsTrigger value="contacts">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="joins" className="mt-6">
          {loadingJoins ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-accent" /></div>
          ) : joinRequests?.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">No join requests yet.</div>
          ) : (
            <div className="space-y-4">
              {joinRequests?.map(req => (
                <Card key={req.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{req.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Mail className="w-3 h-3" /> {req.email}
                          <span className="text-xs ml-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatDate(req.created_at)}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(req.status)}
                        <Select
                          value={req.status}
                          onValueChange={(val) => updateStatusMutation.mutate({ table: 'join_requests', id: req.id, status: val })}
                        >
                          <SelectTrigger className="w-[130px] h-8 text-xs">
                            <SelectValue placeholder="Update status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="reviewed">Reviewed</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap">
                      <span className="font-semibold block mb-1 text-xs text-muted-foreground uppercase">Reason for joining:</span>
                      {req.reason}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ideas" className="mt-6">
          {loadingIdeas ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-accent" /></div>
          ) : ideaSubmissions?.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">No idea submissions yet.</div>
          ) : (
            <div className="space-y-4">
              {ideaSubmissions?.map(req => (
                <Card key={req.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{req.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Mail className="w-3 h-3" /> {req.email}
                          <span className="text-xs ml-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatDate(req.created_at)}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(req.status)}
                        <Select
                          value={req.status}
                          onValueChange={(val) => updateStatusMutation.mutate({ table: 'idea_submissions', id: req.id, status: val })}
                        >
                          <SelectTrigger className="w-[130px] h-8 text-xs">
                            <SelectValue placeholder="Update status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="reviewed">Reviewed</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap">
                      <span className="font-semibold block mb-1 text-xs text-muted-foreground uppercase">Idea Pitch:</span>
                      {req.idea}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          {loadingContacts ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-accent" /></div>
          ) : contactSubmissions?.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">No contact messages yet.</div>
          ) : (
            <div className="space-y-4">
              {contactSubmissions?.map(req => (
                <Card key={req.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{req.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Mail className="w-3 h-3" /> {req.email}
                          <span className="text-xs ml-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatDate(req.created_at)}
                          </span>
                        </CardDescription>
                        <Badge variant="outline" className="mt-2 font-normal">{req.subject}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(req.status)}
                        <Select
                          value={req.status}
                          onValueChange={(val) => updateStatusMutation.mutate({ table: 'contact_submissions', id: req.id, status: val })}
                        >
                          <SelectTrigger className="w-[130px] h-8 text-xs">
                            <SelectValue placeholder="Update status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="reviewed">Reviewed</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap">
                      <span className="font-semibold block mb-1 text-xs text-muted-foreground uppercase">Message:</span>
                      {req.message}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
}
