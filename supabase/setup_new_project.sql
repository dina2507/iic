-- =====================================================================
-- IIC — Full backend setup for a FRESH Supabase project.
-- Paste this whole file into:  Supabase Dashboard → SQL Editor → New query → Run.
-- It recreates every table, enum, function, trigger, RLS policy, and the
-- storage bucket. Safe to run once on an empty project.
-- (No data import needed — the source database is empty.)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Roles, profiles, events, storage bucket, signup trigger
-- ---------------------------------------------------------------------

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    date DATE NOT NULL,
    time TEXT,
    venue TEXT,
    mode TEXT CHECK (mode IN ('online', 'offline', 'hybrid')) DEFAULT 'offline',
    eligibility TEXT CHECK (eligibility IN ('internal', 'external', 'both')) DEFAULT 'both',
    registration_link TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- user_roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- events policies (admin + moderator, final form)
CREATE POLICY "Events are viewable by everyone" ON public.events
FOR SELECT USING (true);
CREATE POLICY "Admins and moderators can create events" ON public.events
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Admins and moderators can update events" ON public.events
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Admins and moderators can delete events" ON public.events
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- storage policies for event-images
CREATE POLICY "Event images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'event-images');
CREATE POLICY "Admins can upload event images" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'event-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update event images" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'event-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete event images" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'event-images' AND public.has_role(auth.uid(), 'admin'));

-- create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- 2) Domains (with seed data)
-- ---------------------------------------------------------------------

CREATE TABLE public.domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Zap',
  color TEXT NOT NULL DEFAULT '262 83% 58%',
  responsibilities TEXT[] DEFAULT '{}',
  head_name TEXT,
  head_role TEXT DEFAULT 'Domain Head',
  coordinator_name TEXT,
  coordinator_role TEXT DEFAULT 'Domain Coordinator',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Domains are viewable by everyone" ON public.domains
FOR SELECT USING (true);
CREATE POLICY "Admins can create domains" ON public.domains
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update domains" ON public.domains
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete domains" ON public.domains
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_domains_updated_at
BEFORE UPDATE ON public.domains
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.domains (slug, name, description, icon, color, responsibilities, head_name, coordinator_name, display_order) VALUES
('events', 'Events', 'The Events domain orchestrates all major IIC activities including workshops, hackathons, innovation summits, and guest lectures. We create immersive experiences that bring together students, industry experts, and innovators to foster a culture of creativity and entrepreneurship.', 'Calendar', '262 83% 58%', ARRAY['Planning and executing flagship events like Innovation Week', 'Coordinating hackathons and ideation competitions', 'Managing guest lectures and expert sessions', 'Organizing networking events and meetups'], 'Priya Sharma', 'Rahul Verma', 1),
('design', 'Design', 'The Design domain crafts the visual identity of IIC VIT, creating compelling graphics, user interfaces, and brand materials. We blend creativity with purpose to communicate innovation through aesthetic excellence.', 'Palette', '330 81% 60%', ARRAY['Creating event posters, banners, and promotional materials', 'Designing UI/UX for IIC digital platforms', 'Maintaining brand consistency across all channels', 'Developing presentation templates and visual assets'], 'Ananya Reddy', 'Vikram Patel', 2),
('editorial', 'Editorial', 'The Editorial domain shapes the narrative of innovation at VIT through compelling content. From newsletters to blog posts, we document stories of entrepreneurship and share knowledge that inspires action.', 'FileText', '199 89% 48%', ARRAY['Publishing monthly IIC newsletters', 'Writing articles on innovation and entrepreneurship', 'Managing social media content strategy', 'Documenting events and success stories'], 'Kavya Menon', 'Arjun Singh', 3),
('ipr', 'IPR', 'The IPR (Intellectual Property Rights) domain guides students through the complexities of patents, trademarks, and copyrights. We ensure that innovative ideas are protected and creators receive the recognition they deserve.', 'Shield', '142 71% 45%', ARRAY['Conducting IPR awareness workshops', 'Assisting with patent filing procedures', 'Providing guidance on intellectual property protection', 'Organizing sessions with IP experts and attorneys'], 'Dr. Sanjay Kumar', 'Meera Nair', 4),
('internships', 'Internships', 'The Internships domain bridges the gap between academic learning and industry experience. We connect students with startups, established companies, and research organizations to provide hands-on learning opportunities.', 'Briefcase', '43 96% 56%', ARRAY['Curating internship opportunities from partner companies', 'Organizing internship fairs and recruitment drives', 'Providing resume and interview preparation workshops', 'Building relationships with potential employers'], 'Neha Gupta', 'Rohan Kapoor', 5),
('industry-connect', 'Industry Connect', 'The Industry Connect domain establishes and nurtures partnerships with corporate entities, fostering collaboration between academia and industry. We create pathways for knowledge exchange, mentorship, and real-world project opportunities.', 'Building2', '220 65% 50%', ARRAY['Building relationships with industry partners', 'Organizing industry visits and corporate interactions', 'Facilitating mentorship programs', 'Coordinating sponsored projects and collaborations'], 'Aditya Rao', 'Sneha Iyer', 6),
('startups', 'Startups', 'The Startups domain nurtures entrepreneurial ventures from ideation to launch. We provide resources, mentorship, and support to help student entrepreneurs transform their innovative ideas into successful businesses.', 'Rocket', '15 90% 55%', ARRAY['Running startup incubation programs', 'Organizing pitch competitions and demo days', 'Connecting founders with investors and mentors', 'Providing resources for business plan development'], 'Karthik Sundaram', 'Divya Krishnan', 7),
('innovations', 'Innovations', 'The Innovations domain drives cutting-edge research and development initiatives. We explore emerging technologies, facilitate prototype development, and create an environment where breakthrough ideas can flourish.', 'Zap', '280 70% 55%', ARRAY['Promoting research and development activities', 'Organizing innovation challenges and competitions', 'Facilitating access to labs and prototyping resources', 'Showcasing innovations at national platforms'], 'Dr. Ravi Shankar', 'Aarav Mehta', 8);

