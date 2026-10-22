"""Curated healthcare knowledge base (EN/HI/GU) + safe chatbot intent engine.

Educational content only. The assistant NEVER diagnoses or prescribes. Emergency
language always redirects to professional/emergency help.
"""

EDU_NOTE = {
    "en": "General health education only — not a diagnosis. Please consult a qualified healthcare professional for personal advice.",
    "hi": "यह केवल सामान्य स्वास्थ्य शिक्षा है — निदान नहीं। व्यक्तिगत सलाह के लिए योग्य चिकित्सक से संपर्क करें।",
    "gu": "આ ફક્ત સામાન્ય આરોગ્ય શિક્ષણ છે — નિદાન નથી. વ્યક્તિગત સલાહ માટે લાયક તબીબનો સંપર્ક કરો.",
}

EMERGENCY_REPLY = {
    "en": "🚨 What you describe could be an emergency. Please seek immediate help: call your local emergency number (India: 108/112) or go to the nearest emergency department right away. If you are in this hospital, use the Emergency module to raise a request. I cannot diagnose — a qualified professional must assess you urgently.",
    "hi": "🚨 आपके लक्षण आपातकालीन हो सकते हैं। तुरंत मदद लें: स्थानीय आपातकालीन नंबर पर कॉल करें (भारत: 108/112) या निकटतम आपातकालीन विभाग जाएं। मैं निदान नहीं कर सकता — योग्य चिकित्सक से तुरंत जांच कराएं।",
    "gu": "🚨 તમારા લક્ષણો તાત્કાલિક હોઈ શકે છે. તરત મદદ લો: સ્થાનિક ઈમરજન્સી નંબર પર કૉલ કરો (ભારત: 108/112) અથવા નજીકના ઈમરજન્સી વિભાગમાં જાઓ. હું નિદાન કરી શકતો નથી — લાયક તબીબ પાસે તાત્કાલિક તપાસ કરાવો.",
}

CRISIS_REPLY = {
    "en": "💙 I'm really glad you reached out. If you feel you may act on these thoughts, please contact a trusted person or a crisis helpline right now (India: Tele-MANAS 14416 / 1800-891-4416, 24x7). You matter, and qualified counsellors can help. This assistant cannot assess mental health — please connect with a human professional.",
    "hi": "💙 आपने संपर्क किया, यह अच्छी बात है। यदि आपको लगता है कि आप इन विचारों पर कार्य कर सकते हैं, तो तुरंत किसी विश्वसनीय व्यक्ति या संकट हेल्पलाइन (भारत: Tele-MANAS 14416, 24x7) से संपर्क करें। योग्य परामर्शदाता आपकी मदद कर सकते हैं।",
    "gu": "💙 તમે સંપર્ક કર્યો તે સારી વાત છે. જો તમને લાગે કે તમે આ વિચારો પર કાર્ય કરી શકો છો, તો તરત કોઈ વિશ્વસનીય વ્યક્તિ અથવા ક્રાઈસિસ હેલ્પલાઈન (ભારત: Tele-MANAS 14416, 24x7)નો સંપર્ક કરો. લાયક સલાહકારો તમને મદદ કરી શકે છે.",
}

EMERGENCY_KW = ["chest pain", "can't breathe", "cant breathe", "breathing difficulty", "unconscious", "fainted",
                "severe bleeding", "bleeding heavily", "stroke", "seizure", "overdose", "poison", "accident",
                "trauma", "heart attack", "छाती में दर्द", "सांस", "बेहोश", "खून", "छातीमां दुखावो", "શ્વાસ", "બેભાન", "લોહી"]
CRISIS_KW = ["suicide", "kill myself", "end my life", "self harm", "self-harm", "want to die", "आत्महत्या", "मरना", "આત્મહત્યા", "મરી જવું"]

