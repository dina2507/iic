import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  GraduationCap,
  Users,
  Mail,
  Linkedin,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FacultyMemberForm } from "./FacultyMemberForm";
import { StudentMemberForm } from "./StudentMemberForm";

interface FacultyMember {
  id: string;
  name: string;
  designation: string;
  department: string;
  image_url: string | null;
  email: string | null;
  linkedin_url: string | null;
  display_order: number;
  is_active: boolean | null;
}

interface StudentMember {
  id: string;
  name: string;
  role: string;
  domain: string | null;
  image_url: string | null;
  linkedin_url: string | null;
  whatsapp_url: string | null;
  display_order: number;
  is_active: boolean | null;
  is_core_member: boolean | null;
}

interface MembersManagementProps {
  canManageContent: boolean;
}

export default function MembersManagement({ canManageContent }: MembersManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFacultyFormOpen, setIsFacultyFormOpen] = useState(false);
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<FacultyMember | null>(null);
  const [editingStudent, setEditingStudent] = useState<StudentMember | null>(null);

  // Fetch faculty members
  const { data: facultyMembers, isLoading: facultyLoading } = useQuery({
    queryKey: ["admin-faculty"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faculty_members")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as FacultyMember[];
    },
  });

  // Fetch student members
  const { data: studentMembers, isLoading: studentsLoading } = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_members")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as StudentMember[];
    },
  });

  const handleDeleteFaculty = async (id: string) => {
    const { error } = await supabase.from("faculty_members").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete faculty member", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Faculty member has been deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin-faculty"] });
    }
  };

  const handleDeleteStudent = async (id: string) => {
    const { error } = await supabase.from("student_members").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete student member", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Student member has been deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="faculty" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="faculty" className="gap-2">
            <GraduationCap className="w-4 h-4" />
            Faculty ({facultyMembers?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-2">
            <Users className="w-4 h-4" />
            Students ({studentMembers?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Faculty Tab */}
        <TabsContent value="faculty" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-muted-foreground">Manage faculty mentors and coordinators</p>
            {canManageContent && (
              <Button onClick={() => setIsFacultyFormOpen(true)} className="gradient-innovation">
                <Plus className="w-4 h-4 mr-2" />
                Add Faculty
              </Button>
            )}
          </div>

          {facultyLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : !facultyMembers || facultyMembers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No faculty members found. Add your first faculty member!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {facultyMembers.map((member) => (
                <Card key={member.id} className={!member.is_active ? "opacity-60" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                        {member.image_url ? (
                          <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <GraduationCap className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{member.name}</h3>
                          {!member.is_active && <Badge variant="secondary">Inactive</Badge>}
                        </div>
                        <p className="text-sm text-accent">{member.designation}</p>
                        <p className="text-sm text-muted-foreground truncate">{member.department}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {member.email && (
                            <a href={`mailto:${member.email}`} className="text-muted-foreground hover:text-foreground">
                              <Mail className="w-4 h-4" />
                            </a>
                          )}
                          {member.linkedin_url && (
                            <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                              <Linkedin className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                      {canManageContent && (
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingFaculty(member);
                              setIsFacultyFormOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Faculty Member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{member.name}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteFaculty(member.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-muted-foreground">Manage student leaders and team members</p>
            {canManageContent && (
              <Button onClick={() => setIsStudentFormOpen(true)} className="gradient-innovation">
                <Plus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            )}
          </div>

          {studentsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : !studentMembers || studentMembers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No student members found. Add your first student member!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studentMembers.map((member) => (
                <Card key={member.id} className={!member.is_active ? "opacity-60" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-muted flex-shrink-0">
                        {member.image_url ? (
                          <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Users className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{member.name}</h3>
                          {member.is_core_member && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                        </div>
                        <p className="text-sm text-accent">{member.role}</p>
                        {member.domain && (
                          <Badge variant="secondary" className="text-xs mt-1">{member.domain}</Badge>
                        )}
                      </div>
                      {canManageContent && (
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingStudent(member);
                              setIsStudentFormOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Student Member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{member.name}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteStudent(member.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Faculty Form Dialog */}
      <Dialog open={isFacultyFormOpen} onOpenChange={(open) => {
        setIsFacultyFormOpen(open);
        if (!open) setEditingFaculty(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFaculty ? "Edit Faculty Member" : "Add Faculty Member"}
            </DialogTitle>
          </DialogHeader>
          <FacultyMemberForm
            member={editingFaculty || undefined}
            onSuccess={() => {
              setIsFacultyFormOpen(false);
              setEditingFaculty(null);
            }}
            onCancel={() => {
              setIsFacultyFormOpen(false);
              setEditingFaculty(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Student Form Dialog */}
      <Dialog open={isStudentFormOpen} onOpenChange={(open) => {
        setIsStudentFormOpen(open);
        if (!open) setEditingStudent(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStudent ? "Edit Student Member" : "Add Student Member"}
            </DialogTitle>
          </DialogHeader>
          <StudentMemberForm
            member={editingStudent || undefined}
            onSuccess={() => {
              setIsStudentFormOpen(false);
              setEditingStudent(null);
            }}
            onCancel={() => {
              setIsStudentFormOpen(false);
              setEditingStudent(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
