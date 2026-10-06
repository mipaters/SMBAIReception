import type { LiveCallBusinessContext } from "./liveCall";

/**
 * Holds the business currently "live" on the demo Twilio phone number.
 *
 * This demo has no database, and a real inbound phone call has no browser in
 * the loop to supply context (unlike the in-app Live Call Simulator, which
 * sends the profile on every request). So when the presenter clicks
 * "Activate" in the app, the frontend posts the profile/greeting/scheduling
 * here once, and the Twilio voice webhook reads it back for every call.
 *
 * Demo-grade limitation: this is in-process memory only. If the Azure
 * Functions host cold-starts or scales to a new instance between activation
 * and the phone call, this will appear empty again — re-activate in the app
 * if that happens.
 */
export interface ActiveBusiness {
  business: LiveCallBusinessContext;
  activatedAt: string;
}

let active: ActiveBusiness | null = null;

export function setActiveBusiness(business: LiveCallBusinessContext): void {
  active = { business, activatedAt: new Date().toISOString() };
}

export function getActiveBusiness(): ActiveBusiness | null {
  return active;
}
