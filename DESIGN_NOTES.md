# Tasarım notları

## Renk
- `paper` `#F7F5F1` — sayfa arka planı (sıcak ama krem-klişe değil)
- `surface` `#FFFFFF` — kart yüzeyleri
- `ink` `#171614` / `ink-muted` `#6B6459` — metin
- `saffron` `#E2A63B` (+ `saffron-dark` `#B8822A`) — birincil aksan: CTA, fiyat, aktif durum
- `teal` `#1E4640` (+ `teal-light` `#2C5C54`) — yapısal renk: nav, footer, rozet
- `line` `#E4E0D8` — hairline border
- `danger` `#B3413A`

Bilinçli olarak kaçınılan: sıcak krem + turuncu (~#D97757, Claude'un kendi rengi),
near-black + neon aksan, generic SaaS-card kit (her yerde aynı gri gölge).

## Tipografi
- **Fraunces** (serif, italic destekli) — başlıklar VE fiyatlar. Ticari anlara
  da marka kişiliği taşınsın diye fiyatlar da bu fontla.
- **Public Sans** — UI, gövde metni, buton etiketleri.
- Tailwind v4 `@theme` üzerinden `font-display` / `font-sans` olarak tanımlı
  (bkz. `app/globals.css`), CSS değişkenleri `app/layout.tsx`'teki
  `next/font/google` importlarından geliyor.

## Layout prensibi
Tek "cesur" hareket: anasayfa hero'sunda arama kartı banner'ın alt kenarına
negatif margin ile taşıyor (`HeroBanner.tsx`). Geri kalan her şey (kategori
şeridi, ürün grid'i) sakin — düz grid, hover'da sadece hafif scale, scattered
animasyon yok.

Kategori şeridindeki renk noktası (saffron/teal) dekoratif değil — göz taraması
için art arda aynı rengin gelmemesini sağlıyor.

## Admin panelde tutarlılık için
Admin, public siteden görsel olarak ayrışabilir (daha yoğun, tablo-ağırlıklı,
"araç" hissi) ama aynı renk/font token'larını (`ink`, `line`, `saffron`, `teal`,
`font-display`/`font-sans`) kullanmalı — iki ayrı marka gibi hissettirmemeli.
Admin'de Fraunces sadece sayfa başlıklarında (`h1`), tablo/form içinde hep
Public Sans.

## Değiştirmeden önce
Yeni bir sayfa/component eklerken burada tanımlı token'ların dışına çıkmadan
önce bir düşün — özellikle yeni bir renk veya font eklemeden önce bu dosyayı
güncelle, aksi halde marka tutarlılığı kayar.
