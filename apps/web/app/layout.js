import "./globals.css";

export const metadata = {
  title: "Ticket Order",
  description: "Dashboard web para gestion de tickets por empresa.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
