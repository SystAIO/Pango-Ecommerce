"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart, ShoppingCart, Search,
  ChevronRight, Menu, X, ArrowRight, LogOut, User, ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { DEFAULT_MENU, menuItemHref, type NavbarMenu } from "@/lib/navbar-menu";

export default function Navbar() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const { user, logout } = useAuth();
  const { count: cartCount, ready: cartReady } = useCart();
  const { count: wishlistCount } = useWishlist();

  const isAdmin = user?.role === "admin";

  const [menu, setMenu] = useState<NavbarMenu>(DEFAULT_MENU);
  // Admin-editable announcement strip (Admin → Customize Homepage → Announcement).
  // null = not loaded yet (show the built-in fallback), false = switched off.
  const [announcement, setAnnouncement] = useState<string | false | null>(null);
  const [activeMenu, setActiveMenu] = useState<"topwear" | "bottomwear" | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    fetch("/api/navbar-menu")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: NavbarMenu | null) => {
        if (
          alive &&
          data?.topwear?.columns?.length &&
          data?.bottomwear?.columns?.length &&
          Array.isArray(data?.links)
        ) {
          setMenu(data);
        }
      })
      .catch(() => {
        /* keep the defaults */
      });

    // The top strip is a homepage section; when it is switched off in the
    // admin the whole strip disappears rather than showing stale copy.
    fetch("/api/homepage-sections")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { announcement?: { enabled?: boolean; text?: string } } | null) => {
        if (!alive || !data?.announcement) return;
        setAnnouncement(
          data.announcement.enabled === false ? false : (data.announcement.text ?? false)
        );
      })
      .catch(() => {
        /* keep the default strip */
      });
    return () => {
      alive = false;
    };
  }, []);

  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  const navRef = useRef<HTMLElement>(null);
  const [navHeight, setNavHeight] = useState(110);

  // Hover opens the panel on desktop, but touch screens have no hover and the
  // pointer can also leave the navbar entirely. Escape / outside tap dismisses
  // it, and the trigger itself is inside navRef so opening still works.
  useEffect(() => {
    if (!activeMenu) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (event instanceof PointerEvent && navRef.current?.contains(event.target as Node)) return;
      setActiveMenu(null);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", close);
    };
  }, [activeMenu]);

  useLayoutEffect(() => {
    const el = navRef.current;
    if (!el) return;

    const measure = () => {
      const height = el.offsetHeight;
      if (height > 0) setNavHeight(height);
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/product-page?search=${encodeURIComponent(search.trim())}`);
      setMobileSearch(false);
    }
  };

  const DROPDOWN_KEYS = ["topwear", "bottomwear"] as const;

  return (
    <>
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 font-sans transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        {/* ─── Announcement strip: black, centred (admin-editable) ─── */}
        {announcement !== false ? (
          <div className="border-b border-white/10 bg-[#111] py-1.5 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-[#f6f1e8] sm:text-[10px]">
            {announcement ??
              "Free Shipping Sitewide on Every Order, Don't Miss Out!!"}
          </div>
        ) : null}

        {/* ─── Main bar: wordmark left, triggers centre, actions right ─── */}
        <div
          className="relative border-b border-stone-200 bg-white"
          onMouseLeave={() => setActiveMenu(null)}
        >
          <div className="mx-auto flex max-w-[1680px] items-center gap-3 px-4 sm:px-6 lg:gap-8 lg:px-10">
            <button
              className="-ml-1 shrink-0 rounded p-1 text-stone-700 transition-colors hover:text-black lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-6 w-6" />
            </button>

            <Link href="/" className="shrink-0 py-2" aria-label="Pango Apparels — home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/pango-logo.png"
                alt="Pango Apparels"
                className="h-20 w-auto object-contain sm:h-24"
              />
            </Link>

            {/* ─── Triggers: two dropdowns + direct links ─── */}
            <nav
              aria-label="Shop by category"
              className="relative hidden items-stretch self-stretch lg:flex"
            >
              {DROPDOWN_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onMouseEnter={() => setActiveMenu(key)}
                  onFocus={() => setActiveMenu(key)}
                  // Do NOT toggle here: mouseenter/focus has already opened the
                  // panel, so a toggle would immediately close it on click.
                  // Opening is idempotent; Escape / outside tap closes it.
                  onClick={() => setActiveMenu(key)}
                  aria-expanded={activeMenu === key}
                  aria-haspopup="true"
                  className={`flex items-center gap-1.5 px-4 text-[13px] font-semibold tracking-[0.05em] transition-colors xl:px-6 ${
                    activeMenu === key ? "text-[#171512]" : "text-stone-700 hover:text-[#171512]"
                  }`}
                >
                  {menu[key].label}
                  <ChevronDown className="h-3.5 w-3.5 text-stone-500" aria-hidden />
                </button>
              ))}

              {menu.links.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  onClick={() => setActiveMenu(null)}
                  className="flex items-center px-4 text-[13px] font-semibold tracking-[0.05em] text-stone-700 transition-colors hover:text-[#171512] xl:px-6"
                >
                  {link.label}
                </Link>
              ))}

              {/* ─── Mega panel: anchored under the category triggers ─── */}
              {activeMenu && (
                /* Wrapper starts flush with the nav and carries the gap as
                   padding, so moving the pointer into the panel never leaves
                   the subtree and closes the menu. */
                <div
                  className="absolute left-0 top-full z-[100] w-[min(80vw,740px)] pt-2"
                  onMouseEnter={() => setActiveMenu(activeMenu)}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  <div
                    role="region"
                    aria-label={`${menu[activeMenu].label} menu`}
                    className="rounded-xl border border-stone-200 bg-white px-8 py-7 shadow-xl"
                  >
                    <div
                      className={`grid gap-8 ${
                        menu[activeMenu].columns.length === 1
                          ? "grid-cols-1"
                          : menu[activeMenu].columns.length === 2
                            ? "grid-cols-2"
                            : "grid-cols-3 lg:grid-cols-4"
                      }`}
                    >
                      {menu[activeMenu].columns.map((col) => (
                        <div key={col.title}>
                          <p className="mb-4 text-sm font-semibold text-[#171512]">{col.title}</p>
                          <ul className="space-y-4">
                            {col.items.map((item) => (
                              <li key={item}>
                                <Link
                                  href={menuItemHref(item)}
                                  onClick={() => setActiveMenu(null)}
                                  className="text-sm text-stone-500 transition-colors hover:text-[#171512]"
                                >
                                  {item}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </nav>

            <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-3">
              <form onSubmit={handleSearchSubmit} className="hidden max-w-[240px] items-center md:flex" role="search">
                <label htmlFor="nav-search" className="sr-only">Search products</label>
                <div className="flex w-full items-center overflow-hidden rounded-full border border-stone-300 bg-stone-50 focus-within:border-stone-500">
                  <input
                    id="nav-search"
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search…"
                    className="w-full bg-transparent px-3 py-2 text-xs text-stone-800 outline-none placeholder-stone-400"
                  />
                  <button type="submit" aria-label="Search" className="p-2 text-stone-700 hover:text-black">
                    <Search className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </form>

              <button
                className="rounded p-2 text-stone-700 transition-colors hover:text-black md:hidden"
                onClick={() => setMobileSearch((v) => !v)}
                aria-label={mobileSearch ? "Close search" : "Open search"}
                aria-expanded={mobileSearch}
              >
                <Search className="h-6 w-6" />
              </button>

              {!isAdmin ? (
                <>
                  <Link
                    href={user ? "/user-dashboard?tab=wishlist" : "/login"}
                    aria-label="Wishlist"
                    className="relative hidden text-stone-700 transition-colors hover:text-black sm:flex"
                  >
                    <Heart className="h-6 w-6" />
                    {user && wishlistCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[9px] font-bold text-white">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/user-dashboard?tab=cart"
                    aria-label="Shopping cart"
                    className="relative text-stone-700 transition-colors hover:text-black"
                  >
                    <ShoppingCart className="h-6 w-6" />
                    {cartReady && cartCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[9px] font-bold text-white">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </>
              ) : null}

              {user ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* One label only: the account pill shows the role for admins
                      and the user's first name for customers, so the name is
                      never printed twice. */}
                  <Link
                    href={isAdmin ? "/Admin-Dashboard" : "/user-dashboard"}
                    className="flex max-w-[10rem] items-center gap-1 rounded-full bg-[#171512] px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-white transition-all hover:bg-orange-600"
                  >
                    <User className="h-3 w-3 shrink-0" aria-hidden />
                    <span className="hidden truncate xs:inline">
                      {isAdmin ? "Admin" : (user.name?.split(" ")[0] || "Account")}
                    </span>
                  </Link>
                  <button
                    onClick={logout}
                    aria-label="Log out"
                    title="Log out"
                    className="rounded-full border border-stone-200 p-2 text-stone-600 transition-all hover:border-red-200 hover:text-red-600"
                  >
                    <LogOut className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="rounded-full bg-[#171512] px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-white transition-all hover:bg-orange-600"
                >
                  Login
                </Link>
              )}
            </div>
          </div>

          {mobileSearch && (
            <form onSubmit={handleSearchSubmit} className="border-t border-stone-100 px-3 py-2 md:hidden">
              <div className="flex items-center rounded-full border border-stone-300 bg-stone-50 px-4 py-2 gap-3">
                <Search className="h-4 w-4 shrink-0 text-stone-400" />
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="flex-1 bg-transparent text-sm text-stone-800 placeholder-stone-400 outline-none"
                />
              </div>
            </form>
          )}

        </div>
      </nav>

      {/* Spacer: matches the measured navbar height */}
      <div style={{ height: navHeight }} aria-hidden />

      {/* ─── Mobile drawer ─── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          <div className="absolute left-0 top-0 bottom-0 flex w-[85%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 p-5">
              <span className="text-lg font-black uppercase tracking-widest text-[#171512]">
                Menu
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-full p-2 text-stone-500 hover:bg-stone-100"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-5 pb-20">
              {[...DROPDOWN_KEYS].map((key) => {
                const section = menu[key];
                const isExpanded = expandedSections.has(key);
                return (
                  <div key={key} className="overflow-hidden rounded-xl border border-stone-200">
                    <button
                      onClick={() => toggleSection(key)}
                      aria-expanded={isExpanded}
                      className="flex w-full items-center justify-between px-4 py-4 text-sm font-extrabold uppercase tracking-[0.18em] text-[#171512] hover:bg-stone-50"
                    >
                      {section.label}
                      <ChevronRight
                        className={`h-5 w-5 text-stone-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="border-t border-stone-100 bg-stone-50 px-4 pb-5 pt-3">
                        {section.columns.map((col) => (
                          <div key={col.title} className="mb-4 last:mb-0">
                            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">
                              {col.title}
                            </p>
                            <ul className="space-y-1.5">
                              {col.items.map((item) => (
                                <li key={item}>
                                  <Link
                                    href={menuItemHref(item)}
                                    onClick={() => setMobileOpen(false)}
                                    className="block rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm active:scale-[0.98]"
                                  >
                                    {item}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="overflow-hidden rounded-xl border border-stone-200">
                {menu.links.map((link) => (
                  <Link
                    key={link.label + link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between border-b border-stone-100 px-4 py-4 text-sm font-extrabold uppercase tracking-[0.18em] text-[#171512] last:border-0 hover:bg-stone-50"
                  >
                    {link.label}
                    <ArrowRight className="h-4 w-4 text-stone-400" aria-hidden />
                  </Link>
                ))}
              </div>
            </div>

            <div className="border-t border-stone-100 p-5">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#171512] py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-orange-600"
              >
                Sign In / Register
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
