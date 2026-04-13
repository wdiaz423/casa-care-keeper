-- Create homes table
CREATE TABLE public.homes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  color TEXT NOT NULL DEFAULT '#E97B2C',
  icon TEXT NOT NULL DEFAULT 'home',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.homes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own homes" ON public.homes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own homes" ON public.homes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own homes" ON public.homes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own homes" ON public.homes FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_homes_updated_at BEFORE UPDATE ON public.homes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add home_id to maintenance_tasks (nullable for backward compat)
ALTER TABLE public.maintenance_tasks ADD COLUMN home_id UUID REFERENCES public.homes(id) ON DELETE CASCADE;

CREATE INDEX idx_maintenance_tasks_home_id ON public.maintenance_tasks(home_id);