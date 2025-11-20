# n8n Prescription Generator - Quick Reference

## 🚀 Quick Setup (5 Steps)

### 1. Webhook Node
```
Type: Webhook
Method: POST
Path: /prescription-submit
Response: Immediately (200)
```

### 2. Code Node
```
Language: JavaScript
Mode: Run Once for All Items
Code: [Copy from n8n-prescription-processor.js]
```

### 3. HTML Node
```
Operation: Extract HTML Content
Template: [Copy from n8n-prescription-template.html]
```

### 4. PDF Node
```
Type: HTML to PDF
HTML: {{ $json.html }}
Filename: Prescription_{{ $json.orderNumber }}.pdf
```

### 5. Email/Storage Node
```
Configure based on your needs
```

---

## 📋 Code Node Output Structure

The Code node (`n8n-prescription-processor.js`) outputs:

```javascript
{
  // Patient Info
  patientName: "John Doe",
  patientState: "NSW",
  
  // Doctor Info
  doctorName: "Dr. Smith",
  
  // Medicines (pre-generated HTML)
  medicinesHtml: "<tr><td>Medicine</td><td>Qty</td><td>Desc</td></tr>...",
  
  // Sections
  bundleBreakdown: "Item 1 (2x), Item 2 (1x)",
  doctorNote: "Patient requires...",
  
  // Health Assessment
  healthChanges: "No" or "Yes - details",
  takingMedications: "No" or "Yes - medication list",
  hadMedicationBefore: "Yes" or "No",
  pregnancyStatus: "Yes" or "No",
  allergicReaction: "Yes" or "No",
  allergies: "No" or "Yes - allergy list",
  medicalConditions: "No" or "Yes - condition details",
  
  // Signature & Dates
  signatureImage: "data:image/png;base64,...",
  signatureDate: "18/11/2025",
  prescriptionDate: "18 November 2025",
  
  // Metadata
  orderId: "6505200976121",
  orderNumber: "52149"
}
```

---

## 🔧 Common Customizations

### Change Clinic Information
Edit in `n8n-prescription-template.html`:
```html
<div class="clinic-name">FireV8 Clinic</div>
<div class="clinic-address">
    Suite 49<br>
    1 Fireman Street<br>
    Doreen NSW 2154<br>
    T 1300 MY FireV8<br>
    (1300 692 468)
</div>
```

### Change Watermark Text
Edit in `n8n-prescription-template.html`:
```html
<div class="watermark">COPY. DO NOT DISPENSE</div>
```

### Change Colors
Edit in `n8n-prescription-template.html` CSS:
```css
.clinic-info {
    color: #b91c2c; /* Change this color */
}
```

### Add More Medicine Fields
Edit in `n8n-prescription-processor.js`:
```javascript
medicines = parsedLineItems.map(item => ({
  name: item.name || item.title || 'N/A',
  quantity: item.quantity || 1,
  description: item.variant_title || item.sku || 'As prescribed',
  // Add more fields here
  dosage: item.dosage || '',
  frequency: item.frequency || ''
}));
```

Then update the HTML template table:
```html
<th>Dosage</th>
<th>Frequency</th>
```

---

## 🐛 Troubleshooting

### Problem: No medicines showing
**Check:**
- Code node has `medicinesHtml` in output
- `lineItems` or `medicineName` exists in webhook data
- Console logs in Code node for errors

**Fix:**
```javascript
console.log('Line Items:', parsedLineItems);
console.log('Medicines:', medicines);
console.log('Medicines HTML:', medicinesHtml);
```

### Problem: Signature not displaying
**Check:**
- `signaturePdf` is base64 encoded in webhook
- Code node converts to data URL
- Image tag in HTML is correct

**Fix:**
```javascript
console.log('Signature PDF length:', signaturePdf?.length);
console.log('Signature Image:', signatureImage?.substring(0, 50));
```

### Problem: Variables showing as {{ $json.xxx }}
**Check:**
- Using HTML node (not Code node)
- Code node output has all fields
- Variable names match exactly

**Fix:**
```javascript
// In Code node, verify output:
console.log('Output:', JSON.stringify($json, null, 2));
```

### Problem: Health assessments showing "Not provided"
**Check:**
- Webapp is sending health assessment fields
- Field names match exactly in webhook payload
- Code node is extracting them correctly

**Fix:**
```javascript
console.log('Health Changes:', healthChanges);
console.log('Taking Medications:', takingMedications);
// etc.
```

---

## 📊 Testing Checklist

- [ ] Webhook receives data from webapp
- [ ] Code node processes data without errors
- [ ] HTML renders with all variables replaced
- [ ] Medicines table shows all items (test with 1, 5, 10 medicines)
- [ ] Health assessments display correctly
- [ ] Signature image appears
- [ ] Dates are formatted correctly
- [ ] PDF generates successfully
- [ ] PDF is readable and properly formatted
- [ ] Email/storage works as expected

---

## 🔗 Related Files

| File | Purpose |
|------|---------|
| `n8n-prescription-processor.js` | Code node - processes webhook data |
| `n8n-prescription-template.html` | HTML template - renders prescription |
| `N8N_SETUP_GUIDE.md` | Detailed setup instructions |
| `TEMPLATE_COMPARISON.md` | Comparison with old template |
| `HEALTH_ASSESSMENT_UPDATE.md` | Health assessment fields documentation |

---

## 💡 Pro Tips

1. **Test with sample data first** - Use n8n's "Execute Node" feature with sample JSON
2. **Enable logging** - Add console.log statements in Code node for debugging
3. **Save workflow versions** - Use n8n's version control before making changes
4. **Monitor errors** - Set up error notifications for production
5. **Backup prescriptions** - Store generated PDFs in multiple locations
6. **Validate data** - Add validation in Code node before processing
7. **Use environment variables** - Store clinic info, colors, etc. as variables

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the detailed setup guide (`N8N_SETUP_GUIDE.md`)
3. Verify webhook payload structure
4. Test each node individually
5. Check n8n execution logs

---

## 🎯 Success Criteria

Your setup is working correctly when:
- ✅ Webapp submissions trigger the workflow
- ✅ All medicines display in the table (regardless of quantity)
- ✅ Health assessments show Yes/No with details
- ✅ Signature appears clearly
- ✅ PDF is generated and looks professional
- ✅ Patient receives prescription via email
- ✅ Prescription is stored for records

