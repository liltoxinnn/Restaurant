import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import EmployeePayments from './pages/EmployeePayments';
import Stock from './pages/Stock';
import Suppliers from './pages/Suppliers';
import Purchases from './pages/Purchases';
import Menu from './pages/Menu';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import NotFound from './pages/NotFound';

const MANAGEMENT_ROLES = ['ADMIN', 'MANAGER'];
const SALES_ROLES = ['ADMIN', 'MANAGER', 'CASHIER'];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />

        <Route
          path="/employees"
          element={
            <ProtectedRoute roles={MANAGEMENT_ROLES}>
              <Employees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee-payments"
          element={
            <ProtectedRoute roles={MANAGEMENT_ROLES}>
              <EmployeePayments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock"
          element={
            <ProtectedRoute roles={SALES_ROLES}>
              <Stock />
            </ProtectedRoute>
          }
        />
        <Route
          path="/suppliers"
          element={
            <ProtectedRoute roles={MANAGEMENT_ROLES}>
              <Suppliers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchases"
          element={
            <ProtectedRoute roles={MANAGEMENT_ROLES}>
              <Purchases />
            </ProtectedRoute>
          }
        />
        <Route path="/menu" element={<Menu />} />
        <Route
          path="/sales"
          element={
            <ProtectedRoute roles={SALES_ROLES}>
              <Sales />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses"
          element={
            <ProtectedRoute roles={MANAGEMENT_ROLES}>
              <Expenses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute roles={MANAGEMENT_ROLES}>
              <Reports />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
