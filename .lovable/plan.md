

## Update TypeScript Types for New Summary Fields

Add `HorizonItem` and `IndustryShift` interfaces to `src/types/pie.ts` and extend `StructuredSummary` with two optional arrays.

### Changes

**File: `src/types/pie.ts`**
- Add `HorizonItem` interface with fields: `feature`, `source`, `timeline` (union type), `why_it_matters`
- Add `IndustryShift` interface with fields: `shift`, `evidence`
- Add `on_the_horizon?: HorizonItem[]` and `industry_shifts?: IndustryShift[]` to `StructuredSummary`

**File: `src/components/pie/EpisodeDetail.tsx`**
- Update the fallback default in `EpisodeDetail` to include `on_the_horizon: []` and `industry_shifts: []`
- No new UI sections yet — just ensure the component doesn't break with the new optional fields

