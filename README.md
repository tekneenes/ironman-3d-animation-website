# ⚡ STARK INDUSTRIES // MARK LXXXV (85) NANO-SUIT
### 🚀 3D WebGL & Three.js Cinematic Scrollytelling Experience

[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-00f0ff?style=for-the-badge&logo=github)](https://tekneenes.github.io/ironman-3d-animation-website/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Three.js](https://img.shields.io/badge/Three.js-r128-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![WebGL2](https://img.shields.io/badge/WebGL2-3D%20PBR-red?style=for-the-badge&logo=webgl)](https://www.khronos.org/webgl/)
[![JavaScript](https://img.shields.io/badge/Vanilla%20JS-ES6+-yellow?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

Bu proje; 4K PBR kaplamalı **Iron Man Mark LXXXV (85)** nanoteknoloji zırh modelini kullanarak, hiçbir harici ağır framework (React, Vue vb.) olmadan saf **Three.js, GLTFLoader, Web Audio API, modern CSS3 ve Vanilla JavaScript** ile geliştirilmiş, 3D scrollytelling (kaydırmalı hikaye anlatımı) ve interaktif vitrin web sitesidir.

🔗 **Canlı Demo (GitHub Pages):** [https://tekneenes.github.io/ironman-3d-animation-website/](https://tekneenes.github.io/ironman-3d-animation-website/)

---

## 🌟 Öne Çıkan Yetenekler ve Özellikler

### 1. 🎬 Sinematik 3D Kamera Scrollytelling (Kamera Kontrol Noktaları)
Sayfayı kaydırdıkça kamera 3 boyutlu uzayda akıcı bir şekilde hareket eder ve zırhın kritik modüllerine odaklanır:
- **Hero (%0 - Başlangıç):** Tam boy sinematik açı, idle nefes alma animasyonu, atmosferik noktasal ışıklar ve parçacık efektleri.
- **Kask & Nöral HUD (%25):** Kamera doğrudan kask vizörüne kilitlenir; holografik telemetri, canlı hedefleme ızgarası ve açı ölçümleri devreye girer.
- **Ark Reaktörü (%50):** Göğüsteki parlayan ark reaktörüne yakın çekim; dinamik noktasal ışık kaynağı nabız gibi çarpar.
- **Nano Repulsor İticileri (%75):** Avuç içi ve sırt stabilizatör iticilerine odaklanır; plazma akışı tetiklenir.
- **360° Zırh Stüdyosu (%100):** Kullanıcının modeli fare veya dokunmatik ekranla 360 derece serbestçe çevirip inceleyebileceği interaktif stüdyo modu.

### 2. 🛡️ Gerçek Zamanlı PBR Zırh Boya & Materyal Özelleştirici (Suit Customizer)
Three.js PBR (Physically Based Rendering) materyal motoru üzerinde canlı kaplama ve renk değişimi:
- **Mark LXXXV Classic:** Titanyum Kırmızı & 24K Altın Kaplama, Cyan Ark Reaktörü ışığı.
- **Stealth Strike:** Mat Karbon Siyahı ve fırçalanmış koyu altın detaylar.
- **War Machine:** Ağır zırhlı platin çelik ve kırmızı lazer göz aydınlatmaları.
- **Quantum Hologram:** Siber mavi cam ve saydam kuantum enerji kafesi.

### 3. 🔊 Web Audio API Entegre Ses Motoru
Harici ses dosyalarına ihtiyaç duymadan, doğrudan tarayıcının ses sentezleyicisi ve Web Audio osilatörleri ile üretilen ses efektleri:
- F.R.I.D.A.Y. / J.A.R.V.I.S. sistem başlatma frekansları.
- HUD buton etkileşimleri ve holografik klikler.
- **Repulsor Şarj Butonu:** Basıldığında yükselen plazma kondansatör şarj vızıltısı ve ardından ark reaktörü ışık patlaması.

### 4. 🌗 Dinamik Tema & Çoklu Dil (i18n)
- **Akıllı Tema Sistemi:** Yerel saate göre otomatik gündüz (Crimson & Gold) veya gece (Cyber Cyan) modu; istenirse manuel geçiş.
- **İki Dilli Altyapı:** Türkçe ve İngilizce dilleri arasında dinamik tek tıkla geçiş; tarayıcı/bölge diline göre akıllı başlangıç.

---

## 🛠️ Teknoloji Yığını

| Katman | Kullanılan Teknoloji / Kütüphane |
|---|---|
| **3D Rendering** | [Three.js](https://threejs.org/) (WebGL2 Canvas) & GLTFLoader |
| **Model & Materyaller** | GLTF / GLB Formatı, 4K PBR Textures (Albedo, Roughness, Metalness, Normal) |
| **Ses Mimarisi** | Web Audio API (Synthesized Audio Nodes & Oscillators) |
| **Arayüz & Animasyon** | Vanilla JS, Modern CSS (Grid, Flexbox, Glassmorphism, CSS Custom Properties) |
| **Tipografi** | Chakra Petch, Plus Jakarta Sans, Space Grotesk |
| **Yayın (Hosting)** | GitHub Pages |

---

## 📂 Dosya Yapısı

```
ironman-3d-animation-website/
├── index.html         # Ana sayfa, HUD göstergeleri, dil ve tema motoru
├── style.css          # Fütüristik Stark Industries HUD & responsive stiller
├── app.js             # Three.js sahnesi, kamera waypoints, ses motoru ve kontroller
├── favicon.svg        # Vektörel ark reaktörü ikonu
├── js/
│   ├── three.min.js   # Three.js çekirdek kütüphanesi
│   └── GLTFLoader.js  # GLTF/GLB 3D model yükleyici
└── model/
    ├── scene.gltf     # Iron Man Mark 85 3D model geometri ve sahne ağacı
    ├── scene.bin      # Binary vertex ve animasyon verileri (7.9 MB)
    ├── textures/      # 4K PBR kaplama dokuları
    └── license.txt    # 3D model lisans bilgisi
```

---

## 💻 Yerel Geliştirme (Local Setup)

Tarayıcıların CORS politikası gereği 3D GLTF modelleri yerel bir HTTP sunucusu üzerinden sunulmalıdır:

```bash
# Repoyu klonla
git clone https://github.com/tekneenes/ironman-3d-animation-website.git
cd ironman-3d-animation-website

# Python ile yerel sunucuyu başlat
python3 -m http.server 8000
```

Ardından tarayıcınızdan **`http://localhost:8000`** adresine gidin.

---

## 👨‍💻 Geliştirici
**Muhammed Enes Tekne**  
- **GitHub:** [@tekneenes](https://github.com/tekneenes)
- **Web Sitesi:** [tekneenes.github.io](https://tekneenes.github.io)

---

## 📄 Lisans
Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.  
*Not: Zırh 3D modeli Grant Riley tarafından üretilmiş olup CC-BY-NC-4.0 lisansı kapsamındadır.*

