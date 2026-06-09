-- Create domains table
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

-- Enable Row Level Security
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Domains are viewable by everyone" 
ON public.domains 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can create domains" 
ON public.domains 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update domains" 
ON public.domains 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete domains" 
ON public.domains 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_domains_updated_at
BEFORE UPDATE ON public.domains
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default domains
INSERT INTO public.domains (slug, name, description, icon, color, responsibilities, head_name, coordinator_name, display_order) VALUES
('events', 'Events', 'The Events domain orchestrates all major IIC activities including workshops, hackathons, innovation summits, and guest lectures. We create immersive experiences that bring together students, industry experts, and innovators to foster a culture of creativity and entrepreneurship.', 'Calendar', '262 83% 58%', ARRAY['Planning and executing flagship events like Innovation Week', 'Coordinating hackathons and ideation competitions', 'Managing guest lectures and expert sessions', 'Organizing networking events and meetups'], 'Priya Sharma', 'Rahul Verma', 1),
('design', 'Design', 'The Design domain crafts the visual identity of IIC VIT, creating compelling graphics, user interfaces, and brand materials. We blend creativity with purpose to communicate innovation through aesthetic excellence.', 'Palette', '330 81% 60%', ARRAY['Creating event posters, banners, and promotional materials', 'Designing UI/UX for IIC digital platforms', 'Maintaining brand consistency across all channels', 'Developing presentation templates and visual assets'], 'Ananya Reddy', 'Vikram Patel', 2),
('editorial', 'Editorial', 'The Editorial domain shapes the narrative of innovation at VIT through compelling content. From newsletters to blog posts, we document stories of entrepreneurship and share knowledge that inspires action.', 'FileText', '199 89% 48%', ARRAY['Publishing monthly IIC newsletters', 'Writing articles on innovation and entrepreneurship', 'Managing social media content strategy', 'Documenting events and success stories'], 'Kavya Menon', 'Arjun Singh', 3),
('ipr', 'IPR', 'The IPR (Intellectual Property Rights) domain guides students through the complexities of patents, trademarks, and copyrights. We ensure that innovative ideas are protected and creators receive the recognition they deserve.', 'Shield', '142 71% 45%', ARRAY['Conducting IPR awareness workshops', 'Assisting with patent filing procedures', 'Providing guidance on intellectual property protection', 'Organizing sessions with IP experts and attorneys'], 'Dr. Sanjay Kumar', 'Meera Nair', 4),
('internships', 'Internships', 'The Internships domain bridges the gap between academic learning and industry experience. We connect students with startups, established companies, and research organizations to provide hands-on learning opportunities.', 'Briefcase', '43 96% 56%', ARRAY['Curating internship opportunities from partner companies', 'Organizing internship fairs and recruitment drives', 'Providing resume and interview preparation workshops', 'Building relationships with potential employers'], 'Neha Gupta', 'Rohan Kapoor', 5),
('industry-connect', 'Industry Connect', 'The Industry Connect domain establishes and nurtures partnerships with corporate entities, fostering collaboration between academia and industry. We create pathways for knowledge exchange, mentorship, and real-world project opportunities.', 'Building2', '220 65% 50%', ARRAY['Building relationships with industry partners', 'Organizing industry visits and corporate interactions', 'Facilitating mentorship programs', 'Coordinating sponsored projects and collaborations'], 'Aditya Rao', 'Sneha Iyer', 6),
('startups', 'Startups', 'The Startups domain nurtures entrepreneurial ventures from ideation to launch. We provide resources, mentorship, and support to help student entrepreneurs transform their innovative ideas into successful businesses.', 'Rocket', '15 90% 55%', ARRAY['Running startup incubation programs', 'Organizing pitch competitions and demo days', 'Connecting founders with investors and mentors', 'Providing resources for business plan development'], 'Karthik Sundaram', 'Divya Krishnan', 7),
('innovations', 'Innovations', 'The Innovations domain drives cutting-edge research and development initiatives. We explore emerging technologies, facilitate prototype development, and create an environment where breakthrough ideas can flourish.', 'Zap', '280 70% 55%', ARRAY['Promoting research and development activities', 'Organizing innovation challenges and competitions', 'Facilitating access to labs and prototyping resources', 'Showcasing innovations at national platforms'], 'Dr. Ravi Shankar', 'Aarav Mehta', 8);