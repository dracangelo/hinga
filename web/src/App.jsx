import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { Footer } from './components/Footer.jsx';
import { RequireAuth } from './components/Guards.jsx';
import { Spinner } from './components/ui.jsx';
import { Home } from './pages/Home.jsx';
import { Shop } from './pages/Shop.jsx';
import { ProductDetail } from './pages/ProductDetail.jsx';
import { Cart } from './pages/Cart.jsx';
import { Checkout } from './pages/Checkout.jsx';
import { OrderConfirmation } from './pages/OrderConfirmation.jsx';
import { Account } from './pages/Account.jsx';
import { Landscaping } from './pages/Landscaping.jsx';
import { Login, Register, AdminRegister } from './pages/Auth.jsx';
import { AdminLayout } from './pages/admin/AdminLayout.jsx';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

const AdminDashboard = lazy(() =>
  import('./pages/admin/Dashboard.jsx').then((m) => ({ default: m.AdminDashboard })),
);
const AdminOrders = lazy(() =>
  import('./pages/admin/AdminOrders.jsx').then((m) => ({ default: m.AdminOrders })),
);
const AdminOrderDetail = lazy(() =>
  import('./pages/admin/AdminOrderDetail.jsx').then((m) => ({ default: m.AdminOrderDetail })),
);
const AdminProducts = lazy(() =>
  import('./pages/admin/AdminProducts.jsx').then((m) => ({ default: m.AdminProducts })),
);
const AdminProductForm = lazy(() =>
  import('./pages/admin/AdminProductForm.jsx').then((m) => ({ default: m.AdminProductForm })),
);
const AdminCategories = lazy(() =>
  import('./pages/admin/AdminCategories.jsx').then((m) => ({ default: m.AdminCategories })),
);
const AdminCustomers = lazy(() =>
  import('./pages/admin/AdminCustomers.jsx').then((m) => ({ default: m.AdminCustomers })),
);
const AdminCoupons = lazy(() =>
  import('./pages/admin/AdminCoupons.jsx').then((m) => ({ default: m.AdminCoupons })),
);
const AdminReviews = lazy(() =>
  import('./pages/admin/AdminReviews.jsx').then((m) => ({ default: m.AdminReviews })),
);
const AdminLandscaping = lazy(() =>
  import('./pages/admin/AdminLandscaping.jsx').then((m) => ({ default: m.AdminLandscaping })),
);
const AdminPreferences = lazy(() =>
  import('./pages/admin/AdminPreferences.jsx').then((m) => ({ default: m.AdminPreferences })),
);

function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-display text-6xl text-sage">404</p>
      <h1 className="mt-3 font-display text-3xl text-ink">This page has been reaped</h1>
      <p className="mt-2 max-w-sm text-ink-soft">
        The page you're looking for doesn't exist — but there are plenty of plants that do.
      </p>
      <Link to="/shop" className="btn btn-primary mt-6">
        Back to the shop
      </Link>
    </div>
  );
}

function StorefrontLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* storefront */}
              <Route
                path="/"
                element={
                  <StorefrontLayout>
                    <Home />
                  </StorefrontLayout>
                }
              />
              <Route
                path="/shop"
                element={
                  <StorefrontLayout>
                    <Shop />
                  </StorefrontLayout>
                }
              />
              <Route
                path="/product/:slug"
                element={
                  <StorefrontLayout>
                    <ProductDetail />
                  </StorefrontLayout>
                }
              />
              <Route
                path="/landscaping"
                element={
                  <StorefrontLayout>
                    <Landscaping />
                  </StorefrontLayout>
                }
              />
              <Route
                path="/cart"
                element={
                  <StorefrontLayout>
                    <Cart />
                  </StorefrontLayout>
                }
              />
              <Route
                path="/login"
                element={
                  <StorefrontLayout>
                    <Login />
                  </StorefrontLayout>
                }
              />
              <Route
                path="/register"
                element={
                  <StorefrontLayout>
                    <Register />
                  </StorefrontLayout>
                }
              />
              <Route
                path="/admin/login"
                element={
                  <StorefrontLayout>
                    <Login adminMode />
                  </StorefrontLayout>
                }
              />
              <Route
                path="/admin/register"
                element={
                  <StorefrontLayout>
                    <AdminRegister />
                  </StorefrontLayout>
                }
              />
              <Route
                path="/checkout"
                element={
                  <RequireAuth>
                    <StorefrontLayout>
                      <Checkout />
                    </StorefrontLayout>
                  </RequireAuth>
                }
              />
              <Route
                path="/order/:orderNumber"
                element={
                  <RequireAuth>
                    <StorefrontLayout>
                      <OrderConfirmation />
                    </StorefrontLayout>
                  </RequireAuth>
                }
              />
              <Route
                path="/account"
                element={
                  <RequireAuth>
                    <StorefrontLayout>
                      <Account />
                    </StorefrontLayout>
                  </RequireAuth>
                }
              />

              {/* admin */}
              <Route
                path="/admin"
                element={
                  <RequireAuth adminOnly>
                    <StorefrontLayout>
                      <AdminLayout />
                    </StorefrontLayout>
                  </RequireAuth>
                }
              >
                <Route
                  index
                  element={
                    <Suspense fallback={<Spinner label="Loading dashboard" />}>
                      <AdminDashboard />
                    </Suspense>
                  }
                />
                <Route
                  path="orders"
                  element={
                    <Suspense fallback={<Spinner label="Loading orders" />}>
                      <AdminOrders />
                    </Suspense>
                  }
                />
                <Route
                  path="orders/:id"
                  element={
                    <Suspense fallback={<Spinner label="Loading order" />}>
                      <AdminOrderDetail />
                    </Suspense>
                  }
                />
                <Route
                  path="products"
                  element={
                    <Suspense fallback={<Spinner label="Loading products" />}>
                      <AdminProducts />
                    </Suspense>
                  }
                />
                <Route
                  path="products/new"
                  element={
                    <Suspense fallback={<Spinner label="Loading form" />}>
                      <AdminProductForm />
                    </Suspense>
                  }
                />
                <Route
                  path="products/:id/edit"
                  element={
                    <Suspense fallback={<Spinner label="Loading form" />}>
                      <AdminProductForm />
                    </Suspense>
                  }
                />
                <Route
                  path="categories"
                  element={
                    <Suspense fallback={<Spinner label="Loading categories" />}>
                      <AdminCategories />
                    </Suspense>
                  }
                />
                <Route
                  path="customers"
                  element={
                    <Suspense fallback={<Spinner label="Loading customers" />}>
                      <AdminCustomers />
                    </Suspense>
                  }
                />
                <Route
                  path="coupons"
                  element={
                    <Suspense fallback={<Spinner label="Loading coupons" />}>
                      <AdminCoupons />
                    </Suspense>
                  }
                />
                <Route
                  path="reviews"
                  element={
                    <Suspense fallback={<Spinner label="Loading reviews" />}>
                      <AdminReviews />
                    </Suspense>
                  }
                />
                <Route
                  path="landscaping"
                  element={
                    <Suspense fallback={<Spinner label="Loading requests" />}>
                      <AdminLandscaping />
                    </Suspense>
                  }
                />
                <Route
                  path="preferences"
                  element={
                    <Suspense fallback={<Spinner label="Loading preferences" />}>
                      <AdminPreferences />
                    </Suspense>
                  }
                />
              </Route>

              <Route
                path="*"
                element={
                  <StorefrontLayout>
                    <NotFound />
                  </StorefrontLayout>
                }
              />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
      <Analytics />
      <SpeedInsights />
    </ThemeProvider>
  );
}