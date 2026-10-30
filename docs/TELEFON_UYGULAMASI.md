# Storm Saha – Telefon Uygulaması Kurulumu

Telefon uygulaması ayrı bir program değildir: aynı Storm Ön Muhasebe'nin web sürümü,
telefona "uygulama" olarak eklenir (PWA). Sunucu kiralamak gerekmez, ücretsizdir.
Veriler bilgisayardaki programla aynı Firebase veritabanını kullanır; telefonda yapılan
satış/tahsilat bilgisayarda anında görünür, bilgisayardaki kayıtlar da telefonda.

## 1. Web sürümünü yayına alma (bir kez, sonra her yeni sürümde)

> Bu adım canlı yayındır. Yalnızca "yayınla" kararı verildiğinde yapılır.

### Seçenek A – Firebase Hosting (önerilen, ücretsiz Spark planı yeterli)
Proje zaten Firebase kullandığı için ek ayar gerekmez. Adres:
`https://aesthetic-light-cw2h4.web.app`

Bilgisayarda proje klasöründe (Node.js kurulu olmalı):

```bash
npm install
```

```bash
npx firebase-tools@13.35.1 login
```

```bash
npm run deploy:web
```

- `login` komutu tarayıcıda Google hesabını sorar: Firebase projesinin sahibi olan hesapla giriş yapın.
- `deploy:web` programı derler ve yalnızca web sitesini (Hosting) yükler; veritabanına
  ve güvenlik kurallarına dokunmaz.

### Seçenek B – Netlify Drop (komut satırı olmadan)
1. `npm run build` ile derleyin; `dist` klasörü oluşur.
2. https://app.netlify.com/drop adresine `dist` klasörünü sürükleyip bırakın.
3. Verilen `https://….netlify.app` adresini kullanın.

## 2. Telefona kurma

1. Telefonda adresi açın, sonuna `?mod=saha` ekleyebilirsiniz
   (ör. `https://aesthetic-light-cw2h4.web.app/?mod=saha`).
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

Telefon yeni sürümü bir sonraki açılışta kendisi indirir; tekrar kurmaya gerek yoktur.
Hemen görmek için uygulamayı kapatıp yeniden açın.
