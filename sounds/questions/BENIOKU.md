# Ses Dosyaları

Bu klasöre soru ve cevap ses dosyalarını (.mp3) ekleyin.

---

## Kullanım

### Tek sesli soru
questions.json içinde ilgili soruya şunu yazın:

    "audio": "sounds/questions/DOSYA_ADI.mp3"

Ses yoksa:

    "audio": null

---

### Şık sesi
İlgili şıkta (şık obje formatında olmalı) şunu yazın:

    { "text": "Şık metni", "audio": "sounds/questions/DOSYA_ADI.mp3" }

Ses yoksa:

    { "text": "Şık metni", "audio": null }

Veya ses hiç yoksa düz string de yazabilirsiniz:

    "Şık metni"

---

### Konuşma balonlu soru (birden fazla parça)
Soruya şunu yazın:

    "audio_parts": [
        "sounds/questions/DOSYA1.mp3",
        "sounds/questions/DOSYA2.mp3",
        "sounds/questions/DOSYA3.mp3"
    ]

Ses yoksa:

    "audio_parts": null

---

## Önerilen isimlendirme

    q1.mp3          → 1. sorunun sesi
    q1_a1.mp3       → 1. sorunun 1. şıkkının sesi
    q1_a2.mp3       → 1. sorunun 2. şıkkının sesi
    q3_parca1.mp3   → 3. sorunun 1. konuşma balonunun sesi
    q3_parca2.mp3   → 3. sorunun 2. konuşma balonunun sesi

---

## Tam örnek (questions.json)

```json
{
  "question": "Aşağıdaki resimde ne görüyorsun?",
  "audio": "sounds/questions/q1.mp3",
  "audio_parts": null,
  "options": [
    { "text": "Elma", "audio": "sounds/questions/q1_a1.mp3" },
    { "text": "Muz",  "audio": "sounds/questions/q1_a2.mp3" },
    { "text": "Üzüm", "audio": null }
  ],
  "correct": 0
}
```

## Konuşma balonlu örnek

```json
{
  "question": "Konuşmayı dinle ve soruyu cevapla.",
  "audio": null,
  "audio_parts": [
    "sounds/questions/q3_parca1.mp3",
    "sounds/questions/q3_parca2.mp3",
    "sounds/questions/q3_parca3.mp3"
  ],
  "options": ["Sevinçli", "Üzgün", "Kızgın"],
  "correct": 0
}
```
