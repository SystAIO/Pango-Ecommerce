import CollectionListing from "@/app/components/collection/CollectionListing";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export const dynamic = "force-dynamic";

export default async function WinterwearPage() {
  let label = "Winterwear";
  try {
    const res = await fetch(`${BACKEND_URL}/api/navbar-menu`, { cache: "no-store" });
    if (res.ok) {
      const menu = (await res.json()) as { links?: { label: string; href: string }[] };
      label = menu.links?.find((l) => l.href === "/winterwear")?.label || label;
    }
  } catch {
    /* keep the default label */
  }
  return <CollectionListing collectionKey="winterwear" label={label} />;
}
