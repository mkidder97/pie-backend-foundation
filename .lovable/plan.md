

# Expand Date Ranges for Relay and Signals

## Changes

### 1. `src/components/pie/CategoryRelay.tsx`
- Change default `days` state from `"7"` to `"30"` (line 27)
- Add two new options to `rangeOptions` array (after line 19):
  - `{ value: "60", label: "Last 60 days" }`
  - `{ value: "90", label: "Last 90 days" }`

### 2. `src/components/pie/CategorySignals.tsx`
- Change default `days` state from `30` to `90` (line 46, needs confirmation)
- Add `{ value: 90, label: "90d" }` to `dayOptions` array (after line 36)

## Why
Backfilled episodes have old `published_at` dates but recent `created_at`. Wider default windows ensure newly processed content appears immediately.

