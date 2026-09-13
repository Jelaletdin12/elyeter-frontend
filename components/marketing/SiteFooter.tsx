import Link from 'next/link';

export function SiteFooter({ locale }: { locale: string }) {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-3">
        <div>
          <p className="font-serif text-lg italic">Bazaar</p>
          <p className="mt-2 text-muted-foreground">Ashgabat, Turkmenistan</p>
        </div>

        <div>
          <p className="font-medium">Shop</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>
              <Link href={`/${locale}/search`}>Search</Link>
            </li>
            <li>
              <Link href={`/${locale}/cart`}>Cart</Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-medium">Language</p>
          <ul className="mt-2 flex gap-3 text-muted-foreground">
            {(['en', 'ru', 'tk'] as const).map((l) => (
              <li key={l}>
                <Link href={`/${l}`} className={l === locale ? 'font-semibold text-foreground' : ''}>
                  {l.toUpperCase()}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