# slug, category, keywords, title_en, body_en, title_hi, body_hi, title_gu, body_gu, source
ARTICLES = [
    ("fever-care", "general", ["fever", "temperature", "bukhar", "बुखार", "તાવ"],
     "Fever — Home Awareness", "Rest, drink fluids (water, ORS, soups), and monitor temperature. Seek prompt professional care for: fever above 103°F/39.4°C, lasting over 3 days, with rash, stiff neck, breathing difficulty, or in infants under 3 months.",
     "बुखार — घरेलू जानकारी", "आराम करें, तरल पदार्थ (पानी, ORS, सूप) लें और तापमान नापते रहें। इन स्थितियों में तुरंत चिकित्सक से मिलें: 103°F/39.4°C से अधिक बुखार, 3 दिन से अधिक, चकत्ते/गर्दन अकड़न/सांस की तकलीफ के साथ, या 3 माह से छोटे शिशु में।",
     "તાવ — ઘરેલું માહિતી", "આરામ કરો, પ્રવાહી (પાણી, ORS, સૂપ) લો અને તાપમાન માપતા રહો. આ સ્થિતિમાં તરત તબીબને મળો: 103°F/39.4°Cથી વધુ તાવ, 3 દિવસથી વધુ, ફોલ્લીઓ/ગરદન જકડાઈ/શ્વાસની તકલીફ સાથે, અથવા 3 મહિનાથી નાના બાળકમાં.",
     "General first-aid education; consult hospital staff"),
    ("diarrhea-ors", "general", ["diarrhea", "loose motion", "vomiting", "dast", "दस्त", "उल्टी", "ઝાડા", "ઉલટી"],
     "Diarrhoea — ORS Awareness", "Dehydration is the main danger. Give ORS after every loose stool, continue feeding, and watch for danger signs: very dry mouth, no urine for hours, blood in stool, or extreme weakness — seek care immediately.",
     "दस्त — ORS जागरूकता", "मुख्य खतरा निर्जलीकरण है। हर दस्त के बाद ORS दें, भोजन जारी रखें, और खतरे के संकेतों पर तुरंत चिकित्सक से मिलें: बहुत सूखा मुंह, घंटों पेशाब न आना, मल में खून या अत्यधिक कमजोरी।",
     "ઝાડા — ORS જાગૃતિ", "મુખ્ય ખતરો નિર્જલીકરણ છે. દરેક ઝાડા પછી ORS આપો, ખોરાક ચાલુ રાખો, અને જોખમી ચિહ્નો પર તરત તબીબને મળો: ખૂબ સૂકું મોં, કલાકો સુધી પેશાબ ન થવો, મળમાં લોહી કે અતિશય નબળાઈ.",
     "WHO ORS education materials (summary)"),
    ("diabetes-life", "chronic", ["diabetes", "sugar", "madhumeh", "मधुमेह", "शुगर", "ડાયાબિટીસ"],
     "Diabetes — Lifestyle Education", "Balanced meals, daily walking, maintaining healthy weight, avoiding tobacco/alcohol, and regular check-ups help manage blood sugar. Never start/stop medicines without your doctor's guidance.",
     "मधुमेह — जीवनशैली शिक्षा", "संतुलित भोजन, रोज़ टहलना, स्वस्थ वजन, तंबाकू/शराब से परहेज और नियमित जांच रक्त शर्करा नियंत्रण में मदद करते हैं। डॉक्टर की सलाह बिना दवा शुरू/बंद न करें।",
     "ડાયાબિટીસ — જીવનશૈલી શિક્ષણ", "સંતુલિત ભોજન, રોજ ચાલવું, તંદુરસ્ત વજન, તમાકુ/દારૂથી દૂર રહેવું અને નિયમિત તપાસ લોહીમાં શર્કરા નિયંત્રણમાં મદદ કરે છે. ડૉક્ટરની સલાહ વિના દવા શરૂ/બંધ ન કરો.",
     "General lifestyle education"),
    ("bp-life", "chronic", ["blood pressure", "hypertension", "bp ", "रक्तचाप", "ब्लड प्रेशर", "બ્લડ પ્રેશર"],
     "High Blood Pressure — Lifestyle Education", "Reduce salt, exercise regularly, manage stress and sleep, avoid tobacco, and take medicines exactly as prescribed. Sudden severe headache, chest pain, or vision changes need urgent professional assessment.",
     "उच्च रक्तचाप — जीवनशैली शिक्षा", "नमक कम करें, नियमित व्यायाम करें, तनाव/नींद का प्रबंधन करें, तंबाकू से बचें और दवा डॉक्टर के अनुसार ही लें। अचानक तेज सिरदर्द, सीने में दर्द या दृष्टि में बदलाव पर तुरंत जांच कराएं।",
     "હાઈ બ્લડ પ્રેશર — જીવનશૈલી શિક્ષણ", "મીઠું ઓછું કરો, નિયમિત કસરત કરો, તણાવ/ઊંઘનું સંચાલન કરો, તમાકુથી બચો અને દવા ડૉક્ટર મુજબ જ લો. અચાનક તીવ્ર માથાનો દુખાવો, છાતીમાં દુખાવો કે દૃષ્ટિમાં ફેરફાર થાય તો તાત્કાલિક તપાસ કરાવો.",
     "General lifestyle education"),
    ("child-vaccine", "child", ["vaccine", "vaccination", "immuniz", "टीका", "टीकाकरण", "રસી", "રસીકરણ"],
     "Child Vaccination Awareness", "Vaccines protect against serious diseases like polio, measles, and TB. Follow your country's immunization schedule, keep the vaccination card safe, and ask health workers about catch-up doses if any were missed.",
     "बाल टीकाकरण जागरूकता", "टीके पोलियो, खसरा, टीबी जैसी गंभीर बीमारियों से बचाते हैं। टीकाकरण अनुसूची का पालन करें, कार्ड सुरक्षित रखें, और कोई खुराक छूटी हो तो स्वास्थ्य कार्यकर्ता से कैच-अप खुराक पूछें।",
     "બાળ રસીકરણ જાગૃતિ", "રસીઓ પોલિયો, ઓરી, ટીબી જેવા ગંભીર રોગોથી બચાવે છે. રસીકરણ સમયપત્રકનું પાલન કરો, કાર્ડ સાચવો, અને કોઈ ડોઝ રહી ગયો હોય તો આરોગ્ય કાર્યકરને કેચ-અપ ડોઝ વિશે પૂછો.",
     "National immunization education (summary)"),
    ("pregnancy-care", "maternal", ["pregnan", "maternal", "delivery", "गर्भ", "प्रसव", "સગર્ભા", "પ્રસૂતિ"],
     "Pregnancy — Care Awareness", "Attend all antenatal check-ups, eat iron-rich foods, take supplements only as prescribed, and know danger signs: bleeding, severe headache, reduced baby movements, or fever — seek care immediately.",
     "गर्भावस्था — देखभाल जागरूकता", "सभी प्रसवपूर्व जांच कराएं, आयरन युक्त भोजन लें, पूरक केवल डॉक्टर की सलाह से लें, और खतरे के संकेत जानें: रक्तस्राव, तेज सिरदर्द, शिशु की हलचल कम होना या बुखार — तुरंत चिकित्सक से मिलें।",
     "સગર્ભાવસ્થા — સંભાળ જાગૃતિ", "તમામ પ્રસૂતિ-પૂર્વ તપાસ કરાવો, આયર્નયુક્ત ખોરાક લો, પૂરક ફક્ત ડૉક્ટરની સલાહથી લો, અને જોખમી ચિહ્નો જાણો: રક્તસ્રાવ, તીવ્ર માથાનો દુખાવો, બાળકની હલચલ ઓછી થવી કે તાવ — તરત તબીબને મળો.",
     "Maternal health education (summary)"),
    ("nutrition-iron", "nutrition", ["nutrition", "anemia", "anaemia", "iron", "एनीमिया", "खून की कमी", "પોષણ", "એનિમિયા"],
     "Anaemia & Iron-Rich Foods", "Green leafy vegetables, lentils, jaggery, dates, and vitamin-C foods (lemon, amla) help iron absorption. Tea/coffee with meals can reduce absorption. Persistent fatigue or paleness needs professional testing.",
     "एनीमिया और आयरन युक्त भोजन", "हरी पत्तेदार सब्जियां, दालें, गुड़, खजूर और विटामिन-C (नींबू, आंवला) आयरन अवशोषण में मदद करते हैं। भोजन के साथ चाय/कॉफी अवशोषण घटा सकती है। लगातार थकान/पीलापन पर जांच कराएं।",
     "એનિમિયા અને આયર્નયુક્ત ખોરાક", "લીલા પાંદડાવાળા શાકભાજી, દાળ, ગોળ, ખજૂર અને વિટામિન-C (લીંબુ, આમળા) આયર્ન શોષણમાં મદદ કરે છે. ભોજન સાથે ચા/કૉફી શોષણ ઘટાડી શકે છે. સતત થાક/ફિકાશ પર તપાસ કરાવો.",
     "Nutrition education (summary)"),
    ("hygiene-water", "prevention", ["hygiene", "hand wash", "water", "clean", "सफाई", "पानी", "સ્વચ્છતા", "પાણી"],
     "Hygiene & Safe Water", "Wash hands with soap before eating and after toilet use, drink safe/boiled water, and keep food covered. These simple steps prevent many infections, especially in children.",
     "स्वच्छता और सुरक्षित पानी", "खाने से पहले और शौच के बाद साबुन से हाथ धोएं, सुरक्षित/उबला पानी पिएं और भोजन ढककर रखें। ये सरल उपाय कई संक्रमणों से बचाते हैं, विशेषकर बच्चों में।",
     "સ્વચ્છતા અને સલામત પાણી", "જમતા પહેલા અને શૌચાલય પછી સાબુથી હાથ ધુઓ, સલામત/ઉકાળેલું પાણી પીઓ અને ખોરાક ઢાંકીને રાખો. આ સરળ પગલાં ઘણા ચેપથી બચાવે છે, ખાસ કરીને બાળકોમાં.",
     "Public-health education (summary)"),
    ("mental-calm", "mental", ["stress", "anxiety", "sleep", "tension", "depress", "तनाव", "नींद", "તણાવ", "ઊંઘ"],
     "Stress & Sleep — Self-Care Education", "Regular sleep hours, daily walks, slow breathing (4 sec in, 6 sec out), and talking to trusted people help manage stress. If low mood or anxiety persists for weeks or affects daily life, please consult a qualified counsellor or doctor.",
     "तनाव और नींद — स्व-देखभाल शिक्षा", "नियमित नींद, रोज़ टहलना, धीमी श्वास (4 सेकंड अंदर, 6 सेकंड बाहर) और विश्वसनीय लोगों से बात तनाव प्रबंधन में मदद करते हैं। यदि उदासी/चिंता हफ्तों बनी रहे तो योग्य परामर्शदाता/चिकित्सक से मिलें।",
     "તણાવ અને ઊંઘ — સ્વ-સંભાળ શિક્ષણ", "નિયમિત ઊંઘ, રોજ ચાલવું, ધીમો શ્વાસ (4 સેકન્ડ અંદર, 6 સેકન્ડ બહાર) અને વિશ્વસનીય લોકો સાથે વાત તણાવ સંચાલનમાં મદદ કરે છે. જો ઉદાસી/ચિંતા અઠવાડિયાઓ સુધી રહે તો લાયક સલાહકાર/તબીબને મળો.",
     "Wellness education (summary)"),
    ("medicine-safety", "medicines", ["medicine", "tablet", "dose", "dosage", "side effect", "दवा", "दवाई", "દવા"],
     "Medicine Safety Awareness", "Take medicines only as prescribed, never share prescriptions, check expiry dates, and store them safely away from children. Ask your doctor or pharmacist about side effects — this platform never prescribes or gives dosages.",
     "दवा सुरक्षा जागरूकता", "दवाएं केवल डॉक्टर की सलाह अनुसार लें, पर्चा साझा न करें, एक्सपायरी जांचें और बच्चों से दूर सुरक्षित रखें। दुष्प्रभावों के बारे में डॉक्टर/फार्मासिस्ट से पूछें — यह प्लेटफॉर्म कभी दवा या खुराक नहीं बताता।",
     "દવા સલામતી જાગૃતિ", "દવાઓ ફક્ત ડૉક્ટરની સલાહ મુજબ લો, પ્રિસ્ક્રિપ્શન શેર ન કરો, એક્સપાયરી તપાસો અને બાળકોથી દૂર સુરક્ષિત રાખો. આડઅસરો વિશે ડૉક્ટર/ફાર્માસિસ્ટને પૂછો — આ પ્લેટફોર્મ ક્યારેય દવા કે ડોઝ સૂચવતું નથી.",
     "Medication-safety education"),
    ("first-aid", "emergency", ["first aid", "bleed", "burn", "bite", "fracture", "प्राथमिक", "जलना", "પ્રાથમિક", "દાઝવું"],
     "Basic First-Aid Awareness", "For bleeding: press firmly with a clean cloth and seek care. For burns: cool with running water (no ice/toothpaste). For suspected fracture: keep still and get help. Call emergency services (108/112 in India) for anything serious.",
     "प्राथमिक उपचार जागरूकता", "रक्तस्राव पर साफ कपड़े से दबाएं और चिकित्सक से मिलें। जलने पर बहते पानी से ठंडा करें (बर्फ/टूथपेस्ट नहीं)। फ्रैक्चर के संदेह पर हिलाएं नहीं, मदद लें। गंभीर स्थिति में आपातकालीन सेवा (108/112) बुलाएं।",
     "પ્રાથમિક સારવાર જાગૃતિ", "રક્તસ્રાવ પર સ્વચ્છ કપડાથી દબાવો અને તબીબને મળો. દાઝવા પર વહેતા પાણીથી ઠંડુ કરો (બરફ/ટૂથપેસ્ટ નહીં). ફ્રેક્ચરની શંકા હોય તો હલાવો નહીં, મદદ લો. ગંભીર સ્થિતિમાં ઈમરજન્સી સેવા (108/112) બોલાવો.",
     "First-aid education (summary)"),
    ("monsoon", "prevention", ["dengue", "malaria", "mosquito", "chikungunya", "डेंगू", "मलेरिया", "મચ્છર", "ડેન્ગ્યુ"],
     "Mosquito-Borne Disease Prevention", "Remove stagnant water, use nets/repellents, and wear full-sleeve clothes at dawn/dusk. High fever with severe body ache, rash, or bleeding signs needs prompt professional testing — do not self-treat.",
     "मच्छर जनित रोगों से बचाव", "ठहरा पानी हटाएं, मच्छरदानी/रिपेलेंट उपयोग करें, सुबह-शाम पूरे आस्तीन के कपड़े पहनें। तेज बुखार के साथ बदन दर्द, चकत्ते या रक्तस्राव पर तुरंत जांच कराएं — स्व-उपचार न करें।",
     "મચ્છરજન્ય રોગોથી બચાવ", "ભરાયેલું પાણી દૂર કરો, મચ્છરદાની/રિપેલન્ટ વાપરો, સવાર-સાંજ આખી બાંયના કપડાં પહેરો. તીવ્ર તાવ સાથે શરીરનો દુખાવો, ફોલ્લીઓ કે રક્તસ્રાવ પર તરત તપાસ કરાવો — સ્વ-ઉપચાર ન કરો.",
     "Public-health education (summary)"),
]

