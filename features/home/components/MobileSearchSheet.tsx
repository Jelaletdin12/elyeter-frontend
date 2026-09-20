'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SearchBar } from '@/features/home/components/SearchBar';

export function MobileSearchSheet({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Search"
        onClick={() => setOpen(true)}
        className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground md:hidden"
      >
        <Search className="size-5" strokeWidth={1.75} />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="top" className="pt-14">
          <SheetHeader className="sr-only">
            <SheetTitle>Search</SheetTitle>
          </SheetHeader>
          <SearchBar locale={locale} />
        </SheetContent>
      </Sheet>
    </>
  );
}
