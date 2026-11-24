import CollectionDetail from "@/app/components/collection/CollectionDetail";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export default async function NewArrivalDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let label = "New Arrivals";
  try {
    const res = await fetch(`${BACKEND_URL}/api/navbar-menu`, { cache: "no-store" });
    if (res.ok) {
      const menu = (await res.json()) as { links?: { label: string; href: string }[] };
      label = menu.links?.find((l) => l.href === "/new-arrivals")?.label || label;
    }
  } catch { /* keep default */ }
  return <CollectionDetail collectionKey="new-arrivals" slug={slug} label={label} />;
}
