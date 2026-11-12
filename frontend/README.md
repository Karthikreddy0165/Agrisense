# Unified AgriForecasting

A professional agricultural market price forecasting and decision-support platform for Indian mandis. This is a **frontend-only demonstration** built with static mock data.

---

## Quick Start

```bash
cd agri-forecasting
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app opens directly to the Dashboard.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| State | React hooks + Context |
| Persistence | localStorage |
| UI Primitives | Custom + class-variance-authority |

---

## Folder Structure

```
agri-forecasting/
├── app/                         # Next.js App Router pages
│   ├── dashboard/page.tsx       # Main dashboard
│   ├── market-explorer/page.tsx # Market search & browse
│   ├── forecasts/
│   │   ├── page.tsx             # Forecast entry / featured markets
│   │   └── [mandiId]/[commodityId]/page.tsx  # Forecast detail (core screen)
│   ├── prediction-history/page.tsx
│   ├── saved-markets/page.tsx
│   └── settings/page.tsx
│
├── components/
│   ├── layout/     # AppShell, Sidebar, MobileNav, PageHeader
│   ├── dashboard/  # MetricCard, ForecastOverviewChart, QuickActions, RecentActivity
│   └── ui/         # Button, Card, Badge, Skeleton, EmptyState, PriceTrend
│
└── lib/
    ├── data/        # Static mock data (single source of truth)
    ├── services/    # Service layer — components call these, never data/ directly
    ├── hooks/       # Custom React hooks (useLocalStorage, useSavedMarkets, etc.)
    ├── types/       # TypeScript interfaces
    └── utils/       # formatters.ts, price-utils.ts, cn.ts
```

---

## Mock Data Coverage

- **10 Indian states** · **21 mandis** · **10 commodities**
- **~49 mandi×commodity pairs**, each with 90 days of deterministic historical prices
- **7-day and 14-day forecasts** with uncertainty bands for all pairs

### localStorage Keys

| Key | Contents |
|---|---|
| `agri_saved_markets` | Saved mandi-commodity pairs |
| `agri_prediction_history` | Forecast view history |
| `agri_preferences` | Display and notification preferences |

---

## Navigation

| Route | Description |
|---|---|
| `/dashboard` | Overview metrics, featured market chart, quick actions |
| `/market-explorer` | Search and filter all markets |
| `/forecasts` | Select market/commodity or pick a featured pair |
| `/forecasts/[mandiId]/[commodityId]` | Full forecast detail with chart and daily table |
| `/prediction-history` | History of viewed forecasts |
| `/saved-markets` | Bookmarked mandi-commodity pairs |
| `/settings` | Display and notification preferences |

---

## Future Backend Integration

Only `lib/services/*.service.ts` files need to change to connect a real FastAPI backend:

```typescript
// Current: returns static data
export async function getForecast(mandiId, commodityId, horizon) {
  return getForecastForPair(mandiId, commodityId, horizon);
}

// Future: calls FastAPI
export async function getForecast(mandiId, commodityId, horizon) {
  const res = await fetch(`/api/forecasts/${mandiId}/${commodityId}?horizon=${horizon}`);
  return res.json();
}
```

Planned stack: **FastAPI · PostgreSQL · LightGBM · MLflow · AWS**

---

## Known Limitations

- All prices are deterministic mock values — not real market data
- No authentication required
- Forecasts are illustrative only — do not use for real trading decisions

---

## Scripts

```bash
npm run dev    # Development server → http://localhost:3000
npm run build  # Production build
npm run lint   # ESLint
```
