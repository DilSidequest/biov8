-- Migration: Add pre_approved_medicines column and remove clinic_state
-- Date: 2025-11-26
-- Description: 
--   1. Add pre_approved_medicines column to store JSON array of medicines
--   2. Remove clinic_state column as it's no longer needed

-- Add pre_approved_medicines column
ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS pre_approved_medicines TEXT;

-- Remove clinic_state column
ALTER TABLE prescriptions 
DROP COLUMN IF EXISTS clinic_state;

-- Add comment to the new column
COMMENT ON COLUMN prescriptions.pre_approved_medicines IS 'JSON array of medicine names that are pre-approved for future prescriptions without requiring additional doctor approval';

