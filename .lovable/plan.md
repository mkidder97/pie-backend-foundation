

# Fix Relay — Expand Default Date Range

## Problem
`CategoryRelay.tsx` defaults to 7 days (line 27), but most episodes have older `published_at` dates from backfilling. The query returns zero results, showing "No completed episodes in this time range."

## Fix — `src/components/pie/CategoryRelay.tsx`

### Change 1: Default days `"7"` → `"30"` (line 27)
```typescript
const [days, setDays] = useState("30");
```

### Change 2: Add 60d and 90d options to `rangeOptions` (after line 19)
```typescript
{ value: "60", label: "Last 60 days" },
{ value: "90", label: "Last 90 days" },
```

This is the same fix that was approved previously but never applied to this file.

