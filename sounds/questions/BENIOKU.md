# Ses Dosyaları

Bu klasöre soru ve şık ses dosyalarını (.mp3) ekleyin.

---

## Temel soru yapısı (ses YOK)

Şu an questions.json dosyasındaki sorular böyle görünüyor:

```json
{
  "question": "Hecelerine doğru şekilde ayrılan sözcük hangisidir?",
  "options": ["Çiç-ek-çi", "Çör-ek", "Ça-dır"],
  "correct": 2
}
```

`audio` alanı yazılmamışsa ses butonu çıkmaz. Yazmak zorunda değilsiniz.

---

## Soruya ses eklemek

`audio` alanını sorunun içine ekleyin:

```json
{
  "question": "Hecelerine doğru şekilde ayrılan sözcük hangisidir?",
  "audio": "sounds/questions/q1.mp3",
  "options": ["Çiç-ek-çi", "Çör-ek", "Ça-dır"],
  "correct": 2
}
```

Soru metninin yanında 🔊 butonu çıkar, basınca ses çalar.

---

## Şıklara ses eklemek

Şıkları düz metin yerine obje olarak yazın ve `audio` ekleyin:

```json
{
  "question": "Hecelerine doğru şekilde ayrılan sözcük hangisidir?",
  "options": [
    { "text": "Çiç-ek-çi", "audio": "sounds/questions/q1_a1.mp3" },
    { "text": "Çör-ek",    "audio": "sounds/questions/q1_a2.mp3" },
    { "text": "Ça-dır",    "audio": "sounds/questions/q1_a3.mp3" }
  ],
  "correct": 2
}
```

Her şıkkın solunda küçük 🔊 butonu çıkar. Bazı şıklarda ses olup bazılarında olmayabilir, karıştırabilirsiniz.

---

## Konuşma balonlu soru (birden fazla ses parçası)

Soru birden fazla konuşma içeriyorsa `audio_parts` kullanın:

```json
{
  "question": "Itır, al, kek, ılık sözcükleri ile yazılabilecek anlamlı ve kurallı cümle hangisidir?",
  "audio_parts": [
    "sounds/questions/q3_parca1.mp3",
    "sounds/questions/q3_parca2.mp3",
    "sounds/questions/q3_parca3.mp3"
  ],
  "options": ["Ilık al kek Itır.", "Itır kek al ılık.", "Itır ılık kek al."],
  "correct": 2
}
```

🔊 1, 🔊 2, 🔊 3 şeklinde ayrı butonlar çıkar, her birine basınca o parça çalar.

---

## Önerilen dosya isimlendirmesi

```
q1.mp3          → 1. sorunun sesi
q1_a1.mp3       → 1. sorunun 1. şıkkının sesi
q1_a2.mp3       → 1. sorunun 2. şıkkının sesi
q1_a3.mp3       → 1. sorunun 3. şıkkının sesi
q3_parca1.mp3   → 3. sorunun 1. konuşma balonunun sesi
q3_parca2.mp3   → 3. sorunun 2. konuşma balonunun sesi
```

---

## Önemli notlar

- Ses dosyası bu klasörde olmalı: `sounds/questions/`
- `audio` alanı hiç yazılmazsa veya `null` yazılırsa ses butonu çıkmaz
- Bir ses çalarken başka bir butona basılırsa önceki ses durur
- Cevap verilince veya süre dolunca ses otomatik durur
