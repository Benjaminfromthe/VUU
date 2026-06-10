// ==========================================
// 🌐 VUU Transport English/Kinyarwanda Translation Engine
// ==========================================

const VUU_DICT = {
  rw: {
    // Nav & Common Links
    "Routes": "Ibyerekezo",
    "Book Ride": "Kata Itike",
    "Login": "Injira",
    "Register": "Iyandikishe",
    "VUU Transport": "VUU Transport",
    "My Dashboard": "Ikarita Yanjye",
    "Driver Dashboard": "Ikarita y'Umushoferi",
    "Admin Panel": "Ubuyobozi",
    "Logout": "Sohoka",
    "Return Home": "Subira ku Rugo",
    "View Other Routes": "Reba ibindi Byerekezo",
    "Book Now": "Kata Itike Sasa",
    "Home": "Urugo",
    "Return Home": "Subira ku Ntangiriro",

    // index.html
    "Book Your Ride Across Rwanda": "Kata Itike Yerekeza Aho Ari Ho Hose mu Rwanda",
    "Travel safely and comfortably to anywhere in the country.": "Genda neza kandi utekanye mu gihugu cyose.",
    "Book a Trip Quick Search": "Shakisha Umuyoboro mu buryo bwihuse",
    "From": "Aho Uhaguruka",
    "To": "Aho Ujana",
    "Date": "Itariki",
    "Seats": "Imyanya",
    "Search Rides": "Shakisha Imbisi",
    "How It Works": "Uko Bikora",
    "1. Search": "1. Shakisha",
    "Select your origin, destination, and preferred date to travel.": "Hitamo aho uhagurukira, aho uya, n'itariki wifuza kugendaho.",
    "2. Book": "2. Kata Itike",
    "Secure your seat and choose your payment method (MoMo, Airtel, Cash).": "Fata umwanya wawe kandi uhitemo uburyo bwo kwishyura (MoMo, Airtel, Cash).",
    "3. Travel": "3. Agenda",
    "Enjoy a comfortable, safe trip across beautiful Rwanda.": "Gira urugendo rwiza, rufite umutekano mu Rwanda rwiza.",
    "Kigali, Rwanda | +250 788 000 000 | info@vuu.rw": "Kigali, Rwanda | +250 788 000 000 | info@vuu.rw",
    "All rights reserved.": "Uburenganzira bwose burasigasirwa.",

    // routes.html
    "Available Routes & Pricing": "Ibyerekezo Bihari n'Ibiciro",
    "Transparent pricing across Rwanda. No hidden fees.": "Ibiciro bisobanutse neza mu Rwanda. Nta giciro gihishe.",
    "Estimated Time": "Igihe Bitwara (Igereranyo)",
    "Estimated Time:": "Igihe Bitwara:",
    "Price (RWF)": "Igiciro (Frw)",
    "Action": "Gahunda",
    "Book": "Kata Itike",
    "Search dynamic routes...": "Shakisha ibyerekezo...",
    "Query Route Weather Conditions (AI Tracker)": "Ibihe by'Ikirere ku Ryerekezo (AI Tracker)",
    "Analyze Weather & Road Risk": "Shakisha Ibihe & Umutekano w'Umuhanda",
    "VUU Advanced Demands Analytics": "Ibipimo by'Ubwinshi bw'Abagenzi n'Ibiciro bya VUU",
    "Live demand surges predicted by neural dispatch network: Available seats and active pricing variables.": "Ibipimo by'ubwinshi bw'abagenzi n'imbisi zihari biragenda neza:",
    "Route": "Icyerekezo",
    "Base Fare": "Igiciro Kidahinduka",
    "Demand Level": "Urwego rw'Ubwinshi",
    "Surge Factor": "Inyongera y'Akazi",
    "Kigali to Musanze": "Kigali werekeza Musanze",
    "Kigali to Huye": "Kigali werekeza Huye",
    "Kigali to Rubavu": "Kigali werekeza Rubavu",
    "Kigali to Gisenyi": "Kigali werekeza Gisenyi",
    "Kigali to Butare": "Kigali werekeza Butare",
    "Musanze to Rubavu": "Musanze werekeza Rubavu",
    "Kigali to Nyagatare": "Kigali werekeza Nyagatare",
    "Kigali to Rwamagana": "Kigali werekeza Rwamagana",
    "Kigali to Muhanga": "Kigali werekeza Muhanga",
    "High": "Hafi cyane",
    "Medium": "Hagati",
    "Low": "Nkeya",

    // book.html
    "Book Your Trip": "Katisha Urugendo",
    "Full Name": "Amazina Yombi",
    "Phone Number": "Inomero ya Terefone",
    "Travel Date & Time": "Itariki n'Isaha bikubiyemo",
    "Number of Seats": "Umubare w'Imyanya",
    "Select Driver": "Hitamo Umushoferi",
    "Any Available (Auto-routing)": "Uwaboneka Wese (Auto-routing)",
    "Promo Code": "Inyandiko y'Ibiciro Gabanuka (Promo Code)",
    "Secure Seat Now": "Gura Umwanya Sasa",
    "Total Calculated Fare": "Igiciro Cyose Hamwe",
    "Price per seat": "Igiciro ku mwanya umwe",
    "Standard discount": "Inyongera runsange",
    "Demand surge active": "Inyongera y'ubwinshi bw'abagenzi",
    "Final total price": "Igiciro cya nyuma",
    "Calculating route price...": "Kubara igiciro cy'icyerekezo...",
    "Price Per Seat:": "Igiciro ku Mwanya:",
    "Total Fare:": "Yose Hamwe:",
    "Active Promos:": "Poromoshini zihari:",

    // login.html
    "Account Login": "Injira mu Konti",
    "Email Address": "Imeri",
    "Password": "Ijambo ry'Ibanga",
    "Remember me": "Ibukire njye",
    "Sign In": "Injira",
    "Don't have an account?": "Nta konti ufite?",
    "Register here": "Iyandikishe hano",
    "Admin Login Prototype": "Urukuta rw'Ubuyobozi",

    // register.html
    "Create an Account": "Iyandikishe Kuri Konti",
    "Passenger": "Umugenzi",
    "Driver": "Umushoferi",
    "Confirm Password": "Subiramo Ijambo ry'Ibanga",
    "Vehicle Plate Number": "Inomero ya Puraku y'Imodoka",
    "Driver License Number": "Inomero y'Uruhushya rwo gutwara Ibinyabiziga",
    "Already have an account?": "Ufite konti?",
    "Login here": "Injira hano",

    // confirmation.html
    "Booking Confirmed!": "Itike Yemejwe!",
    "Your VUU trip has been successfully scheduled. Present this ticket at the boarding terminal.": "Urugendo rwawe rwa VUU rwashyizwe kuri gahunda neza. Erekana iyi tike aho binjirira.",
    "Reference Code": "Inomero y'Icyerekezo",
    "Passenger Name": "Izina ry'Umugenzi",
    "Carrier": "Ikamyo / Imodoka",
    "Seats Booked": "Imyanya Yafashwe",
    "WhatsApp Sharing Widget": "Ohereza Itike ya VUU kuri WhatsApp",
    "Share VUU Booking Instantly:": "Ohereza Itike ya VUU mu buryo bwihuse:",
    "Send to WhatsApp": "Ohereza kuri WhatsApp",
    "Confirming booking status...": "Kuzamura urugendo...",

    // passenger-dashboard.html
    "Your Digital Ticketing Dashboard": "Urubuga Rwawe rwa Tiketi zo mu buryo bw'Ikoranabuhanga",
    "Welcome, Passenger. Track your scheduled journeys, print mobile tickets, or request rapid AI ticket upgrades below.": "Uhawe ikaze, Mugenzi. Kurikirana ingendo zawe, ishyireho tike kuri telefone, cyangwa usabe poromoshini ku buryo bwihuse bwa AI hano.",
    "Upcoming Bookings": "Ingendo Ziteganyijwe",
    "Scan & Board Express": "Erekana Tike Winjire mu buryo bwihuse",
    "Past Bookings": "Ingendo Zashize",
    "Need to Return? Rapid Book Return Journey (AI)": "Ukeneye Gusubira? Sura Uburyo bwo Kugurira Itike yo Gusubira (AI)",
    "Select a past journey above to automatically generate a recommended return schedule using active passenger density predictions.": "Hitamo urugendo rwashize haruguru kugira ngo uburyo bwa AI bugutegurire gahunda yo gusubira dushingiye ku modoka zihari n'umubare w'abagenzi.",
    "Generate Return Plan (AI)": "Tegura Uburyo bwo Gusubira (AI)",
    "No past journeys found. Book a ride first!": "Nta ngendo zashize zabonetse. Katisha itike bwa mbere!",

    // driver-dashboard.html
    "Duty Status: ONLINE": "Akazi: URI KUGARAGARA",
    "Duty Status: OFFLINE": "Akazi: NTURI KUGARAGARA",
    "You are visible & receiving passenger trip queues.": "Uri kugaragara kandi uri kwakira gahunda z'ingendo z'abagenzi.",
    "Snoozed. Turn on to let dispatch allocate bookings.": "Wafunze. Fungura kugira ngo Ubuyobozi buhe gahunda z'ingendo.",
    "Secure Earnings Ledger": "Igitabo cy'Inyungu z'Urugendo",
    "Today": "Uyu Munsi",
    "This Week": "Iyi Cyumweru",
    "This Month": "Uyu Mwenzi",
    "No Active Dispatch": "Nta cyerekezo cy'akazi gihari",
    "GPS Fleet Dispatcher": "Ikarita ya GPS y'Akazi",
    "Waiting for an active accepted assignment from your queue below to start micro GPS route simulation...": "Utegerezanyije amatsiko gahunda y'akazi yo kwemezwa mu rutonde ruri muryandiko rugutegereje kugira ngo utangire simulation y'urugendo k'ikarita...",
    "Open Passenger Pickup Point in Google Maps": "Fungura aho ufatira umugenzi muri Google Maps",
    "Accept Trip": "Yemera Urugendo",
    "Decline": "Guhakana",
    "Board & Complete Journey": "Urugendo Rushojwe",
    "Driver History Ledger": "Urupapuro rw'Ingendo Zashize",
    "No active assignments today. Take a break or check routes!": "Nta gahunda y'ingendo ihari uyu munsi. Ruhuka cyangwa urebe ibyerekezo!",
    "No past assignments logged.": "Nta gahunda z'ingendo zashize zanditswe.",

    // admin.html
    "VUU Operations Control Room": "Ibiro Bikuru by'Imiyoborere ya VUU",
    "Intelligent Weekly Demand Forecast (AI-Powered)": "Ibipimo by'Umutekano n'Abagenzi mu Cyumweru (AI-Powered)",
    "Analyzing live telemetry...": "Kureba ibipimo by'akazi mu buryo bwa live...",
    "Forecast Computed": "Ibipimo Byamaze Kuboneka",
    "Standard analysis offline": "Ibipimo bisanzwe ntibiri gukora",
    "Recent Bookings": "Ingendo Nshya Zahamagawe",
    "Pending Bookings": "Ingendo Zitegereje Kwemezwa",
    "Manage Drivers": "Cunga Abashoferi",
    "Passenger Accounts": "Konti z'Abagenzi",
    "Route Scheduling Settings": "Gahunda y'Ibyerekezo by'Ingendo",
    "Add Route": "Ongeramo Icyerekezo nshya"
  }
};

