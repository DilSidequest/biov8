# Bundle Medicine Selection Feature

## Overview
This feature allows doctors to select bundles or programs (like "Ultimate Bundle", "Crossfit Bundle", etc.) in the medicine field, and then choose which specific medicines from that bundle to prescribe.

## How It Works

### 1. Bundle Contents Data
- All bundle definitions are stored in `lib/bundle_contents.json`
- Each bundle maps to an array of medicine names
- Example:
  ```json
  {
    "bundle_contents": {
      "Muscle Health Bundle": [
        "CJC 1295 + GHRP2",
        "BIOTESTX",
        "Urolithin A"
      ]
    }
  }
  ```

### 2. User Interface Flow

#### Step 1: Select Bundle
- Doctor types or selects a bundle name in the "Medicine Name" field
- Bundles are now included in the autocomplete suggestions
- Examples: "Ultimate Bundle", "Crossfit Bundle", "Weight Loss Active Bundle"

#### Step 2: Choose Medicines
- When a bundle is detected, a yellow-highlighted section appears below the medicine name field
- This section displays all medicines contained in that bundle
- Each medicine has a checkbox next to it
- Doctor can select one or more medicines from the bundle

#### Step 3: Fill Other Details
- Doctor fills in the quantity and description fields
- These apply to all selected medicines from the bundle

#### Step 4: Submit
- When the form is submitted, the bundle entry is automatically expanded
- Each checked medicine becomes a separate prescription entry
- All selected medicines inherit the same quantity and description from the bundle entry

### 3. Data Structure

#### Before Submission (in UI):
```javascript
medicines = [
  {
    name: "Ultimate Bundle",
    quantity: "1 kit",
    description: "Take as directed"
  }
]

bundleSelections = {
  0: ["CJC 1295/Ipamorelin", "AOD-9604", "Urolithin A"]
}
```

#### After Submission (sent to API):
```javascript
medicines = [
  {
    name: "CJC 1295/Ipamorelin",
    quantity: "1 kit",
    description: "Take as directed"
  },
  {
    name: "AOD-9604",
    quantity: "1 kit",
    description: "Take as directed"
  },
  {
    name: "Urolithin A",
    quantity: "1 kit",
    description: "Take as directed"
  }
]
```

### 4. Validation
- If a bundle is selected, at least one medicine from it must be checked
- Error message: "Medicine X: Please select at least one medicine from the bundle [Bundle Name]"

### 5. Key Features
- **Automatic Detection**: System automatically detects if a medicine name is a bundle
- **Visual Feedback**: Bundle selection UI is highlighted in yellow with an icon
- **Selection Counter**: Shows how many medicines are selected from the bundle
- **Maintains Format**: Final JSON array maintains the same format for HTML row generation
- **Clean Data**: Only actual medicine names are sent to the prescription generator, not bundle names

## Technical Implementation

### Files Modified
1. **lib/bundle_contents.json** (NEW)
   - Contains all bundle definitions

2. **components/OrderDetails.tsx**
   - Added `bundleSelections` state to track selected medicines per bundle
   - Added helper functions: `isBundle()`, `getBundleContents()`, `toggleBundleMedicine()`
   - Added bundle selection UI with checkboxes
   - Modified form submission to expand bundles into individual medicines
   - Updated validation to require at least one medicine selection for bundles
   - Updated medicine filtering to include bundles in autocomplete

### State Management
- `bundleSelections`: `Record<number, string[]>`
  - Key: medicine index in the medicines array
  - Value: array of selected medicine names from that bundle
- Automatically cleared when:
  - Medicine name is changed
  - Medicine is removed
  - Form is reset

## Benefits
1. **Efficiency**: Doctors can quickly prescribe multiple medicines from a bundle
2. **Flexibility**: Doctors can choose which medicines from a bundle to prescribe
3. **Accuracy**: Reduces typing errors by selecting from predefined lists
4. **Compatibility**: Maintains existing JSON format for prescription generation
5. **User-Friendly**: Clear visual indication of bundle contents and selections

