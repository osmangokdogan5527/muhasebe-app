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
| Telefon / web | `deploy-web.yml` web sürümünü Firebase Hosting'e yükler | Telefon uygulaması yeni sürümü bir sonraki açılışta kendisi alır. |

> Yeni masaüstü sürümü için `package.json` içindeki sürüm numarası artırılmalıdır
> (aynı numarayla gönderilen kod mevcut sürümü değiştirmez).

### Telefon yayını için tek seferlik anahtar
Telefon yayınının çalışması için GitHub'a Firebase'e yükleme izni veren bir anahtar eklenir.
Anahtar yoksa iş hata vermez, sadece "anahtar eklenmemiş" uyarısıyla atlanır.

**Kolay yol (bilgisayarda, proje klasöründe):**

```bash
npx firebase-tools@13.35.1 login
```

```bash
npx firebase-tools@13.35.1 init hosting:github
```

- Depo sorulunca: `osmangokdogan5527/muhasebe-app`
- "Set up the workflow to run a build script before every deploy?" → **No**
- "Set up automatic deployment to your site's live channel when a PR is merged?" → **No**
- Komut anahtarı GitHub'a `FIREBASE_SERVICE_ACCOUNT_AESTHETIC_LIGHT_CW2H4` adıyla kendisi ekler.
  Oluşturduğu `.github/workflows/firebase-hosting-*.yml` dosyası olursa silin
  (bizim `deploy-web.yml` aynı işi yapıyor).

**Elle yol:** Google Cloud Console → IAM → Hizmet Hesapları → yeni hesap
(roller: *Firebase Hosting Admin*, *API Keys Viewer*) → Anahtarlar → JSON anahtar oluştur.
GitHub → depo → Settings → Secrets and variables → Actions → *New repository secret*:
ad `FIREBASE_SERVICE_ACCOUNT`, değer JSON dosyasının tamamı.

### Elle yayın (gerekirse)
Otomatik yayını beklemeden yüklemek için:

```bash
npm run deploy:web
```

Firebase kullanmadan: `npm run build` → `dist` klasörünü https://app.netlify.com/drop adresine
sürükleyin.

Web adresi: `https://aesthetic-light-cw2h4.web.app`

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

Telefon uygulaması internet varken her açılışta en son sürümü yükler; tekrar kurmaya gerek
yoktur. Açıkken yayınlanan bir sürümü görmek için uygulamayı tamamen kapatıp yeniden açın.
