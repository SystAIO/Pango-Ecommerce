import {
  DEFAULT_REFERRAL_CONFIG,
  mergeReferralConfig,
  referralDiscount,
} from "../lib/referral-config";

let failures = 0;
const check = (label: string, pass: boolean) => {
  console.log(`  ${pass ? "OK  " : "FAIL"}  ${label}`);
  if (!pass) failures += 1;
};

console.log("\nreferral config");
const config = mergeReferralConfig({ code: " my10 ", percent: 10, active: true });
check("code is uppercased and cleaned", config.code === "MY10");
check("percent is kept", config.percent === 10);
check("active is honoured", config.active === true);
check("matching code gives 10%", referralDiscount(config, "my10", 1000) === 100);
check("wrong code gives 0", referralDiscount(config, "OTHER", 1000) === 0);
check("inactive code gives 0", referralDiscount({ ...config, active: false }, "MY10", 1000) === 0);
check("percent is clamped", mergeReferralConfig({ percent: 500 }).percent === 100);
check("defaults are inactive", DEFAULT_REFERRAL_CONFIG.active === false);

console.log(`\n${failures === 0 ? "REFERRAL OK" : `${failures} FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
