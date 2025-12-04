-- Create enum for user roles if not exists
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'field_agent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create header_details table for company branding
CREATE TABLE IF NOT EXISTS public.header_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'Loan Verification Agency',
  address text DEFAULT '',
  contact_email text DEFAULT '',
  logo_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create field_inspection_reports table
CREATE TABLE IF NOT EXISTS public.field_inspection_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  loan_ac_no text NOT NULL,
  customer_name text NOT NULL,
  loan_amount numeric NOT NULL DEFAULT 0,
  location text NOT NULL DEFAULT '',
  region text NOT NULL DEFAULT '',
  lar_remarks text DEFAULT '',
  state text NOT NULL DEFAULT '',
  payment_status text NOT NULL DEFAULT 'pending',
  invoice_status text NOT NULL DEFAULT 'pending',
  created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payout_reports table
CREATE TABLE IF NOT EXISTS public.payout_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL,
  financier text NOT NULL,
  loan_amount numeric NOT NULL DEFAULT 0,
  payout_percentage numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  less_tds numeric NOT NULL DEFAULT 0,
  nett numeric NOT NULL DEFAULT 0,
  bank_details text DEFAULT '',
  pan text DEFAULT '',
  sm_name text DEFAULT '',
  contact_no text DEFAULT '',
  mail_sent text NOT NULL DEFAULT 'No',
  payment_status text NOT NULL DEFAULT 'pending',
  created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.header_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_inspection_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_reports ENABLE ROW LEVEL SECURITY;

-- Header details policies (admin only can edit, everyone can view)
CREATE POLICY "Anyone can view header details" ON public.header_details FOR SELECT USING (true);
CREATE POLICY "Admins can manage header details" ON public.header_details FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Field inspection reports policies
CREATE POLICY "Admins can view all inspection reports" ON public.field_inspection_reports FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own inspection reports" ON public.field_inspection_reports FOR SELECT USING (auth.uid() = created_by_user_id);
CREATE POLICY "Users can create inspection reports" ON public.field_inspection_reports FOR INSERT WITH CHECK (auth.uid() = created_by_user_id);
CREATE POLICY "Admins can update any inspection report" ON public.field_inspection_reports FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own inspection reports" ON public.field_inspection_reports FOR UPDATE USING (auth.uid() = created_by_user_id);
CREATE POLICY "Admins can delete inspection reports" ON public.field_inspection_reports FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Payout reports policies
CREATE POLICY "Admins can view all payout reports" ON public.payout_reports FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own payout reports" ON public.payout_reports FOR SELECT USING (auth.uid() = created_by_user_id);
CREATE POLICY "Users can create payout reports" ON public.payout_reports FOR INSERT WITH CHECK (auth.uid() = created_by_user_id);
CREATE POLICY "Admins can update any payout report" ON public.payout_reports FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own payout reports" ON public.payout_reports FOR UPDATE USING (auth.uid() = created_by_user_id);
CREATE POLICY "Admins can delete payout reports" ON public.payout_reports FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Insert default header details
INSERT INTO public.header_details (company_name, address, contact_email) 
VALUES ('Loan Verification Agency', '123 Business Street, City', 'contact@loanverify.com')
ON CONFLICT DO NOTHING;

-- Add triggers for updated_at
CREATE TRIGGER update_header_details_updated_at BEFORE UPDATE ON public.header_details FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_field_inspection_reports_updated_at BEFORE UPDATE ON public.field_inspection_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_payout_reports_updated_at BEFORE UPDATE ON public.payout_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();