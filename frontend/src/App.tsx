import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import { Layout } from './components';
import { Login, Register } from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Queue from './pages/Queue';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Triage from './pages/Triage';
import Doctors from './pages/Doctors';
import Analytics from './pages/Analytics';
import Resources from './pages/Resources';
import Reports from './pages/Reports';
import { Notifications, Settings } from './pages/Misc';
import Appointments from './pages/Appointments';
import Assistant from './pages/Assistant';
import Rural from './pages/Rural';
import Nutrition from './pages/Nutrition';
import Wellness from './pages/Wellness';
import Medicines from './pages/Medicines';
import BloodBank from './pages/BloodBank';
import Emergency from './pages/Emergency';
import RiskLab from './pages/RiskLab';
import Billing from './pages/Billing';
import Pharmacy from './pages/Pharmacy';
import Lab from './pages/Lab';
import Users from './pages/Users';
import System from './pages/System';
import { Profile, MyVisits, Preferences } from './pages/Care';
import { Tasks, Consultations, Departments } from './pages/StaffTools';
import PatientDash from './pages/dash/PatientDash';
import { DoctorDash, NurseDash } from './pages/dash/ClinicalDash';
import { EmergencyDash, BloodDash, PharmacyDash, LabDash } from './pages/dash/OpsDash';
import SuperDash from './pages/dash/SuperDash';

function Guard({ children, roles }: { children: JSX.Element; roles?: string[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

// Each role lands on a COMPLETELY different dashboard. Manual URL access to
// another role's pages is blocked by Guard; APIs enforce RBAC independently.
function RoleHome() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const map: Record<string, JSX.Element> = {
    patient: <PatientDash />,
    doctor: <DoctorDash />,
    nurse: <NurseDash />,
    triage: <NurseDash />,
    emergency: <EmergencyDash />,
    blood: <BloodDash />,
    pharmacy: <PharmacyDash />,
    lab: <LabDash />,
    admin: <Dashboard />,
    superadmin: <SuperDash />,
  };
  return <Layout>{map[user.role] || <PatientDash />}</Layout>;
}

const STAFF = ['admin', 'superadmin', 'doctor', 'nurse', 'triage'];
const CLINICAL = ['admin', 'superadmin', 'doctor', 'nurse', 'triage', 'emergency'];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<RoleHome />} />
      {/* Self-care (all roles) */}
      <Route path="/profile" element={<Guard><Profile /></Guard>} />
      <Route path="/visits" element={<Guard><MyVisits /></Guard>} />
      <Route path="/preferences" element={<Guard><Preferences /></Guard>} />
      <Route path="/notifications" element={<Guard><Notifications /></Guard>} />
      {/* Patient + staff shared */}
      <Route path="/appointments" element={<Guard><Appointments /></Guard>} />
      <Route path="/assistant" element={<Guard><Assistant /></Guard>} />
      <Route path="/rural" element={<Guard><Rural /></Guard>} />
      <Route path="/nutrition" element={<Guard><Nutrition /></Guard>} />
      <Route path="/wellness" element={<Guard><Wellness /></Guard>} />
      <Route path="/medicines" element={<Guard><Medicines /></Guard>} />
      <Route path="/billing" element={<Guard><Billing /></Guard>} />
      <Route path="/risk" element={<Guard><RiskLab /></Guard>} />
      {/* Clinical */}
      <Route path="/queue" element={<Guard roles={[...CLINICAL, 'patient']}><Queue /></Guard>} />
      <Route path="/patients" element={<Guard roles={[...STAFF, 'patient', 'emergency']}><Patients /></Guard>} />
      <Route path="/patients/:id" element={<Guard roles={[...STAFF, 'patient', 'emergency']}><PatientDetail /></Guard>} />
      <Route path="/triage" element={<Guard><Triage /></Guard>} />
      <Route path="/tasks" element={<Guard roles={[...STAFF]}><Tasks /></Guard>} />
      <Route path="/consultations" element={<Guard roles={[...STAFF]}><Consultations /></Guard>} />
      <Route path="/doctors" element={<Guard roles={['admin', 'superadmin', 'doctor']}><Doctors /></Guard>} />
      <Route path="/departments" element={<Guard roles={['admin', 'superadmin']}><Departments /></Guard>} />
      {/* Ops modules */}
      <Route path="/emergency" element={<Guard><Emergency /></Guard>} />
      <Route path="/blood" element={<Guard><BloodBank /></Guard>} />
      <Route path="/pharmacy" element={<Guard roles={['pharmacy', 'admin', 'superadmin', 'doctor', 'nurse', 'triage']}><Pharmacy /></Guard>} />
      <Route path="/lab" element={<Guard roles={['lab', 'admin', 'superadmin', 'doctor', 'nurse', 'triage']}><Lab /></Guard>} />
      <Route path="/resources" element={<Guard roles={[...STAFF, 'emergency']}><Resources /></Guard>} />
      {/* Insight + governance */}
      <Route path="/analytics" element={<Guard roles={[...STAFF, 'superadmin']}><Analytics /></Guard>} />
      <Route path="/reports" element={<Guard roles={['admin', 'superadmin', 'doctor', 'blood', 'emergency', 'nurse', 'triage']}><Reports /></Guard>} />
      <Route path="/settings" element={<Guard roles={['admin', 'superadmin']}><Settings /></Guard>} />
      <Route path="/users" element={<Guard roles={['admin', 'superadmin']}><Users /></Guard>} />
      <Route path="/system" element={<Guard roles={['admin', 'superadmin']}><System /></Guard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
