import Link from 'next/link';
import {
  Info,
  TrendingUp,
  MapPin,
  Store,
  ShieldCheck,
  AlertTriangle,
  Compass,
  Layers,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'About AgriForecasting | Mandi Price Intelligence & 14-Day Forecasts',
  description:
    'Comprehensive guide for farmers and evaluators on how AgriForecasting operates, price forecasting methodology, APMC mandi concepts, and decision support.',
};

export default function AboutPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <PageHeader
        title="About AgriForecasting"
        subtitle="Empowering Indian farmers with local mandi discovery, price transparency, and machine learning-powered 14-day price forecasting."
      />

      {/* Purpose Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 shadow-md">
        <div className="relative z-10 max-w-3xl">
          <Badge className="bg-green-500/20 text-green-200 border-green-400/30 mb-3">
            Farmer-Centric Advisory
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
            Making Agricultural Market Prices Predictable
          </h2>
          <p className="text-green-100 text-sm sm:text-base leading-relaxed mb-6">
            Smallholder farmers often sell their produce under distress due to lack of timely price information.
            AgriForecasting bridges this gap by combining historical APMC mandi trading data with advanced machine learning
            to project expected modal price movements up to 14 days ahead.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/nearby-mandis">
              <Button className="bg-white text-green-900 hover:bg-green-50 font-semibold text-sm">
                <MapPin className="w-4 h-4 mr-2 text-green-800" />
                Find Nearby Mandis
              </Button>
            </Link>
            <Link href="/forecast">
              <Button variant="outline" className="text-white border-white/40 hover:bg-white/10 text-sm">
                <TrendingUp className="w-4 h-4 mr-2" />
                Explore 14-Day Forecasts
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mandi Concepts Guide */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-green-800" />
          <h3 className="text-xl font-bold text-slate-900">Understanding APMC Mandi Concepts</h3>
        </div>
        <p className="text-slate-600 text-sm leading-relaxed">
          In India, Agricultural Produce Market Committees (APMCs) govern regulated physical markets where daily auctions
          take place. Here is what the numbers on AgriForecasting mean:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-slate-200 hover:border-green-300 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-md bg-green-100 text-green-800 flex items-center justify-center font-bold text-xs">
                  ₹
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Modal Price</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                The most frequent auction price at which the majority of the commodity was traded on that market day.
                This is the standard benchmark used for farmer settlement and price projections.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 hover:border-green-300 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                  ↕
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Min & Max Price</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Reflects quality differentials. Lower-grade, high-moisture produce sells near the minimum price,
                while sorted, premium, low-moisture produce commands the maximum price.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 hover:border-green-300 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                  ⚖
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Arrival Volume</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Reported in metric tonnes. A surge in daily arrivals typically softens prices due to supply gluts,
                whereas thin arrivals can push modal prices upward.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How the 14-Day Forecast Works */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-800" />
          <h3 className="text-xl font-bold text-slate-900">How the 14-Day Machine Learning Model Works</h3>
        </div>
        <Card className="border border-slate-200">
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              AgriForecasting incorporates a trained <strong>LightGBM (Gradient Boosted Decision Trees)</strong> forecasting engine.
              The model evaluates 69 distinct features for each mandi–commodity pair:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-slate-900 text-xs">Historical Price Momentum & Lags</h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    1-day, 2-day, 7-day, 14-day, and 30-day price lags capturing short-term trends.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-slate-900 text-xs">Rolling Averages & Volatility</h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Rolling 7-day and 14-day mean prices and standard deviations indicating market stability.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-slate-900 text-xs">Calendar & Seasonality Signals</h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Day of week, month, day of year, cyclical sin/cos transforms, and harvest season indicators.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-slate-900 text-xs">Multi-Step Autoregressive Rollout</h5>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Iteratively projects Day 1 through Day 14, dynamically feeding each predicted price into subsequent step lags.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 mt-4 text-xs text-emerald-900 flex items-start gap-3">
              <Calendar className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Evaluation Reference Point: 23 November 2026</span>
                <p className="text-emerald-800 mt-0.5">
                  The model generates forecasts starting from <strong>24 November 2026</strong> through <strong>07 December 2026</strong> (exactly 14 calendar days).
                  Confidence bands expand progressively as the forecast horizon extends into the future, reflecting increasing uncertainty.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Farmer Selling Decision Guide */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-green-800" />
          <h3 className="text-xl font-bold text-slate-900">How to Use Forecasts for Selling Decisions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border border-green-200 bg-green-50/40">
            <CardContent className="p-5 space-y-2">
              <Badge className="bg-green-700 text-white text-[11px]">Upward Trend (Hold or Stagger)</Badge>
              <h4 className="font-bold text-slate-900 text-sm">When Prices Are Projected to Rise</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                If the 7 to 14-day forecast indicates a strong upward trajectory and your crop is non-perishable (e.g. Wheat, Gram, Mustard) or you have aerated storage, consider staggering sales or holding for 5–7 days to capture higher mandi realizations.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-rose-200 bg-rose-50/40">
            <CardContent className="p-5 space-y-2">
              <Badge className="bg-rose-700 text-white text-[11px]">Downward Trend (Early Sale)</Badge>
              <h4 className="font-bold text-slate-900 text-sm">When Prices Are Projected to Decline</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                If forecasts indicate incoming arrival spikes or post-harvest price dips, selling immediately or choosing a nearby premium market can protect your operational margins from adverse price corrections.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Disclaimers & Limitations */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-700" />
          <h3 className="text-xl font-bold text-slate-900">Advisory Disclaimer & Limitations</h3>
        </div>
        <Card className="border border-amber-200 bg-amber-50/60">
          <CardContent className="p-5 text-xs text-amber-900 space-y-2 leading-relaxed">
            <p>
              <strong>Decision Support Tool Only:</strong> AgriForecasting provides statistical price intelligence and projections for informational purposes.
              Agricultural prices are subject to dynamic external factors including sudden unseasonal rainfall, pest attacks, state export/import policies, minimum support price (MSP) announcements, and local logistics strikes.
            </p>
            <p>
              <strong>Demonstration Prototype Notice:</strong> In this evaluation environment, prices are curated and calibrated around the reference date of 23 November 2026.
              The system does not claim real-time operational Agmarknet synchronization or guaranteed price realization. Farmers must exercise independent judgment before making dispatch decisions.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Architecture & Future Roadmap */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-green-800" />
          <h3 className="text-xl font-bold text-slate-900">Technical Architecture & Future Roadmap</h3>
        </div>
        <Card className="border border-slate-200">
          <CardContent className="p-5 space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              AgriForecasting is engineered using a robust enterprise three-layer architecture:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Frontend Layer</span>
                <span className="text-slate-600">Next.js 16 App Router, TypeScript, Tailwind CSS, Leaflet Maps, and Recharts.</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Application Backend</span>
                <span className="text-slate-600">Java 17/21, Spring Boot 3.3.5, Spring Data JPA, Haversine spatial discovery, and market orchestration.</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Model Inference Service</span>
                <span className="text-slate-600">Python FastAPI serving LightGBM with 69 features and 14-day iterative autoregressive rollout.</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <h5 className="font-bold text-slate-900 text-xs mb-2">Planned Future Features:</h5>
              <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                <li>Automated daily ingestion from National Agmarknet portal via scheduled workers.</li>
                <li>Hyperlocal IMD weather and rainfall anomaly integration for improved forecasting accuracy.</li>
                <li>Multi-language voice interface (Hindi, Marathi, Telugu, Kannada, Bengali, Punjabi).</li>
                <li>WhatsApp and SMS price alert notifications for registered farmer phone numbers.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}