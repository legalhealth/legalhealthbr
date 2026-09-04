GRANT UPDATE ON public.ambassador_applications TO authenticated;

CREATE POLICY "Admins atualizam candidaturas"
  ON public.ambassador_applications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));