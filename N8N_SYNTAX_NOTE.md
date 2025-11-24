# n8n Template Syntax - Important Note

## Equal Sign in n8n Expressions

### Understanding the Syntax

When working with n8n, you'll see two different formats for the same expression:

#### In n8n UI (when typing):
```
={{ $json.orderId }}
={{ $json.totalAmount || '0.00' }}
={{ $json.shippingAddress ? JSON.stringify($json.shippingAddress) : '' }}
```

#### In JSON Export Files (like n8n-body-parameters-complete.json):
```json
"value": "{{ $json.orderId }}"
"value": "{{ $json.totalAmount || '0.00' }}"
"value": "{{ $json.shippingAddress ? JSON.stringify($json.shippingAddress) : '' }}"
```

### Why the Difference?

- **n8n UI**: Requires `=` at the start to indicate it's an expression: `={{ ... }}`
- **JSON Export**: The `=` is automatically removed in the export format: `{{ ... }}`

### The File is Already Correct!

The `n8n-body-parameters-complete.json` file uses the **JSON export format** (without `=`), which is correct.

When you:
1. **Import this JSON into n8n** → n8n automatically adds the `=` in the UI
2. **Copy-paste into n8n UI** → You need to add `=` manually if copying individual expressions

### How to Use the File

#### Option 1: Import the Entire Node (Recommended)
1. Copy the entire content of `n8n-body-parameters-complete.json`
2. In n8n, go to your workflow
3. Click the "..." menu → "Import from JSON"
4. Paste the content
5. ✅ n8n will automatically handle the syntax

#### Option 2: Manual Copy-Paste
If you're manually copying individual fields into the n8n UI:

**From the JSON file:**
```json
"value": "{{ $json.orderId }}"
```

**Paste into n8n UI as:**
```
={{ $json.orderId }}
```

(Add the `=` at the beginning)

### Summary

| Context | Format | Example |
|---------|--------|---------|
| n8n UI (typing) | `={{ ... }}` | `={{ $json.orderId }}` |
| JSON Export/Import | `{{ ... }}` | `"value": "{{ $json.orderId }}"` |
| HTML Templates | `{{ ... }}` | `<div>{{ $json.customerName }}</div>` |

### Common Mistake

❌ **Wrong**: Trying to remove `=` from n8n UI
```
{ $json.orderId }  // This won't work in n8n UI
```

✅ **Correct**: Keep `=` in n8n UI, remove in JSON
```
n8n UI: ={{ $json.orderId }}
JSON:   "value": "{{ $json.orderId }}"
```

### Quick Reference

**When you see `=` in documentation:**
- It's showing the n8n UI format
- If importing JSON, the `=` is not needed (and shouldn't be there)
- If typing in n8n UI, the `=` IS needed

**The `n8n-body-parameters-complete.json` file is already in the correct format for JSON import/export.**

No changes needed! 🎉

