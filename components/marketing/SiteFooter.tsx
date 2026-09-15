import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';

import logo from '@/public/logo.png';

export function SiteFooter({ locale }: { locale: string }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4">
        {/* Main footer */}
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-16">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              href={`/${locale}`}
              className="inline-block transition-opacity hover:opacity-80"
            >
              <Image
                src={logo}
                alt="Elýeter"
                width={140}
                height={40}
                className="h-9 w-auto"
              />
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">
              Gündelik durmuşuňyz üçin gerek bolan zatlaryňyzy aňsatlyk bilen
              tapyň we sargyt ediň.
            </p>

            <Link
              href={`/${locale}/search`}
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary"
            >
              Söwda etmäge başla
              <ArrowUpRight size={15} />
            </Link>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold">Shop</h3>

            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <Link
                  href={`/${locale}/search`}
                  className="transition-colors hover:text-foreground"
                >
                  Search
                </Link>
              </li>

              <li>
                <Link
                  href={`/${locale}/discounted`}
                  className="transition-colors hover:text-foreground"
                >
                  Sale
                </Link>
              </li>

              <li>
                <Link
                  href={`/${locale}/cart`}
                  className="transition-colors hover:text-foreground"
                >
                  Cart
                </Link>
              </li>

              <li>
                <Link
                  href={`/${locale}/account/wishlist`}
                  className="transition-colors hover:text-foreground"
                >
                  Wishlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-semibold">Account</h3>

            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <Link
                  href={`/${locale}/account`}
                  className="transition-colors hover:text-foreground"
                >
                  My account
                </Link>
              </li>

              <li>
                <Link
                  href={`/${locale}/account/orders`}
                  className="transition-colors hover:text-foreground"
                >
                  Orders
                </Link>
              </li>

              <li>
                <span className="text-muted-foreground">
                  Ashgabat, Turkmenistan
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col gap-3 border-t border-border py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Elýeter. All rights reserved.</p>

          <p className="text-muted-foreground/70">
            Gerek zat. Bir ýerde.
          </p>
        </div>
      </div>
    </footer>
  );
}