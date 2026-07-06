# GitHub Üzerinden Otomatik Güncelleme Sistemi

Uygulamanızın içindeki "Güncellemeleri Denetle" butonunun çalışması ve kullanıcılarınıza otomatik güncelleme sunabilmeniz için aşağıdaki adımları GitHub üzerinde gerçekleştirmeniz gerekir:

## 1. GitHub Deposu Oluşturma
GitHub hesabınızda (`osmangokdogan5527`) **`muhasebe-app`** adında **Public (Açık)** bir repository (depo) oluşturun.
(Eğer farklı bir isimde depo kullanacaksanız `package.json` içindeki `"publish"` ayarlarını ona göre değiştirmelisiniz).

## 2. Versiyon Numarasını Belirleme
Yeni bir güncelleme vereceğiniz zaman, bilgisayarınızda kodu düzenledikten sonra `package.json` dosyasındaki `"version"` kısmını artırın. Örneğin `"version": "1.5.2"`.

## 3. Uygulamayı Derleme
Terminalde aşağıdaki komutu çalıştırarak Windows için kurulum dosyanızı oluşturun:
```bash
npm run electron:build
```
Bu işlem bittiğinde projenizdeki `dist-electron` klasörünün içine uygulamanızın `.exe` dosyası ve güncelleme için gerekli olan `latest.yml` dosyası oluşacaktır.

## 4. GitHub'da Release (Sürüm) Yayınlama
1. GitHub'daki `muhasebe-app` deponuza gidin.
2. Sağ taraftan **"Releases"** bölümüne tıklayın ve **"Draft a new release"** (Yeni sürüm oluştur) seçeneğini seçin.
3. **Choose a tag** (Etiket seçin) kısmına versiyon numaranızı yazın (örneğin: `v1.5.2`) ve "Create new tag" deyin.
4. Alt kısımdaki dosya yükleme (Attach binaries) alanına şu iki dosyayı bilgisayarınızdaki `dist-electron` klasöründen sürükleyip bırakın:
   - `Storm.On.Muhasebe.Setup.1.5.2.exe`
   - `latest.yml`
5. **Publish release** butonuna tıklayarak sürümü yayınlayın.

## Sonuç
Artık kullanıcılar uygulamadaki **"Güncellemeleri Denetle"** butonuna bastığında, sistem otomatik olarak GitHub'daki bu sürümü (`latest.yml` dosyasını) kontrol edecek, yeni versiyon olduğunu görecek ve arka planda `.exe` dosyasını indirerek güncellemeyi kuracaktır.