// State manager for current active language
let currentLang = localStorage.getItem('vuu-language') || 'en';

// Recursive DOM translator walker
function walkDOMToTranslate(node, lang) {
  if (node.nodeType === Node.ELEMENT_NODE) {
    // Skip script elements, style sheets, and translation toggle itself
    if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE' || node.classList.contains('vuu-lang-toggle')) {
      return;
    }

    // 1. Placeholder translation
    if (node.hasAttribute('placeholder')) {
      const placeholder = node.getAttribute('placeholder');
      if (node._originalPlaceholder === undefined) {
        node._originalPlaceholder = placeholder;
      }
      const orig = node._originalPlaceholder.trim();
      if (lang === 'rw' && VUU_DICT.rw[orig]) {
        node.setAttribute('placeholder', VUU_DICT.rw[orig]);
      } else {
        node.setAttribute('placeholder', node._originalPlaceholder);
      }
    }

    // 2. Select option translation
    if (node.tagName === 'OPTION') {
      const txt = node.innerText;
      if (node._originalText === undefined) {
        node._originalText = txt;
      }
      const orig = node._originalText.trim();
      if (lang === 'rw' && VUU_DICT.rw[orig]) {
        node.innerText = VUU_DICT.rw[orig];
      } else {
        node.innerText = node._originalText;
      }
    }

    // 3. Inputs of submit/button type value translation
    if (node.tagName === 'INPUT' && (node.type === 'submit' || node.type === 'button')) {
      const val = node.value;
      if (node._originalValue === undefined) {
        node._originalValue = val;
      }
      const orig = node._originalValue.trim();
      if (lang === 'rw' && VUU_DICT.rw[orig]) {
        node.value = VUU_DICT.rw[orig];
      } else {
        node.value = node._originalValue;
      }
    }
  } else if (node.nodeType === Node.TEXT_NODE) {
    const text = node.nodeValue;
    if (text && text.trim() !== '') {
      if (node._originalText === undefined) {
        node._originalText = text;
      }
      const orig = node._originalText.trim();
      
      // Clean duplicate or trailing spacing boundaries
      const leadingSpaces = node._originalText.match(/^\s*/)[0];
      const trailingSpaces = node._originalText.match(/\s*$/)[0];

      if (lang === 'rw') {
        if (VUU_DICT.rw[orig]) {
          node.nodeValue = leadingSpaces + VUU_DICT.rw[orig] + trailingSpaces;
        } else {
          // Fallback fuzzy segment mapping for compound strings
          let matched = false;
          for (const key of Object.keys(VUU_DICT.rw)) {
            if (orig === key) {
              node.nodeValue = leadingSpaces + VUU_DICT.rw[key] + trailingSpaces;
              matched = true;
              break;
            }
          }
        }
      } else {
        // Reset to original English values
        node.nodeValue = node._originalText;
      }
    }
  }

  // Iterate to children nodes
  let child = node.firstChild;
  while (child) {
    walkDOMToTranslate(child, lang);
    child = child.nextSibling;
  }
}

