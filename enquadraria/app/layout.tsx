import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Enquadraria | Histórias que viram quadros',
  description:
    'Explore pôsteres e quadros A3 ou transforme sua própria foto em arte para sua parede.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
