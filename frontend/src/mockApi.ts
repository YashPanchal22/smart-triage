// Comprehensive Mock & Offline Demo API Adapter for Smart Healthcare Ecosystem
// Automatically provides full realistic data on GitHub Pages or when backend is unreachable.

export const DEMO_USERS: Record<string, { id: number; username: string; email: string; full_name: string; role: string }> = {
  admin: { id: 1, username: 'admin', email: 'admin@hospital.demo', full_name: 'Hospital Administrator', role: 'admin' },
  superadmin: { id: 2, username: 'superadmin', email: 'super@hospital.demo', full_name: 'Chief Medical Super Admin', role: 'superadmin' },
  doctor: { id: 3, username: 'doctor', email: 'doctor@hospital.demo', full_name: 'Dr. Vikram Mehta (Senior Physician)', role: 'doctor' },
  nurse: { id: 4, username: 'nurse', email: 'nurse@hospital.demo', full_name: 'Nurse Anjali Sharma (Head Nurse)', role: 'nurse' },
  triage: { id: 5, username: 'triage', email: 'triage@hospital.demo', full_name: 'Nurse Priya Patel (Triage Specialist)', role: 'triage' },
  patient: { id: 6, username: 'patient', email: 'patient@hospital.demo', full_name: 'Ramesh Patel (Demo Patient)', role: 'patient' },
  blood: { id: 7, username: 'blood', email: 'blood@hospital.demo', full_name: 'Suresh Rao (Blood Bank Coordinator)', role: 'blood' },
  emergency: { id: 8, username: 'emergency', email: 'emergency@hospital.demo', full_name: 'Arjun Jadeja (Emergency Response Lead)', role: 'emergency' },
  pharmacy: { id: 9, username: 'pharmacy', email: 'pharmacy@hospital.demo', full_name: 'Kavita Joshi (Chief Pharmacist)', role: 'pharmacy' },
  lab: { id: 10, username: 'lab', email: 'lab@hospital.demo', full_name: 'Dr. Nikhil Verma (Lead Pathologist)', role: 'lab' },
};

export const DEPARTMENTS = [
  { id: 1, name: 'Emergency', description: '24/7 Acute trauma & emergency triage', capacity: 35, active_cases: 18, head: 'Dr. Vikram Mehta' },
  { id: 2, name: 'Cardiology', description: 'Heart, hypertension, & coronary care', capacity: 25, active_cases: 14, head: 'Dr. Ananya Roy' },
  { id: 3, name: 'Pediatrics', description: 'Infant, child, & adolescent health', capacity: 20, active_cases: 11, head: 'Dr. Sneha Joshi' },
  { id: 4, name: 'Orthopedics', description: 'Fractures, joint care & bone surgery', capacity: 20, active_cases: 9, head: 'Dr. Rajesh Gupta' },
  { id: 5, name: 'General Medicine', description: 'Comprehensive adult diagnostics & OPD', capacity: 40, active_cases: 24, head: 'Dr. Kavita Shah' },
  { id: 6, name: 'Neurology', description: 'Brain, stroke & neurological disorders', capacity: 15, active_cases: 7, head: 'Dr. Farhan Khan' },
  { id: 7, name: 'Gynecology & Obstetrics', description: 'Maternity & women healthcare', capacity: 25, active_cases: 16, head: 'Dr. Meera Trivedi' },
  { id: 8, name: 'Oncology', description: 'Cancer care, chemotherapy & screening', capacity: 20, active_cases: 8, head: 'Dr. Suresh Nair' },
];

export const DOCTORS = [
  { id: 1, name: 'Dr. Vikram Mehta', full_name: 'Dr. Vikram Mehta', specialty: 'Emergency Medicine', department_id: 1, department: 'Emergency', experience: '12 yrs', available: true, room: 'ER Bay 1' },
  { id: 2, name: 'Dr. Ananya Roy', full_name: 'Dr. Ananya Roy', specialty: 'Interventional Cardiology', department_id: 2, department: 'Cardiology', experience: '15 yrs', available: true, room: 'OPD 104' },
  { id: 3, name: 'Dr. Sneha Joshi', full_name: 'Dr. Sneha Joshi', specialty: 'Pediatrics & Neonatal Care', department_id: 3, department: 'Pediatrics', experience: '9 yrs', available: true, room: 'OPD 202' },
  { id: 4, name: 'Dr. Rajesh Gupta', full_name: 'Dr. Rajesh Gupta', specialty: 'Orthopedics & Joint Surgery', department_id: 4, department: 'Orthopedics', experience: '16 yrs', available: true, room: 'OPD 108' },
  { id: 5, name: 'Dr. Kavita Shah', full_name: 'Dr. Kavita Shah', specialty: 'Internal Medicine', department_id: 5, department: 'General Medicine', experience: '14 yrs', available: true, room: 'OPD 101' },
  { id: 6, name: 'Dr. Farhan Khan', full_name: 'Dr. Farhan Khan', specialty: 'Neurology', department_id: 6, department: 'Neurology', experience: '11 yrs', available: true, room: 'OPD 305' },
];

