# Doctor vs Nurse Workflow Comparison

## Overview
This document compares the doctor and nurse prescription workflows to highlight similarities and differences.

## Side-by-Side Comparison

| Feature | Doctor Workflow | Nurse Workflow |
|---------|----------------|----------------|
| **Page Route** | `/doctor` | `/nurse` |
| **Header Color** | Blue gradient | Green gradient |
| **Search Method** | Search by email/name | Search by email/name |
| **Patient Selection** | Click patient card | Click patient card |
| **Medicine Selection** | Free-form autocomplete from full medicine list | Checkboxes from pre-approved medicines only |
| **Bundle Support** | Yes - can select bundles and choose constituent medicines | No - only individual medicines |
| **Medicine Quantity** | Custom per medicine | Default "1" for all |
| **Medicine Description** | Custom per medicine | Default message |
| **Signature** | Required (PDF/image upload) | Not required (empty string) |
| **Doctor/Nurse Name** | Required | Required (marked as "Nurse") |
| **Notes** | Required (min 10 chars) | Optional (default message) |
| **Pre-Approved Medicines** | Can set new ones for future | Cannot set (empty array) |
| **Health Assessment** | Filled from order data | Passed through from order data |
| **Submission Endpoint** | `/api/submit` | `/api/submit` (same) |
| **n8n Webhook** | Same webhook | Same webhook |
| **JSON Format** | Standard format | Same format |

## Workflow Diagrams

### Doctor Workflow
```
1. Search patient
2. Select patient/order
3. View order details and health assessment
4. Add medicines (free-form, can use bundles)
5. Set quantities and descriptions per medicine
6. Select pre-approved medicines for future
7. Fill health assessment form
8. Add doctor notes
9. Upload signature
10. Submit → n8n → Prescription generated
```

### Nurse Workflow
```
1. Search patient
2. Select patient
3. View pre-approved medicines (from previous prescriptions)
4. Select medicines from pre-approved list
5. Enter nurse name
6. Optionally add notes
7. Submit → n8n → Prescription generated
```

## Permission Model

### Doctor Permissions
- ✅ Can prescribe any medicine from the full catalog
- ✅ Can use bundles and select constituent medicines
- ✅ Can set custom quantities and descriptions
- ✅ Can approve medicines for future nurse prescriptions
- ✅ Can fill complete health assessment
- ✅ Must provide signature

### Nurse Permissions
- ✅ Can prescribe only pre-approved medicines
- ❌ Cannot prescribe medicines not pre-approved by doctor
- ❌ Cannot use bundles
- ❌ Cannot set custom quantities (defaults to "1")
- ❌ Cannot approve new medicines for future
- ❌ Does not fill health assessment (uses existing data)
- ❌ Does not need to provide signature

## Data Flow Comparison

### Doctor Data Flow
```
Shopify Order → n8n → /api/receive-order → Database
                                              ↓
Doctor searches → /api/search → Display patient
                                              ↓
Doctor fills form → /api/submit → n8n → Prescription PDF
                         ↓
                   Database (prescriptions table with pre_approved_medicines)
```

### Nurse Data Flow
```
Nurse searches → /api/search → Display patient
                                      ↓
Nurse clicks patient → /api/prescriptions → Get pre_approved_medicines
                                      ↓
Nurse selects medicines → /api/submit → n8n → Prescription PDF
```

## Database Interaction

### Doctor
- **Reads**: Orders, customer data
- **Writes**: Prescriptions (including pre_approved_medicines)

### Nurse
- **Reads**: Orders, customer data, prescriptions (for pre_approved_medicines)
- **Writes**: None directly (n8n may write prescription records)

## n8n Payload Differences

### Doctor Payload Example
```json
{
  "doctorName": "Dr. Smith",
  "medicines": [
    {
      "name": "BPC-157",
      "quantity": "2 vials",
      "description": "Inject 250mcg daily"
    }
  ],
  "doctorNotes": "Patient shows good progress...",
  "signaturePdf": "data:image/png;base64,iVBORw0KG...",
  "preApprovedMedicines": ["BPC-157", "NAD+", "Glutathione"]
}
```

### Nurse Payload Example
```json
{
  "doctorName": "Jane Doe (Nurse)",
  "medicines": [
    {
      "name": "BPC-157",
      "quantity": "1",
      "description": "Prescribed from pre-approved medicines"
    }
  ],
  "doctorNotes": "Nurse prescribed from pre-approved medicines list",
  "signaturePdf": "",
  "preApprovedMedicines": []
}
```

## Use Cases

### When to Use Doctor Workflow
- ✅ New patient prescriptions
- ✅ Complex prescriptions with multiple medicines
- ✅ Prescriptions requiring bundles
- ✅ Setting up pre-approved medicines for future
- ✅ Prescriptions requiring detailed notes and signature
- ✅ First-time prescriptions for a medicine

### When to Use Nurse Workflow
- ✅ Refill prescriptions for existing patients
- ✅ Routine prescriptions from pre-approved list
- ✅ Quick prescriptions without doctor availability
- ✅ Prescriptions that don't require new medical assessment
- ✅ Emergency refills for pre-approved medicines

## Security Considerations

### Doctor
- Must be authenticated with Doctor role
- Can access all patient data
- Can prescribe any medicine
- Signature required for audit trail

### Nurse
- Must be authenticated with Nurse role
- Can access all patient data
- Can only prescribe pre-approved medicines
- No signature required (pre-approval serves as authorization)

## Future Enhancements

### Doctor Workflow
- [ ] Add prescription templates
- [ ] Add favorite medicines list
- [ ] Add prescription history view
- [ ] Add ability to modify pre-approved medicines

### Nurse Workflow
- [ ] Add optional signature capture
- [ ] Add custom quantities per medicine
- [ ] Add ability to request new pre-approved medicines
- [ ] Add prescription history view
- [ ] Add bulk prescriptions for multiple patients
- [ ] Add medicine notes/instructions

## Benefits of Two-Tier System

1. **Efficiency**: Nurses can handle routine refills without doctor involvement
2. **Safety**: Nurses can only prescribe pre-approved medicines
3. **Compliance**: Doctor pre-approval provides audit trail
4. **Scalability**: Reduces doctor workload for routine prescriptions
5. **Patient Care**: Faster service for routine medications
6. **Flexibility**: Doctors maintain control over what can be prescribed

## Workflow Integration

Both workflows integrate seamlessly:
1. Doctor prescribes initial medicines and sets pre-approved list
2. Nurse can prescribe from pre-approved list for refills
3. If patient needs new medicine, nurse contacts doctor
4. Doctor adds new medicine to pre-approved list
5. Nurse can then prescribe the new medicine in future

This creates a collaborative workflow that balances efficiency with safety.

