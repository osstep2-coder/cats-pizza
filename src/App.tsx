import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { CartPage } from './pages/CartPage';
import { OrdersPage } from './pages/OrdersPage';
import { CartProvider } from './cart/CartContext';

function App() {
  return (
    <CartProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </CartProvider>
  );
}

export default App;