NUTRITION = [
    ("Maternal Nutrition Essentials", "en", "maternal", "Eat extra roti/rice + dal, green vegetables, milk/curd, and iron-rich foods daily. Take IFA tablets only as prescribed. Avoid alcohol/tobacco. Attend all antenatal visits.", "Nutrition education"),
    ("गर्भवती पोषण आवश्यकताएं", "hi", "maternal", "रोज़ अतिरिक्त रोटी/चावल + दाल, हरी सब्जियां, दूध/दही और आयरन युक्त भोजन लें। IFA गोलियां केवल डॉक्टर की सलाह से लें। शराब/तंबाकू से बचें। सभी जांच कराएं।", "पोषण शिक्षा"),
    ("સગર્ભા પોષણ આવશ્યકતાઓ", "gu", "maternal", "રોજ વધુ રોટલી/ભાત + દાળ, લીલા શાકભાજી, દૂધ/દહીં અને આયર્નયુક્ત ખોરાક લો. IFA ગોળીઓ ફક્ત ડૉક્ટરની સલાહથી લો. દારૂ/તમાકુથી બચો. તમામ તપાસ કરાવો.", "પોષણ શિક્ષણ"),
    ("Child Feeding (6–24 months)", "en", "child", "Exclusive breastfeeding for 6 months, then soft khichdi, mashed dal-vegetables, banana, and continued breastfeeding to 2 years. Add a spoon of oil/ghee for energy. Wash hands before feeding.", "Nutrition education"),
    ("शिशु आहार (6–24 माह)", "hi", "child", "6 माह तक केवल स्तनपान, फिर नरम खिचड़ी, मसली दाल-सब्जी, केला और 2 वर्ष तक स्तनपान जारी रखें। ऊर्जा के लिए एक चम्मच तेल/घी मिलाएं। खिलाने से पहले हाथ धोएं।", "पोषण शिक्षा"),
    ("બાળ આહાર (6–24 મહિના)", "gu", "child", "6 મહિના સુધી ફક્ત સ્તનપાન, પછી નરમ ખીચડી, છૂંદેલી દાળ-શાકભાજી, કેળું અને 2 વર્ષ સુધી સ્તનપાન ચાલુ રાખો. ઊર્જા માટે એક ચમચી તેલ/ઘી ઉમેરો. ખવડાવતા પહેલા હાથ ધુઓ.", "પોષણ શિક્ષણ"),
    ("Affordable Thali Guide", "en", "general", "A balanced thali: 2 roti + 1 katori dal + vegetables + salad + buttermilk. Seasonal fruits and peanuts/soy add cheap nutrition. Limit fried food, sweets, and sugary drinks.", "Nutrition education"),
    ("सस्ती संतुलित थाली", "hi", "general", "संतुलित थाली: 2 रोटी + 1 कटोरी दाल + सब्जी + सलाद + छाछ। मौसमी फल और मूंगफली/सोया सस्ता पोषण देते हैं। तला भोजन, मिठाई और मीठे पेय सीमित करें।", "पोषण शिक्षा"),
    ("સસ્તી સંતુલિત થાળી", "gu", "general", "સંતુલિત થાળી: 2 રોટલી + 1 વાટકી દાળ + શાક + સલાડ + છાશ. મોસમી ફળો અને શીંગ/સોયા સસ્તું પોષણ આપે છે. તળેલું, મીઠાઈ અને ગળ્યા પીણાં મર્યાદિત કરો.", "પોષણ શિક્ષણ"),
]