let mockQueue: any[] = [
  {
    id: 101, patient_id: 1, patient_name: 'Ramesh Patel', patient_code: 'PAT-2026-001',
    age: 58, gender: 'Male', chief_complaint: 'Severe chest discomfort & shortness of breath',
    priority: 'emergency', priority_score: 95,
    priority_reasons: ['Critical vitals (SpO2 91%)', 'Chest pain radiating to shoulder', 'High-risk cardiovascular age'],
    status: 'waiting', department_id: 2, department: 'Cardiology',
    waiting_live_min: 4, assigned_doctor_id: 2, doctor_name: 'Dr. Ananya Roy',
    vitals: { hr: 116, bp_sys: 165, bp_dia: 102, spo2: 91, temp: 98.6 }
  },
  {
    id: 102, patient_id: 2, patient_name: 'Priya Sharma', patient_code: 'PAT-2026-002',
    age: 34, gender: 'Female', chief_complaint: 'Acute lower right abdominal pain with high fever',
    priority: 'urgent', priority_score: 75,
    priority_reasons: ['High body temperature 103.2°F', 'Acute localized pain score 8/10'],
    status: 'under_assessment', department_id: 1, department: 'Emergency',
    waiting_live_min: 12, assigned_doctor_id: 1, doctor_name: 'Dr. Vikram Mehta',
    vitals: { hr: 98, bp_sys: 124, bp_dia: 82, spo2: 97, temp: 103.2 }
  },
  {
    id: 103, patient_id: 3, patient_name: 'Aarav Desai', patient_code: 'PAT-2026-003',
    age: 8, gender: 'Male', chief_complaint: 'Persistent dry cough with mild wheezing',
    priority: 'semi_urgent', priority_score: 48,
    priority_reasons: ['Pediatric respiratory distress', 'Wheezing audible on auscultation'],
    status: 'called', department_id: 3, department: 'Pediatrics',
    waiting_live_min: 19, assigned_doctor_id: 3, doctor_name: 'Dr. Sneha Joshi',
    vitals: { hr: 94, bp_sys: 105, bp_dia: 68, spo2: 96, temp: 99.4 }
  },
  {
    id: 104, patient_id: 4, patient_name: 'Sunita Verma', patient_code: 'PAT-2026-004',
    age: 62, gender: 'Female', chief_complaint: 'Routine hypertension follow-up & prescription renewal',
    priority: 'routine', priority_score: 18,
    priority_reasons: ['Stable baseline vitals', 'Routine medication management'],
    status: 'waiting', department_id: 5, department: 'General Medicine',
    waiting_live_min: 24, assigned_doctor_id: 5, doctor_name: 'Dr. Kavita Shah',
    vitals: { hr: 72, bp_sys: 130, bp_dia: 82, spo2: 98, temp: 98.4 }
  },
  {
    id: 105, patient_id: 5, patient_name: 'Karan Solanki', patient_code: 'PAT-2026-005',
    age: 26, gender: 'Male', chief_complaint: 'Deep laceration on right forearm after bike slip',
    priority: 'urgent', priority_score: 70,
    priority_reasons: ['Active trauma & moderate bleeding', 'Tetanus status unknown'],
    status: 'waiting', department_id: 1, department: 'Emergency',
    waiting_live_min: 8, assigned_doctor_id: 1, doctor_name: 'Dr. Vikram Mehta',
    vitals: { hr: 88, bp_sys: 120, bp_dia: 78, spo2: 99, temp: 98.6 }
  }
];

export const PATIENTS = [
  { id: 1, mrn: 'PAT-2026-001', code: 'PAT-2026-001', name: 'Ramesh Patel', full_name: 'Ramesh Patel', age: 58, gender: 'Male', blood_group: 'B+', phone: '+91 98251 01234', address: 'Ahmedabad, Gujarat', emergency_contact: '+91 98251 99999', registered_at: '2026-10-22' },
  { id: 2, mrn: 'PAT-2026-002', code: 'PAT-2026-002', name: 'Priya Sharma', full_name: 'Priya Sharma', age: 34, gender: 'Female', blood_group: 'O+', phone: '+91 98982 54321', address: 'Surat, Gujarat', emergency_contact: '+91 98982 88888', registered_at: '2026-10-22' },
  { id: 3, mrn: 'PAT-2026-003', code: 'PAT-2026-003', name: 'Aarav Desai', full_name: 'Aarav Desai', age: 8, gender: 'Male', blood_group: 'A+', phone: '+91 97123 45678', address: 'Vadodara, Gujarat', emergency_contact: '+91 97123 77777', registered_at: '2026-10-21' },
  { id: 4, mrn: 'PAT-2026-004', code: 'PAT-2026-004', name: 'Sunita Verma', full_name: 'Sunita Verma', age: 62, gender: 'Female', blood_group: 'AB+', phone: '+91 99090 11223', address: 'Rajkot, Gujarat', emergency_contact: '+91 99090 66666', registered_at: '2026-10-20' },
  { id: 5, mrn: 'PAT-2026-005', code: 'PAT-2026-005', name: 'Karan Solanki', full_name: 'Karan Solanki', age: 26, gender: 'Male', blood_group: 'O-', phone: '+91 98240 77889', address: 'Bhavnagar, Gujarat', emergency_contact: '+91 98240 55555', registered_at: '2026-10-19' },
  { id: 6, mrn: 'PAT-2026-006', code: 'PAT-2026-006', name: 'Divya Pandya', full_name: 'Divya Pandya', age: 41, gender: 'Female', blood_group: 'A-', phone: '+91 97230 44556', address: 'Gandhinagar, Gujarat', emergency_contact: '+91 97230 33333', registered_at: '2026-10-18' },
];

export const APPOINTMENTS = [
  { id: 1, patient_id: 1, patient_name: 'Ramesh Patel', doctor_id: 2, doctor_name: 'Dr. Ananya Roy', department: 'Cardiology', date: '2026-10-23', slot: '10:00 AM', status: 'confirmed', chief_complaint: 'ECG review & cardiac checkup' },
  { id: 2, patient_id: 2, patient_name: 'Priya Sharma', doctor_id: 1, doctor_name: 'Dr. Vikram Mehta', department: 'Emergency', date: '2026-10-23', slot: '11:30 AM', status: 'confirmed', chief_complaint: 'Abdominal ultrasound review' },
  { id: 3, patient_id: 3, patient_name: 'Aarav Desai', doctor_id: 3, doctor_name: 'Dr. Sneha Joshi', department: 'Pediatrics', date: '2026-10-24', slot: '09:30 AM', status: 'requested', chief_complaint: 'Vaccination & routine checkup' },
  { id: 4, patient_id: 4, patient_name: 'Sunita Verma', doctor_id: 5, doctor_name: 'Dr. Kavita Shah', department: 'General Medicine', date: '2026-10-24', slot: '02:00 PM', status: 'confirmed', chief_complaint: 'Diabetes & thyroid panel follow-up' },
];

