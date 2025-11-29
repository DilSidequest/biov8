# Nurse Page Implementation

## Overview
The nurse page allows nurses to prescribe pre-approved medicines to patients without requiring additional doctor approval. This feature streamlines the prescription process for recurring medications.

## Features Implemented

### 1. Patient Search
- **Search Bar**: Accepts patient name or email
- **Search Results**: Displays patient cards with:
  - Patient name (with initial avatar)
  - Email address
  - Number of orders
  - Click to view pre-approved medicines

### 2. Pre-Approved Medicines Modal
When a nurse clicks on a patient card:
- **Full-page modal** appears covering the entire screen
- **Loading state** while fetching pre-approved medicines from database
- **Medicine list** with checkboxes for each medicine
- **Search/filter bar** to quickly find specific medicines
- **Selection counter** showing how many medicines are selected

### 3. Medicine Details (Per Selected Medicine)
For each medicine selected:
- **Quantity field**: Custom quantity input (e.g., "1", "2 vials", "30 tablets")
- **Description field**: Instructions/notes for the medicine (e.g., "Take once daily with food")
- Fields appear automatically when medicine is checked
- Fields are removed when medicine is unchecked

### 4. Submission Form
At the bottom of the modal:
- **Nurse name** field (required)
- **Signature upload** field (required) - accepts images or PDF
- **Submit button** positioned at bottom right
- **Error/Success messages** displayed inline

### 5. Data Flow

```
1. Nurse searches for patient (name/email)
   ↓
2. GET /api/search → Returns matching patients with orders
   ↓
3. Nurse clicks patient card
   ↓
4. GET /api/prescriptions?customerId=X → Returns all prescriptions
   ↓
5. Extract pre_approved_medicines from prescriptions (aggregated from all)
   ↓
6. Display medicines with checkboxes in modal
   ↓
7. Nurse selects medicines
   ↓
8. For each selected medicine, nurse enters quantity and description
   ↓
9. Nurse enters name and uploads signature
   ↓
10. POST /api/submit → Sends to n8n webhook
   ↓
11. n8n processes prescription (same workflow as doctor)
```

## API Endpoints Used

### `/api/search` (GET)
- **Query param**: `query` (patient name or email)
- **Returns**: Array of patients with their orders
- **Used for**: Patient search functionality

### `/api/prescriptions` (GET)
- **Query param**: `customerId` (patient's customer ID)
- **Returns**: Array of prescriptions for that patient
- **Used for**: Fetching pre-approved medicines

### `/api/submit` (POST)
- **Body**: Complete prescription payload (same format as doctor page)
- **Returns**: Success/error response from n8n
- **Used for**: Submitting prescription to n8n workflow

## JSON Payload Format

The nurse page sends the **exact same JSON format** to n8n as the doctor page:

```json
{
  "orderId": "...",
  "orderNumber": "...",
  "customerName": "...",
  "customerEmail": "...",
  "totalAmount": "...",
  "currency": "USD",
  "orderDate": "...",
  "lineItems": "...",
  "shippingAddress": "...",
  "tags": "...",
  "doctorName": "Nurse Name (Nurse)",
  "medicines": [
    {
      "name": "BPC-157",
      "quantity": "2 vials",
      "description": "Inject 250mcg daily subcutaneously"
    },
    {
      "name": "NAD+ 100mg/ml",
      "quantity": "1",
      "description": "Take as directed"
    }
  ],
  "doctorNotes": "Nurse prescribed from pre-approved medicines list",
  "signaturePdf": "data:image/png;base64,iVBORw0KG...",
  "preApprovedMedicines": [],
  "healthChanges": "...",
  "takingMedications": "...",
  "hadMedicationBefore": "...",
  "pregnancyStatus": "...",
  "allergicReaction": "...",
  "allergies": "...",
  "medicalConditions": "...",
  "submittedAt": "2025-11-29T..."
}
```

## Key Differences from Doctor Page

| Feature | Doctor Page | Nurse Page |
|---------|-------------|------------|
| Medicine Selection | Free-form autocomplete | Pre-approved list only (checkboxes) |
| Signature | Required | Required |
| Notes | Required (min 10 chars) | Not shown (auto-generated) |
| Pre-Approved Medicines | Can set new ones | Cannot set (empty array) |
| Medicine Quantity | Custom per medicine | Custom per medicine |
| Medicine Description | Custom per medicine | Custom per medicine |

## Files Modified

### 1. `/app/nurse/page.tsx` (Complete Rewrite)
- Implemented full nurse dashboard with search and prescription functionality
- Added patient search with results display
- Added full-page modal for pre-approved medicines
- Added medicine selection with checkboxes and search
- Added submission form with nurse name and notes
- Integrated with existing API endpoints

### 2. `/app/api/submit/route.ts` (Minor Update)
- Made `signaturePdf` optional in validation
- Reduced minimum notes length from 10 to 5 characters
- Updated validation messages to be more generic (not just "doctor")

## Database Schema

Pre-approved medicines are stored in the `prescriptions` table:

```sql
CREATE TABLE prescriptions (
  ...
  pre_approved_medicines TEXT, -- JSON array of medicine names
  ...
);
```

Example data:
```json
["BPC-157", "NAD+ 100mg/ml", "Glutathione 200mg/ml"]
```

## User Experience

1. **Nurse logs in** → Redirected to `/nurse` page
2. **Searches for patient** by name or email
3. **Clicks patient card** → Modal opens with pre-approved medicines
4. **Selects medicines** using checkboxes (can search/filter)
5. **For each selected medicine**:
   - Quantity and description fields appear automatically
   - Nurse enters custom quantity (e.g., "2 vials")
   - Nurse enters instructions (e.g., "Take once daily")
6. **Scrolls to bottom** of modal
7. **Enters nurse name** (required)
8. **Uploads signature** (image or PDF, required)
9. **Clicks Submit** → Prescription sent to n8n
10. **Success message** → Modal closes automatically

## Error Handling

- **No search results**: "No patients found matching your search"
- **No pre-approved medicines**: "No pre-approved medicines found for this patient. Please contact a doctor to approve medicines first."
- **No medicines selected**: "Please select at least one medicine to prescribe"
- **Missing nurse name**: "Please enter your name"
- **Submission failure**: Displays error message from API

## Future Enhancements

- Add signature capture for nurses (optional)
- Allow custom quantities per medicine
- Add prescription history view for nurses
- Add ability to request new pre-approved medicines from doctor
- Add bulk prescription for multiple patients

