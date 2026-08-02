# Dactylion SkyBlock Web

Dactylion Network için hazırlanmış SkyBlock tanıtım ve oyuncu portalı.

Web sitesi ürün satmaz. Oyuncular burada yalnızca kredi yükleme talebi oluşturur,
merkezi kredi bakiyesini görür ve destek kaydı açar. Bütün ürün alışverişleri
Minecraft sunucusundaki `/sitemarket` menüsünden yapılır.

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
gönderimler GitHub Actions ile GitHub Pages yayınına alınır.

## Güvenlik modeli

Oyuncu girişi Minecraft sunucusundaki AuthMe hesabıyla yapılır. Şifre statik ön
yüze veya site veritabanına kaydedilmez; kısa ömürlü ve şifrelenmiş doğrulama
isteğini yalnızca Minecraft köprüsü açar ve AuthMe doğrular. Personel yetkileri
LuckPerms rollerinden gelir. Kredi yükleme talepleri ödeme referansıyla yönetici
onayına gider. Ürün fiyatları ve bakiye düşümü API tarafında doğrulanır.

Bu proje Mojang veya Microsoft ile bağlantılı değildir.