export const BLOOD_INVENTORY = [
  { group: 'A+', units: 48, status: 'normal', threshold: 10 },
  { group: 'A-', units: 14, status: 'normal', threshold: 5 },
  { group: 'B+', units: 62, status: 'normal', threshold: 12 },
  { group: 'B-', units: 9, status: 'normal', threshold: 5 },
  { group: 'AB+', units: 28, status: 'normal', threshold: 5 },
  { group: 'AB-', units: 3, status: 'low', threshold: 5 },
  { group: 'O+', units: 75, status: 'normal', threshold: 15 },
  { group: 'O-', units: 6, status: 'low', threshold: 8 },
];

export const BLOOD_DONORS = [
  { id: 1, name: 'Rahul Joshi', blood_group: 'O-', phone: '+91 98250 11111', city: 'Ahmedabad', eligible: true, last_donated: '2026-06-15' },
  { id: 2, name: 'Ananya Dave', blood_group: 'AB-', phone: '+91 98250 22222', city: 'Rajkot', eligible: true, last_donated: '2026-07-20' },
  { id: 3, name: 'Manav Shah', blood_group: 'B+', phone: '+91 98250 33333', city: 'Surat', eligible: true, last_donated: '2026-08-10' },
  { id: 4, name: 'Pooja Trivedi', blood_group: 'A+', phone: '+91 98250 44444', city: 'Vadodara', eligible: true, last_donated: '2026-05-30' },
];

export const AMBULANCES = [
  { id: 1, code: 'AMB-01', vehicle_number: 'GJ-01-AX-1081', type: 'Advanced Life Support (ALS)', status: 'dispatched', driver_name: 'Mohan Solanki', driver_phone: '+91 98251 10801', location: 'Ring Road Jn.' },
  { id: 2, code: 'AMB-02', vehicle_number: 'GJ-01-AX-1082', type: 'Basic Life Support (BLS)', status: 'available', driver_name: 'Dinesh Parmar', driver_phone: '+91 98251 10802', location: 'Hospital Base' },
  { id: 3, code: 'AMB-03', vehicle_number: 'GJ-01-AX-1083', type: 'Neonatal Care Ambulance', status: 'available', driver_name: 'Iqbal Mansoori', driver_phone: '+91 98251 10803', location: 'Hospital Base' },
  { id: 4, code: 'AMB-04', vehicle_number: 'GJ-01-AX-1084', type: 'Advanced Cardiac Care', status: 'en_route', driver_name: 'Gopal Rathod', driver_phone: '+91 98251 10804', location: 'Kalawad Road' },
];

export const EMERGENCY_REQUESTS = [
  { id: 1, incident_type: 'cardiac', caller_name: 'Haresh Patel', caller_phone: '+91 98250 88881', location: 'Kalawad Road, Near Circle', priority: 'critical', status: 'en_route', assigned_ambulance: 'AMB-04', eta_min: 6, created_at: '10 mins ago' },
  { id: 2, incident_type: 'accident', caller_name: 'Vijay Rathod', caller_phone: '+91 98250 88882', location: 'Ring Road Highway Flyover', priority: 'high', status: 'assigned', assigned_ambulance: 'AMB-01', eta_min: 12, created_at: '18 mins ago' },
  { id: 3, incident_type: 'maternity', caller_name: 'Laxmi Ben', caller_phone: '+91 98250 88883', location: 'Mavdi Main Road', priority: 'medium', status: 'transferred', assigned_ambulance: 'AMB-03', eta_min: 0, created_at: '45 mins ago' },
];

export const HOSPITAL_RESOURCES = [
  { id: 1, resource_type: 'General Ward Beds', category: 'beds', total: 120, occupied: 86, available: 34, location: 'Building A, Floors 2-3' },
  { id: 2, resource_type: 'Intensive Care Unit (ICU)', category: 'icu', total: 28, occupied: 22, available: 6, location: 'Building B, Floor 1' },
  { id: 3, resource_type: 'Cardiac Care Unit (CCU)', category: 'ccu', total: 16, occupied: 12, available: 4, location: 'Building B, Floor 2' },
  { id: 4, resource_type: 'Mechanical Ventilators', category: 'equipment', total: 24, occupied: 18, available: 6, location: 'ICU / ER' },
  { id: 5, resource_type: 'Operation Theaters (OT)', category: 'ot', total: 8, occupied: 5, available: 3, location: 'Building C, Floor 2' },
];

export const PHARMACY_ITEMS = [
  { id: 1, name: 'Paracetamol 650mg', generic: 'Acetaminophen', qty: 1420, reorder_level: 200, category: 'Analgesic', expiry: '2027-12-31', price: 2.5 },
  { id: 2, name: 'Amoxicillin 500mg', generic: 'Amoxicillin Trihydrate', qty: 450, reorder_level: 100, category: 'Antibiotic', expiry: '2027-08-31', price: 8.0 },
  { id: 3, name: 'Atorvastatin 10mg', generic: 'Atorvastatin Calcium', qty: 380, reorder_level: 80, category: 'Cardiovascular', expiry: '2027-05-15', price: 6.5 },
  { id: 4, name: 'Metformin 500mg', generic: 'Metformin HCl', qty: 620, reorder_level: 120, category: 'Antidiabetic', expiry: '2027-11-20', price: 3.0 },
  { id: 5, name: 'Salbutamol Inhaler 100mcg', generic: 'Albuterol', qty: 34, reorder_level: 30, category: 'Respiratory', expiry: '2026-11-30', price: 140.0 },
  { id: 6, name: 'Ceftriaxone 1g Inj', generic: 'Ceftriaxone Sodium', qty: 85, reorder_level: 40, category: 'Antibiotic Injectable', expiry: '2027-03-31', price: 55.0 },
];

export const LAB_ORDERS = [
  { id: 1, patient_id: 1, patient_name: 'Ramesh Patel', test_name: 'Cardiac Troponin-I + CK-MB', urgency: 'stat', status: 'completed', result: 'Troponin-I: 0.84 ng/mL (High - Acute Ischemia indicator)', requested_at: '25 mins ago' },
  { id: 2, patient_id: 2, patient_name: 'Priya Sharma', test_name: 'Complete Blood Count (CBC) + CRP', urgency: 'urgent', status: 'in_progress', result: 'Pending analysis', requested_at: '40 mins ago' },
  { id: 3, patient_id: 4, patient_name: 'Sunita Verma', test_name: 'HbA1c & Lipid Panel', urgency: 'routine', status: 'completed', result: 'HbA1c: 6.8% (Fair control), Total Chol: 184 mg/dL', requested_at: '2 hours ago' },
];