MEALS = [
    ("Khichdi Power Bowl", "Rice + moong dal + carrots + peas + 1 tsp oil. One-pot, soft, rich in protein.", "खिचड़ी पावर बाउल", "चावल + मूंग दाल + गाजर + मटर + 1 चम्मच तेल। एक बर्तन, नरम, प्रोटीन युक्त।"),
    ("Sprout Chaat", "Sprouted moong + onion + tomato + lemon. No cooking, iron + vitamin C.", "अंकुरित चाट", "अंकुरित मूंग + प्याज + टमाटर + नींबू। बिना पकाए, आयरन + विटामिन C।"),
    ("Vegetable Daliya", "Broken wheat + seasonal vegetables + peanuts. Fibre-rich, keeps full longer.", "सब्जी दलिया", "दलिया + मौसमी सब्जियां + मूंगफली। फाइबर युक्त, देर तक भूख शांत।"),
    ("Curd Rice + Greens", "Rice + curd + sautéed spinach + tempering. Cooling, calcium + iron.", "दही-चावल + साग", "चावल + दही + पालक + तड़का। ठंडक, कैल्शियम + आयरन।"),
]

# name, generic, brands, category, uses, safety, warnings, manufacturer, source
MEDICINES = [
    ("Paracetamol", "Paracetamol", "Crocin, Dolo, Calpol", "Antipyretic / Analgesic", "Commonly used for fever and mild pain as directed by a doctor/pharmacist.", "Do not exceed the labeled maximum daily amount; inform doctor about liver conditions.", "Overdose can seriously harm the liver. Avoid combining multiple cold/flu products.", "Various licensed manufacturers", "Reference: standard drug information summaries"),
    ("ORS Powder", "Oral Rehydration Salts", "Electral, ORS-L", "Rehydration", "Used to replace fluids and salts lost in diarrhoea/vomiting, as advised by health workers.", "Mix exactly as instructed with safe water; discard unused solution after 24 hours.", "Not a substitute for professional care if dehydration is severe.", "Various licensed manufacturers", "Reference: WHO ORS guidance (summary)"),
    ("Cetirizine", "Cetirizine", "Cetzine, Alerid", "Antihistamine", "Commonly used for allergy symptoms like sneezing and itching, as advised.", "May cause drowsiness; avoid driving if affected.", "Not for infants without medical advice; inform doctor about kidney disease.", "Various licensed manufacturers", "Reference: standard drug information summaries"),
    ("Amoxicillin", "Amoxicillin", "Moxikind, Novamox", "Antibiotic (prescription)", "Prescription antibiotic for bacterial infections — only on a doctor's prescription.", "Complete the full course exactly as prescribed; never share antibiotics.", "Do not use for viral colds/flu. Allergy can be serious — inform your doctor.", "Various licensed manufacturers", "Reference: standard drug information summaries"),
    ("Metformin", "Metformin", "Glycomet, Glyciphage", "Antidiabetic (prescription)", "Prescription medicine for type-2 diabetes alongside diet and exercise.", "Take as prescribed with food as directed; attend regular follow-ups.", "Never start/stop without your doctor. Report persistent stomach upset or weakness.", "Various licensed manufacturers", "Reference: standard drug information summaries"),
    ("Amlodipine", "Amlodipine", "Amlopress, Stamlo", "Antihypertensive (prescription)", "Prescription medicine for high blood pressure.", "Take at the same time daily; do not skip doses.", "Never stop suddenly without medical advice. Report swelling or dizziness.", "Various licensed manufacturers", "Reference: standard drug information summaries"),
    ("Omeprazole", "Omeprazole", "Omez, Ocid", "Antacid / PPI (prescription)", "Prescription medicine for acidity and reflux as diagnosed.", "Usually taken before food as directed.", "Long-term use needs supervision. Report black stools or persistent pain promptly.", "Various licensed manufacturers", "Reference: standard drug information summaries"),
    ("Azithromycin", "Azithromycin", "Azithral, Zithromax", "Antibiotic (prescription)", "Prescription antibiotic — only on a doctor's prescription.", "Complete the full course as prescribed.", "Misuse causes resistance. Inform doctor about heart/liver conditions.", "Various licensed manufacturers", "Reference: standard drug information summaries"),
    ("Salbutamol Inhaler", "Salbutamol", "Asthalin, Ventorlin", "Asthma reliever (prescription)", "Prescription reliever inhaler for asthma symptoms as trained by a doctor.", "Learn correct inhaler technique from a health worker.", "Frequent need may mean poor control — see your doctor. Emergency breathlessness needs urgent care.", "Various licensed manufacturers", "Reference: standard drug information summaries"),
    ("Iron + Folic Acid", "Ferrous Sulphate + Folic Acid", "IFA tablets (Govt. supply)", "Supplement", "Used to prevent/treat iron-deficiency anaemia as advised, incl. pregnancy programs.", "Take as directed; vitamin-C foods help absorption.", "Keep away from children (overdose danger). Dark stools can be normal — ask your doctor.", "Government/licensed manufacturers", "Reference: anaemia-program education (summary)"),
    ("Vitamin D3", "Cholecalciferol", "D-Rise, Tayo", "Supplement", "Used for vitamin-D deficiency as tested/advised.", "Sunlight exposure and diet also help; follow the advised schedule.", "Do not megadose without advice — excess can be harmful.", "Various licensed manufacturers", "Reference: standard drug information summaries"),
    ("Diclofenac Gel", "Diclofenac (topical)", "Volini, Voveran Gel", "Topical pain relief", "Applied on skin for muscle/joint pain as directed.", "External use only; wash hands after applying.", "Do not apply on wounds, eyes, or broken skin.", "Various licensed manufacturers", "Reference: standard drug information summaries"),
    ("Loratadine", "Loratadine", "Lorfast, Alaspan", "Antihistamine", "Used for allergy symptoms as advised; usually less drowsy.", "Follow pack/doctor directions.", "Not for young children without advice.", "Various licensed manufacturers", "Reference: standard drug information summaries"),
    ("Pantoprazole", "Pantoprazole", "Pan, Pantocid", "Antacid / PPI (prescription)", "Prescription medicine for acidity-related conditions.", "Usually before breakfast as directed.", "Report alarming symptoms (vomiting blood, weight loss) urgently.", "Various licensed manufacturers", "Reference: standard drug information summaries"),
    ("Losartan", "Losartan", "Losar, Covance", "Antihypertensive (prescription)", "Prescription medicine for high blood pressure.", "Regular BP monitoring and follow-ups needed.", "Not for use in pregnancy without specialist advice. Report swelling/dizziness.", "Various licensed manufacturers", "Reference: standard drug information summaries"),
    ("Atorvastatin", "Atorvastatin", "Storvas, Atorva", "Cholesterol (prescription)", "Prescription medicine for high cholesterol alongside diet/exercise.", "Periodic tests as advised by your doctor.", "Report unexplained muscle pain. Avoid stopping without advice.", "Various licensed manufacturers", "Reference: standard drug information summaries"),
    ("Montelukast", "Montelukast", "Montair, Montek", "Asthma/allergy (prescription)", "Prescription controller for asthma/allergic rhinitis.", "Take regularly as prescribed, even when well.", "Not a rescue medicine for sudden attacks — keep reliever handy.", "Various licensed manufacturers", "Reference: standard drug information summaries"),
    ("Doxycycline", "Doxycycline", "Doxy, Microdox", "Antibiotic (prescription)", "Prescription antibiotic — only on prescription.", "Take with water; avoid direct sun sensitivity.", "Not for young children/pregnancy without specialist advice.", "Various licensed manufacturers", "Reference: standard drug information summaries"),
    ("Insulin Glargine", "Insulin Glargine", "Lantus, Basalog", "Antidiabetic (prescription)", "Prescription long-acting insulin for diabetes.", "Requires training on injection, storage, and hypo management.", "Low sugar can be dangerous — follow your doctor's sick-day and diet plan.", "Various licensed manufacturers", "Reference: standard drug information summaries"),
    ("Hydrocortisone Cream", "Hydrocortisone (topical)", "Various", "Topical steroid (ask pharmacist)", "Short-term relief of itching/inflammation as advised.", "Thin layer on affected area; short courses only unless advised.", "Do not use on face/infections without medical advice.", "Various licensed manufacturers", "Reference: standard drug information summaries"),
    ("Zinc Tablets", "Zinc Sulphate", "Zinconia", "Supplement", "Used with ORS in childhood diarrhoea programs as advised.", "Give the advised course with fluids.", "Not a substitute for ORS and medical review.", "Various licensed manufacturers", "Reference: child-health education (summary)"),
    ("Calcium + D3", "Calcium Carbonate + D3", "Shelcal, Gemcal", "Supplement", "Used for calcium support as advised (e.g., pregnancy, elderly).", "Take as directed with water.", "Kidney-stone history needs medical advice first.", "Various licensed manufacturers", "Reference: standard drug information summaries"),
    ("Domperidone", "Domperidone", "Domstal, Motinorm", "Antiemetic (prescription)", "Prescription medicine for nausea/vomiting.", "Take as prescribed.", "Report irregular heartbeat; not for long unsupervised use.", "Various licensed manufacturers", "Reference: standard drug information summaries"),
    ("Fluconazole", "Fluconazole", "Zocon, Forcan", "Antifungal (prescription)", "Prescription antifungal — only on prescription.", "Complete the course as directed.", "Inform doctor about liver disease and other medicines.", "Various licensed manufacturers", "Reference: standard drug information summaries"),
    ("Thyroxine", "Levothyroxine", "Thyrox, Eltroxin", "Thyroid (prescription)", "Prescription thyroid hormone replacement.", "Take on empty stomach as directed; regular TSH tests.", "Do not adjust dose without your doctor.", "Various licensed manufacturers", "Reference: standard drug information summaries"),
    ("Gliclazide", "Gliclazide", "Diamicron, Glyzid", "Antidiabetic (prescription)", "Prescription diabetes medicine.", "Take with food as directed; learn hypo signs.", "Skipping meals while on it can drop sugar — follow your plan.", "Various licensed manufacturers", "Reference: standard drug information summaries"),
    ("Betadine Ointment", "Povidone-Iodine", "Betadine", "Antiseptic", "Used to clean minor cuts and wounds.", "Clean wound first; apply thin layer.", "Deep/large wounds or animal bites need professional care + possible vaccines.", "Various licensed manufacturers", "Reference: standard drug information summaries"),
    ("Dextromethorphan Syrup", "Dextromethorphan", "Benadryl DR, Tossex", "Cough suppressant", "Used for dry cough as directed.", "Measure dose; avoid alcohol.", "Not for children under advice age; persistent cough needs evaluation.", "Various licensed manufacturers", "Reference: standard drug information summaries"),
    ("Multivitamin", "Multivitamin", "Supradyn, Zincovit", "Supplement", "General nutritional support as advised.", "Balanced diet matters more than pills.", "Not a treatment for disease; keep away from children.", "Various licensed manufacturers", "Reference: standard drug information summaries"),
    ("Albendazole", "Albendazole", "Zentel, Bendex", " deworming".strip(), "Deworming medicine used in mass programs / on advice.", "Single-dose schedules as per program/doctor.", "Pregnancy and young infants need specific medical advice.", "Various licensed manufacturers", "Reference: deworming-program education (summary)"),
]

