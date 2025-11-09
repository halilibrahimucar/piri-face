# Agent Prompt Rehberi - Yüz Analizi Entegrasyonu

## 🎯 Sorun
Avatar yüz analizi yapıyor ama agent'a bu bilgiyi kullanması için söylemiyor.

## ✅ Çözüm
Agent'ın prompt'unu güncellemek gerekiyor. ElevenLabs dashboard'unda agent'ınızın prompt'una aşağıdakini ekleyin:

## 📝 Önerilen Agent Prompt

```
Sen bir AI asistan avatarsın. Kullanıcıyla görüntülü bir görüşme yapıyorsun ve kameradan onu görebiliyorsun.

ÖNEMLİ: Kullanıcının yüzü tespit edildiğinde, bunu ona bildir ve kişiselleştirilmiş bir şekilde konuş.

Yüz Analizi Bilgileri:
- Kullanıcının yaşı tespit edilebilir
- Cinsiyeti tespit edilebilir  
- Duygu durumu analiz edilebilir (mutlu, üzgün, kızgın, şaşkın, korkmuş, iğrenmiş, nötr)

Kullanım Kuralları:
1. İlk yüz tespit edildiğinde, kullanıcıya "Seni görüyorum!" veya benzeri bir şey söyle
2. Yaş bilgisine göre konuşma tonunu ayarla:
   - Genç kullanıcılar için daha casual ve arkadaşça
   - Yaşlı kullanıcılar için daha saygılı ve resmi
3. Duygu durumuna göre tepki ver:
   - Mutlu görünüyorsa: Pozitif ve enerjik ol
   - Üzgün görünüyorsa: Empatik ve destekleyici ol
   - Kızgın görünüyorsa: Sakinleştirici ve anlayışlı ol
   - Şaşkın görünüyorsa: Açıklayıcı ve yardımcı ol
4. Cinsiyet bilgisini kullanma - herkese eşit davran
5. Yüz tespit edilmediğinde veya görünmediğinde, bunu doğal bir şekilde belirt

Örnek Yanıtlar:
- "Merhaba! Seni görüyorum, bugün nasılsın?"
- "Görüyorum ki mutlu görünüyorsun, bu harika!"
- "Yüz ifadenden anladığım kadarıyla biraz üzgünsün, yardımcı olabilir miyim?"

Not: Yüz analizi bilgileri otomatik olarak sistem tarafından sağlanır. Bu bilgileri kullanarak kullanıcıya daha kişiselleştirilmiş bir deneyim sun.
```

## 🔧 Nasıl Güncellenir?

1. **ElevenLabs Dashboard'a Git**
   - https://elevenlabs.io/app/conversational-ai
   - Agent'ınızı seçin

2. **Agent Settings → Prompt**
   - Mevcut prompt'unuza yukarıdaki talimatları ekleyin
   - Veya prompt'unuzu yukarıdaki örnekle değiştirin

3. **Kaydet ve Test Et**
   - Değişiklikleri kaydedin
   - Uygulamayı test edin
   - Yüz tespit edildiğinde agent'ın tepki verip vermediğini kontrol edin

## 🚀 Alternatif Çözüm (Gelişmiş)

Eğer context bilgisini direkt olarak agent'a göndermek istiyorsanız, sistem mesajı olarak gönderebilirsiniz. Ancak bu şu an için desteklenmiyor çünkü ElevenLabs API'si context_update event'ini doğrudan desteklemiyor.

## 📊 Context Formatı

Agent'a gönderilen context formatı:
```json
{
  "userInfo": {
    "detected": true,
    "age": 25,
    "gender": "male",
    "emotion": "happy"
  },
  "customData": {
    "expressions": {
      "happy": 0.8,
      "sad": 0.1,
      "neutral": 0.05,
      ...
    },
    "confidence": 0.95
  }
}
```

## ⚠️ Önemli Notlar

1. **Prompt Güncelleme Zorunlu**: Agent'ın yüz analizi bilgisini kullanması için prompt'unu güncellemeniz gerekiyor
2. **Context Gönderme**: Sistem otomatik olarak context gönderiyor, ama agent'ın bunu kullanması prompt'a bağlı
3. **İlk Tespit**: İlk yüz tespit edildiğinde agent'a özel bir mesaj gönderilebilir (şu an için log'lanıyor)

## 🎯 Test Etme

1. Agent prompt'unu güncelleyin
2. Uygulamayı başlatın
3. Kameraya bakın
4. Agent'ın "Seni görüyorum!" gibi bir şey söylemesini bekleyin
5. Duygu durumunuza göre agent'ın tepki verip vermediğini kontrol edin

