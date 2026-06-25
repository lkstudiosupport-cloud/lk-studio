export const LEGAL_CONTACT_EMAIL = "lkstudio.support@gmail.com";
export const LEGAL_PRIVACY_URL = "https://lk-studio-1.onrender.com/privacy";
export const LEGAL_TERMS_URL = "https://lk-studio-1.onrender.com/terms";

export type LegalSection = { title: string; body: string[] };

export const privacySectionsEn: LegalSection[] = [
  {
    title: "Introduction",
    body: [
      "LK Studio (“we”, “us”) provides a tailoring shop management platform for shop owners and their customers. This Privacy Policy explains what data we collect, how we use it, and your choices.",
      `Questions: ${LEGAL_CONTACT_EMAIL}`,
    ],
  },
  {
    title: "Information we collect",
    body: [
      "Account details: name, mobile number, email (if provided), shop name, and profile information you enter.",
      "Phone numbers: used for login, SMS OTP verification, order updates, and billing communication between shops and customers.",
      "Photos and images: profile photos, design catalog images, order reference photos, measurement diagrams, bill receipts, and UPI QR codes you upload.",
      "Some catalog design reference images (for example maggam and embroidery samples) are AI-generated illustrations provided for inspiration; see our Terms of Service for how we handle reports and removal.",
      "Location: address text, map links, and GPS coordinates when you choose “use my location” for delivery or shop directions.",
      "Voice input: when you use voice-to-text for notes, audio may be processed on your device or sent to speech services you enable; we store the resulting text you save.",
      "Payment-related data: subscription status, Razorpay payment references, UPI IDs you display to customers, and bill payment records. We do not store full card numbers.",
      "Device and usage: device identifiers for trusted-device login, session cookies, and basic server logs (IP, timestamps) for security.",
    ],
  },
  {
    title: "How we use your information",
    body: [
      "Provide login, orders, measurements, bills, subscriptions, and shop–customer messaging features.",
      "Send mobile OTP login codes when you request them.",
      "Process subscription payments through Razorpay when configured.",
      "Improve reliability, prevent abuse, and comply with legal obligations.",
    ],
  },
  {
    title: "Sharing",
    body: [
      "Shop and customer data is shared between connected parties only as needed for orders and bills (e.g. your phone or address visible to a shop you order from).",
      "We use hosting and infrastructure providers (e.g. Render, Supabase/PostgreSQL, object storage) under contractual safeguards.",
      "We do not sell your personal information.",
    ],
  },
  {
    title: "Data retention",
    body: [
      "Active account data is kept while your account exists and as needed to operate the service.",
      "Orders, bills, and uploaded images may remain linked to shop records until deleted by you or the shop, or until account deletion.",
      "When you delete your account in the app, we permanently remove your user profile and associated customer or shop data as described in our account deletion flow.",
      "Backups and logs may retain data for a limited period before automatic purging.",
    ],
  },
  {
    title: "Security",
    body: [
      "We use HTTPS, hashed passwords, signed sessions, and access controls. No method of transmission or storage is 100% secure.",
    ],
  },
  {
    title: "Your rights",
    body: [
      "Access and update profile information in the app.",
      "Delete your account and associated data from Profile → Delete my account.",
      "Contact us at " + LEGAL_CONTACT_EMAIL + " for privacy requests.",
    ],
  },
  {
    title: "Children",
    body: ["LK Studio is intended for adults running or using tailoring businesses. We do not knowingly collect data from children under 13."],
  },
  {
    title: "Changes",
    body: ["We may update this policy. The “Last updated” date below will change. Continued use after updates means you accept the revised policy."],
  },
];

