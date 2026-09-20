import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';

import logo from '@/public/logo.png';

export function SiteFooter({ locale }: { locale: string }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-border bg-card border-t">
      <div className="mx-auto max-w-7xl px-4">
        {/* Main footer */}
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-16">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href={`/${locale}`} className="inline-block transition-opacity hover:opacity-80">
              <Image src={logo} alt="Elýeter" width={140} height={40} className="h-9 w-auto" />
            </Link>

            <p className="text-muted-foreground mt-5 max-w-sm text-sm leading-6">
              Gündelik durmuşuňyz üçin gerek bolan zatlaryňyzy aňsatlyk bilen tapyň we sargyt ediň.
            </p>

            <Link
              href={`/${locale}/search`}
              className="hover:text-primary mt-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
            >
              Söwda etmäge başla
              <ArrowUpRight size={15} />
            </Link>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold">Shop</h3>

            <ul className="text-muted-foreground mt-4 space-y-3 text-sm">
              <li>
                <Link
                  href={`/${locale}/search`}
                  className="hover:text-foreground transition-colors"
                >
                  Search
                </Link>
              </li>

              <li>
                <Link
                  href={`/${locale}/discounted`}
                  className="hover:text-foreground transition-colors"
                >
                  Sale
                </Link>
              </li>

              <li>
                <Link href={`/${locale}/cart`} className="hover:text-foreground transition-colors">
                  Cart
                </Link>
              </li>

              <li>
                <Link
                  href={`/${locale}/account/wishlist`}
                  className="hover:text-foreground transition-colors"
                >
                  Wishlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-semibold">Account</h3>

            <ul className="text-muted-foreground mt-4 space-y-3 text-sm">
              <li>
                <Link
                  href={`/${locale}/account`}
                  className="hover:text-foreground transition-colors"
                >
                  My account
                </Link>
              </li>

              <li>
                <Link
                  href={`/${locale}/account/orders`}
                  className="hover:text-foreground transition-colors"
                >
                  Orders
                </Link>
              </li>

              <li>
                <span className="text-muted-foreground">Ashgabat, Turkmenistan</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-border text-muted-foreground flex flex-col gap-3 border-t py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Elýeter. All rights reserved.</p>

          <p className="text-muted-foreground/70">Gerek zat. Bir ýerde.</p>
        </div>
      </div>
    </footer>
  );
}