# name, type, place, phone, hours, services
SERVICES = [
    ("City General Hospital (Demo)", "hospital", "Rajkot Central", "0281-000001", "24x7", "Emergency, OPD, ICU, Surgery"),
    ("St. Mary Rural Hospital (Demo)", "hospital", "Gondal Road", "0281-000002", "24x7", "Emergency, Maternity, Pediatrics"),
    ("Sunrise Clinic (Demo)", "clinic", "Kalawad Road", "0281-000003", "9am–9pm", "General OPD, Child care"),
    ("Village Health Centre (Demo)", "clinic", "Paddhari", "0281-000004", "9am–5pm", "OPD, Immunization, ANC"),
    ("Jan Aushadhi Store (Demo)", "pharmacy", "Rajkot Central", "0281-000005", "8am–10pm", "Generic medicines"),
    ("City Pharmacy 24x7 (Demo)", "pharmacy", "Ring Road", "0281-000006", "24x7", "Medicines, Baby care"),
    ("LifeLine Blood Bank (Demo)", "blood_bank", "Hospital Campus", "0281-000007", "24x7", "All blood groups, Donation camps"),
    ("City Diagnostics (Demo)", "diagnostic", "Kalawad Road", "0281-000008", "7am–9pm", "Blood tests, X-ray, ECG"),
    ("Rural Diagnostic Van (Demo)", "diagnostic", "Weekly village route", "0281-000009", " Camps", "Basic tests, BP, Sugar"),
    ("108 Ambulance Desk (Demo)", "emergency", "District HQ", "108", "24x7", "Emergency ambulance coordination"),
    ("Tele-MANAS Counselling (Info)", "emergency", "National helpline", "14416", "24x7", "Mental-health crisis support"),
]


