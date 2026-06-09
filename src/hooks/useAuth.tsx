import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface UserDomainRole {
  domain_id: string;
  role: "head" | "coordinator" | "member";
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isDomainAdmin: boolean;
  isDomainHead: boolean;
  isDomainCoordinator: boolean;
  isDomainMember: boolean;
  isStudentMember: boolean;
  userDomainRoles: UserDomainRole[];
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [isDomainAdmin, setIsDomainAdmin] = useState(false);
  const [isDomainHead, setIsDomainHead] = useState(false);
  const [isDomainCoordinator, setIsDomainCoordinator] = useState(false);
  const [isDomainMember, setIsDomainMember] = useState(false);
  const [isStudentMember, setIsStudentMember] = useState(false);
  const [userDomainRoles, setUserDomainRoles] = useState<UserDomainRole[]>([]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role check with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            checkUserRoles(session.user.id);
          }, 0);
        } else {
          resetRoles();
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const resetRoles = () => {
    setIsAdmin(false);
    setIsModerator(false);
    setIsDomainAdmin(false);
    setIsDomainHead(false);
    setIsDomainCoordinator(false);
    setIsDomainMember(false);
    setIsStudentMember(false);
    setUserDomainRoles([]);
  };

  const checkUserRoles = async (userId: string) => {
    // 1. Check global roles (admin / moderator)
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (!error && data) {
      const roles = data.map(r => r.role);
      setIsAdmin(roles.includes("admin"));
      setIsModerator(roles.includes("moderator"));
    } else {
      setIsAdmin(false);
      setIsModerator(false);
    }

    // 2. Check domain roles — fetch ALL roles (head, coordinator, member)
    const { data: domainRoles, error: domainError } = await supabase
      .from("user_domain_roles")
      .select("domain_id, role")
      .eq("user_id", userId);
    
    if (!domainError && domainRoles && domainRoles.length > 0) {
      const roles = domainRoles as UserDomainRole[];
      setUserDomainRoles(roles);

      const roleValues = roles.map(r => r.role);
      setIsDomainHead(roleValues.includes("head"));
      setIsDomainCoordinator(roleValues.includes("coordinator"));
      setIsDomainMember(true); // any domain role means they are a domain member
      // backward compat: isDomainAdmin = head or coordinator
      setIsDomainAdmin(roleValues.includes("head") || roleValues.includes("coordinator"));
    } else {
      setUserDomainRoles([]);
      setIsDomainHead(false);
      setIsDomainCoordinator(false);
      setIsDomainMember(false);
      setIsDomainAdmin(false);
    }

    // 3. Check student member status
    const { data: studentMember, error: studentError } = await supabase
      .from("student_members")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!studentError && studentMember) {
      setIsStudentMember(true);
    } else {
      setIsStudentMember(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Allow both VIT domains (faculty @vit.ac.in, students @vitstudent.ac.in).
        // The actual domain restriction is enforced server-side by the
        // enforce_email_domain trigger on auth.users.
        redirectTo: `${window.location.origin}/auth`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    resetRoles();
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      isAdmin, isModerator,
      isDomainAdmin, isDomainHead, isDomainCoordinator, isDomainMember,
      isStudentMember, userDomainRoles,
      signUp, signIn, signInWithGoogle, signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