-- ---------------------------------------------------------------------
-- 3) Gallery
-- ---------------------------------------------------------------------

CREATE TABLE public.gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  event_name TEXT,
  event_date DATE,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gallery images are viewable by everyone" ON public.gallery
FOR SELECT USING (true);
CREATE POLICY "Admins and moderators can create gallery images" ON public.gallery
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Admins and moderators can update gallery images" ON public.gallery
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Admins and moderators can delete gallery images" ON public.gallery
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE TRIGGER update_gallery_updated_at
BEFORE UPDATE ON public.gallery
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- 4) Event registrations
-- ---------------------------------------------------------------------

CREATE TABLE public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
  UNIQUE(user_id, event_id)
);
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own registrations" ON public.event_registrations
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can register for events" ON public.event_registrations
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own registrations" ON public.event_registrations
FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own registrations" ON public.event_registrations
FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all registrations" ON public.event_registrations
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- ---------------------------------------------------------------------
-- 5) Faculty + Student members
-- ---------------------------------------------------------------------

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
  -- NEW: per-member designation within the domain (head / coordinator / member)
  domain_role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.faculty_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Faculty members are viewable by everyone" ON public.faculty_members
FOR SELECT USING (true);
CREATE POLICY "Admins and moderators can create faculty members" ON public.faculty_members
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));
CREATE POLICY "Admins and moderators can update faculty members" ON public.faculty_members
FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));
CREATE POLICY "Admins and moderators can delete faculty members" ON public.faculty_members
FOR DELETE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Student members are viewable by everyone" ON public.student_members
FOR SELECT USING (true);
CREATE POLICY "Admins and moderators can create student members" ON public.student_members
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));
CREATE POLICY "Admins and moderators can update student members" ON public.student_members
FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));
CREATE POLICY "Admins and moderators can delete student members" ON public.student_members
FOR DELETE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE TRIGGER update_faculty_members_updated_at
BEFORE UPDATE ON public.faculty_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_student_members_updated_at
BEFORE UPDATE ON public.student_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- 6) NEW: event_domains join table (events organized by one or more domains)
-- ---------------------------------------------------------------------

CREATE TABLE public.event_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (event_id, domain_id)
);
ALTER TABLE public.event_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event domains are viewable by everyone" ON public.event_domains
FOR SELECT USING (true);
CREATE POLICY "Admins and moderators can create event domains" ON public.event_domains
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));
CREATE POLICY "Admins and moderators can update event domains" ON public.event_domains
FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));
CREATE POLICY "Admins and moderators can delete event domains" ON public.event_domains
FOR DELETE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE INDEX idx_event_domains_event_id ON public.event_domains(event_id);
CREATE INDEX idx_event_domains_domain_id ON public.event_domains(domain_id);

-- =====================================================================
-- Done. Next: make yourself an admin AFTER you sign up in the app:
--   INSERT INTO public.user_roles (user_id, role)
--   VALUES ('<your-auth-user-id>', 'admin');
-- (Find your id under Authentication → Users in the dashboard.)
-- =====================================================================
