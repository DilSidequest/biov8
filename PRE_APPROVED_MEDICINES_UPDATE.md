# Pre-Approved Medicines Feature - Update Summary

## Overview
Added a new "Pre-Approved Medicines" feature that allows doctors to pre-approve specific medicines for patients. This enables nurses to prescribe these medicines in the future without requiring additional doctor approval. Also removed the "Clinic State" field as it's no longer needed.

## Changes Made

### 1. Frontend Component (`components/OrderDetails.tsx`)

#### Removed Clinic State Field
- Removed `clinicState` state variable
- Removed clinic state input field from the form
- Removed clinic state validation
- Removed clinic state from form submission payload

#### Added Pre-Approved Medicines Feature

**New State:**
```typescript
const [preApprovedMedicines, setPreApprovedMedicines] = useState<string[]>([]);
```

**New UI Section:**
- Added a new section after the medicines section with checkboxes for all medicines
- Displays medicines in a 3-column grid layout
- Filters out non-medicine items (bundles, programs, stacks, etc.)
- Shows count of selected pre-approved medicines
- Scrollable list with max height of 96 (24rem)

**Filtered Items:**
The following types of items are excluded from the pre-approved medicines list:
- Items containing "bundle"
- Items containing "program"
- Items containing "stack"
- Items containing "welcome"
- Items containing "tips"
- Items containing "sharps"
- Items containing "container"

**Note:** The medicine name autocomplete dropdown still shows ALL items from the JSON, including bundles and programs. Only the pre-approved medicines checkboxes are filtered.

### 2. Database Schema (`lib/db/schema.sql`)

**Removed:**
```sql
clinic_state VARCHAR(100),
```

**Added:**
```sql
-- Pre-approved medicines for future prescriptions (stored as JSON array)
pre_approved_medicines TEXT,
```

### 3. API Routes

#### `/app/api/submit/route.ts`
- Removed `clinicState` from request body destructuring
- Added `preApprovedMedicines` to request body
- Removed `clinicState` from webhook payload
- Added `preApprovedMedicines` to webhook payload

#### `/app/api/prescriptions/route.ts`
- Removed `clinic_state` from INSERT query
- Added `pre_approved_medicines` to INSERT query
- Converts `preApprovedMedicines` array to JSON string before storing
- Stores as NULL if no medicines are pre-approved

### 4. Database Migration

**File:** `lib/db/migrations/002_add_pre_approved_medicines.sql`

```sql
-- Add pre_approved_medicines column
ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS pre_approved_medicines TEXT;

-- Remove clinic_state column
ALTER TABLE prescriptions 
DROP COLUMN IF EXISTS clinic_state;
```

## How to Apply Changes

### 1. Run Database Migration

Connect to your NeonDB database and run the migration:

```bash
psql <your-neon-connection-string> -f lib/db/migrations/002_add_pre_approved_medicines.sql
```

Or run it directly in your NeonDB console:

```sql
ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS pre_approved_medicines TEXT;

ALTER TABLE prescriptions 
DROP COLUMN IF EXISTS clinic_state;
```

### 2. Update n8n Workflow (if needed)

If your n8n workflow uses `clinicState`, you'll need to update it:

**Remove references to:**
- `clinicState`

**Add handling for:**
- `preApprovedMedicines` (array of strings)

Example in n8n Code node:
```javascript
const preApprovedMedicines = $input.item.json.preApprovedMedicines || [];

// Generate HTML list of pre-approved medicines
let preApprovedHtml = '';
if (preApprovedMedicines.length > 0) {
  preApprovedHtml = '<ul>' + 
    preApprovedMedicines.map(med => `<li>${med}</li>`).join('') + 
    '</ul>';
} else {
  preApprovedHtml = '<p>None</p>';
}

return {
  ...$input.item.json,
  preApprovedMedicinesHtml: preApprovedHtml
};
```

## How It Works

1. **Doctor fills out prescription form** as usual
2. **After adding prescribed medicines**, doctor scrolls to the "Pre-Approved Medicines" section
3. **Doctor checks medicines** that the patient can receive in future without approval
4. **Form is submitted** with both prescribed medicines and pre-approved medicines
5. **Data is saved** to database:
   - Prescribed medicines: stored in `medicine_description` as JSON array
   - Pre-approved medicines: stored in `pre_approved_medicines` as JSON array
6. **Nurses can reference** the pre-approved medicines list for future prescriptions

## Benefits

- **Faster service**: Nurses can prescribe pre-approved medicines without waiting for doctor approval
- **Better patient care**: Patients can get recurring medicines more quickly
- **Reduced workload**: Doctors don't need to approve every refill
- **Audit trail**: Pre-approved medicines are stored in the database for compliance

## Data Format

Pre-approved medicines are stored as a JSON array string:

```json
["BPC-157", "NAD+ 100mg/ml x 10ml", "Glutathione 200mg/ml"]
```

To retrieve in your application:
```javascript
const preApproved = JSON.parse(prescription.pre_approved_medicines || '[]');
```

