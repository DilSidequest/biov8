# Multiple Medicines Feature - Update Summary

## Overview
Updated the prescription form to support multiple medicines instead of just one. Doctors can now prescribe 1, 2, 3, or more medicines in a single prescription.

## Changes Made

### 1. Frontend Component (`components/OrderDetails.tsx`)

#### State Management
**Before:**
```typescript
const [medicineName, setMedicineName] = useState('');
const [medicineQuantity, setMedicineQuantity] = useState('');
const [medicineDescription, setMedicineDescription] = useState('');
```

**After:**
```typescript
const [medicines, setMedicines] = useState<Array<{
  name: string;
  quantity: string;
  description: string;
}>>([
  { name: '', quantity: '', description: '' }
]);
```

#### New Helper Functions
```typescript
// Add a new medicine field
const addMedicine = () => {
  setMedicines([...medicines, { name: '', quantity: '', description: '' }]);
};

// Remove a medicine field (minimum 1 required)
const removeMedicine = (index: number) => {
  if (medicines.length > 1) {
    setMedicines(medicines.filter((_, i) => i !== index));
  }
};

// Update a specific medicine field
const updateMedicine = (index: number, field: 'name' | 'quantity' | 'description', value: string) => {
  const updatedMedicines = [...medicines];
  updatedMedicines[index][field] = value;
  setMedicines(updatedMedicines);
};
```

#### Validation
**Before:**
```typescript
if (!medicineName || medicineName.trim().length < 2) {
  setError('Medicine name is required');
  return;
}
```

**After:**
```typescript
for (let i = 0; i < medicines.length; i++) {
  const medicine = medicines[i];
  
  if (!medicine.name || medicine.name.trim().length < 2) {
    setError(`Medicine ${i + 1}: Name is required (minimum 2 characters)`);
    return;
  }
  // ... similar for quantity and description
}
```

#### UI Changes
- **Numbered Medicine Sections**: Each medicine is labeled "Medicine 1", "Medicine 2", etc.
- **Add Medicine Button**: Green button with "+" icon to add more medicines
- **Remove Medicine Button**: Red "X" button on each medicine (except the first one)
- **Grouped Fields**: Each medicine's fields are grouped in a bordered container

### 2. API Route (`app/api/submit/route.ts`)

**Before:**
```typescript
const {
  // ...
  medicineName,
  medicineQuantity,
  medicineDescription,
  // ...
} = body;

const webhookPayload = {
  // ...
  medicineName,
  medicineQuantity,
  medicineDescription,
  // ...
};
```

**After:**
```typescript
const {
  // ...
  medicines, // Array of medicines
  // ...
} = body;

const webhookPayload = {
  // ...
  medicines, // Array with name, quantity, description for each
  // ...
};
```

### 3. n8n Webhook Payload

The webhook now receives medicines as an array:

```json
{
  "orderId": "12345",
  "customerEmail": "patient@example.com",
  "doctorName": "Dr. Smith",
  "medicines": [
    {
      "name": "Semaglutide 0.25mg",
      "quantity": "4 pens",
      "description": "Inject 0.25mg weekly for 4 weeks"
    },
    {
      "name": "Semaglutide 0.5mg",
      "quantity": "4 pens",
      "description": "Inject 0.5mg weekly for 4 weeks"
    },
    {
      "name": "Safety Needles",
      "quantity": "8 needles",
      "description": "4mm safety needles for injection"
    }
  ],
  "doctorNotes": "...",
  "signaturePdf": "..."
}
```

## User Experience

### Adding Medicines
1. Form starts with 1 empty medicine field
2. Click "Add Medicine" button to add more
3. Each new medicine is numbered (Medicine 1, Medicine 2, etc.)
4. No limit on number of medicines

### Removing Medicines
1. Each medicine (except the first) has a "Remove" button
2. Click to remove that specific medicine
3. Remaining medicines are automatically renumbered
4. Cannot remove the last medicine (minimum 1 required)

### Validation
- All medicine fields are required
- Each medicine must have:
  - Name: minimum 2 characters
  - Quantity: minimum 1 character
  - Description: minimum 5 characters
- Error messages specify which medicine has the issue (e.g., "Medicine 2: Name is required")

## Visual Design

### Medicine Container
```
┌─────────────────────────────────────────┐
│ Medicine 1                    [Remove]  │ ← Header with number and remove button
├─────────────────────────────────────────┤
│ Medicine Name *                         │
│ [Input field]                           │
│                                         │
│ Medicine Quantity *                     │
│ [Input field]                           │
│                                         │
│ Medicine Description *                  │
│ [Textarea]                              │
│ 45 characters (minimum 5)               │
└─────────────────────────────────────────┘
```

### Add Button
```
[Prescribed Medicines]          [+ Add Medicine]
```

## n8n Integration Notes

### Processing Multiple Medicines in n8n

You'll need to update your n8n workflow to handle the medicines array. Here's an example Code node:

```javascript
// In your n8n Code node
const medicines = $input.item.json.medicines;

// Generate HTML table rows for all medicines
let medicinesHtml = '';
medicines.forEach((medicine, index) => {
  medicinesHtml += `
    <tr>
      <td>${index + 1}</td>
      <td>${medicine.name}</td>
      <td>${medicine.quantity}</td>
      <td>${medicine.description}</td>
    </tr>
  `;
});

return {
  ...$input.item.json,
  medicinesHtml
};
```

### Prescription Template Update

Update your HTML template to include a numbered column:

```html
<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Medicine Name</th>
      <th>Quantity</th>
      <th>Instructions</th>
    </tr>
  </thead>
  <tbody>
    {{ $json.medicinesHtml }}
  </tbody>
</table>
```

## Benefits

1. **More Flexible**: Doctors can prescribe any number of medicines
2. **Better Organization**: Each medicine is clearly numbered and separated
3. **Easier to Manage**: Add/remove medicines without affecting others
4. **Clear Validation**: Error messages specify which medicine has issues
5. **Professional**: Numbered medicines look more organized in prescriptions

## Testing

### Test Case 1: Single Medicine
1. Fill in one medicine
2. Submit form
3. ✅ Should work as before

### Test Case 2: Multiple Medicines
1. Click "Add Medicine" 2 times (total 3 medicines)
2. Fill in all 3 medicines
3. Submit form
4. ✅ All 3 medicines should be in the payload

### Test Case 3: Remove Medicine
1. Add 3 medicines
2. Remove the 2nd medicine
3. ✅ Should have 2 medicines (1 and 3, renumbered as 1 and 2)

### Test Case 4: Validation
1. Add 2 medicines
2. Leave the 2nd medicine's name empty
3. Try to submit
4. ✅ Should show error: "Medicine 2: Name is required"

## Migration Notes

- **No database changes needed**: The medicines array is sent directly to n8n
- **Backward compatible**: Single medicine works the same way (just as an array with 1 item)
- **n8n update required**: You need to update your n8n workflow to process the medicines array instead of individual fields

