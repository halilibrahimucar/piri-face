# Test Rehberi - Yüz Analizi Özelliği

## 🧪 Test Adımları

### 1. Sunucuyu Başlat
```bash
npm run dev
```

### 2. Tarayıcıda Aç
- `http://localhost:3000` adresini aç
- Developer Tools (F12) açık olsun

### 3. İzinler
- **Mikrofon izni**: İzin ver
- **Kamera izni**: İzin ver (yüz analizi için gerekli)

### 4. Test Senaryoları

#### Senaryo 1: Temel Bağlantı
1. "Start" butonuna tıkla
2. Mikrofon ve kamera izinlerini ver
3. SimliClient bağlantısını bekle
4. ElevenLabs conversation başlamalı
5. Avatar görünmeli

#### Senaryo 2: Yüz Analizi
1. Kameraya bak
2. Console'da şu logları görmelisin:
   - "Face detection models loaded from CDN"
   - "Face analysis started"
   - "Context sent to agent: {...}"
3. Development modunda sol üstte analiz sonuçları görünmeli:
   - Yaş
   - Cinsiyet
   - Duygu
   - Güven skoru

#### Senaryo 3: Context Gönderme
1. Yüz tespit edildiğinde
2. Console'da "Context sent to agent" mesajını gör
3. Context formatı:
```json
{
  "userInfo": {
    "detected": true,
    "age": 25,
    "gender": "male",
    "emotion": "happy"
  }
}
```

### 5. Olası Sorunlar

#### Sorun: Kamera açılmıyor
- **Çözüm**: Tarayıcı ayarlarından kamera iznini kontrol et
- HTTPS gerekiyorsa: `localhost` çalışır, production'da HTTPS gerekli

#### Sorun: Face detection modelleri yüklenmiyor
- **Çözüm**: İnternet bağlantısını kontrol et (CDN'den yükleniyor)
- Alternatif: Modelleri local'e indirip `/public/models` klasörüne koy

#### Sorun: Yüz tespit edilmiyor
- **Çözüm**: 
  - Işığı kontrol et
  - Kameraya doğru bak
  - Yüz net görünmeli
  - Çok uzak/çok yakın olmamalı

#### Sorun: Context gönderilmiyor
- **Çözüm**: 
  - Console'da hata var mı kontrol et
  - WebSocket bağlantısı aktif mi kontrol et
  - ElevenLabs API'si context_update event'ini destekliyor mu kontrol et

### 6. Debug Bilgileri

#### Console Logları
- `"User camera started"` - Kamera başlatıldı
- `"Face detection models loaded from CDN"` - Modeller yüklendi
- `"Face analysis started"` - Analiz başladı
- `"Context sent to agent"` - Context gönderildi

#### Development Modu
- Sol üstte analiz sonuçları gösterilir
- Production'da gizlenir

### 7. Performans

#### Beklenen Değerler
- Model yükleme: ~2-5 saniye (ilk sefer)
- Analiz sıklığı: Her 2 saniyede bir
- Context güncelleme: Yüz tespit edildiğinde

#### Optimizasyon
- Analiz sıklığını artırabilirsin (daha fazla CPU kullanır)
- Model yükleme: CDN'den yükleniyor (hızlı)
- Canvas boyutu: Video boyutuna göre ayarlanıyor

## 🎯 Başarı Kriterleri

✅ Kamera açılıyor
✅ Yüz tespit ediliyor
✅ Analiz sonuçları alınıyor (yaş, cinsiyet, duygu)
✅ Context agent'a gönderiliyor
✅ Console'da hata yok
✅ Performance kabul edilebilir

## 📝 Notlar

- Face detection modelleri CDN'den yükleniyor (ilk yükleme yavaş olabilir)
- Kamera izni gerekiyor
- HTTPS gerektirebilir (production'da)
- Development modunda debug bilgileri gösterilir

