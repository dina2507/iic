-- Create faculty_members table
CREATE TABLE public.faculty_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  department TEXT NOT NULL,
  image_url TEXT,
  email TEXT,
  linkedin_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student_members table
CREATE TABLE public.student_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  domain TEXT,
  image_url TEXT,
  linkedin_url TEXT,
  whatsapp_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_core_member BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.faculty_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_members ENABLE ROW LEVEL SECURITY;

-- Faculty members policies (viewable by everyone, managed by admin/moderator)
CREATE POLICY "Faculty members are viewable by everyone" 
ON public.faculty_members 
FOR SELECT 
USING (true);

CREATE POLICY "Admins and moderators can create faculty members" 
ON public.faculty_members 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins and moderators can update faculty members" 
ON public.faculty_members 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins and moderators can delete faculty members" 
ON public.faculty_members 
FOR DELETE 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- Student members policies (viewable by everyone, managed by admin/moderator)
CREATE POLICY "Student members are viewable by everyone" 
ON public.student_members 
FOR SELECT 
USING (true);

CREATE POLICY "Admins and moderators can create student members" 
ON public.student_members 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins and moderators can update student members" 
ON public.student_members 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins and moderators can delete student members" 
ON public.student_members 
FOR DELETE 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- Create triggers for updated_at
CREATE TRIGGER update_faculty_members_updated_at
BEFORE UPDATE ON public.faculty_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_members_updated_at
BEFORE UPDATE ON public.student_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();