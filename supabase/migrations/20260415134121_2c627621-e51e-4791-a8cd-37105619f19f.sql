
-- Role type for home membership
CREATE TYPE public.home_role AS ENUM ('owner', 'admin', 'member');

-- Home members table
CREATE TABLE public.home_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role home_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(home_id, user_id)
);

ALTER TABLE public.home_members ENABLE ROW LEVEL SECURITY;

-- Security definer function to check home membership
CREATE OR REPLACE FUNCTION public.is_home_member(_user_id UUID, _home_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.home_members
    WHERE user_id = _user_id AND home_id = _home_id
  );
$$;

-- Security definer function to check home role
CREATE OR REPLACE FUNCTION public.get_home_role(_user_id UUID, _home_id UUID)
RETURNS home_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.home_members
  WHERE user_id = _user_id AND home_id = _home_id;
$$;

-- RLS policies for home_members
CREATE POLICY "Members can view their home's members"
  ON public.home_members FOR SELECT
  USING (public.is_home_member(auth.uid(), home_id));

CREATE POLICY "Owners and admins can add members"
  ON public.home_members FOR INSERT
  WITH CHECK (
    public.get_home_role(auth.uid(), home_id) IN ('owner', 'admin')
  );

CREATE POLICY "Owners can update member roles"
  ON public.home_members FOR UPDATE
  USING (public.get_home_role(auth.uid(), home_id) = 'owner');

CREATE POLICY "Owners and admins can remove members"
  ON public.home_members FOR DELETE
  USING (
    public.get_home_role(auth.uid(), home_id) IN ('owner', 'admin')
  );

-- Home invitations table
CREATE TABLE public.home_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  email TEXT,
  role home_role NOT NULL DEFAULT 'member',
  invite_code TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  invited_by UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.home_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their home invitations"
  ON public.home_invitations FOR SELECT
  USING (public.is_home_member(auth.uid(), home_id));

CREATE POLICY "Owners and admins can create invitations"
  ON public.home_invitations FOR INSERT
  WITH CHECK (
    public.get_home_role(auth.uid(), home_id) IN ('owner', 'admin')
  );

CREATE POLICY "Owners and admins can update invitations"
  ON public.home_invitations FOR UPDATE
  USING (
    public.get_home_role(auth.uid(), home_id) IN ('owner', 'admin')
  );

-- Allow anyone authenticated to read invitations by code (for accepting)
CREATE POLICY "Users can view invitations by code"
  ON public.home_invitations FOR SELECT
  TO authenticated
  USING (true);

-- Auto-add home creator as owner via trigger
CREATE OR REPLACE FUNCTION public.auto_add_home_owner()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.home_members (home_id, user_id, role)
  VALUES (NEW.id, NEW.user_id, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_home_created
  AFTER INSERT ON public.homes
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_home_owner();

-- Add existing home owners as members
INSERT INTO public.home_members (home_id, user_id, role)
SELECT id, user_id, 'owner' FROM public.homes
ON CONFLICT (home_id, user_id) DO NOTHING;
