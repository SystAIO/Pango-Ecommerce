const fs = require("fs");
const f = "frontend/app/Admin-Dashboard/page.tsx";
let t = fs.readFileSync(f, "utf8");

const swaps = [
  ['NavbarMenu["men"]): EditSection =>', 'NavbarMenu["topwear"]): EditSection =>'],
  ['const fromEditSection = (s: EditSection): NavbarMenu["men"] => ({', 'const fromEditSection = (s: EditSection): NavbarMenu["topwear"] => ({'],
  ['const [navMen, setNavMen] = useState<EditSection>(() => toEditSection(DEFAULT_MENU.men));',
   'const [navTopwear, setNavTopwear] = useState<EditSection>(() => toEditSection(DEFAULT_MENU.topwear));'],
  ['const [navWomen, setNavWomen] = useState<EditSection>(() => toEditSection(DEFAULT_MENU.women));',
   'const [navBottomwear, setNavBottomwear] = useState<EditSection>(() => toEditSection(DEFAULT_MENU.bottomwear));'],
  ['if (!res.ok || !data?.men?.columns?.length || !data?.women?.columns?.length) {',
   'if (!res.ok || !data?.topwear?.columns?.length || !data?.bottomwear?.columns?.length || !Array.isArray(data?.links)) {'],
  ['setNavMen(toEditSection(data.men));\n      setNavWomen(toEditSection(data.women));',
   'setNavTopwear(toEditSection(data.topwear));\n      setNavBottomwear(toEditSection(data.bottomwear));'],
  ['body: JSON.stringify({ men: fromEditSection(navMen), women: fromEditSection(navWomen) }),',
   'body: JSON.stringify({\n          topwear: fromEditSection(navTopwear),\n          bottomwear: fromEditSection(navBottomwear),\n          links: navLinks.filter((l) => l.label.trim() && l.href.trim()).map((l) => ({ label: l.label.trim(), href: l.href.trim() })),\n        }),'],
  ['setCatalogueMenu({ men: fromEditSection(navMen), women: fromEditSection(navWomen) });',
   'setCatalogueMenu({\n        topwear: fromEditSection(navTopwear),\n        bottomwear: fromEditSection(navBottomwear),\n        links: DEFAULT_MENU.links,\n      });'],
  ['setNavMen(toEditSection(DEFAULT_MENU.men));\n    setNavWomen(toEditSection(DEFAULT_MENU.women));\n    setNavError(\'\');',
   'setNavTopwear(toEditSection(DEFAULT_MENU.topwear));\n    setNavBottomwear(toEditSection(DEFAULT_MENU.bottomwear));\n    setNavLinks(DEFAULT_MENU.links.map((l) => ({ ...l, id: crypto.randomUUID() })));\n    setNavError(\'\');'],
  ['if (data?.men?.columns?.length && data?.women?.columns?.length) {\n          setCatalogueMenu(data);',
   'if (data?.topwear?.columns?.length && data?.bottomwear?.columns?.length && Array.isArray(data?.links)) {\n          setCatalogueMenu(data);'],
  ['setNavMen', 'setNavTopwear'],
  ['setNavWomen', 'setNavBottomwear'],
  ['toEditSection(DEFAULT_MENU.men)', 'toEditSection(DEFAULT_MENU.topwear)'],
  ['heading="Men" section={navMen} onChange={setNavTopwear}', 'heading="Topwear" section={navTopwear} onChange={setNavTopwear}'],
  ['heading="Women" section={navWomen} onChange={setNavBottomwear}', 'heading="Bottomwear" section={navBottomwear} onChange={setNavBottomwear}'],
];
for (const [a, b] of swaps) {
  const before = t;
  t = t.split(a).join(b);
  if (t === before) console.log("no-match:", JSON.stringify(a.slice(0, 70)));
}
fs.writeFileSync(f, t);
console.log("done");
