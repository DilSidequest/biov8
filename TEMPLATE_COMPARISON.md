# Prescription Template Comparison

## Overview
This document compares the old and new prescription templates and explains when to use each.

## Template Files

### 1. prescription_template.html (Original - Handlebars)
**Syntax:** Handlebars templating `{{variableName}}` and `{{#each array}}`
**Use Case:** If you're using a templating engine that supports Handlebars
**Limitations:** 
- Requires Handlebars processor
- Loop syntax may not work directly in n8n
- Needs additional processing for arrays

### 2. n8n-prescription-template.html (New - n8n Native)
**Syntax:** n8n expressions `{{ $json.variableName }}`
**Use Case:** Direct use in n8n HTML node
**Advantages:**
- Works natively with n8n
- No additional dependencies
- Pre-processed medicine HTML (handles any number of medicines)
- Includes all health assessment fields

## Key Differences

### Medicine Table Handling

#### Old Template (Handlebars)
```html
<tbody>
    {{#each medicines}}
    <tr>
        <td>{{this.name}}</td>
        <td>{{this.quantity}}</td>
        <td>{{this.description}}</td>
    </tr>
    {{/each}}
</tbody>
```
**Problem:** n8n doesn't natively support `{{#each}}` loops

#### New Template (n8n)
```html
<tbody>
    {{ $json.medicinesHtml }}
</tbody>
```
**Solution:** Medicine rows are pre-generated as HTML in the Code node

**Example Output:**
```html
<tr>
    <td>Semaglutide 0.25mg</td>
    <td>4 pens</td>
    <td>Inject 0.25mg weekly for 4 weeks</td>
</tr>
<tr>
    <td>Semaglutide 0.5mg</td>
    <td>4 pens</td>
    <td>Inject 0.5mg weekly for 4 weeks</td>
</tr>
<tr>
    <td>Needles</td>
    <td>8</td>
    <td>Safety needles 4mm</td>
</tr>
```

### Variable Syntax

#### Old Template
```html
<div>{{patientName}}</div>
<div>{{doctorNote}}</div>
```

#### New Template
```html
<div>{{ $json.patientName }}</div>
<div>{{ $json.doctorNote }}</div>
```

### Conditional Rendering

#### Old Template
```html
{{#if signatureImage}}
<div>
    <img src="{{signatureImage}}" alt="Doctor Signature">
</div>
{{/if}}
```

#### New Template
```html
<div>
    <img src="{{ $json.signatureImage }}" alt="Doctor Signature">
</div>
```
**Note:** Conditionals are handled in the Code node (signature is always provided)

## Health Assessment Fields

Both templates now include the same health assessment fields:

```html
<div class="assessment-item">
    <div class="assessment-question">
        <strong>Has the patient had any health changes in the past 6 months?</strong>
    </div>
    <div class="assessment-answer">{{ $json.healthChanges }}</div>
</div>
```

**Fields included:**
1. Health changes in past 6 months
2. Current medications
3. Previous use of this medication
4. Pregnancy/breastfeeding status
5. Allergic reactions to medication
6. Any allergies
7. Current medical conditions

## Migration Path

### If you're currently using prescription_template.html:

**Option 1: Switch to new template (Recommended)**
1. Use `n8n-prescription-processor.js` in a Code node
2. Use `n8n-prescription-template.html` in an HTML node
3. Benefit from native n8n support and dynamic medicine handling

**Option 2: Keep using Handlebars**
1. Continue using `prescription_template.html`
2. Add a Handlebars processing node before HTML generation
3. Manually handle the medicine array loop

## Styling

Both templates use **identical styling**:
- Same colors (red theme: #b91c2c)
- Same layout (A4 page size: 210mm x 297mm)
- Same watermark ("COPY. DO NOT DISPENSE")
- Same sections and formatting
- Same fonts and spacing

**The only difference is the variable syntax and how medicines are handled.**

## Recommendation

✅ **Use the new n8n template** (`n8n-prescription-template.html`) because:
- Works directly with n8n without additional dependencies
- Handles multiple medicines automatically (1, 10, or any number)
- Includes all health assessment fields
- Easier to maintain and debug
- Better performance (no Handlebars compilation needed)

## File Summary

| File | Purpose | When to Use |
|------|---------|-------------|
| `prescription_template.html` | Original Handlebars template | Legacy systems with Handlebars support |
| `n8n-prescription-template.html` | n8n-native template | **Recommended for n8n workflows** |
| `n8n-prescription-processor.js` | Data processor for n8n | Required with new template |
| `prescription-generator-code.js` | Old processor | Legacy reference |

## Example Workflow

### Using New Template (Recommended)

```
Webhook (receives data)
    ↓
Code Node (n8n-prescription-processor.js)
    ↓
HTML Node (n8n-prescription-template.html)
    ↓
PDF Converter
    ↓
Email/Storage
```

### Using Old Template (Legacy)

```
Webhook (receives data)
    ↓
Handlebars Processor
    ↓
HTML Generator
    ↓
PDF Converter
    ↓
Email/Storage
```

## Testing Both Templates

You can test both templates side-by-side:
1. Create two parallel branches in your n8n workflow
2. One branch uses the old template
3. One branch uses the new template
4. Compare the outputs
5. Switch to the new template once verified

