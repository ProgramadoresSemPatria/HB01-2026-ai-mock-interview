import { cookies } from "next/headers";

import {
  SITE_LOCALE_COOKIE,
  parseSiteLocale,
  type SiteLocale,
} from "./site-locale";

/** Server-side read of the public-site language cookie (defaults to EN). */
export async function getSiteLocale(): Promise<SiteLocale> {
  const store = await cookies();
  return parseSiteLocale(store.get(SITE_LOCALE_COOKIE)?.value);
}
