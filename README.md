# Dactylion SkyBlock Web

Dactylion Network için hazırlanmış özgün SkyBlock tanıtım ve mağaza ön yüzü.

## Yerel geliştirme

```bash
pnpm install
pnpm dev
```

Site `http://localhost:3000` adresinde açılır.

## Üretim

```bash
pnpm build
```

Next.js statik dışa aktarımı `out/` klasörüne yazar. `main` dalına yapılan
gönderimler GitHub Actions ile ücretsiz GitHub Pages yayınına alınır.

## Henüz etkin olmayan bölümler

Kredi yükleme, ödeme, oyuncu hesabı ve Minecraft sunucusuna otomatik ürün
teslimatı güvenli bir arka uç kurulana kadar bilerek kapalıdır. Gizli ödeme
anahtarları veya RCON bilgileri bu statik projeye eklenmemelidir.

Bu proje Mojang veya Microsoft ile bağlantılı değildir.
