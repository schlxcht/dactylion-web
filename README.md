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

Oyuncu girişi, oyunda üretilen tek kullanımlık `/sitekod` ile yapılır. Kredi
yükleme talepleri ödeme referansıyla personel onayına gider. Ödeme sağlayıcısı ve
mağaza sunucu sırları statik ön yüze eklenmez. Ürün fiyatları ve bakiye düşümü API
tarafında doğrulanır.

Bu proje Mojang veya Microsoft ile bağlantılı değildir.
