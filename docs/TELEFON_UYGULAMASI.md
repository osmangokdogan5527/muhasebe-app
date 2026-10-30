# Storm Saha – Telefon Uygulaması Kurulumu

Telefon uygulaması ayrı bir program değildir: aynı Storm Ön Muhasebe'nin web sürümü,
telefona "uygulama" olarak eklenir (PWA). Sunucu kiralamak gerekmez, ücretsizdir.
Veriler bilgisayardaki programla aynı Firebase veritabanını kullanır; telefonda yapılan
satış/tahsilat bilgisayarda anında görünür, bilgisayardaki kayıtlar da telefonda.

## 1. Otomatik yayın (bir kez kurulur)

Kod GitHub'da `main` dalına girdiğinde iki şey kendiliğinden olur:

| | Ne olur | Kullanıcıya nasıl ulaşır |
|---|---|---|
| Bilgisayar programı | `release.yml` Windows kurulumunu derler ve GitHub Releases'te **yayınlanmış** sürüm olarak açar | Program açıldıktan ~15 sn sonra ve 4 saatte bir yeni sürüm arar, sessizce indirir, "Güncelleme Hazır" der. "Sonra" denirse program kapanırken kurulur. |
| Telefon / web | `deploy-web.yml` web sürümünü **GitHub Pages**'e yükler (ücretsiz, anahtar gerekmez) | Telefon uygulaması internet varken her açılışta en son sürümü yükler. |

> Yeni masaüstü sürümü için `package.json` içindeki sürüm numarası artırılmalıdır
> (aynı numarayla gönderilen kod mevcut sürümü değiştirmez).

### Telefon yayını için tek seferlik ayar
GitHub → `muhasebe-app` deposu → **Settings** → sol menüde **Pages** →
*Build and deployment* → **Source: GitHub Actions** seçin. Başka bir şey gerekmez.

İlk yayın için: GitHub → **Actions** → *Web ve Telefon Sürümünü Yayınla* → **Run workflow**
(sonrakiler `main`'e her gönderimde kendiliğinden çalışır).

Web adresi: **`https://osmangokdogan5527.github.io/muhasebe-app/`**

### Alternatif: Firebase Hosting (elle)
Proje klasöründe Node.js kuruluysa:

```bash
npx firebase-tools@13.35.1 login
```

```bash
npm run deploy:web
```

Adres: `https://aesthetic-light-cw2h4.web.app` (AI Studio Starter Tier projelerinde Hosting
kapalı olabilir; o durumda GitHub Pages'i kullanın).

## 2. Telefona kurma

1. Telefonda adresi açın, sonuna `?mod=saha` ekleyebilirsiniz
   (ör. `https://osmangokdogan5527.github.io/muhasebe-app/?mod=saha`).
2. Firma kodu ve şifreyle **"Firmam zaten var, bağlan"** ile giriş yapın.
3. Ana ekrana ekleyin:
   - **Android (Chrome):** Giriş ekranındaki "Yükle" butonu ya da menü (⋮) → *Ana ekrana ekle / Uygulamayı yükle*.
   - **iPhone (Safari):** Paylaş (□↑) → *Ana Ekrana Ekle*.
4. Ana ekrandaki **Storm** simgesiyle açıldığında doğrudan saha ekranı gelir.

## 3. Saha ekranında neler var

| Sekme | İşlev |
|---|---|
| Satış | Ürün ara / barkod okut, sepet, Nakit · Kart · Veresiye, otomatik fiş no |
| Tahsilat | Cariden tahsilat veya cariye ödeme, Kasa · Banka · POS |
| Stok | Ürün sorgulama, kritik stok listesi |
| Cariler | Alacak/borç toplamları, cari bakiye, Ara · Tahsilat · Satış kısayolu |
| Storm AI | Yapay zeka asistanı (Ayarlar'dan Gemini anahtarı girilmişse) |

- Sağ üst menü → **Tam Sürüme Geç**: bilgisayardaki tüm ekranlar. Geri dönmek için
  mobil menüde **Saha Moduna Geç**.
- Güvenlik modu açıkken personelin yetkisi olmayan sekmeler gizlenir.

## 4. İnternetsiz kullanım

- Uygulama bir kez internetle açıldıktan sonra internetsiz de açılır.
- Çekim yokken yapılan satış ve tahsilatlar telefona kaydedilir, üst barda
  **Çevrimdışı** yazar; internet gelince otomatik olarak gönderilir.
- İlk giriş ve yeni firma oluşturma için internet gerekir.

## 5. Yeni sürüm yayınlandığında

Telefon uygulaması internet varken her açılışta en son sürümü yükler; tekrar kurmaya gerek
yoktur. Açıkken yayınlanan bir sürümü görmek için uygulamayı tamamen kapatıp yeniden açın.
