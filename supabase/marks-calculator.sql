-- ============================================
-- WBJEE MARKS CALCULATOR LEADERBOARD SCHEMA
-- Supabase PostgreSQL Schema
-- ============================================

CREATE TABLE IF NOT EXISTS public.marks_submissions (
    id BIGSERIAL PRIMARY KEY,
    
    -- Candidate Info
    nickname TEXT NOT NULL,
    application_number TEXT NOT NULL, -- SHA-256 hashed application number for uniqueness & anonymity
    
    -- Exam configuration
    exam_type TEXT NOT NULL DEFAULT 'both', -- 'both' (Engineering: 200 max) or 'physics_chemistry' (Pharmacy: 100 max)
    math_set TEXT,          -- 'A', 'B', 'C', 'D' or null
    phy_chem_set TEXT,      -- 'A', 'B', 'C', 'D'
    
    -- Scores
    math_score NUMERIC(5, 2),
    phy_chem_score NUMERIC(5, 2),
    total_score NUMERIC(5, 2) NOT NULL,
    
    -- Response details (stores question-wise answers)
    math_responses JSONB,
    phy_chem_responses JSONB,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index to prevent duplicate submissions per application number
CREATE UNIQUE INDEX IF NOT EXISTS idx_marks_submissions_app_num 
ON public.marks_submissions(application_number);

-- Composite index for leaderboard queries sorted by exam type, score and tie-break
CREATE INDEX IF NOT EXISTS idx_marks_submissions_leaderboard 
ON public.marks_submissions(exam_type, total_score DESC, created_at ASC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.marks_submissions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to leaderboard records
DROP POLICY IF EXISTS "Public leaderboard read access" ON public.marks_submissions;
CREATE POLICY "Public leaderboard read access"
ON public.marks_submissions FOR SELECT
USING (true);

-- Restrict all client-side direct writes (anon cannot directly insert/update/delete)
-- Submissions must proceed through the verified server API (getServerSupabase service role)
DROP POLICY IF EXISTS "No direct anon insert" ON public.marks_submissions;
DROP POLICY IF EXISTS "No direct anon update" ON public.marks_submissions;
DROP POLICY IF EXISTS "No direct anon delete" ON public.marks_submissions;

-- Trigger to keep updated_at in sync
CREATE OR REPLACE FUNCTION update_marks_submissions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_marks_submissions_updated_at ON public.marks_submissions;
CREATE TRIGGER trg_marks_submissions_updated_at
BEFORE UPDATE ON public.marks_submissions
FOR EACH ROW
EXECUTE FUNCTION update_marks_submissions_timestamp();