export const MEDICINES_DB = [
  { id: 1, name: 'Paracetamol', dosage: '500mg / 650mg', uses: 'Fever, mild-to-moderate pain, headache, dental pain', safety: 'Maximum 4g/day. Avoid alcohol. Hepatic caution.', warnings: 'Overdose causes severe liver toxicity. Consult doctor if fever > 3 days.' },
  { id: 2, name: 'Azithromycin', dosage: '250mg / 500mg', uses: 'Bacterial respiratory infections, strep throat, sinusitis', safety: 'Complete full prescribed course. Take 1h before or 2h after meals.', warnings: 'Do not take for viral flu or common cold. Monitor for cardiac QT prolongation.' },
  { id: 3, name: 'Metformin', dosage: '500mg / 850mg / 1000mg', uses: 'Type 2 Diabetes Mellitus glycemic control', safety: 'Take with or after meals to minimize stomach upset.', warnings: 'Contraindicated in severe renal impairment. Avoid excessive binge alcohol.' },
  { id: 4, name: 'Amlodipine', dosage: '2.5mg / 5mg / 10mg', uses: 'Essential hypertension, chronic stable angina', safety: 'Take once daily at the same time. Check BP periodically.', warnings: 'May cause peripheral ankle edema or dizziness when standing up quickly.' },
  { id: 5, name: 'ORS (Oral Rehydration Salts)', dosage: '1 packet in 1 Liter clean boiled water', uses: 'Dehydration from diarrhea, vomiting, heat exhaustion', safety: 'Safe across all age groups including infants and elderly.', warnings: 'Discard prepared solution after 24 hours. Seek immediate care for unresponsiveness.' },
];

export const WELLNESS_LOGS = [
  { id: 1, mood: 'calm', note: 'Morning walk and 15 mins breathing meditation', sleep_hours: 7.5, created_at: 'Today, 08:30 AM' },
  { id: 2, mood: 'happy', note: 'Doctor confirmed BP readings improved!', sleep_hours: 8, created_at: 'Yesterday, 09:15 PM' },
  { id: 3, mood: 'neutral', note: 'Busy work schedule, stayed hydrated', sleep_hours: 6.5, created_at: '2 days ago' },
];

export const NUTRITION_ITEMS = [
  { id: 1, title: 'Balanced Indian Plate Guide', group: 'general', lang: 'en', calories: 450, summary: '50% vegetables & greens, 25% whole grains (roti/brown rice), 25% plant protein (dal/paneer/sprouts).' },
  { id: 2, title: 'Iron & Folate Rich Diet for Mothers', group: 'maternal', lang: 'en', calories: 520, summary: 'Spinach, moringa leaves, beetroot, jaggery with sesame, soaked lentils, and vitamin C rich citrus.' },
  { id: 3, title: 'High Protein Growth Foods for Children', group: 'child', lang: 'en', calories: 380, summary: 'Boiled eggs, moong dal khichdi with ghee, milk/curd, roasted chickpeas, banana mash.' },
];

export const RURAL_SERVICES = [
  { id: 1, name: 'Rajkot Community Health Center (CHC)', type: 'hospital', address: 'Kotharia Main Road, Rajkot', phone: '+91 281 2456789', emergency: true },
  { id: 2, name: 'Prathmik Arogya Kendra (PHC) Paddhari', type: 'clinic', address: 'Near Gram Panchayat, Paddhari', phone: '+91 2820 223344', emergency: false },
  { id: 3, name: 'Red Cross Voluntary Blood Center', type: 'blood_bank', address: 'Jail Road, Rajkot', phone: '+91 281 2234567', emergency: true },
  { id: 4, name: 'Jan Aushadhi Medical Store', type: 'pharmacy', address: 'Opp. Civil Hospital Gate, Rajkot', phone: '+91 281 2987654', emergency: false },
];

export const NOTIFICATIONS = [
  { id: 1, title: 'Emergency Dispatch Active', message: 'Ambulance AMB-04 dispatched to Kalawad Road (Cardiac Incident).', type: 'alert', read: false, time: '8 mins ago' },
  { id: 2, title: 'Critical Patient Escalation', message: 'Patient Ramesh Patel vitals flagged SpO2 91% — priority set to Emergency.', type: 'warning', read: false, time: '20 mins ago' },
  { id: 3, title: 'Blood Inventory Notice', message: 'AB- & O- stock levels below recommended safe reserve buffer.', type: 'info', read: true, time: '1 hour ago' },
];

export const AUDIT_LOGS = [
  { id: 1, user: 'admin', action: 'SYSTEM_HEALTH_CHECK', details: 'All 12 micro-modules reporting healthy heartbeat', timestamp: '2026-10-22 22:15:00' },
  { id: 2, user: 'triage', action: 'TRIAGE_EVALUATED', details: 'Patient #1 triage score computed: 95 (Emergency)', timestamp: '2026-10-22 22:04:12' },
  { id: 3, user: 'doctor', action: 'CONSULTATION_COMPLETED', details: 'Dr. Vikram Mehta reviewed ER triage bay #1', timestamp: '2026-10-22 21:50:33' },
];

