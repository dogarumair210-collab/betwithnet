# ♠️ American Blackjack - Complete Game Template Kit (Game ID: 48844)
**Platform Reference:** 1xBet (`/en/casino-search?game=48844`)  
**Original Provider:** Pragmatic Play  
**Game Symbol:** `bjmb` (American Blackjack)  
**Product ID:** 736 | **Brand ID:** 323  

---

## 📁 فولڈر کا اسٹرکچر (Extracted Assets & Template Structure)

```text
american_blackjack_extracted_assets/
├── images/                          # 🎨 تمام 21 ہائی ریزولوشن ٹیکسچرز اور اسپرائٹس
│   ├── texture_1_b4c8...jpg         # اصلی 4K گرین فیلٹ بلیک جیک ٹیبل بیک گراؤنڈ
│   ├── texture_8_42b6...png         # مکمل 52 تاش کارڈز اسپرائٹ شیٹ (Hearts, Diamonds, Clubs, Spades + Card Backs)
│   ├── texture_4_afba...png         # چپ ڈینومینیشنز (1, 5, 10, 25, 50, 100) اور بیٹنگ رنگز
│   ├── texture_13_a4c...png         # بٹنز اسپرائٹ شیٹ (Deal, Hit, Stand, Double, Split, Clear)
│   ├── texture_14_1d3...png         # ٹیبل رولز ٹیکسٹ اوورلے (Blackjack pays 3:2, Insurance pays 2:1)
│   └── 1xbet_game_thumb_48844.jpg   # 1xBet / Pragmatic Play آفیشل تھمب نیل
├── sounds/                          # 🔊 مکمل اصلی کیسینو آڈیو بینک
│   ├── sounds.mp3.json              # 6 MB کارڈ ڈیل، شفل، چپس، اور جیتنے کے ساؤنڈز
│   └── sounds.ogg.json
├── res/                             # ایکسٹینشن اور اوورلے فائلز
└── game_complete.json               # مکمل 12 پارٹس پر مشتمل یونیفائیڈ گیم انجن میٹا ڈیٹا

american_blackjack_template/
├── standalone_game/                 # 🎮 مکمل اسٹینڈ اکیلا گیم ٹیمپلیٹ (سنگل یا لوکل رن کے لیے)
│   ├── index.html                  # مین ایچ ٹی ایم ایل گیم فریم
│   ├── css/game_style.css          # رئیلسٹک کیسینو ٹیبل فیلٹ اور رسپانسو سی ایس ایس
│   ├── js/audio_engine.js          # ویب آڈیو سنتیسائزر ساؤنڈز (بغیر کسی بیرونی لاگ کے)
│   ├── js/game_engine.js           # 8 ڈیک شوز، ملٹی اسپاٹ بیٹنگ، ڈیلر AI، اسپلٹ، ڈبل ڈاؤن اور پے آؤٹس
│   └── assets/                     # ایکسٹریکٹ شدہ تمام میڈیا فائلز
│
├── 1xbet_portal_embed/             # 🌐 ون ایکس بیٹ پورٹل انٹیگریشن ٹیمپلیٹ
│   └── index.html                  # 1xBet لائیو والٹ (₨ 50,000)، نیویگیشن بار اور گیم آئی فریم
│
└── starter_reskin_template/        # ⚙️ گیم رولز، کرنسیاں اور کنفیگریشن فائل
    └── game_config.json            # من/میکس بیٹس، چپ ویلیوز اور پے آؤٹ ریشوز (3:2 vs 6:5)
```

---

## 🚀 لوکل ہوسٹ پر فوری چلانے کا طریقہ (How to Run)

1. **اسٹینڈ اکیلا بلیک جیک گیم چلائیں:**  
   براؤزر میں کھولیں:  
   `http://localhost:8080/american_blackjack_template/standalone_game/index.html`

2. **ون ایکس بیٹ لابی ایمبیڈ ٹیمپلیٹ چلائیں:**  
   براؤزر میں کھولیں:  
   `http://localhost:8080/american_blackjack_template/1xbet_portal_embed/index.html`

---

## ⚙️ گیم کے اہم فیچرز اور رولز (Game Rules & Features)

- **8-Deck Shoe with Cut Card:** اصلی کیسینو رینڈم شفل لاجک۔
- **Multi-Spot Betting:** پلیئر بیک وقت 3 اسپاٹس (لیفٹ، سینٹر، رائٹ) پر الگ الگ شرط لگا سکتا ہے۔
- **Blackjack Payout 3:2:** قدرتی بلیک جیک پر 1.5 گنا منافع۔
- **Insurance Feature:** ڈیلر کے اکے (Ace) پر انشورنس کی سہولت (2:1 پے آؤٹ)۔
- **Dealer Rules:** ڈیلر 16 تک کارڈز لیتا ہے اور 17 پر اسٹینڈ کرتا ہے۔
- **Double Down & Split:** کسی بھی 2 کارڈز پر ڈبل ڈاؤن کرنے کی سہولت۔
- **Currency Switcher:** ایک کلک پر PKR (₨) اور USD ($) کے درمیان رئیل ٹائم سوئچ۔
