# Nurse Page Testing Checklist

## Prerequisites
- [ ] Database has patients with prescriptions containing pre-approved medicines
- [ ] n8n webhook URL is configured in environment variables
- [ ] Nurse role is set up in Clerk authentication
- [ ] User is logged in with Nurse role

## Test Cases

### 1. Page Load
- [ ] Navigate to `/nurse` page
- [ ] Verify header shows "Nurse Dashboard" with green gradient
- [ ] Verify search bar is visible
- [ ] Verify placeholder text: "Enter patient name or email..."
- [ ] Verify empty state message is displayed

### 2. Patient Search

#### 2.1 Search by Email
- [ ] Enter a valid patient email
- [ ] Click "Search" button
- [ ] Verify patient card appears with correct information
- [ ] Verify patient name, email, and order count are displayed

#### 2.2 Search by Name
- [ ] Enter a patient name (partial match should work)
- [ ] Click "Search" button
- [ ] Verify matching patients appear
- [ ] Verify case-insensitive search works

#### 2.3 No Results
- [ ] Enter a non-existent email/name
- [ ] Click "Search" button
- [ ] Verify error message: "No patients found matching your search"

#### 2.4 Clear Search
- [ ] Perform a search with results
- [ ] Click "Clear" button
- [ ] Verify search results are cleared
- [ ] Verify search input is cleared

### 3. Pre-Approved Medicines Modal

#### 3.1 Modal Opening
- [ ] Click on a patient card
- [ ] Verify full-page modal opens
- [ ] Verify modal shows patient name in header
- [ ] Verify loading spinner appears initially

#### 3.2 Medicines Display
- [ ] Wait for medicines to load
- [ ] Verify list of pre-approved medicines appears
- [ ] Verify each medicine has a checkbox
- [ ] Verify selection counter shows "0 of X medicine(s) selected"

#### 3.3 Medicine Search/Filter
- [ ] Enter text in medicine search bar
- [ ] Verify medicines are filtered in real-time
- [ ] Verify case-insensitive filtering
- [ ] Clear search and verify all medicines reappear

#### 3.4 Medicine Selection
- [ ] Check one medicine
- [ ] Verify selection counter updates
- [ ] Check multiple medicines
- [ ] Verify counter shows correct count
- [ ] Uncheck a medicine
- [ ] Verify counter decrements

#### 3.5 No Pre-Approved Medicines
- [ ] Click on a patient with no pre-approved medicines
- [ ] Verify error message: "No pre-approved medicines found for this patient..."
- [ ] Verify "Close" button is available

#### 3.6 Modal Closing
- [ ] Click X button in header
- [ ] Verify modal closes
- [ ] Click "Cancel" button
- [ ] Verify modal closes

### 4. Submission Form

#### 4.1 Form Display
- [ ] Select at least one medicine
- [ ] Click "Continue" button
- [ ] Verify submission form appears
- [ ] Verify selected medicines summary is shown
- [ ] Verify nurse name field is present
- [ ] Verify notes field is present

#### 4.2 Validation
- [ ] Try to submit without entering nurse name
- [ ] Verify error message appears
- [ ] Try to continue without selecting medicines
- [ ] Verify error message: "Please select at least one medicine to prescribe"

#### 4.3 Back Navigation
- [ ] Click "Back" button
- [ ] Verify form returns to medicine selection
- [ ] Verify selected medicines are still checked

#### 4.4 Successful Submission
- [ ] Enter nurse name
- [ ] Optionally enter notes
- [ ] Click "Submit Prescription"
- [ ] Verify loading state (button shows "Submitting...")
- [ ] Verify success message appears
- [ ] Verify modal closes after 2 seconds

#### 4.5 Failed Submission
- [ ] Simulate API failure (disconnect network or stop n8n)
- [ ] Try to submit
- [ ] Verify error message is displayed
- [ ] Verify modal stays open
- [ ] Verify user can retry

### 5. n8n Integration

#### 5.1 Payload Verification
- [ ] Check n8n webhook receives the submission
- [ ] Verify `orderId` is present
- [ ] Verify `customerEmail` is present
- [ ] Verify `doctorName` contains "(Nurse)"
- [ ] Verify `medicines` array contains selected medicines
- [ ] Verify each medicine has `name`, `quantity`, `description`
- [ ] Verify `doctorNotes` has default message or custom notes
- [ ] Verify `signaturePdf` is empty string
- [ ] Verify `preApprovedMedicines` is empty array
- [ ] Verify health assessment fields are included

#### 5.2 n8n Workflow
- [ ] Verify n8n workflow processes the prescription
- [ ] Verify prescription PDF is generated
- [ ] Verify email is sent to patient (if configured)
- [ ] Verify no errors in n8n logs

### 6. Edge Cases

#### 6.1 Multiple Patients
- [ ] Search returns multiple patients
- [ ] Click different patient cards
- [ ] Verify correct medicines load for each patient

#### 6.2 Long Medicine Names
- [ ] Test with medicines that have very long names
- [ ] Verify UI doesn't break
- [ ] Verify text wraps properly

#### 6.3 Many Medicines
- [ ] Test with patient having 20+ pre-approved medicines
- [ ] Verify scrolling works in modal
- [ ] Verify search/filter helps find medicines

#### 6.4 Special Characters
- [ ] Test search with special characters in name/email
- [ ] Verify search handles them correctly

#### 6.5 Concurrent Sessions
- [ ] Open nurse page in two browser tabs
- [ ] Submit prescription in one tab
- [ ] Verify other tab still works correctly

### 7. UI/UX

#### 7.1 Responsive Design
- [ ] Test on desktop (1920x1080)
- [ ] Test on laptop (1366x768)
- [ ] Test on tablet (768x1024)
- [ ] Verify modal is responsive

#### 7.2 Accessibility
- [ ] Tab through form fields
- [ ] Verify focus indicators are visible
- [ ] Test with screen reader (if available)

#### 7.3 Visual Feedback
- [ ] Verify hover states on buttons
- [ ] Verify loading spinners appear during async operations
- [ ] Verify success/error messages are clearly visible

## Known Limitations

1. **Signature**: Nurses cannot add signatures (by design)
2. **Quantity**: All medicines default to quantity "1"
3. **Description**: All medicines use default description
4. **Order Selection**: Uses most recent order for patient
5. **Pre-Approved Aggregation**: Combines medicines from all prescriptions

## Troubleshooting

### Modal doesn't open
- Check browser console for errors
- Verify `/api/prescriptions` endpoint is working
- Check database connection

### No medicines appear
- Verify patient has prescriptions with pre_approved_medicines
- Check database: `SELECT pre_approved_medicines FROM prescriptions WHERE customer_id = X`
- Verify JSON parsing is working

### Submission fails
- Check n8n webhook URL in environment variables
- Verify n8n workflow is active
- Check network tab for API errors
- Verify `/api/submit` endpoint is working

### Search returns no results
- Verify patients exist in database
- Check `/api/search` endpoint
- Verify search query is being sent correctly