// Health Assistant Trilingual AI KB
export function getAssistantResponse(message: string, lang = 'en') {
  const m = (message || '').toLowerCase();
  
  if (m.includes('chest') || m.includes('heart') || m.includes('छात') || m.includes('છાત')) {
    return {
      reply: lang === 'hi' 
        ? '🚨 चेतावनी: सीने में तेज दर्द, पसीना या सांस फूलना एक गंभीर आपातकालीन स्थिति (Heart Emergency) हो सकती है। तुरंत 108 या 112 पर कॉल करें या नजदीकी आपातकालीन केंद्र पहुंचें।'
        : lang === 'gu'
        ? '🚨 ચેતવણી: છાતીમાં તીવ્ર દુખાવો, પરસેવો અથવા શ્વાસ લેવામાં તકલીફ એ તાત્કાલિક ઇમરજન્સી હોઈ શકે છે. તરત જ 108 / 112 પર કૉલ કરો અથવા નજીકની હોસ્પિટલ પહોંચો.'
        : '🚨 CRITICAL WARNING: Severe chest pressure radiating to arm or jaw, accompanied by sweating or shortness of breath, can indicate an acute coronary syndrome. Call 108 / 112 immediately or proceed to the nearest Emergency Bay.',
      sources: ['National Health Portal (NHP)', 'Emergency Medicine Guidelines'],
      confidence: 0.99,
      emergency: true
    };
  }

  if (m.includes('fever') || m.includes('बुखार') || m.includes('તાવ')) {
    return {
      reply: lang === 'hi'
        ? '🌡️ बुखार के लिए: खूब पानी या ओआरएस पिएं, पर्याप्त आराम करें। यदि तापमान 102°F से अधिक है या 3 दिनों से अधिक रहता है, तो तुरंत डॉक्टर से मिलें। बिना डॉक्टर की सलाह के अनावश्यक एंटीबायोटिक न लें।'
        : lang === 'gu'
        ? '🌡️ તાવ માટે: પુષ્કળ પ્રવાહી અથવા ORS લો, આરામ કરો. જો તાવ 102°F થી વધુ હોય કે 3 દિવસથી વધુ રહે તો તરત જ ડૉક્ટરનો સંપર્ક કરો.'
        : '🌡️ Fever Management: Maintain hydration with fluids/ORS, rest, and monitor body temperature with a thermometer. If fever exceeds 102°F (38.9°C), causes stiff neck, or persists past 3 days, see a medical officer immediately.',
      sources: ['WHO Fever Guidelines', 'Indian Academy of Pediatrics'],
      confidence: 0.95,
      emergency: false
    };
  }

  return {
    reply: lang === 'hi'
      ? 'नमस्ते! मैं आपका स्मार्ट हेल्थकेयर सहायक हूँ। मैं ट्राइएज प्राथमिक मार्गदर्शन, अस्पताल सेवाओं और स्वास्थ्य शिक्षा में आपकी मदद कर सकता हूँ। किसी भी आपातकाल में 108 या 112 डायल करें।'
      : lang === 'gu'
      ? 'નમસ્તે! હું તમારો સ્માર્ટ હેલ્થકેર સહાયક છું. હું પ્રારંભિક માર્ગદર્શન, સેવાઓ અને આરોગ્ય શિક્ષણમાં મદદ કરી શકું છું. ઈમરજન્સીમાં 108 / 112 ડાયલ કરો.'
      : 'Hello! I am your Smart Healthcare AI Assistant. I provide decision-support, triage guidance, service directions, and patient health education. For medical emergencies, always dial 108 or 112 immediately.',
    sources: ['Smart Triage Clinical Decision Support'],
    confidence: 0.92,
    emergency: false
  };
}

