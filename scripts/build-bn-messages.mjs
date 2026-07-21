/**
 * Builds bn.json = English base deep-merged with Bengali overrides.
 * Run: node scripts/build-bn-messages.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "src", "lib", "i18n", "messages");
const en = JSON.parse(fs.readFileSync(path.join(root, "en.json"), "utf8"));

/** Bengali overrides (nested objects supported). Unlisted keys keep English. */
const bn = {
  appName: "এল কে স্টুডিও",
  tagline: "দোকান ও গ্রাহকের জন্য টেইলরিং",
  login: "লগইন",
  backHome: "হোমে ফিরুন",
  tryAgain: "আবার চেষ্টা করুন",
  serverTemporaryErrorTitle: "কিছু ভুল হয়েছে",
  serverTemporaryErrorHint:
    "সার্ভার জেগে উঠছে বা ব্যস্ত হতে পারে। একটু অপেক্ষা করে আবার চেষ্টা করুন।",
  register: "নিবন্ধন",
  logout: "লগআউট",
  logoutFailed: "লগআউট হয়নি। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।",
  shopLogin: "দোকান মালিক লগইন",
  customerLogin: "গ্রাহক লগইন",
  email: "ইমেইল",
  emailPlaceholder: "আপনার ইমেইল",
  mobileNumberHint: "মোবাইল নম্বর",
  mobileNumberPlaceholder: "১০ সংখ্যার মোবাইল",
  password: "পাসওয়ার্ড",
  name: "নাম",
  phone: "ফোন",
  mobileNumber: "মোবাইল নম্বর",
  whatsapp: "হোয়াটসঅ্যাপ",
  submit: "জমা দিন",
  save: "সেভ",
  cancel: "বাতিল",
  language: "ভাষা",
  dashboard: "ড্যাশবোর্ড",
  designs: "ডিজাইন",
  orders: "অর্ডার",
  navShortHome: "হোম",
  navShortDesigns: "ডিজাইন",
  navShortOrders: "অর্ডার",
  navShortBill: "বিল",
  navShortWorkers: "পার্টনার",
  bills: "বিল",
  profile: "প্রোফাইল",
  shopProfileTitle: "দোকানের প্রোফাইল",
  customerProfileTitle: "গ্রাহক প্রোফাইল",
  city: "শহর",
  selectCity: "শহর বেছে নিন",
  shopName: "দোকানের নাম",
  customerName: "গ্রাহকের নাম",
  customerNamePlaceholder: "গ্রাহকের নাম লিখুন বা মাইকে বলুন",
  newShopOrder: "নতুন অর্ডার",
  newShopOrderHint: "গ্রাহক খুঁজুন বা নতুন নাম ও নম্বর দিয়ে চালিয়ে যান",
  continueNewOrder: "এগিয়ে যান",
  findCustomer: "গ্রাহক খুঁজুন",
  dashboardCompleted: "সম্পন্ন",
  viewEarningsReport: "আয়ের রিপোর্ট দেখুন",
  customers: "গ্রাহক",
  orderForPerson: "অর্ডার যার জন্য",
  referencePhotos: "রেফারেন্স ছবি",
  noDesignYet: "এখনও ডিজাইন নেই",
  noMeasurements: "মাপ নেই",
  customer: "গ্রাহক",
  person: "ব্যক্তি",
  measurements: "মাপ",
  notes: "নোট",
  saveOrderPending: "অর্ডার সেভ করুন",
  orderPlaced: "অর্ডার তৈরি হয়েছে",
  clothHandoverNotes: "কাপড় / হস্তান্তর নোট",
  startListening: "মাইক চাপুন — বলুন",
  stopListening: "শোনা বন্ধ করুন",
  voiceNoteLabel: "নোট (ঐচ্ছিক)",
  voiceDictationHint:
    "টাইপ করতে পারছেন না? মাইক চাপুন — কথা এখানে আসবে এবং অ্যাপের ভাষায় বদলাবে। সেভের আগে সম্পাদনা করুন।",
  voiceNameHint:
    "নাম টাইপ করুন বা বলুন — অ্যাপের ভাষায় বদলাবে (যেমন Ashok → অশোক)।",
  voiceScriptConvertHint:
    "ইংরেজি অক্ষর তেলুগু / হিন্দি / বাংলায় বদলায় যখন সেই ভাষা বেছে নেওয়া থাকে।",
  voicePieceHint: "প্রতিটি পিসের নামের পাশে মাইক চেপে বলুন।",
  billPresetPickTitle: "কাজ / আইটেম বেছে নিন",
  billPresetPickHint: "তালিকা থেকে বেছে নিন বা নিজের নাম টাইপ / বলুন",
  billPresetQtyPriceHint: "পিসের নামে ট্যাপ — তালিকা খুলবে। তারপর পরিমাণ ও দাম দিন।",
  pieceNamePlaceholder: "তালিকা থেকে বেছে নিতে ট্যাপ করুন",
  billPresetGroup: {
    embroideryWork: "এমব্রয়ডারি ও কাজ",
    blouse: "ব্লাউজ",
    garments: "ড্রেস ও টপ",
    sareeUniform: "শাড়ি ফল ও ইউনিফর্ম",
  },
  billPreset: {
    maggamWork: "মগ্গম কাজ",
    computerEmbroidery: "কম্পিউটার এমব্রয়ডারি",
    machineEmbroidery: "মেশিন এমব্রয়ডারি",
    liningBlouse: "লাইনিং ব্লাউজ",
    normalBlouse: "সাধারণ ব্লাউজ",
    modelBlouse: "মডেল ব্লাউজ",
    shapeBlouse: "শেপ ব্লাউজ",
    lining: "লাইনিং",
    blousePiece: "ব্লাউজ পিস",
    dress: "ড্রেস",
    top: "টপ",
    restitching: "রিস্টিচিং",
    sareeFalls: "শাড়ি ফল",
    sareeFallsMudulu: "শাড়ি ফল ও মুদুলু",
    hangings: "হ্যাংgings",
    schoolUniform: "স্কুল ইউনিফর্ম",
  },
  micPermissionError: "স্পিচ-টু-টেক্সটের জন্য মাইকের অনুমতি দিন",
  workers: "পার্টনার",
  workPartnerAppEntry: "ওয়ার্ক পার্টনার — দোকানের কাজ দেখুন",
  workPartnerAppTitle: "ওয়ার্ক পার্টনার জবস",
  workPartnerAppHint: "দোকানের খোলা অনুরোধ — গ্রহণ করুন বা ফিল্টার করুন।",
  workPartnerOpenOnlyHint: "এখানে শুধু খোলা অনুরোধ দেখা যায়। বাতিল অনুরোধ লুকানো থাকে।",
  workPartnerUnknownShop: "দোকান",
  workerPartnerRole: {
    maggamWorker: "মগ্গম ওয়ার্কার",
    machineEmbroidery: "মেশিন এমব্রয়ডারি",
    stitchingWorker: "স্টিচিং",
    cuttingMaster: "কাটিং মাস্টার",
  },
  workPartnerShopGuideTitle: "গৃহীত পার্টনার কোথায় দেখবেন",
  workPartnerShopGuideStep1: "ওয়ার্কার ধরন, তারিখ ও দিন দিয়ে অনুরোধ পাঠান।",
  workPartnerShopGuideStep2: "কেউ গ্রহণ করলে Accepted স্ট্যাটাস — Accepted ফিল্টারে ট্যাপ করুন।",
  workPartnerShopGuideStep3: "প্রোফাইলে লোকেশন, অভিজ্ঞতা, রেটিং দেখে WhatsApp বা কলে নিশ্চিত করুন।",
  workerPartnerStatusAccepted: "গৃহীত",
  workerPartnerFilterAll: "সব",
  workerPartnerFilterOpen: "খোলা",
  workerPartnerFilterAccepted: "গৃহীত",
  workPartnerAcceptedCount: "{n} পার্টনার গ্রহণ করেছে — নিচে প্রোফাইল দেখুন",
  workPartnerRefreshRequests: "রিফ্রেশ",
  workPartnerNoAcceptedYet: "এখনও কেউ গ্রহণ করেনি। রিফ্রেশ চাপুন।",
  workPartnerLocationLabel: "লোকেশন",
  workPartnerRatingLabel: "রেটিং",
  workPartnerFilledNoProfile: "ভরা আছে, কিন্তু পার্টনার প্রোফাইল নেই।",
  workPartnerAcceptedProfile: "গৃহীত পার্টনার প্রোফাইল",
  workPartnerAccept: "অনুরোধ গ্রহণ করুন",
  workPartnerAcceptTitle: "এই কাজ গ্রহণ করুন",
  workPartnerAcceptHint: "আপনার বিবরণ দিন — দোকান প্রোফাইল দেখে যোগাযোগ করতে পারবে।",
  workPartnerNamePlaceholder: "আপনার নাম",
  workPartnerYearsExperience: "অভিজ্ঞতা (বছর)",
  workPartnerYearsUnit: "বছর",
  workPartnerAddressOptional: "ঠিকানা (ঐচ্ছিক)",
  workPartnerAddressPlaceholder: "এলাকা / ল্যান্ডমার্ক",
  workPartnerLocationLinkOptional: "ম্যাপ / লোকেশন লিংক (ঐচ্ছিক)",
  workPartnerAcceptConfirm: "গ্রহণ নিশ্চিত করুন",
  workPartnerAccepting: "গ্রহণ হচ্ছে…",
  workPartnerAcceptedProfile: "গৃহীত পার্টনার",
  workPartnerViewLocation: "ম্যাপে লোকেশন খুলুন",
  workPartnerNoRatingsYet: "এখনও রেটিং নেই",
  workPartnerRatePartner: "পার্টনারকে রেট করুন",
  workPartnerYourRating: "আপনার রেটিং",
  workPartnerContactPartnerWhatsApp: "পার্টনার WhatsApp",
  workPartnerCallPartner: "পার্টনার কল",
  workPartnerShopWhatsAppIntro: "হাই, আপনি যে ওয়ার্কার অনুরোধ গ্রহণ করেছেন সে বিষয়ে",
  shopBootLoadingTabs: "1/2 হোম, অর্ডার, বিল, পার্টনার লোড…",
  shopBootLoadingDesigns: "2/2 ডিজাইন লোড…",
  loadingDesigns: "লোড হচ্ছে…",
  weeklyIncome: "সাপ্তাহিক আয়",
  monthlyIncome: "মাসিক আয়",
  createBill: "বিল তৈরি",
  pending: "মুলতুবি",
  paid: "পরিশোধিত",
  status: {
    pending: "চলমান",
    readyToPick: "নেওয়ার জন্য প্রস্তুত",
    measuring: "মাপ",
    stitching: "সেলাই",
    ready: "প্রস্তুত",
    delivered: "ডেলিভারি হয়েছে",
    cancelled: "বাতিল",
  },
  categories: {
    maggam: "মগ্গম",
    embroidery: "কম্পিউটার এমব্রয়ডারি",
    blouse: "ব্লাউজ ডিজাইন",
    dress: "ড্রেস মডেল",
    children: "শিশু পোশাক",
    stitched: "সেলাই করা ডিজাইন",
  },
  workerPartnerRequestTitle: "কর্মী দরকার?",
  workerPartnerSubmitRequest: "পার্টনারদের কাছে অনুরোধ পাঠান",
  workerPartnerPageHint:
    "মগ্গম, সেলাই বা অন্য কর্মী লাগলে অনুরোধ তুলুন। খোলা অনুরোধ আপনার শহরের ওয়ার্ক পার্টনার অ্যাপে দেখা যায়।",
  orderShowDetails: "বিস্তারিত দেখুন",
  shareOrderWork: "ওয়ার্ক পার্টনারের সাথে শেয়ার",
  photosFromGallery: "গ্যালারি থেকে ছবি",
  noData: "এখনও কিছু নেই",
  pickSavedCustomer: "সংরক্ষিত গ্রাহক বেছে নিন",
  selectCustomerOptional: "ঐচ্ছিক — তালিকা থেকে বেছে নিন",
  measurementPersonLabel: "কার মাপ?",
  measurementType: "মাপের ধরন",
  registeredCustomerFoundHint: "নিবন্ধিত গ্রাহক পাওয়া গেছে",
  newCustomerWalkInHint: "নতুন গ্রাহক — অর্ডার চালিয়ে যেতে পারেন",
};

function deepMerge(base, over) {
  if (Array.isArray(base) || Array.isArray(over)) return over ?? base;
  if (over === null || over === undefined) return base;
  if (typeof over !== "object" || typeof base !== "object" || base === null) return over;
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) {
    if (
      k in out &&
      typeof out[k] === "object" &&
      out[k] &&
      typeof v === "object" &&
      v &&
      !Array.isArray(v)
    ) {
      out[k] = deepMerge(out[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

const merged = deepMerge(en, bn);
fs.writeFileSync(path.join(root, "bn.json"), JSON.stringify(merged, null, 2) + "\n", "utf8");
console.log("Wrote bn.json with", Object.keys(merged).length, "top-level keys");
