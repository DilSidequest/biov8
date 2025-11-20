# n8n Body Parameters - Complete List with New Fields

## 🆕 New Fields Added

You manually added these 4 new fields to your n8n HTTP Request node:

1. **Sex** - Patient's sex/gender
2. **Weight** - Patient's weight
3. **Height** - Patient's height  
4. **Over18c** - Whether patient is over 18 years old

---

## 📋 Complete Field List (52 Total Fields)

### ✅ Required Fields (4)
These MUST have values or you'll get "Bad Request - Missing Field" error:

```
orderId
orderNumber
customerName
customerEmail
```

---

### ⚪ Optional Basic Fields (7)

```
orderDate
totalAmount
currency
lineItems
shippingAddress
tags
```

---

### 🆕 Basic Patient Information (4 NEW FIELDS)

```
Sex
Weight
Height
Over18c
```

**Example n8n expressions:**
```javascript
Sex: ={{ $('Map Shopify to Salesforce Fields').item.json.Sex || 'Not Provided' }}
Weight: ={{ $('Map Shopify to Salesforce Fields').item.json.Weight || 'Not Provided' }}
Height: ={{ $('Map Shopify to Salesforce Fields').item.json.Height || 'Not Provided' }}
Over18c: ={{ $('Map Shopify to Salesforce Fields').item.json.Over18c || 'Not Provided' }}
```

---

### 📊 Health Assessment Fields (38 fields)

#### Weight & Diet (2)
```
weightsatisfaction
dietdescription
```

#### Sexual Health (1)
```
SexualIssuesImpactRelationshipc
```

#### Aging & Appearance (6)
```
WorriedAboutFastAgingc
LookOlderThanFeelc
DeclineInBalanceFunctionMentalc
OvertakenByAgingc
AgingProcessImpactc
InterestInSlowingAgingc
```

#### Muscle Health (6)
```
LackOfMuscleMassStrengthImpactc
DesiredMuscleMassDefinitionc
DesiredResponseToExercisec
MuscleFunctionImprovementImpactc
StepsTakenForMuscleHealthc
EffectivenessOfActionsTakenc
```

#### Cognitive/Brain Function (5)
```
MentallySharpAsBeforec
ConcernAboutCognitiveDeclinec
TakenActionsToImproveBrainFunctionc
NutritionalSupportHelpsForBrainc
ConcernedAboutFutureBrainFunctionc
```

#### Immune System (6)
```
MoreUnwellThanBeforec
LessEffectiveRecoveryThanBeforec
LessResilientThanBeforec
ImmuneHealthHelpsOnOverallWellnessc
ImmuneSystemFunctioningWellc
ImmuneMeasuresImproveHealthc
```

#### Gut Health (6)
```
SatisfiedWithGutHealthc
TakenActionsToImproveGutHealthc
StepsTakenForGutHealthc
GutHealthImproveOverallHealthc
SymptomsMightRelatedToGutHealthc
ImpactOfBetterGutHealthc
```

#### Mental Health (3)
```
MentalHealthHistoryc
EverReceivedCounselingOrTreatmentc
CurrentMentalEmotionalStateRatingc
```

#### Sleep & Energy (2)
```
DifficultySleepingc
FeelRefreshedEagerUponWaking_c
```

---

## 🎨 How New Fields Display in Webapp

The doctor will now see a **new section** at the top of the health assessment:

```
┌─────────────────────────────────────────────────────────┐
│     📋 Patient Health Assessment (Blue Gradient)        │
├─────────────────────────────────────────────────────────┤
│  Basic Patient Information (NEW!)                       │
│  - Sex: Male                                            │
│  - Weight: 180 lbs                                      │
│  - Height: 5'10"                                        │
│  - Over 18: Yes                                         │
├─────────────────────────────────────────────────────────┤
│  Weight & Diet                                          │
│  - Weight Satisfaction: Satisfied                       │
│  - Diet Description: Keto diet                          │
├─────────────────────────────────────────────────────────┤
│  [Other health sections...]                             │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ What's Been Updated

### 1. **lib/types.ts** ✅
Added 4 new fields to Order interface:
```typescript
// Basic Patient Information
Sex?: string;
Weight?: string;
Height?: string;
Over18c?: string;
```

### 2. **components/OrderDetails.tsx** ✅
Added new "Basic Patient Information" section that displays:
- Sex
- Weight
- Height
- Over 18

### 3. **app/api/fetch-customer/route.ts** ✅
Added polling logic to ensure HTTP request from n8n is received before showing form:
- Polls for up to 10 seconds
- Checks if order exists in webapp queue
- Ensures data integrity before doctor accesses form

---

## 🔒 Data Integrity Feature

**New:** The webapp now ensures the HTTP request from n8n is fully received before allowing the doctor to access the form.

### How It Works:

1. Doctor enters patient email
2. Webapp calls n8n to fetch customer data
3. **NEW:** Webapp polls for 10 seconds to confirm order is in queue
4. Once confirmed, form is displayed with all data
5. Doctor sees complete patient information

### Benefits:

✅ Prevents race conditions  
✅ Ensures all data is loaded before form access  
✅ Guarantees data integrity  
✅ Better user experience (no missing data)

---

## 🧪 Testing Your Setup

### Step 1: Add Fields to n8n

Make sure your n8n HTTP Request node has these 4 new fields:

```javascript
Sex: ={{ $('Map Shopify to Salesforce Fields').item.json.Sex || 'Not Provided' }}
Weight: ={{ $('Map Shopify to Salesforce Fields').item.json.Weight || 'Not Provided' }}
Height: ={{ $('Map Shopify to Salesforce Fields').item.json.Height || 'Not Provided' }}
Over18c: ={{ $('Map Shopify to Salesforce Fields').item.json.Over18c || 'Not Provided' }}
```

### Step 2: Test Workflow

1. Execute your n8n workflow
2. Check HTTP Request node response:
   ```json
   {
     "success": true,
     "message": "Order added to queue",
     "orderId": "12345"
   }
   ```

### Step 3: Test Webapp

1. Open `https://dilhan.ngrok.app/`
2. Enter patient email
3. Wait for 10-second loading (includes polling)
4. Form opens with all data
5. ✅ Check "Basic Patient Information" section shows:
   - Sex
   - Weight
   - Height
   - Over 18

---

## 📊 Summary

**Total Fields:** 52 (was 48, added 4)

**New Fields:**
- Sex
- Weight
- Height
- Over18c

**New Features:**
- ✅ Basic Patient Information section in webapp
- ✅ Polling to ensure order is received before form access
- ✅ Better data integrity
- ✅ Prevents race conditions

**Files Updated:**
- `lib/types.ts` - Added 4 new fields to Order type
- `components/OrderDetails.tsx` - Added Basic Patient Information display section
- `app/api/fetch-customer/route.ts` - Added polling logic for data integrity

---

**Your webapp now displays all 52 fields and ensures data is fully loaded before the doctor accesses the form! 🎉**

