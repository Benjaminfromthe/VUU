-- ============================================================================
-- VUU TRANSPORT - ACCOUNTABILITY LEDGER DDL AND TRIGGER AUTOMATIONS
-- Calculates Average Profile Rating on new Rating entries seamlessly.
-- ============================================================================

-- 1. Create safety_logs, ratings, and complaints tables if they don't already exist
CREATE TABLE IF NOT EXISTS public.safety_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL,
    sender_name TEXT,
    sender_phone TEXT,
    sender_role TEXT CHECK (sender_role IN ('rider', 'driver', 'customer', 'admin')),
    ride_id UUID,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    is_simulated BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active_emergency',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id TEXT, -- Can represent standard ride id strings
    rater_id UUID,
    driver_id UUID,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.complaints (
    id TEXT PRIMARY KEY,
    ride_id TEXT NOT NULL,
    complainant_id UUID NOT NULL,
    issue_type TEXT,
    description TEXT,
    status TEXT CHECK (status IN ('pending', 'resolved')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure profiles table has rating columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 5.00;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS num_ratings INTEGER DEFAULT 1;

-- 2. CREATE A DATABASE TRIGGER FUNCTION FOR DYNAMIC RATING RECALCULATION
CREATE OR REPLACE FUNCTION public.calculate_average_recipient_rating()
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
DECLARE
    avg_score NUMERIC(3, 2);
    total_ratings INTEGER;
BEGIN
    -- Only evaluate if driver_id is specified
    IF NEW.driver_id IS NOT NULL THEN
        -- Calculate average rating and count of ratings for the target driver
        SELECT COALESCE(AVG(rating), 5.0), COUNT(*)
        INTO avg_score, total_ratings
        FROM public.ratings
        WHERE driver_id = NEW.driver_id;

        -- Update the profiles table with the recalculated scores
        UPDATE public.profiles
        SET 
            rating = ROUND(avg_score, 2),
            num_ratings = total_ratings
        WHERE id = NEW.driver_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. LINK FUNCTION TO EXECUTABLE ROW-LEVEL TRIGGER ON NEW RATINGS ROW INSERTION
DROP TRIGGER IF EXISTS trigger_recalculate_recipient_rating ON public.ratings;
CREATE TRIGGER trigger_recalculate_recipient_rating
AFTER INSERT OR UPDATE ON public.ratings
FOR EACH ROW
EXECUTE FUNCTION public.calculate_average_recipient_rating();

-- Create Indexes for blazing-fast lookup speeds
CREATE INDEX IF NOT EXISTS idx_ratings_driver_id ON public.ratings(driver_id);
CREATE INDEX IF NOT EXISTS idx_complaints_complainant ON public.complaints(complainant_id);
