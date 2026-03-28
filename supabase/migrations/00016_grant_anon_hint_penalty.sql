-- Grant anon SELECT on columns added after the initial column grant in 00005
-- hint_penalty was added in 00008 but never granted to anon,
-- causing player UI to receive null for hint penalty display.
-- explanation and difficulty are only used server-side so not granted.

GRANT SELECT (hint_penalty) ON public.challenges TO anon;
