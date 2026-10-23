# 🎰 Fortune Gems 2 - Complete Game Template Kit
**Platform Reference:** 1xBet (`/en/slots/game/98308/fortune-gems-2`)  
**Original Provider:** TaDa Gaming / JILI Games  

---

## 📁 ٹیمپلیٹ فولڈر کا اسٹرکچر (Template Structure)

```text
fortune_gems_2_template/
├── standalone_game/              # 🎮 مکمل اسٹینڈ اکیلا گیم ٹیمپلیٹ (بغیر کسی بیرونی منحصرات کے)
│   ├── index.html               # مین ایچ ٹی ایم ایل گیم فریم
│   ├── css/game_style.css       # مکمل ریسپانسیو سی ایس ایس، اینیمیشنز اور ایزٹیک کیبنٹ
│   ├── js/audio_engine.js       # ویب آڈیو سنتیسائزر (ساؤنڈ ایفیکٹس بغیر ایم پی تھری کے)
│   ├── js/game_engine.js        # آر این جی ریل میتھ، 5 پے لائنز اور وہیل لاجک
│   └── assets/                  # تمام ہائی ریزولوشن سمبلز، وہیل، شیلڈز اور ویکٹرز
│
├── 1xbet_portal_embed/          # 🌐 ون ایکس بیٹ پورٹل ایمبیڈ ٹیمپلیٹ
│   └── index.html               # 1xBet نیویگیشن، لائیو والیٹ، سائڈبار اور گیم آئی فریم
│
└── starter_reskin_template/     # 🎨 فوری ری اسکن کے لیے کنفگریشن فائل
    └── game_config.json         # سمبلز، پے آؤٹس اور ملٹی پلائرز آسانی سے تبدیل کرنے کے لیے
```

---

## 🚀 فوری چلانے کا طریقہ (How to Run on Localhost)

1. **اسٹینڈ اکیلا گیم چلائیں:**  
   براؤزر میں کھولیں:  
   `http://localhost:8080/fortune_gems_2_template/standalone_game/index.html`

2. **ون ایکس بیٹ لابی ایمبیڈ ٹیمپلیٹ چلائیں:**  
   براؤزر میں کھولیں:  
   `http://localhost:8080/fortune_gems_2_template/1xbet_portal_embed/index.html`

---

## ⚙️ گیم کی خصوصیات (Features Included in this Template)

- **3x3 Main Grid:** اصلی 3 بائی 3 ایزٹیک ریلز۔
- **4th Multiplier Reel:** چوتھا ملٹی پلائر ریل (1X, 2X, 3X, 5X, 10X, 15X اور Lucky Wheel Trigger)۔
- **Extra Bet Toggle:** اضافی شرط آن کرنے پر 1X ملٹی پلائر غائب ہو جاتا ہے اور بڑے انعامات کے چانسز بڑھ جاتے ہیں۔
- **Interactive Lucky Wheel:** سن اسٹون وہیل بونس جس میں 1,000X تک فزکس ڈیسیلیریشن کے ساتھ ملٹی پلائرز ملتے ہیں۔
- **Big Win Fanfare:** ایزٹیک شیلڈ اور کوائن پارٹیکلز کے ساتھ جیتنے کی زبردست اینیمیشن۔
- **No Third-Party Dependencies:** مکمل طور پر خالص وینلا جاوا اسکرپٹ (Vanilla JS)، خالص سی ایس ایس (Pure CSS) اور ویب آڈیو پر مبنی ہے۔
