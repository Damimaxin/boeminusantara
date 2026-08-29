import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { QuoteProvider } from "@/components/QuoteProvider";
import { CartProvider } from "@/components/CartProvider";

// Layout storefront: chrome toko (Header + Footer).
// Route group "(shop)" tidak mengubah URL — hanya memisahkan chrome dari /admin.
// QuoteProvider menyediakan "keranjang penawaran" (RFQ) ke seluruh storefront.
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QuoteProvider>
      <CartProvider>
        <Header />
        <main>{children}</main>
        <Footer />
      </CartProvider>
    </QuoteProvider>
  );
}