// Global invocation to apply current language selections
function applyTranslations(lang) {
  currentLang = lang;
  localStorage.setItem('vuu-language', lang);
  walkDOMToTranslate(document.body, lang);
  updateToggleUI();
}

// Injects the sleek language selector widget
function renderLangToggle() {
  if (document.getElementById('vuu-language-toggle')) return;

  const toggle = document.createElement('div');
  toggle.id = 'vuu-language-toggle';
  toggle.className = 'vuu-lang-toggle';
  toggle.style.position = 'fixed';
  toggle.style.bottom = '20px';
  toggle.style.left = '20px';
  toggle.style.zIndex = '99999';
  toggle.style.display = 'flex';
  toggle.style.alignItems = 'center';
  toggle.style.gap = '4px';
  toggle.style.background = 'rgba(0, 87, 168, 0.95)';
  toggle.style.backdropFilter = 'blur(4px)';
  toggle.style.padding = '6px 12px';
  toggle.style.borderRadius = '24px';
  toggle.style.boxShadow = '0 4px 15px rgba(0,0,0,0.25)';
  toggle.style.border = '2px solid rgba(255,255,255,0.8)';
  toggle.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  toggle.innerHTML = `
    <button id="lang-sec-en" style="border: none; background: transparent; color: white; padding: 4px 8px; font-size: 0.8rem; font-weight: bold; border-radius: 12px; cursor: pointer; transition: all 0.2s;">EN</button>
    <span style="color: rgba(255,255,255,0.4); font-size: 0.8rem;">|</span>
    <button id="lang-sec-rw" style="border: none; background: transparent; color: white; padding: 4px 8px; font-size: 0.8rem; font-weight: bold; border-radius: 12px; cursor: pointer; transition: all 0.2s;">RW</button>
  `;

  document.body.appendChild(toggle);

  document.getElementById('lang-sec-en').addEventListener('click', () => applyTranslations('en'));
  document.getElementById('lang-sec-rw').addEventListener('click', () => applyTranslations('rw'));

  updateToggleUI();
}