def detect_intent(text: str) -> str:
    t = (text or "").lower()
    if any(k in t for k in [k.lower() for k in CRISIS_KW]):
        return "crisis"
    if any(k in t for k in [k.lower() for k in EMERGENCY_KW]):
        return "emergency"
    return "info"


def find_articles(text: str, lang: str = "en", limit: int = 3):
    t = (text or "").lower()
    scored = []
    for art in ARTICLES:
        slug, cat, kws = art[0], art[1], art[2]
        hits = sum(1 for k in kws if k.lower() in t)
        if hits:
            scored.append((hits, art))
    scored.sort(key=lambda x: -x[0])
    out = []
    for _, art in scored[:limit]:
        slug, cat = art[0], art[1]
        li = {"en": (3, 4), "hi": (5, 6), "gu": (7, 8)}.get(lang, (3, 4))
        out.append({"slug": slug, "category": cat, "title": art[li[0]], "body": art[li[1]], "source": art[9]})
    return out


def chat_reply(message: str, lang: str = "en") -> dict:
    lang = lang if lang in ("en", "hi", "gu") else "en"
    intent = detect_intent(message)
    if intent == "crisis":
        return {"intent": "crisis", "reply": CRISIS_REPLY[lang], "sources": ["Tele-MANAS 14416 (India, 24x7)"], "articles": [], "emergency": True}
    if intent == "emergency":
        return {"intent": "emergency", "reply": EMERGENCY_REPLY[lang], "sources": ["Local emergency: 108/112 (India)"], "articles": [], "emergency": True}
    arts = find_articles(message, lang)
    if not arts:
        fallback = {
            "en": "I can share general health education on topics like fever, diarrhoea & ORS, diabetes, blood pressure, vaccination, pregnancy care, nutrition & anaemia, hygiene, stress & sleep, medicine safety, first aid, and mosquito-borne diseases. Please ask about one of these — and note I cannot diagnose or prescribe.",
            "hi": "मैं बुखार, दस्त-ORS, मधुमेह, रक्तचाप, टीकाकरण, गर्भावस्था देखभाल, पोषण-एनीमिया, स्वच्छता, तनाव-नींद, दवा सुरक्षा, प्राथमिक उपचार और मच्छर जनित रोगों पर सामान्य स्वास्थ्य शिक्षा दे सकता हूं। इनमें से किसी विषय पर पूछें — मैं निदान या दवा नहीं बता सकता।",
            "gu": "હું તાવ, ઝાડા-ORS, ડાયાબિટીસ, બ્લડ પ્રેશર, રસીકરણ, સગર્ભા સંભાળ, પોષણ-એનિમિયા, સ્વચ્છતા, તણાવ-ઊંઘ, દવા સલામતી, પ્રાથમિક સારવાર અને મચ્છરજન્ય રોગો પર સામાન્ય આરોગ્ય શિક્ષણ આપી શકું છું. આમાંથી કોઈ વિષય પર પૂછો — હું નિદાન કે દવા સૂચવી શકતો નથી.",
        }
        return {"intent": "info", "reply": fallback[lang], "sources": [], "articles": [], "emergency": False}
    top = arts[0]
    reply = f"📘 {top['title']}\n\n{top['body']}\n\n— {EDU_NOTE[lang]}"
    return {"intent": "info", "reply": reply, "sources": [top["source"]], "articles": arts, "emergency": False}