// Router for mock endpoints
export function routeMock(method: string, url: string, data?: any, params?: any): any {
  const norm = url.replace(/^\/api/, '').split('?')[0];

  // Auth
  if (norm === '/auth/login-json') {
    const username = (data?.username || 'admin').toLowerCase();
    const user = DEMO_USERS[username] || {
      id: 99,
      username,
      email: `${username}@hospital.demo`,
      full_name: username[0].toUpperCase() + username.slice(1),
      role: data?.role || 'patient'
    };
    return {
      access_token: `mock-token-${user.role}-${Date.now()}`,
      token_type: 'bearer',
      user
    };
  }
  if (norm === '/auth/me') {
    try {
      const stored = JSON.parse(localStorage.getItem('triage_user') || 'null');
      if (stored) return stored;
    } catch {}
    return DEMO_USERS.admin;
  }
  if (norm === '/auth/register') {
    return {
      access_token: `mock-token-${data?.role || 'patient'}-${Date.now()}`,
      token_type: 'bearer',
      user: {
        id: Math.floor(Math.random() * 900) + 100,
        username: data?.username || 'user',
        email: data?.email || 'user@hospital.demo',
        full_name: data?.full_name || 'Hospital User',
        role: data?.role || 'patient'
      }
    };
  }

  // Analytics
  if (norm === '/analytics/overview') {
    return {
      total_today: 142,
      waiting: mockQueue.filter(q => q.status === 'waiting').length,
      avg_wait_today: 14,
      by_priority_today: {
        emergency: mockQueue.filter(q => q.priority === 'emergency').length,
        urgent: mockQueue.filter(q => q.priority === 'urgent').length,
        semi_urgent: mockQueue.filter(q => q.priority === 'semi_urgent').length,
        routine: mockQueue.filter(q => q.priority === 'routine').length
      },
      under_assessment: mockQueue.filter(q => q.status === 'under_assessment').length || 2,
      completed_today: 48,
      doctors_available: 6,
      admitted_today: 18,
      discharged_today: 15,
      waiting_stats_30d: { mean: 14, median: 12, min: 2, max: 48, count: 142 }
    };
  }
  if (norm === '/analytics/distributions') {
    const daily = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      daily.push({ date: d.toISOString().slice(5, 10), count: Math.floor(Math.sin(i) * 8) + 24 });
    }
    const by_priority = [
      { name: 'Emergency', key: 'emergency', value: 14 },
      { name: 'Urgent', key: 'urgent', value: 38 },
      { name: 'Semi-Urgent', key: 'semi_urgent', value: 72 },
      { name: 'Routine', key: 'routine', value: 94 }
    ];
    return {
      by_priority,
      daily,
      hourly: [
        { hour: '08:00', count: 12 }, { hour: '10:00', count: 32 }, { hour: '12:00', count: 38 },
        { hour: '14:00', count: 24 }, { hour: '16:00', count: 18 }, { hour: '18:00', count: 12 },
        { hour: '20:00', count: 6 }
      ],
      departments: [
        { department: 'Emergency', count: 38 }, { department: 'Cardiology', count: 26 },
        { department: 'Pediatrics', count: 21 }, { department: 'Orthopedics', count: 19 },
        { department: 'General Medicine', count: 38 }
      ],
      by_department: [
        { name: 'Emergency', value: 38 }, { name: 'Cardiology', value: 26 },
        { name: 'Pediatrics', value: 21 }, { name: 'Orthopedics', value: 19 },
        { name: 'General Medicine', value: 38 }
      ],
      workload: [
        { name: 'Emergency', value: 12 }, { name: 'Cardiology', value: 8 },
        { name: 'Pediatrics', value: 5 }, { name: 'General Medicine', value: 15 }
      ],
      completed_vs_waiting: [{ name: 'Completed', value: 48 }, { name: 'Active', value: 18 }],
      waits_sample: [10, 15, 20, 25, 30, 12, 18, 22, 14, 16]
    };
  }
  if (norm === '/analytics/ecosystem' || norm === '/analytics/kpis') {
    return {
      appointments_today: 18,
      appointments_upcoming: 42,
      blood_units: 418,
      blood_open_requests: 3,
      emergencies_active: 4,
      ambulances_available: 5,
      beds_total: 220,
      beds_occupied: 164,
      bed_utilization: 74.5,
      unpaid_billing: 18450,
      donors: 500,
      total_patients: 1042,
      total_doctors: 100,
      system_uptime: '99.98%'
    };
  }

  // Role Dashboards Overview
  if (norm === '/doctor/overview') {
    return {
      today_total: 24,
      waiting: 6,
      emergency: 1,
      completed_today: 18,
      appointments_today: 8,
      lab_ready: 3,
      lab_pending: 2,
      queue: mockQueue.map(q => ({
        id: q.id,
        patient: q.patient_name,
        code: q.patient_code,
        wait: q.waiting_live_min,
        dept: q.department,
        status: q.status,
        priority: q.priority
      }))
    };
  }
  if (norm === '/nurse/overview') {
    return {
      assigned: 14,
      waiting_triage: 4,
      vitals_pending: 2,
      tasks_open: 5,
      high_priority: 2,
      beds_available: 56,
      triage_waitlist: [
        { id: 101, complaint: 'Chest discomfort & shortness of breath' },
        { id: 102, complaint: 'Acute lower right abdominal pain' }
      ]
    };
  }
  if (norm === '/patient/overview') {
    return {
      linked: true,
      hint: 'Your profile PAT-2026-001 is active in the hospital registry.',
      upcoming: {
        doctor: 'Dr. Ananya Roy',
        dept: 'Cardiology',
        date: '2026-10-24',
        slot: '10:00 AM',
        status: 'confirmed'
      },
      queue_position: 2,
      queue_total: 5,
      last_visit: {
        date: '2026-10-22',
        dept: 'Emergency',
        status: 'completed'
      },
      unread: 2,
      active_visits: [
        {
          id: 101,
          dept: 'Cardiology',
          complaint: 'Follow-up ECG checkup',
          priority: 'urgent',
          status: 'under_assessment'
        }
      ]
    };
  }
  if (norm === '/superadmin/overview') {
    return {
      users_total: Object.keys(DEMO_USERS).length,
      users_active: Object.keys(DEMO_USERS).length,
      by_role: [
        { role: 'admin', count: 1 },
        { role: 'superadmin', count: 1 },
        { role: 'doctor', count: 1 },
        { role: 'nurse', count: 1 },
        { role: 'triage', count: 1 },
        { role: 'patient', count: 1 },
        { role: 'blood', count: 1 },
        { role: 'emergency', count: 1 },
        { role: 'pharmacy', count: 1 },
        { role: 'lab', count: 1 }
      ],
      tables: {
        patients: 1042,
        visits: 5000,
        appointments: 5000,
        doctors: 100,
        departments: 8,
        blood_donors: 500,
        blood_inventory: 8,
        emergency_requests: 60,
        ambulances: 12,
        medicines: 30,
        audit_logs: 12450
      },
      recent_audit: [
        { action: 'LOGIN_SUCCESS', entity: 'User #1 (admin)', at: new Date().toISOString() },
        { action: 'QUEUE_STATUS_CHANGE', entity: 'Visit #101', at: new Date().toISOString() },
        { action: 'TRIAGE_CLASSIFIED', entity: 'Patient #2', at: new Date().toISOString() }
      ]
    };
  }
  if (norm === '/pharmacy/overview') {
    return {
      total_items: 142,
      total_units: 4850,
      low_stock: 4,
      expiring_soon: 2,
      pending_orders: 3,
      low_list: [
        { id: 1, name: 'Amoxicillin 500mg', qty: 12 },
        { id: 2, name: 'Paracetamol IV 100ml', qty: 8 },
        { id: 3, name: 'Insulin Glargine 100IU', qty: 4 }
      ],
      expiring_list: [
        { id: 4, name: 'Ceftriaxone 1g Inj', batch: 'BAT-2024-88', expiry: '2026-11-15' },
        { id: 5, name: 'Pantoprazole 40mg Inj', batch: 'BAT-2024-91', expiry: '2026-11-30' }
      ]
    };
  }
  if (norm === '/lab/overview') {
    return {
      pending_total: 12,
      by_status: {
        requested: 3,
        processing: 4,
        sample_collected: 2,
        reviewed: 8
      },
      done_today: 18,
      by_test: [
        { name: 'Complete Blood Count (CBC)', value: 18 },
        { name: 'Lipid Profile', value: 12 },
        { name: 'Liver Function Test (LFT)', value: 9 },
        { name: 'Renal Function Test (RFT)', value: 8 },
        { name: 'HbA1c Blood Glucose', value: 15 }
      ]
    };
  }
  if (norm === '/settings') {
    return {
      theme: localStorage.getItem('triage_theme') || 'light',
      hospital_name: 'Smart Healthcare Ecosystem',
      auto_triage: true,
      notifications_enabled: true
    };
  }

  // Queue
  if (norm === '/queue') {
    let list = [...mockQueue];
    if (params?.priority) list = list.filter(r => r.priority === params.priority);
    if (params?.status) list = list.filter(r => r.status === params.status);
    if (params?.department_id) list = list.filter(r => String(r.department_id) === String(params.department_id));
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(r => r.patient_name.toLowerCase().includes(q) || r.patient_code.toLowerCase().includes(q));
    }
    return list;
  }
  if (norm.startsWith('/queue/') && norm.endsWith('/emergency')) {
    const id = Number(norm.split('/')[2]);
    const found = mockQueue.find(q => q.id === id);
    if (found) {
      found.priority = 'emergency';
      found.priority_score = 99;
      found.priority_reasons.unshift('Manual clinical emergency override');
    }
    return { ok: true, item: found };
  }
  if (norm.startsWith('/queue/')) {
    const id = Number(norm.split('/')[2]);
    const found = mockQueue.find(q => q.id === id);
    if (found && data) {
      Object.assign(found, data);
    }
    return { ok: true, item: found };
  }

  // Triage Evaluation
  if (norm === '/triage') {
    if (method.toUpperCase() === 'POST') {
      const score = (data?.spo2 && data.spo2 < 92 ? 35 : 0) +
                    (data?.pain_score && data.pain_score >= 8 ? 25 : 0) +
                    (data?.warning_indicators?.length ? 30 : 0) + 15;
      const priority = score >= 60 ? 'emergency' : score >= 40 ? 'urgent' : score >= 20 ? 'semi_urgent' : 'routine';
      const newItem = {
        id: Date.now(),
        patient_id: data?.patient_id || 1,
        patient_name: data?.patient_name || 'New Patient',
        patient_code: `PAT-${Math.floor(Math.random() * 800) + 200}`,
        age: data?.age || 35,
        gender: data?.gender || 'Other',
        chief_complaint: data?.chief_complaint || 'Triage assessment recorded',
        priority,
        priority_score: score,
        priority_reasons: ['Triage algorithm vital signs scoring', 'Algorithmic assessment'],
        status: 'waiting',
        department_id: data?.department_id || 1,
        department: 'Emergency',
        waiting_live_min: 1,
        vitals: data?.vitals || { hr: 80, bp_sys: 120, bp_dia: 80, spo2: 98, temp: 98.6 }
      };
      mockQueue.unshift(newItem);
      return newItem;
    }
    return { rules: ['Vital signs score', 'Pain index', 'Red-flag warnings'] };
  }

  // Patients & Details
  if (norm === '/patients') {
    if (method.toUpperCase() === 'POST') {
      const np = {
        id: PATIENTS.length + 1,
        mrn: `PAT-2026-${String(PATIENTS.length + 1).padStart(3, '0')}`,
        code: `PAT-2026-${String(PATIENTS.length + 1).padStart(3, '0')}`,
        name: data?.full_name || data?.name || 'Registered Patient',
        full_name: data?.full_name || data?.name || 'Registered Patient',
        age: data?.age || 30,
        gender: data?.gender || 'Male',
        blood_group: data?.blood_group || 'O+',
        phone: data?.phone || '+91 98000 00000',
        address: data?.address || 'Hospital OPD',
        emergency_contact: data?.emergency_contact || '+91 98000 11111',
        registered_at: 'Just now'
      };
      (PATIENTS as any[]).unshift(np);
      return np;
    }
    let list = [...PATIENTS];
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.mrn.toLowerCase().includes(q));
    }
    return list;
  }
  if (norm.startsWith('/patients/')) {
    const id = Number(norm.split('/')[2]);
    const found = PATIENTS.find(p => p.id === id) || PATIENTS[0];
    return {
      ...found,
      vitals_history: [
        { date: '2026-10-22', hr: 78, bp: '124/82', spo2: 98, temp: 98.6 },
        { date: '2026-09-15', hr: 82, bp: '130/86', spo2: 97, temp: 99.1 }
      ],
      visits: [
        { id: 1, date: '2026-10-22', department: 'Cardiology', doctor: 'Dr. Ananya Roy', notes: 'Stable cardiovascular follow-up' }
      ],
      prescriptions: [
        { medicine: 'Amlodipine 5mg', dosage: '1 tablet daily', duration: '30 days' }
      ]
    };
  }

  // Doctors & Departments
  if (norm === '/doctors') return DOCTORS;
  if (norm === '/departments') {
    if (method.toUpperCase() === 'POST' && data) {
      const nd = { id: DEPARTMENTS.length + 1, ...data };
      DEPARTMENTS.push(nd);
      return nd;
    }
    return DEPARTMENTS;
  }

  // Appointments
  if (norm === '/appointments') {
    if (method.toUpperCase() === 'POST') {
      const na = { id: APPOINTMENTS.length + 1, ...data, status: 'confirmed', date: data?.date || '2026-10-25' };
      APPOINTMENTS.unshift(na);
      return na;
    }
    return APPOINTMENTS;
  }

  // Blood Bank
  if (norm.startsWith('/blood/inventory') || norm === '/blood') return BLOOD_INVENTORY;
  if (norm.startsWith('/blood/donors')) return BLOOD_DONORS;
  if (norm.startsWith('/blood/requests')) {
    return [
      { id: 1, patient_name: 'Ramesh Patel', group: 'B+', units: 2, status: 'approved', urgency: 'high', created_at: '1 hour ago' },
      { id: 2, patient_name: 'Priya Sharma', group: 'O+', units: 1, status: 'issued', urgency: 'critical', created_at: '2 hours ago' },
    ];
  }

  // Emergency
  if (norm.startsWith('/emergency/fleet') || norm === '/emergency') return AMBULANCES;
  if (norm.startsWith('/emergency/requests')) return EMERGENCY_REQUESTS;

  // Resources (Beds / ICU)
  if (norm === '/resources') return HOSPITAL_RESOURCES;
  if (norm.startsWith('/resources/')) {
    const id = Number(norm.split('/')[2]);
    const r = HOSPITAL_RESOURCES.find(x => x.id === id);
    if (r && data?.occupied !== undefined) {
      r.occupied = data.occupied;
      r.available = Math.max(0, r.total - r.occupied);
    }
    return { ok: true, resource: r };
  }

  // Pharmacy
  if (norm.startsWith('/pharmacy/items')) return PHARMACY_ITEMS;
  if (norm.startsWith('/pharmacy/orders')) {
    return [
      { id: 1, patient_name: 'Ramesh Patel', items: 'Atorvastatin 10mg (30 tabs)', status: 'dispensed', doctor: 'Dr. Ananya Roy' },
      { id: 2, patient_name: 'Priya Sharma', items: 'Paracetamol 650mg + IV Ceftriaxone', status: 'preparing', doctor: 'Dr. Vikram Mehta' },
    ];
  }

  // Laboratory
  if (norm.startsWith('/lab/orders') || norm.startsWith('/lab/requests')) return LAB_ORDERS;

  // AI Assistant
  if (norm === '/assistant') {
    const message = data?.message || data?.query || '';
    const lang = data?.lang || data?.language || 'en';
    return getAssistantResponse(message, lang);
  }

  // ML Risk Lab
  if (norm === '/ml/risk/metrics') {
    return {
      model: 'RandomForestClassifier (Ensemble)',
      accuracy: 0.942,
      precision: 0.928,
      recall: 0.951,
      f1_score: 0.939,
      roc_auc: 0.974,
      confusion_matrix: [[480, 28], [24, 468]],
      feature_importance: [
        { feature: 'SpO2 Level', importance: 0.32 },
        { feature: 'Heart Rate', importance: 0.24 },
        { feature: 'Systolic BP', importance: 0.18 },
        { feature: 'Age Index', importance: 0.15 },
        { feature: 'Pain Severity', importance: 0.11 }
      ]
    };
  }
  if (norm === '/ml/risk/train') {
    return { ok: true, message: 'Model trained successfully on 5,000 synthetic clinical records', accuracy: 0.948 };
  }
  if (norm === '/ml/risk/predict') {
    return {
      risk_score: 78.4,
      risk_category: 'High Risk',
      confidence: 0.93,
      recommended_action: 'Admit to monitored telemetry bed and conduct urgent troponin + ECG repeat within 2 hours.'
    };
  }

  // Wellness & Nutrition
  if (norm.startsWith('/wellness/logs')) {
    if (method.toUpperCase() === 'POST') {
      const nl = { id: WELLNESS_LOGS.length + 1, ...data, created_at: 'Just now' };
      WELLNESS_LOGS.unshift(nl);
      return nl;
    }
    return WELLNESS_LOGS;
  }
  if (norm === '/wellness/summary') {
    return { avg_sleep: 7.2, primary_mood: 'calm', streak_days: 12, logs_count: WELLNESS_LOGS.length };
  }
  if (norm.startsWith('/nutrition/meals') || norm.startsWith('/nutrition')) return NUTRITION_ITEMS;
  if (norm.startsWith('/medicines')) return MEDICINES_DB;

  // Rural Health
  if (norm.startsWith('/articles')) {
    return [
      { id: 1, title: 'Preventing Waterborne Illnesses in Monsoons', lang: params?.lang || 'en', summary: 'Safe drinking water practices, ORS preparation, and boiling techniques.' },
      { id: 2, title: 'Child Immunization Schedule Guide', lang: params?.lang || 'en', summary: 'Complete milestone vaccines from birth to 5 years (BCG, Polio, Pentavalent, MMR).' },
    ];
  }
  if (norm.startsWith('/services')) return RURAL_SERVICES;

  // Staff tools
  if (norm.startsWith('/tasks')) {
    return [
      { id: 1, title: 'Check ICU Bed 4 vitals & arterial line', category: 'vitals', status: 'pending', assigned_to: 'Nurse Anjali' },
      { id: 2, title: 'Administer IV Ceftriaxone 1g to Patient #2', category: 'medication', status: 'completed', assigned_to: 'Nurse Priya' },
    ];
  }
  if (norm.startsWith('/consultations') || norm === '/eco2/consultations') {
    return [
      { id: 1, patient_name: 'Ramesh Patel', doctor: 'Dr. Ananya Roy', notes: 'ECG demonstrates mild ST elevation in leads II, III, aVF. Commenced antiplatelet therapy.', status: 'closed' }
    ];
  }

  // Admin & System
  if (norm === '/admin/users') return Object.values(DEMO_USERS);
  if (norm === '/admin/permissions') {
    return { roles: ['admin', 'superadmin', 'doctor', 'nurse', 'triage', 'patient', 'blood', 'emergency', 'pharmacy', 'lab'] };
  }
  if (norm === '/admin/settings') {
    return { hospital_name: 'Smart Healthcare Ecosystem', maintenance_mode: false, auto_triage_enabled: true };
  }
  if (norm === '/admin/db-stats') {
    return { tables_count: 28, patients: 1042, appointments: 5000, visits: 5000, audit_events: 12450 };
  }
  if (norm.startsWith('/admin/security')) {
    return [
      { id: 1, event: 'RBAC Authorization Check', ip: '127.0.0.1', status: 'ALLOWED', timestamp: '2 mins ago' },
      { id: 2, event: 'JWT Token Refresh', ip: '127.0.0.1', status: 'ALLOWED', timestamp: '15 mins ago' },
    ];
  }

  // Reports, Audit & Notifications
  if (norm.startsWith('/reports/summary')) {
    return { total_patients: 1042, total_surgeries: 142, blood_transfusions: 88, bed_turnover_rate: '84%' };
  }
  if (norm.startsWith('/audit')) return AUDIT_LOGS;
  if (norm.startsWith('/notifications')) return NOTIFICATIONS;
  if (norm.startsWith('/billing')) {
    return [
      { id: 1, invoice_no: 'INV-2026-001', patient_name: 'Ramesh Patel', amount: 4500, status: 'paid', date: '2026-10-22' },
      { id: 2, invoice_no: 'INV-2026-002', patient_name: 'Priya Sharma', amount: 2800, status: 'pending', date: '2026-10-22' },
    ];
  }

  // Generic fallback for any other eco/eco2 endpoints
  return { ok: true, success: true, timestamp: new Date().toISOString() };
}