function updateToggleUI() {
  const btnEn = document.getElementById('lang-sec-en');
  const btnRw = document.getElementById('lang-sec-rw');
  if (!btnEn || !btnRw) return;

  if (currentLang === 'en') {
    btnEn.style.background = '#ffffff';
    btnEn.style.color = '#0057A8';
    btnRw.style.background = 'transparent';
    btnRw.style.color = '#ffffff';
  } else {
    btnRw.style.background = '#ffffff';
    btnRw.style.color = '#0057A8';
    btnEn.style.background = 'transparent';
    btnEn.style.color = '#ffffff';
  }
}

// Injects standard service worker triggers
function registerPwaWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('[PWA] VUU Service Worker registered at scope:', reg.scope);
      })
      .catch(err => {
        console.error('[PWA] VUU Service Worker setup failed:', err);
      });
  }
}

// Bootstrapping listeners
document.addEventListener('DOMContentLoaded', () => {
  renderLangToggle();
  applyTranslations(currentLang);
  registerPwaWorker();

  // Set up MutationObserver to translate live API / micro-frontend elements
  const observer = new MutationObserver((mutations) => {
    let shouldTranslate = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldTranslate = true;
        break;
      }
    }
    if (shouldTranslate) {
      walkDOMToTranslate(document.body, currentLang);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
});
