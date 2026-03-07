-- Track hints used per submission for server-side hint penalty enforcement
-- Previously hint penalties were only tracked client-side

ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS hints_used integer DEFAULT 0;
