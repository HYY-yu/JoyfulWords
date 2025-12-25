-- Add user_id column to materials table
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS materials_user_id_idx ON public.materials(user_id);

-- Drop existing policies (if any exist)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.materials;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.materials;
DROP POLICY IF EXISTS "Users can update own profile." ON public.materials;

-- Create new RLS policies for materials
CREATE POLICY "Authenticated users can view materials"
ON public.materials FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert materials"
ON public.materials FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update own materials"
ON public.materials FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own materials"
ON public.materials FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Revoke anon permissions to ensure only authenticated users can access
REVOKE ALL ON TABLE public.materials FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
