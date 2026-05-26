import { NextResponse } from "next/server";
import { z } from "zod";

// Free, no-API-key weather via Open-Meteo
// https://open-meteo.com/en/docs

const Query = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = Query.safeParse({
    lat: url.searchParams.get("lat"),
    lng: url.searchParams.get("lng"),
  });
  if (!parsed.success) return NextResponse.json({ error: "Invalid coords" }, { status: 400 });

  const { lat, lng } = parsed.data;
  // Today only — current conditions + min/max F, condition code
  const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&temperature_unit=fahrenheit&timezone=auto&forecast_days=1`;

  try {
    const r = await fetch(apiUrl, { next: { revalidate: 1800 } }); // cache 30 min
    if (!r.ok) throw new Error("weather upstream error");
    const j = await r.json();

    const current = j.current?.temperature_2m;
    const high = j.daily?.temperature_2m_max?.[0];
    const low = j.daily?.temperature_2m_min?.[0];
    const code = j.daily?.weather_code?.[0];
    const rainPct = j.daily?.precipitation_probability_max?.[0];

    // Compact, prompt-friendly summary
    const description = describeWeather(code);
    const summary = `${Math.round(current)}°F now (high ${Math.round(high)}°/low ${Math.round(low)}°), ${description}${rainPct >= 30 ? `, ${rainPct}% rain` : ""}`;

    return NextResponse.json({
      summary,
      current_f: current,
      high_f: high,
      low_f: low,
      rain_pct: rainPct,
      condition: description,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// WMO weather codes → plain English
function describeWeather(code: number): string {
  if (code === 0) return "clear";
  if (code <= 3) return "partly cloudy";
  if (code <= 48) return "foggy";
  if (code <= 57) return "drizzle";
  if (code <= 67) return "rain";
  if (code <= 77) return "snow";
  if (code <= 82) return "showers";
  if (code <= 86) return "snow showers";
  if (code >= 95) return "thunderstorm";
  return "mixed";
}
