import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { Projects } from './pages/Projects';
import { Quotes } from './pages/Quotes';
import { QuoteTracking } from './pages/QuoteTracking';
import { Salaries } from './pages/Salaries';
import { Budget } from './pages/Budget';
import { Invoices } from './pages/Invoices';
import { Documents } from './pages/Documents';
import { DeliveryNotes } from './pages/DeliveryNotes';
import { Suppliers } from './pages/Suppliers';
import { Expenses } from './pages/Expenses';
import { Revenue } from './pages/Revenue';
import { Notifications } from './pages/Notifications';
import { HREstimation } from './pages/HREstimation';
import { Users } from './pages/Users';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/quote-tracking" element={<QuoteTracking />} />
            <Route path="/delivery-notes" element={<DeliveryNotes />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/revenue" element={<Revenue />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/salaries" element={<Salaries />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/hr-estimation" element={<HREstimation />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
