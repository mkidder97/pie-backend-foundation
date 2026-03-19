-- Allow inserts
CREATE POLICY "Allow insert on pie_episodes"
  ON public.pie_episodes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow insert on pie_creators"
  ON public.pie_creators FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow insert on pie_chunks"
  ON public.pie_chunks FOR INSERT
  WITH CHECK (true);

-- Allow updates
CREATE POLICY "Allow update on pie_episodes"
  ON public.pie_episodes FOR UPDATE
  USING (true);