export const termsSectionsEn: LegalSection[] = [
  {
    title: "Agreement",
    body: [
      "By registering for or using LK Studio you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the app.",
      "You must accept these terms, including the AI-generated catalog images policy and the shop stitched designs policy below, before creating an account.",
      `Support: ${LEGAL_CONTACT_EMAIL}`,
    ],
  },
  {
    title: "Service",
    body: [
      "LK Studio helps tailoring shops manage designs, orders, measurements, bills, and customer relationships. Customers can browse shops, place orders, and receive bills.",
      "Features may change. We may suspend the service for maintenance or legal reasons.",
    ],
  },
  {
    title: "Accounts",
    body: [
      "You must provide accurate information and keep your login credentials secure.",
      "One mobile number may be registered as either a shop account or a customer account, not both.",
      "You are responsible for activity under your account.",
    ],
  },
  {
    title: "Shop and customer content",
    body: [
      "You retain ownership of photos and content you upload. You grant us a license to host and display that content to provide the service.",
      "Do not upload unlawful, infringing, or harmful content.",
    ],
  },
  {
    title: "Shop stitched designs in the app catalog",
    body: [
      "When a shop uploads stitched design photos to LK Studio (under Stitched designs or similar shop-owned galleries), the shop retains ownership of those photos.",
      "The shop also grants LK Studio a non-exclusive, royalty-free license to use, reproduce, and display those shop-uploaded designs within the LK Studio app—for example in the shared design catalog, browse screens, inspiration sections, or related in-app features—so customers and other shops can discover tailoring work through the platform.",
      "LK Studio may apply reasonable modifications when featuring shop-uploaded designs, including but not limited to: watermarks, the uploading shop’s name or shop code, resizing, cropping, compression, category or size grouping, and presentation alongside LK Studio admin catalog designs.",
      "Attribution will identify the source shop where practicable. This license is limited to operating and promoting LK Studio; we do not claim ownership of your original photos.",
      "If a shop does not want a particular uploaded design used in this way, the shop may delete it from their gallery or contact us at " +
        LEGAL_CONTACT_EMAIL +
        " to request removal from app-wide catalog use.",
      "By uploading stitched designs as a shop, you confirm you have the right to share those images and agree to this catalog-use license.",
    ],
  },
  {
    title: "AI-generated catalog images",
    body: [
      "Some design reference images shown in the LK Studio catalog (for example maggam work and embroidery samples) are created using artificial intelligence (AI). They are provided for illustration and inspiration only.",
      "We do not intentionally copy or use any real person's identity, portrait, likeness, or personal data in these AI-generated images.",
      "If you believe any catalog image infringes your copyright, trademark, privacy, or other rights—or wrongly depicts you or your work—contact us at " +
        LEGAL_CONTACT_EMAIL +
        " with reasonable proof (for example, links to your original work, registration documents, or other supporting evidence).",
      "After we receive your report and verify it in good faith, we will remove or replace the disputed image within seven (7) calendar days.",
      "By creating an account and continuing to use LK Studio, you acknowledge and accept this AI-generated images policy.",
    ],
  },
  {
    title: "Payments and subscriptions",
    body: [
      "Shop and customer subscriptions may be billed monthly through Razorpay or other methods we enable.",
      "Fees, trials, and refunds are described in the app at purchase time. Payment disputes should be raised with us at " +
        LEGAL_CONTACT_EMAIL +
        ".",
      "Shops may collect payments from customers outside LK Studio (cash, UPI, etc.); those transactions are between shop and customer.",
    ],
  },
  {
    title: "Acceptable use",
    body: [
      "No harassment, fraud, spam, or attempts to breach security.",
      "No misuse of phone numbers, location data, or uploaded images.",
    ],
  },
  {
    title: "Disclaimer",
    body: [
      "The service is provided “as is”. We do not guarantee uninterrupted operation or fitness for a particular business outcome.",
      "We are not a party to stitching contracts between shops and customers.",
    ],
  },
  {
    title: "Limitation of liability",
    body: [
      "To the extent permitted by law, our liability is limited to the amount you paid us in the twelve months before the claim, or INR 5,000, whichever is greater.",
    ],
  },
  {
    title: "Termination",
    body: [
      "You may delete your account at any time from Profile settings.",
      "We may suspend or terminate accounts that violate these terms.",
    ],
  },
  {
    title: "Governing law",
    body: ["These terms are governed by the laws of India. Courts in India shall have jurisdiction, subject to applicable consumer protection rules."],
  },
  {
    title: "Contact",
    body: [`${LEGAL_CONTACT_EMAIL}`],
  },
];

/** Key section titles for hi/te — full body falls back to English via LegalPage. */
export const privacySectionTitlesHi: Record<string, string> = {
  Introduction: "परिचय",
  "Information we collect": "हम कौन सा डेटा एकत्र करते हैं",
  "How we use your information": "हम आपकी जानकारी का उपयोग कैसे करते हैं",
  Sharing: "साझा करना",
  "Data retention": "डेटा रखना",
  Security: "सुरक्षा",
  "Your rights": "आपके अधिकार",
  Children: "बच्चे",
  Changes: "बदलाव",
};

export const privacySectionTitlesTe: Record<string, string> = {
  Introduction: "పరిచయం",
  "Information we collect": "మేము సేకరించే సమాచారం",
  "How we use your information": "మీ సమాచారాన్ని ఎలా ఉపయోగిస్తాము",
  Sharing: "షేరింగ్",
  "Data retention": "డేటా నిల్వ",
  Security: "భద్రత",
  "Your rights": "మీ హక్కులు",
  Children: "పిల్లలు",
  Changes: "మార్పులు",
};

export const termsSectionTitlesHi: Record<string, string> = {
  Agreement: "समझौता",
  Service: "सेवा",
  Accounts: "खाते",
  "Shop and customer content": "दुकान और ग्राहक सामग्री",
  "Shop stitched designs in the app catalog": "ऐप कैटलॉग में दुकान की सिली हुई डिज़ाइन",
  "AI-generated catalog images": "AI द्वारा बनाई कैटलॉग तस्वीरें",
  "Payments and subscriptions": "भुगतान और सदस्यता",
  "Acceptable use": "स्वीकार्य उपयोग",
  Disclaimer: "अस्वीकरण",
  "Limitation of liability": "दायित्व की सीमा",
  Termination: "समाप्ति",
  "Governing law": "लागू कानून",
  Contact: "संपर्क",
};

export const termsSectionTitlesTe: Record<string, string> = {
  Agreement: "ఒప్పందం",
  Service: "సేవ",
  Accounts: "ఖాతాలు",
  "Shop and customer content": "షాప్ మరియు కస్టమర్ కంటెంట్",
  "Shop stitched designs in the app catalog": "యాప్ క్యాటలాగ్‌లో షాప్ కుట్టిన డిజైన్‌లు",
  "AI-generated catalog images": "AI సృష్టించిన క్యాటలాగ్ చిత్రాలు",
  "Payments and subscriptions": "చెల్లింపులు మరియు సబ్‌స్క్రిప్షన్‌లు",
  "Acceptable use": "అనుమతించిన వినియోగం",
  Disclaimer: "నిరాకరణ",
  "Limitation of liability": "బాధ్యత పరిమితి",
  Termination: "ముగింపు",
  "Governing law": "వర్తించే చట్టం",
  Contact: "సంప్రదించండి",
};
