/**
 * STARK INDUSTRIES // MARK LXXXV (85)
 * Master 3D Scrollytelling Engine — Three.js, PBR & Web Audio API
 */

document.addEventListener('DOMContentLoaded', () => {
  initLanguageManager();
  initCursorReticle();
  initThreeJsScrollytelling();
  initWebAudioJarvis();
  initSuitVariantSwitcher();
  initRepulsorTest();
  initCoreOverdriveButton();
  initCard3DTiltAndSpotlight();
  initAnimatedCounters();
  initMagneticButtons();
  initClickShockwaves();
  initPlasmaBladeSparks();
  initScrollReveal();
  initThemeSwitcher();
  initMobileDrawer();
  initOffscreenSectionPause();
});

/* ==========================================================================
   Bellek Optimizasyonu: Ekran Dışı Bölümlerde Blur & Animasyonları Duraklat
   (1 ekran boyu önceden tekrar etkinleşir — kullanıcı asla farkı görmez)
   ========================================================================== */
function initOffscreenSectionPause() {
  const sections = document.querySelectorAll('.story-section');
  if (!sections.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      entry.target.classList.toggle('is-offscreen', !entry.isIntersecting);
    });
  }, { rootMargin: '100% 0px 100% 0px', threshold: 0 });

  sections.forEach(section => observer.observe(section));
}

/* ==========================================================================
   1. Özel HUD İmleci (Target Reticle & Coordinates)
   ========================================================================== */
function initCursorReticle() {
  const reticle = document.getElementById('cursorReticle');
  const coords = document.getElementById('reticleCoords');
  if (!reticle) return;

  // Merkezi Fare Takip Yöneticisi (Reticle + 3D Parallaks + Stüdyo 360 Döndürme)
  window.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    reticle.style.left = `${mouseX}px`;
    reticle.style.top = `${mouseY}px`;

    if (coords) {
      coords.textContent = `X: ${Math.round(mouseX)} // Y: ${Math.round(mouseY)}`;
    }

    // Three.js Kamera Parallaksı
    mouseNormX = (mouseX / window.innerWidth - 0.5) * 2;
    mouseNormY = (mouseY / window.innerHeight - 0.5) * 2;

    // Stüdyo Bölümü 360° Sürükleme
    if (isStudioDragging && ironManModel) {
      const deltaX = mouseX - studioDragStartX;
      studioDragStartX = mouseX;
      studioRotationY += deltaX * 0.008;
    }
  }, { passive: true });

  const circle = reticle.querySelector('.reticle-circle');
  const interactives = document.querySelectorAll('a, button, .suit-btn');
  interactives.forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (circle) {
        circle.style.width = '55px';
        circle.style.height = '55px';
        circle.style.borderColor = currentActiveTheme === 'crimson-gold' ? '#ffd700' : '#f6d365';
      }
    }, { passive: true });
    el.addEventListener('mouseleave', () => {
      if (circle) {
        circle.style.width = '';
        circle.style.height = '';
        circle.style.borderColor = '';
      }
    }, { passive: true });
  });
}

/* ==========================================================================
   2. Three.js 3D Sahne ve Sinematik Kamera Scrollytelling Motoru
   ========================================================================== */
let scene, camera, renderer;
let modelContainer = null;
let ironManModel = null;
let ironManMaterials = [];
let arcReactorLight = null;
let rimLight = null;
let fillLight = null;
let currentActiveTheme = 'default';

let chestDiveIntensity = 0;
let reactorStabilizeFactor = 0; // 0 = normal nefes alma, 1 = tam kilitli, dümdüz ve hareketsiz

// Kamera Waypoints (6 scrollytelling bölümü için birebir kalibre edilmiş sinematik konumlar)
const storySectionIds = ['hero', 'helmet', 'reactor', 'reactor-dive', 'repulsor', 'specs'];

const cameraWaypoints = [
  // 0: Hero (Genel Zırh Görünümü — Sağda geniş açılı sinematik görünüm)
  { pos: new THREE.Vector3(-0.95, 0.25, 4.3), target: new THREE.Vector3(-0.85, 0.15, 0) },

  // 1: Kask & Nöral HUD (Solda — Sağdaki kartla çakışmaz, sol kenardan taşmaz)
  { pos: new THREE.Vector3(0.68, 1.18, 1.68), target: new THREE.Vector3(0.44, 1.15, 0) },

  // 2: Ark Reaktörü Dış Bakış (Sağ yarıda dengeli — Sol karttan ayrı, sağ kenardan taşmaz)
  { pos: new THREE.Vector3(-0.38, 0.72, 1.68), target: new THREE.Vector3(-0.38, 0.72, 0.298) },

  // 3: Çekirdek İçi Dalış (Kuantum Plazma Odası — Sol kenardan taşmaz, reaktör tam görünür ve sağ kartla çakışmaz)
  { pos: new THREE.Vector3(0.20, 0.868, 1.10), target: new THREE.Vector3(0.20, 0.868, 0.298) },

  // 4: Repulsor İticileri (Solda — Avuç içi iticileri ve kollar geniş kadrajda, kenarlardan kesilmez)
  { pos: new THREE.Vector3(0.68, 0.2, 2.15), target: new THREE.Vector3(0.22, 0.1, 0) },

  // 5: Telemetri & Bento Grid Detayları (Model sütunun sağında, baştan ayağa tam sığacak şekilde)
  { pos: new THREE.Vector3(-0.95, 0.08, 4.45), target: new THREE.Vector3(-0.85, 0.02, 0) }
];

let currentCameraPos = cameraWaypoints[0].pos.clone();
let currentCameraTarget = cameraWaypoints[0].target.clone();
let targetCameraPos = cameraWaypoints[0].pos.clone();
let targetCameraTarget = cameraWaypoints[0].target.clone();

// Fare Parallaksı
let mouseNormX = 0, mouseNormY = 0;
let isStudioDragging = false;
let studioDragStartX = 0;
let studioRotationY = 0;

function initThreeJsScrollytelling() {
  const canvas = document.getElementById('webglCanvas');
  const container = document.getElementById('canvasContainer');
  if (!canvas || !container) return;

  // Sahne
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030508, 0.08);

  // Kamera
  const isMobile = window.innerWidth <= 768;
  camera = new THREE.PerspectiveCamera(isMobile ? 56 : 45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.copy(cameraWaypoints[0].pos);
  if (isMobile) {
    camera.position.x *= 0.2;
    camera.position.z += 0.35;
    camera.position.y -= 0.16;
    targetCameraPos.copy(camera.position);
    targetCameraTarget.x *= 0.2;
    targetCameraTarget.y -= 0.16;
    currentCameraPos.copy(camera.position);
    currentCameraTarget.copy(targetCameraTarget);
  }

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: false,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.6;
  renderer.outputEncoding = THREE.sRGBEncoding;

  // Işıklandırma (Stark Laboratories Cinematic Lighting)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambientLight);

  // Altın Ana Key Işık (Sağ üstten)
  const keyLight = new THREE.DirectionalLight(0xffeedd, 2.8);
  keyLight.position.set(4, 5, 4);
  scene.add(keyLight);

  // Siyan Rim Işık (Sol arkadan zırh kıvrımlarını parlatır)
  rimLight = new THREE.DirectionalLight(0x00f2fe, 3.2);
  rimLight.position.set(-4, 3, -3);
  scene.add(rimLight);

  // Göğüsteki Ark Reaktörü Noktasal Işığı (Point Light — Üst Göğüs Beyaz Dairesinde)
  arcReactorLight = new THREE.PointLight(0x00f2fe, 4.0, 3.5);
  arcReactorLight.position.set(0, 0.868, 0.305);
  scene.add(arcReactorLight);

  // Model Taşıyıcı Grubu (Merkezleme ve Dönüşler İçin)
  modelContainer = new THREE.Group();
  scene.add(modelContainer);

  // Ark Reaktörü Zemin Işıltısı
  fillLight = new THREE.DirectionalLight(0x0a2244, 1.2);
  fillLight.position.set(0, -3, 2);
  scene.add(fillLight);

  // 3D Model Yükleme (GLTFLoader)
  loadIronManModel();

  // Pencere Boyutlandırma
  window.addEventListener('resize', onWindowResize);

  // Scroll Dinleyicisi (rAF ile Throttled — Sıfır Gereksiz Kare İşlemi)
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        onScrollUpdate();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  // Stüdyo Bölümünde 360° Sürükleyip Döndürme
  initStudioDragControls(container);

  // Animasyon Döngüsü
  animateScene();
}

function loadIronManModel() {
  const loader = new THREE.GLTFLoader();
  const preloader = document.getElementById('preloader');
  const loadProgress = document.getElementById('loadProgress');
  const loadStatus = document.getElementById('loadStatus');

  loader.load(
    'model/scene.gltf',
    (gltf) => {
      ironManModel = gltf.scene;

      // Model Bounding Box Hesaplama ve Otomatik Merkezleme
      const box = new THREE.Box3().setFromObject(ironManModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const scaleFactor = 3.15 / (maxDim || 1);

      ironManModel.scale.setScalar(scaleFactor);
      ironManModel.position.set(
        -center.x * scaleFactor,
        -center.y * scaleFactor,
        -center.z * scaleFactor
      );

      // Malzemeleri (PBR Materials) topla ve optimize et
      ironManMaterials = [];
      ironManModel.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.metalness = 0.85;
          child.material.roughness = 0.25;
          child.material.envMapIntensity = 1.5;
          ironManMaterials.push(child.material);
        }
      });

      modelContainer.add(ironManModel);

      // Yükleme tamamlandı, preloader'ı gizle
      if (loadProgress) loadProgress.style.width = '100%';
      if (loadStatus) {
        loadStatus.textContent = (currentActiveLang === 'en')
          ? 'ONLINE LINK ESTABLISHED // WELCOME'
          : 'BAĞLANTI TAMAMLANDI // HOŞ GELDİNİZ';
      }

      setTimeout(() => {
        if (preloader) {
          preloader.classList.add('fade-out');
          // Geçiş bitince preloader'ı (sonsuz dönen animasyonlarıyla birlikte) DOM'dan tamamen kaldır
          setTimeout(() => preloader.remove(), 1200);
        }
        playJarvisWakeupSound();
      }, 600);
    },
    (xhr) => {
      if (xhr.lengthComputable) {
        const percent = Math.round((xhr.loaded / xhr.total) * 100);
        if (loadProgress) loadProgress.style.width = `${percent}%`;
        if (loadStatus) {
          loadStatus.textContent = (currentActiveLang === 'en')
            ? `LOADING 3D NANO-ARMOR MODEL: ${percent}%`
            : `3D NANO-ZIRH MODELİ YÜKLENİYOR: %${percent}`;
        }
      }
    },
    (err) => {
      console.error('Model yüklenirken hata:', err);
      if (loadStatus) {
        loadStatus.textContent = (currentActiveLang === 'en')
          ? 'LOCAL SERVER REQUIRED TO LOAD 3D MODEL (CORS)'
          : 'MODEL YÜKLENİRKEN YEREL SUNUCU GEREKİYOR (CORS)';
      }
    }
  );
}



function onWindowResize() {
  const isMobile = window.innerWidth <= 768;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.fov = isMobile ? 56 : 45;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.5));
  cachedSectionEls = null; // Ekran boyutu değiştiğinde DOM referanslarını yenile
}

/* ==========================================================================
   Scroll ile Kamera İnterpolasyonu (Scrollytelling Engine — GC-Free)
   ========================================================================== */
const chestExitPos = new THREE.Vector3(0.5, 0.868, 1.55);
const chestExitTarget = new THREE.Vector3(0.3, 0.868, 0.298);
let cachedSectionEls = null;

function getCachedSectionEls() {
  if (!cachedSectionEls) {
    cachedSectionEls = storySectionIds.map(id => document.getElementById(id));
  }
  return cachedSectionEls;
}

function onScrollUpdate() {
  const scrollTracker = document.getElementById('scrollTracker');
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return;

  const scrollY = window.scrollY;
  const progress = Math.max(0, Math.min(1, scrollY / maxScroll));

  if (scrollTracker) {
    scrollTracker.style.width = `${progress * 100}%`;
  }

  // Bölüm tabanlı hassas kamera enterpolasyonu (Önbellekten çekilir, DOM sorgusu yapılmaz)
  const sectionEls = getCachedSectionEls();
  const viewportCenter = scrollY + window.innerHeight * 0.5;

  let segment = 0;
  for (let i = 0; i < sectionEls.length - 1; i++) {
    const elCurrent = sectionEls[i];
    const elNext = sectionEls[i + 1];
    if (!elCurrent || !elNext) continue;

    const centerCurrent = elCurrent.offsetTop + elCurrent.offsetHeight * 0.5;
    const centerNext = elNext.offsetTop + elNext.offsetHeight * 0.5;

    if (viewportCenter >= centerCurrent && viewportCenter < centerNext) {
      const frac = (viewportCenter - centerCurrent) / (centerNext - centerCurrent);
      segment = i + frac;
      break;
    } else if (viewportCenter < centerCurrent && i === 0) {
      segment = 0;
      break;
    } else if (i === sectionEls.length - 2 && viewportCenter >= centerNext) {
      segment = sectionEls.length - 1;
      break;
    }
  }

  const totalWaypoints = cameraWaypoints.length - 1;
  segment = Math.max(0, Math.min(totalWaypoints, segment));
  const index = Math.floor(segment);
  const fraction = segment - index;

  const currentWp = cameraWaypoints[index];
  const nextWp = cameraWaypoints[Math.min(index + 1, totalWaypoints)];

  if (index === 3) {
    // Çekirdek İçi (index 3) -> İticiler (index 4) geçişi (Sabit Vector3 tekilleri ile sıfır GC)
    if (fraction < 0.45) {
      // 1. Aşama: Göğüsten geriye doğru süzülür
      const subFraction = fraction / 0.45;
      targetCameraPos.lerpVectors(currentWp.pos, chestExitPos, subFraction);
      targetCameraTarget.lerpVectors(currentWp.target, chestExitTarget, subFraction);
    } else {
      // 2. Aşama: Dışarı çıktıktan sonra iticilere/kollara döner
      const subFraction = (fraction - 0.45) / 0.55;
      targetCameraPos.lerpVectors(chestExitPos, nextWp.pos, subFraction);
      targetCameraTarget.lerpVectors(chestExitTarget, nextWp.target, subFraction);
    }
  } else if (currentWp && nextWp) {
    targetCameraPos.lerpVectors(currentWp.pos, nextWp.pos, fraction);
    targetCameraTarget.lerpVectors(currentWp.target, nextWp.target, fraction);
  }

  // Mobil portre ekranda zırhı ortala ve kartların üzerindeki üst vitrin alanına yerleştir
  const isMobile = window.innerWidth <= 768;
  if (isMobile && index !== 3) {
    targetCameraPos.x *= 0.2;
    targetCameraTarget.x *= 0.2;
    targetCameraTarget.y -= 0.16;
    targetCameraPos.y -= 0.16;
    targetCameraPos.z += 0.35;
  }

  // Çekirdek İçi Dalış Yoğunluğu (diveIntensity: 0..1)
  // Segment 2 -> 3: Göğüsteki beyaz ışığın içine dalıyoruz (0 -> 1)
  // Segment 3 -> 4 (fraction < 0.5): Delikten geriye doğru dışarı çıkıyoruz (1 -> 0)
  if (index === 2) {
    chestDiveIntensity = Math.min(1, fraction * 1.25);
  } else if (index === 3) {
    if (fraction < 0.5) {
      chestDiveIntensity = Math.max(0, 1 - (fraction / 0.5));
    } else {
      chestDiveIntensity = 0;
    }
  } else {
    chestDiveIntensity = 0;
  }

  // Reaktöre yaklaştıkça ve delikten çıkana kadar modelin sallanmasını sıfırla (Stabilizasyon)
  if (segment >= 1.2 && segment <= 3.6) {
    if (segment < 2.0) {
      reactorStabilizeFactor = (segment - 1.2) / 0.8;
    } else if (segment <= 3.4) {
      reactorStabilizeFactor = 1.0; // Delikten tamamen çıkana kadar kaya gibi düz ve sabit!
    } else {
      reactorStabilizeFactor = Math.max(0, (3.6 - segment) / 0.2);
    }
  } else {
    reactorStabilizeFactor = 0;
  }

  // Göğüsteki Ark Reaktörü Noktasal Işığı (Yaklaştıkça parıldar)
  if (arcReactorLight) {
    arcReactorLight.intensity = 4.0 + chestDiveIntensity * 6.0;
    arcReactorLight.distance = 3.5 + chestDiveIntensity * 3.0;
  }

  // Ekran Vignette Parlaması
  const vignette = document.querySelector('.core-dive-vignette');
  if (vignette) {
    vignette.style.opacity = (chestDiveIntensity * 0.7).toString();
  }

  // Portalı animateScene içerisindeki gerçek kamera mesafesi kontrol eder
}

/* ==========================================================================
   Stüdyo 360° Sürükleyip Döndürme
   ========================================================================== */
function initStudioDragControls(container) {
  window.addEventListener('mousedown', (e) => {
    // Sadece stüdyo bölümündeyken veya tıklanınca aktif
    if (window.scrollY > window.innerHeight * 3.5) {
      isStudioDragging = true;
      studioDragStartX = e.clientX;
    }
  });

  window.addEventListener('mouseup', () => { isStudioDragging = false; });

  // Dokunmatik Cihazlar
  window.addEventListener('touchstart', (e) => {
    if (window.scrollY > window.innerHeight * 3.5) {
      isStudioDragging = true;
      studioDragStartX = e.touches[0].clientX;
    }
  }, { passive: true });

  window.addEventListener('touchend', () => { isStudioDragging = false; });

  window.addEventListener('touchmove', (e) => {
    if (!isStudioDragging || !ironManModel) return;
    const deltaX = e.touches[0].clientX - studioDragStartX;
    studioDragStartX = e.touches[0].clientX;
    studioRotationY += deltaX * 0.008;
  }, { passive: true });
}

/* ==========================================================================
   Render & Animasyon Döngüsü (Page Visibility ile Optimize Edildi)
   ========================================================================== */
let clock = new THREE.Clock();
let isPageVisible = true;
let animSceneId = null;
let resumeBladeAnimation = null;

document.addEventListener('visibilitychange', () => {
  isPageVisible = !document.hidden;
  if (isPageVisible) {
    clock.start();
    if (!animSceneId) {
      animSceneId = requestAnimationFrame(animateScene);
    }
    if (typeof resumeBladeAnimation === 'function') {
      resumeBladeAnimation();
    }
  }
});

function animateScene() {
  if (!isPageVisible) {
    animSceneId = null;
    return;
  }
  animSceneId = requestAnimationFrame(animateScene);

  const elapsedTime = clock.getElapsedTime();

  // Kamera Konumlarını LERP ile Pürüzsüzleştir
  currentCameraPos.lerp(targetCameraPos, 0.06);
  currentCameraTarget.lerp(targetCameraTarget, 0.06);

  camera.position.copy(currentCameraPos);

  // Hafif Fare Parallaksı Ekle (Reaktöre yaklaştıkça parallaksı sıfırla ki delikten sapmasın)
  const parallaxFactor = Math.max(0, 1 - reactorStabilizeFactor * 0.95);
  camera.position.x += (mouseNormX * 0.15 * parallaxFactor - (camera.position.x - currentCameraPos.x)) * 0.05;
  camera.position.y += (-mouseNormY * 0.1 * parallaxFactor - (camera.position.y - currentCameraPos.y)) * 0.05;

  camera.lookAt(currentCameraTarget);

  // Model Animasyonları
  if (modelContainer) {
    // Stüdyo döndürmesi veya hafif süzülme
    if (Math.abs(studioRotationY) > 0.0001) {
      modelContainer.rotation.y = studioRotationY;
    } else {
      // Reaktöre yaklaştıkça modelin sallanması ve açısı TAM SIFIRA iner — model dümdüz kilitlenir
      const swayFactor = Math.max(0, 1 - reactorStabilizeFactor);
      modelContainer.position.y = Math.sin(elapsedTime * 1.5) * 0.03 * swayFactor;
      modelContainer.rotation.y = Math.sin(elapsedTime * 0.8) * 0.08 * swayFactor;
    }
  }

  // Ark Reaktörü Titreşimi (Pulsing Arc Light)
  if (arcReactorLight) {
    const baseIntensity = 3.5 + chestDiveIntensity * 14.0;
    arcReactorLight.intensity = baseIntensity + Math.sin(elapsedTime * 6) * 0.8;
  }

  renderer.render(scene, camera);
}

/* ==========================================================================
   3. Web Audio API — Jarvis & Repulsor Ses Motoru
   ========================================================================== */
let audioCtx = null;
let isAudioActive = false;
let ambientDroneOsc = null;
let ambientDroneGain = null;

function initWebAudioJarvis() {
  const toggleBtn = document.getElementById('audioToggle');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    ensureAudioContext();
    isAudioActive = !isAudioActive;
    toggleBtn.classList.toggle('active', isAudioActive);

    if (isAudioActive) {
      playJarvisBeep(880, 0.08);
      startJarvisAmbientDrone();
    } else {
      stopJarvisAmbientDrone();
    }
  });
}

function ensureAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playJarvisBeep(freq = 600, duration = 0.06) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + duration);

    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (err) {}
    };
  } catch (e) { }
}

function playJarvisWakeupSound() {
  if (!audioCtx || audioCtx.state !== 'running') return;
  // F.R.I.D.A.Y. çift tonlu uyanış akoru
  setTimeout(() => playJarvisBeep(523.25, 0.12), 100);
  setTimeout(() => playJarvisBeep(659.25, 0.12), 220);
  setTimeout(() => playJarvisBeep(783.99, 0.18), 340);
}

function startJarvisAmbientDrone() {
  if (!audioCtx || ambientDroneOsc) return;
  try {
    ambientDroneOsc = audioCtx.createOscillator();
    ambientDroneGain = audioCtx.createGain();

    ambientDroneOsc.type = 'sawtooth';
    ambientDroneOsc.frequency.setValueAtTime(55, audioCtx.currentTime); // 55Hz Sub-Bass rezonans

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 180;

    ambientDroneGain.gain.setValueAtTime(0.04, audioCtx.currentTime);

    ambientDroneOsc.connect(filter);
    filter.connect(ambientDroneGain);
    ambientDroneGain.connect(audioCtx.destination);
    ambientDroneOsc.start();
  } catch (e) {
    ambientDroneOsc = null;
    ambientDroneGain = null;
  }
}

function stopJarvisAmbientDrone() {
  if (!ambientDroneOsc) return;
  try {
    if (ambientDroneGain && audioCtx) {
      ambientDroneGain.gain.setValueAtTime(ambientDroneGain.gain.value, audioCtx.currentTime);
      ambientDroneGain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
      setTimeout(() => {
        if (ambientDroneOsc) {
          ambientDroneOsc.stop();
          ambientDroneOsc.disconnect();
          ambientDroneOsc = null;
          ambientDroneGain = null;
        }
      }, 250);
    } else {
      ambientDroneOsc.stop();
      ambientDroneOsc.disconnect();
      ambientDroneOsc = null;
      ambientDroneGain = null;
    }
  } catch (e) {
    ambientDroneOsc = null;
    ambientDroneGain = null;
  }
}

/* ==========================================================================
   4. Zırh Varyantları & PBR Renk Değiştirici
   ========================================================================== */
function initSuitVariantSwitcher() {
  const suitBtns = document.querySelectorAll('.suit-btn');

  const variantConfigs = {
    classic: {
      color: 0xffffff,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x00f2fe,
      emissiveIntensity: 1.0,
      lightColor: 0x00f2fe
    },
    stealth: {
      color: 0x22262e,
      metalness: 0.95,
      roughness: 0.35,
      emissive: 0xf6d365,
      emissiveIntensity: 1.4,
      lightColor: 0xf6d365
    },
    warmachine: {
      color: 0x8892a0,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xff1a40,
      emissiveIntensity: 1.8,
      lightColor: 0xff1a40
    },
    quantum: {
      color: 0x00d2ff,
      metalness: 0.3,
      roughness: 0.1,
      emissive: 0x00f2fe,
      emissiveIntensity: 2.2,
      lightColor: 0x00f2fe
    }
  };

  suitBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      suitBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const variant = btn.getAttribute('data-variant');
      const conf = variantConfigs[variant];

      if (conf && ironManMaterials.length > 0) {
        ironManMaterials.forEach(mat => {
          mat.color.setHex(conf.color);
          mat.metalness = conf.metalness;
          mat.roughness = conf.roughness;
          if (mat.emissive) {
            mat.emissive.setHex(conf.emissive);
            mat.emissiveIntensity = conf.emissiveIntensity;
          }
        });

        if (arcReactorLight) {
          arcReactorLight.color.setHex(conf.lightColor);
        }
      }

      playJarvisBeep(1046.5, 0.08); // Yüksek onay sesi
    });
  });
}

/* ==========================================================================
   5. Repulsor Plazma Şarj Testi
   ========================================================================== */
function initRepulsorTest() {
  const btn = document.getElementById('btnRepulsorTest');
  if (!btn) return;

  btn.addEventListener('click', () => {
    ensureAudioContext();
    btn.disabled = true;
    btn.querySelector('span:last-child').textContent = '⚡ PLAZMA ŞARJ OLUYOR...';

    // Ses: Yükselen osilatör (Repulsor Whine)
    if (audioCtx) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(240, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(3600, audioCtx.currentTime + 1.2);

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.25);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.3);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (err) {}
      };
    }

    // Işık patlaması
    if (arcReactorLight) {
      arcReactorLight.intensity = 12.0;
      arcReactorLight.color.setHex(0xffffff);

      setTimeout(() => {
        arcReactorLight.intensity = 4.0;
        arcReactorLight.color.setHex(currentActiveTheme === 'crimson-gold' ? 0xe30022 : 0x00f2fe);
      }, 1200);
    }

    setTimeout(() => {
      btn.disabled = false;
      btn.querySelector('span:last-child').textContent = '⚡ Repulsor Şarjını Test Et';
    }, 1500);
  });
}

/* ==========================================================================
   5.5 Ark Reaktörü Plazma Aşırı Yükü (Core Overdrive Pulse)
   ========================================================================== */
function initCoreOverdriveButton() {
  const btn = document.getElementById('btnCoreOverdrive');
  if (!btn) return;

  btn.addEventListener('click', () => {
    ensureAudioContext();
    btn.disabled = true;
    const txtSpan = btn.querySelector('span:last-child');
    if (txtSpan) txtSpan.textContent = '💥 ÇEKİRDEK PLAZMA PATLAMASI!';

    // Ses: Derin sub-bass ve yüksek rezonans reaktör deşarjı
    if (audioCtx) {
      const subOsc = audioCtx.createOscillator();
      const subGain = audioCtx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(120, audioCtx.currentTime);
      subOsc.frequency.exponentialRampToValueAtTime(35, audioCtx.currentTime + 1.4);

      subGain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      subGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.4);

      subOsc.connect(subGain);
      subGain.connect(audioCtx.destination);
      subOsc.start();
      subOsc.stop(audioCtx.currentTime + 1.45);
      subOsc.onended = () => {
        try {
          subOsc.disconnect();
          subGain.disconnect();
        } catch (err) {}
      };

      // Yüksek harmonik çınlama
      const highOsc = audioCtx.createOscillator();
      const highGain = audioCtx.createGain();
      highOsc.type = 'sine';
      highOsc.frequency.setValueAtTime(1400, audioCtx.currentTime);
      highOsc.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 1.2);

      highGain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      highGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);

      highOsc.connect(highGain);
      highGain.connect(audioCtx.destination);
      highOsc.start();
      highOsc.stop(audioCtx.currentTime + 1.25);
      highOsc.onended = () => {
        try {
          highOsc.disconnect();
          highGain.disconnect();
        } catch (err) {}
      };
    }

    // Göğüsteki Ark Reaktörü ışığını anlık 32'ye çıkar
    if (arcReactorLight) {
      arcReactorLight.intensity = 32.0;
      arcReactorLight.color.setHex(0xffffff);

      setTimeout(() => {
        arcReactorLight.color.setHex(currentActiveTheme === 'crimson-gold' ? 0xe30022 : 0x00f2fe);
        arcReactorLight.intensity = 4.0 + chestDiveIntensity * 14.0;
      }, 900);
    }

    // Ekran flaşı
    const vignette = document.querySelector('.core-dive-vignette');
    if (vignette) {
      if (currentActiveTheme === 'crimson-gold') {
        vignette.style.background = 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.7) 0%, rgba(227, 0, 34, 0.5) 40%, rgba(26, 17, 4, 0) 75%)';
        setTimeout(() => {
          vignette.style.background = '';
        }, 700);
      } else {
        vignette.style.background = 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.7) 0%, rgba(0, 242, 254, 0.4) 40%, rgba(3, 5, 8, 0) 75%)';
        setTimeout(() => {
          vignette.style.background = '';
        }, 700);
      }
    }

    setTimeout(() => {
      btn.disabled = false;
      if (txtSpan) txtSpan.textContent = '⚡ Plazma Aşırı Yükünü Ateşle (Pulse)';
    }, 1600);
  });
}

/* ==========================================================================
   6. Holografik Metin Şifre Çözücü (Devre Dışı Bırakıldı - Metinler Doğrudan Temiz Görünür)
   ========================================================================== */
function initTextScrambleEngine() {
  // Kullanıcı isteği üzerine metinlerdeki rastgele karakter / şifre çözme efekti kaldırıldı.
}

/* ==========================================================================
   7. 3D Kart Perspektif Eğimi (Tilt) & Dinamik Glare Işığı
   ========================================================================== */
function initCard3DTiltAndSpotlight() {
  const cards = document.querySelectorAll('.interactive-card');
  cards.forEach(card => {
    let rect = null;

    card.addEventListener('mouseenter', () => {
      rect = card.getBoundingClientRect();
    }, { passive: true });

    card.addEventListener('mousemove', (e) => {
      if (!rect) rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);

      const rotateX = ((y / rect.height) - 0.5) * -12;
      const rotateY = ((x / rect.width) - 0.5) * 12;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px) scale3d(1.02, 1.02, 1.02)`;
    }, { passive: true });

    card.addEventListener('mouseleave', () => {
      rect = null;
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale3d(1, 1, 1)';
    });
  });
}

/* ==========================================================================
   8. Dinamik Sayı Sayacı (Live Digital Telemetry Counters)
   ========================================================================== */
function initAnimatedCounters() {
  const countElements = document.querySelectorAll('.count-up');
  if (!countElements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
        entry.target.classList.add('counted');
        observer.unobserve(entry.target);
        animateValue(entry.target);
      }
    });
  }, { threshold: 0.3 });

  countElements.forEach(el => observer.observe(el));

  function animateValue(el) {
    const target = parseFloat(el.getAttribute('data-target')) || 0;
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const decimals = parseInt(el.getAttribute('data-decimals'), 10) || 0;
    const isComma = el.getAttribute('data-format') === 'comma';

    let startTime = null;
    const duration = 1600; // ms

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeVal = 1 - Math.pow(1 - progress, 4); // EaseOutQuart
      const current = easeVal * target;

      let formattedNumber = current.toFixed(decimals);
      if (isComma) {
        formattedNumber = Math.round(current).toLocaleString('tr-TR');
      }

      el.textContent = `${prefix}${formattedNumber}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        let finalStr = target.toFixed(decimals);
        if (isComma) finalStr = Math.round(target).toLocaleString('tr-TR');
        el.textContent = `${prefix}${finalStr}${suffix}`;
      }
    }

    requestAnimationFrame(step);
  }
}

/* ==========================================================================
   9. Manyetik Buton Çekim Efekti (Magnetic Buttons)
   ========================================================================== */
function initMagneticButtons() {
  const buttons = document.querySelectorAll('.magnetic-btn');
  buttons.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);

      btn.style.transform = `translate(${x * 0.28}px, ${y * 0.28}px) scale(1.04)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

/* ==========================================================================
   10. Tıklama Plazma Şok Dalgası (Click Shockwaves - Sabit DOM Havuzu)
   ========================================================================== */
function initClickShockwaves() {
  const POOL_SIZE = 6;
  const shockwavePool = [];
  let shockwaveIdx = 0;

  for (let i = 0; i < POOL_SIZE; i++) {
    const wave = document.createElement('div');
    wave.className = 'stark-click-shockwave';
    wave.style.display = 'none';
    document.body.appendChild(wave);
    shockwavePool.push(wave);
  }

  window.addEventListener('click', (e) => {
    const wave = shockwavePool[shockwaveIdx];
    shockwaveIdx = (shockwaveIdx + 1) % POOL_SIZE;

    wave.style.left = `${e.clientX}px`;
    wave.style.top = `${e.clientY}px`;
    wave.style.display = 'block';
    wave.style.animation = 'none';
    void wave.offsetWidth; // CSS animasyonunu sıfırlayıp baştan tetikle
    wave.style.animation = 'shockwaveExpand 0.65s cubic-bezier(0.1, 0.8, 0.3, 1) forwards';

    if (isAudioActive) {
      playJarvisBeep(880, 0.04);
    }

    setTimeout(() => {
      wave.style.display = 'none';
    }, 650);
  });
}

/* ==========================================================================
   11. Fruit Ninja Tarzı Plazma Bıçak İzi & 3D Model Kıvılcım Motoru (GC-Free Object Pool)
   ========================================================================== */
function initPlasmaBladeSparks() {
  const canvas = document.getElementById('plasmaTrailCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Plazma bıçak noktaları (Bellek tahsissiz sabit dizi)
  const MAX_TRAIL_POINTS = 35;
  const trailPoints = [];
  const MAX_TRAIL_AGE = 380; // ms boyunca iz parıldar

  // Çöp toplamayı (GC) sıfırlayan önceden tahsis edilmiş statik köşe dizileri
  const staticLeftOuter = Array.from({ length: MAX_TRAIL_POINTS }, () => ({ x: 0, y: 0 }));
  const staticRightOuter = Array.from({ length: MAX_TRAIL_POINTS }, () => ({ x: 0, y: 0 }));
  const staticLeftInner = Array.from({ length: MAX_TRAIL_POINTS }, () => ({ x: 0, y: 0 }));
  const staticRightInner = Array.from({ length: MAX_TRAIL_POINTS }, () => ({ x: 0, y: 0 }));

  // Modelden dökülen kıvılcımlar (Önceden ayrılmış 100 parçacıklı Obje Havuzu)
  const MAX_SPARKS = 100;
  const sparkPool = [];
  for (let i = 0; i < MAX_SPARKS; i++) {
    sparkPool.push({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      gravity: 0.22,
      life: 0,
      decay: 0.03,
      size: 2,
      color: '#f6d365'
    });
  }

  let sparkCursor = 0;
  function spawnSpark(x, y) {
    const s = sparkPool[sparkCursor];
    sparkCursor = (sparkCursor + 1) % MAX_SPARKS;

    const angle = Math.random() * Math.PI * 2;
    const force = Math.random() * 5.5 + 2;
    s.active = true;
    s.x = x + (Math.random() - 0.5) * 8;
    s.y = y + (Math.random() - 0.5) * 8;
    s.vx = Math.cos(angle) * force;
    s.vy = Math.sin(angle) * force - 2.0;
    s.gravity = 0.22;
    s.life = 1.0;
    s.decay = 0.02 + Math.random() * 0.025;
    s.size = Math.random() * 3.5 + 1.5;
    if (currentActiveTheme === 'crimson-gold') {
      s.color = Math.random() > 0.4 ? '#f2c14e' : '#e30022';
    } else {
      s.color = Math.random() > 0.35 ? '#f6d365' : '#00f2fe';
    }
    triggerBladeLoop();
  }

  // 3D Kesişim (Raycaster)
  const raycaster = new THREE.Raycaster();
  const mouseVec = new THREE.Vector2();
  let isHoveringModel = false;

  let lastX = null, lastY = null;
  let pendingX = 0, pendingY = 0;
  let pendingDist = 0;
  let hasPendingRaycast = false;

  function triggerBladeLoop() {
    if (!animBladeId && isPageVisible) {
      animBladeId = requestAnimationFrame(renderBladeAndSparks);
    }
  }

  window.addEventListener('pointermove', (e) => {
    const x = e.clientX;
    const y = e.clientY;
    const now = performance.now();

    if (lastX === null) {
      lastX = x;
      lastY = y;
    }

    const dist = Math.hypot(x - lastX, y - lastY);

    // Raycast ve kıvılcım için son imleç koordinatlarını her zaman güncelle
    pendingX = x;
    pendingY = y;
    pendingDist = dist;
    hasPendingRaycast = true;

    // Bıçak izi noktalarını yalnızca belirgin hareket varsa ekle (nokta birikmesini önler)
    if (dist < 3) return;

    lastX = x;
    lastY = y;

    // Bıçak noktası ekle (Bellek taşmasını önleyen döngüsel yönetim)
    if (trailPoints.length < MAX_TRAIL_POINTS) {
      trailPoints.push({ x, y, time: now, dist });
    } else {
      const oldest = trailPoints.shift();
      oldest.x = x;
      oldest.y = y;
      oldest.time = now;
      oldest.dist = dist;
      trailPoints.push(oldest);
    }

    triggerBladeLoop();
  }, { passive: true });

  let animBladeId = null;

  resumeBladeAnimation = function () {
    triggerBladeLoop();
  };

  function renderBladeAndSparks() {
    if (!isPageVisible) {
      animBladeId = null;
      return;
    }

    const now = performance.now();

    // 1. Kare Başına En Fazla 1 Kez Raycast (CPU & GC Tasarrufu)
    if (hasPendingRaycast && camera && ironManModel) {
      hasPendingRaycast = false;
      mouseVec.x = (pendingX / window.innerWidth) * 2 - 1;
      mouseVec.y = -(pendingY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouseVec, camera);

      const intersects = raycaster.intersectObjects(ironManModel.children, true);
      isHoveringModel = intersects.length > 0;

      if (isHoveringModel && pendingDist > 1) {
        const count = Math.min(10, Math.floor(pendingDist * 0.45) + 3);
        for (let i = 0; i < count; i++) {
          spawnSpark(pendingX, pendingY);
        }
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Ömrü dolan izleri temizle
    while (trailPoints.length > 0 && now - trailPoints[0].time > MAX_TRAIL_AGE) {
      trailPoints.shift();
    }

    // 3. Fruit Ninja Akıcı Plazma Bıçak İzi (Tek Parça Kesintisiz Ribbon — Sıfır GC Havuzu)
    const n = trailPoints.length;
    if (n >= 2) {
      for (let i = 0; i < n; i++) {
        const p = trailPoints[i];
        let tx = 0, ty = 0;

        if (i === 0) {
          tx = trailPoints[1].x - p.x;
          ty = trailPoints[1].y - p.y;
        } else if (i === n - 1) {
          tx = p.x - trailPoints[i - 1].x;
          ty = p.y - trailPoints[i - 1].y;
        } else {
          tx = trailPoints[i + 1].x - trailPoints[i - 1].x;
          ty = trailPoints[i + 1].y - trailPoints[i - 1].y;
        }

        const len = Math.hypot(tx, ty) || 1;
        const nx = -ty / len;
        const ny = tx / len;

        // u: 0 (en eski nokta / kuyruk) -> 1 (imlecin olduğu en yeni nokta / uç)
        const u = i / (n - 1);
        const ageRatio = (now - p.time) / MAX_TRAIL_AGE;
        const life = Math.max(0, 1 - ageRatio);

        // Kılıç Profili: Ucu sivri jilet keskinliği, ortası dolgun, arkası zarifçe incelen aerodinamik enerji bıçağı
        const envelope = Math.sin(Math.pow(u, 0.72) * Math.PI);
        const outerW = Math.max(0, envelope * 13 * life);
        const innerW = outerW * 0.38;

        staticLeftOuter[i].x = p.x + nx * outerW;
        staticLeftOuter[i].y = p.y + ny * outerW;
        staticRightOuter[i].x = p.x - nx * outerW;
        staticRightOuter[i].y = p.y - ny * outerW;
        staticLeftInner[i].x = p.x + nx * innerW;
        staticLeftInner[i].y = p.y + ny * innerW;
        staticRightInner[i].x = p.x - nx * innerW;
        staticRightInner[i].y = p.y - ny * innerW;
      }

      function drawSmoothRibbon(left, right, fillStyle, blur, shadowColor) {
        ctx.save();
        ctx.beginPath();
        ctx.shadowBlur = blur;
        ctx.shadowColor = shadowColor;
        ctx.fillStyle = fillStyle;

        // Kuyruk ucundan başla
        ctx.moveTo(trailPoints[0].x, trailPoints[0].y);

        // Sol kenarı kuyruktan uca pürüzsüz spline ile çiz
        for (let i = 0; i < n - 1; i++) {
          const xc = (left[i].x + left[i + 1].x) / 2;
          const yc = (left[i].y + left[i + 1].y) / 2;
          ctx.quadraticCurveTo(left[i].x, left[i].y, xc, yc);
        }
        ctx.lineTo(trailPoints[n - 1].x, trailPoints[n - 1].y);

        // Sağ kenarı uçtan geriye kuyruğa pürüzsüz spline ile dön
        for (let i = n - 1; i > 0; i--) {
          const xc = (right[i].x + right[i - 1].x) / 2;
          const yc = (right[i].y + right[i - 1].y) / 2;
          ctx.quadraticCurveTo(right[i].x, right[i].y, xc, yc);
        }
        ctx.lineTo(trailPoints[0].x, trailPoints[0].y);

        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Aşama A: Dış Neon Plazma Aurası (Crimson & Gold modunda altın kıvılcım & kırmızı plazma, cyan yok)
      const isCrimsonGold = currentActiveTheme === 'crimson-gold';
      const outerColor = isHoveringModel
        ? (isCrimsonGold ? 'rgba(242, 193, 78, 0.85)' : 'rgba(246, 211, 101, 0.68)')
        : (isCrimsonGold ? 'rgba(227, 0, 34, 0.75)' : 'rgba(0, 242, 254, 0.65)');
      const outerGlow = isHoveringModel 
        ? (isCrimsonGold ? '#f2c14e' : '#f6d365') 
        : (isCrimsonGold ? '#e30022' : '#00f2fe');
      drawSmoothRibbon(staticLeftOuter, staticRightOuter, outerColor, 18, outerGlow);

      // Aşama B: İç Beyaz Lazer Çekirdeği (Fruit Ninja Kılıç Keskinliği — Kusursuz Akıcı)
      drawSmoothRibbon(staticLeftInner, staticRightInner, 'rgba(255, 255, 255, 0.96)', 6, '#ffffff');
    }

    // 4. 3D Model Kıvılcımları (Obje Havuzundan Çizim - Sıfır Çöp Tahsisi, Toplu Blur)
    let hasActiveSparks = false;
    for (let i = 0; i < MAX_SPARKS; i++) {
      if (sparkPool[i].active) {
        hasActiveSparks = true;
        break;
      }
    }

    if (hasActiveSparks) {
      ctx.save();
      ctx.shadowBlur = 8;
      for (let i = 0; i < MAX_SPARKS; i++) {
        const s = sparkPool[i];
        if (!s.active) continue;

        s.x += s.vx;
        s.y += s.vy;
        s.vy += s.gravity;
        s.vx *= 0.97;
        s.life -= s.decay;

        if (s.life <= 0) {
          s.active = false;
          continue;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, s.life));
        ctx.fill();

        // Parıltı kuyruğu
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 2, s.y - s.vy * 2);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.size * s.life * 0.8;
        ctx.stroke();
      }
      ctx.restore();
    }

    // İz ve kıvılcım kalmadıysa döngüyü uyut (Sıfır CPU & Bellek Tüketimi)
    if (n === 0 && !hasActiveSparks) {
      animBladeId = null;
      return;
    }

    animBladeId = requestAnimationFrame(renderBladeAndSparks);
  }

  // Başlangıçta iz yoksa boşuna sürekli çizim yapmaz
  triggerBladeLoop();
}







/* ==========================================================================
   12. Scroll Reveal Animasyonları (Yazılara Genel Giriş Efekti)
   ========================================================================== */
function initScrollReveal() {
  // Reveal uygulanacak seçiciler
  const selectors = [
    '.stark-tag',
    '.main-heading',
    '.hero-desc',
    '.hero-quick-specs',
    '.scroll-cue',
    '.section-counter',
    '.card-heading',
    '.card-p',
    '.hud-telemetry-box',
    '.reactor-power-meter',
    '.dive-status-badge',
    '.core-dive-specs',
    '.core-actions',
    '.telemetry-grid',
    '.btn-repulsor-test',
    '.specs-title',
    '.section-tag-center',
    '.bento-card'
  ];

  const elements = document.querySelectorAll(selectors.join(', '));
  if (!elements.length) return;

  // Her elemente reveal class'ı ekle
  elements.forEach((el, i) => {
    el.classList.add('reveal');

    // Bento kartlarına kademeli gecikme ekle
    if (el.classList.contains('bento-card')) {
      const bentoCards = document.querySelectorAll('.bento-card');
      const idx = Array.from(bentoCards).indexOf(el);
      if (idx >= 0 && idx < 5) {
        el.classList.add(`stagger-${idx + 1}`);
      }
    }

    // Sol kartlara reveal-left, sağ kartlara reveal-right
    const parentCard = el.closest('.story-card');
    if (parentCard) {
      if (parentCard.classList.contains('left')) {
        el.classList.add('reveal-left');
      } else if (parentCard.classList.contains('right')) {
        el.classList.add('reveal-right');
      }
    }
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
}

/* ==========================================================================
   13. HUD Zırh Tema Seçici (Cyan / Crimson / Gold)
   ========================================================================== */
function initThemeSwitcher() {
  const toggles = document.querySelectorAll('.hud-compact-toggle');
  if (!toggles.length) return;

  // Tema → Three.js Sahne Işık ve Sis Konfigürasyonu (Zırh malzemesi DEĞİŞMEZ)
  const themeSceneConfigs = {
    default: {
      arcReactor: 0x00f2fe,
      rim:        0x00f2fe,
      fill:       0x0a2244,
      fog:        0x030508
    },
    'crimson-gold': {
      arcReactor: 0xffd700,
      rim:        0xffd700,
      fill:       0x8a0b16,
      fog:        0xd69516
    }
  };

  function applyTheme(theme, isInit = false) {
    currentActiveTheme = theme;
    try {
      localStorage.setItem('stark_theme', theme);
    } catch (e) {}

    // CSS data-theme attribute'unu güncelle
    if (theme === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }

    // Toggle butonlarının durumlarını güncelle
    toggles.forEach(toggle => {
      toggle.setAttribute('data-theme-current', theme);
      toggle.setAttribute('aria-checked', theme === 'crimson-gold' ? 'true' : 'false');
      toggle.setAttribute(
        'title',
        theme === 'crimson-gold'
          ? 'Aktif: Güneş (Crimson & Gold) — Gece (Cyan) temasına geçmek için tıklayın'
          : 'Aktif: Ay (Cyan) — Gündüz (Crimson & Gold) temasına geçmek için tıklayın'
      );
    });

    // Sekme ikonu (Favicon) rengini temaya göre dinamik güncelle
    const faviconLink = document.querySelector('link[rel="icon"]');
    if (faviconLink) {
      if (theme === 'crimson-gold') {
        faviconLink.href = 'data:image/svg+xml,' + encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
          '<circle cx="16" cy="16" r="14" fill="#66000c" stroke="#ffd700" stroke-width="2"/>' +
          '<circle cx="16" cy="16" r="9.5" fill="none" stroke="#ffd700" stroke-width="1.2" stroke-dasharray="3 2" opacity="0.85"/>' +
          '<polygon points="16,8.5 21.8,18.5 10.2,18.5" fill="none" stroke="#ffffff" stroke-width="1.4"/>' +
          '<circle cx="16" cy="16" r="2.8" fill="#ffd700"/>' +
          '</svg>'
        );
      } else {
        faviconLink.href = 'favicon.svg';
      }
    }

    // Three.js sahne ışıklarını ve sisini temaya göre güncelle
    const cfg = themeSceneConfigs[theme];
    if (cfg) {
      if (typeof arcReactorLight !== 'undefined' && arcReactorLight) {
        arcReactorLight.color.setHex(cfg.arcReactor);
      }
      if (typeof rimLight !== 'undefined' && rimLight) {
        rimLight.color.setHex(cfg.rim);
      }
      if (typeof fillLight !== 'undefined' && fillLight) {
        fillLight.color.setHex(cfg.fill);
      }
      if (typeof scene !== 'undefined' && scene && scene.fog) {
        scene.fog.color.setHex(cfg.fog);
      }
    }

    // Onay sesi (kullanıcı değiştirdiğinde)
    if (!isInit && typeof playJarvisBeep === 'function') {
      playJarvisBeep(theme === 'crimson-gold' ? 660 : 880, 0.06);
    }
  }

  toggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      try {
        localStorage.setItem('stark_theme_manual', 'true');
      } catch (err) {}
      const targetIcon = e.target.closest('[data-theme-target]');
      let nextTheme;
      if (targetIcon) {
        nextTheme = targetIcon.getAttribute('data-theme-target');
      } else {
        nextTheme = (currentActiveTheme === 'crimson-gold') ? 'default' : 'crimson-gold';
      }
      applyTheme(nextTheme, false);
    });
  });

  // Saate göre otomatik tema tespiti:
  // Gündüz (07:00 - 19:00): Crimson-Gold (Güneş / Açık Tema)
  // Gece (19:00 - 07:00): Default Cyan (Ay / Kapalı Tema)
  const currentHour = new Date().getHours();
  const isDayTime = (currentHour >= 7 && currentHour < 19);
  const timeAutoTheme = isDayTime ? 'crimson-gold' : 'default';

  let initialTheme = timeAutoTheme;
  try {
    const isManual = localStorage.getItem('stark_theme_manual') === 'true';
    if (isManual) {
      const saved = localStorage.getItem('stark_theme');
      if (saved === 'crimson-gold' || saved === 'default') initialTheme = saved;
    }
  } catch (e) {}

  if (document.documentElement.getAttribute('data-theme') === 'crimson-gold') {
    initialTheme = 'crimson-gold';
  } else if (!document.documentElement.getAttribute('data-theme') && localStorage.getItem('stark_theme_manual') !== 'true') {
    initialTheme = timeAutoTheme;
  }

  applyTheme(initialTheme, true);
}

/* ==========================================================================
   14. HUD Çoklu Dil Yöneticisi (TR / EN Translations & Dynamic Switcher)
   ========================================================================== */
let currentActiveLang = 'tr';

const translations = {
  tr: {
    pageTitle: 'STARK INDUSTRIES — Mark LXXXV (85) Nano-Zırh Vitrini',
    'preloader.badge': 'STARK INDUSTRIES // MARK LXXXV PROTOKOLÜ',
    'preloader.title': 'JARVIS SİSTEM BAŞLATILIYOR',
    'nav.armor': 'Zırh',
    'nav.helmet': 'Kask & HUD',
    'nav.reactor': 'Ark Reaktörü',
    'nav.dive': 'Çekirdek İçi',
    'nav.repulsor': 'İticiler',
    'nav.telemetry': 'Telemetri',
    'nav.cta': 'Telemetriyi İncele',
    'drawer.theme_label': 'ZIRH TEMASI',
    'hero.tag': 'NANOTEKNOLOJİ PROTOKOLÜ // AKTİF',
    'hero.sub': 'SAF NANO-GÜÇ.',
    'hero.desc': "Tony Stark'ın son başyapıtı. Milyarlarca nano-parçacığın milisaniyeler içinde şekillendiği, kuantum seviyesinde işlenen en gelişmiş zırh teknolojisi.",
    'hero.output': 'REAKTÖR ÇIKIŞI',
    'hero.speed': 'AZAMİ HIZ',
    'hero.integrity': 'ZIRH BÜTÜNLÜĞÜ',
    'hero.scroll': 'Kaskı İncelemek İçin Kaydırın',
    'helmet.stage': 'AŞAMA 01 // NÖRAL KASK',
    'helmet.h2_1': 'Biyonik Görüş &',
    'helmet.h2_2': 'Jarvis HUD Kilitlenmesi',
    'helmet.desc': 'Gelişmiş optik sensörler, pilotun retinasına doğrudan 360° taktiksel veri akışı sağlar. Tehditleri milisaniyeler içinde tespit eder ve yapay zeka destekli hedef tahmini yürütür.',
    'helmet.t_label1': 'HEDEF TAKİBİ:',
    'helmet.t_val1': 'KİLİTLENDİ (TRACKING)',
    'helmet.t_label2': 'BİYOMETRİK SENKRON:',
    'helmet.t_label3': 'OPTİK PARLAKLIK:',
    'reactor.stage': 'AŞAMA 02 // GÖĞÜS ARK REAKTÖRÜ',
    'reactor.h2_1': 'Sonsuz Güç Kaynağı:',
    'reactor.h2_2': 'Yeni Element Çekirdeği',
    'reactor.desc': "Tony Stark tarafından sentezlenen yeni element ile çalışan minyatür Ark Reaktörü, zırhın tüm nano-partikül ağını, iticilerini ve F.R.I.D.A.Y. işlemcisini saniyede petawattlarca temiz enerjiyle besler.",
    'reactor.meter': 'ARK REAKTÖRÜ ENERJİ VERİMLİLİĞİ',
    'dive.badge': 'ÇEKİRDEK İÇİ KİLİTLENDİ // 10,000,000°K PLAZMA',
    'dive.stage': 'AŞAMA 03 // ÇEKİRDEĞİN İÇİNE DALIŞ',
    'dive.h2_1': 'Beyaz Işığın İçi:',
    'dive.h2_2': 'Kuantum Plazma Odası',
    'dive.desc': "Şu anda Ark Reaktörü'nün göğüs kafesi arkasındaki kuantum plazma odasının tam merkezindesiniz. Manyetik koruma kafesi, nükleer füzyon plazmasını nano-milimetrik hassasiyetle hapseder.",
    'dive.spec_label1': 'MANYETİK ALAN:',
    'dive.spec_val1': '4.85 TESLA (KORUMALI)',
    'dive.spec_label2': 'İYON REZONANSI:',
    'dive.spec_label3': 'ÇEKİRDEK PLAZMA AKIŞI:',
    'dive.btn': 'Plazma Aşırı Yükünü Ateşle (Pulse)',
    'repulsor.stage': 'AŞAMA 04 // İTİCİ VE SİLAH SİSTEMLERİ',
    'repulsor.h2_1': 'Süpersonik İtki &',
    'repulsor.h2_2': 'Plazma Repulsorları',
    'repulsor.desc': 'Avuç içi ve taban iticileri hem Mach 8 hızında atmosferik ve uzay uçuşu sağlar, hem de odaklanmış plazma ışınları fırlatarak yıkıcı bir savunma gücü oluşturur.',
    'repulsor.speed': 'Uçuş Hızı',
    'repulsor.temp': 'Işın Isısı',
    'repulsor.btn': 'Repulsor Şarjını Test Et',
    'specs.tag': 'STARK LABS // NANO-MİMARİ',
    'specs.title': 'Efsanenin Bilişsel ve Fiziksel Sınırları',
    'bento.friday_title': '85. Nesil F.R.I.D.A.Y. Yapay Zeka Çekirdeği',
    'bento.friday_desc': 'Göz açıp kapayıncaya kadar düşman mühimmatını analiz eder, nano-kalkanları tehdidin açısına göre milisaniyede şekillendirir.',
    'bento.regen_title': 'Nano-Kafes Rejenerasyonu',
    'bento.regen_desc': 'Ağır hasar aldığında çevreleyen nano-parçacıklar hasarlı dokuyu saniyeler içinde onarır.',
    'bento.space_title': 'Derin Uzay Desteği',
    'bento.space_desc': 'Mutlak sıfır (-273°C) soğuklukta ve kozmik radyasyon altında bağımsız yaşam kabini.',
    'bento.thor_title': 'Yıldırım & Enerji Emici Matris',
    'bento.thor_desc': "Thor'un yıldırımlarından elektrik enerjisine kadar dış saldırıları reaktör şarjına dönüştüren ters akım kapasitörleri.",
    'footer.copy': '© 2026 Stark Industries Global. Tüm Hakları Saklıdır.',
    'footer.back': 'Başa Dön'
  },
  en: {
    pageTitle: 'STARK INDUSTRIES — Mark LXXXV (85) Nano-Armor Showcase',
    'preloader.badge': 'STARK INDUSTRIES // MARK LXXXV PROTOCOL',
    'preloader.title': 'INITIALIZING JARVIS SYSTEM',
    'nav.armor': 'Armor',
    'nav.helmet': 'Helmet & HUD',
    'nav.reactor': 'Arc Reactor',
    'nav.dive': 'Core Dive',
    'nav.repulsor': 'Repulsors',
    'nav.telemetry': 'Telemetry',
    'nav.cta': 'View Telemetry',
    'drawer.theme_label': 'SUIT THEME',
    'hero.tag': 'NANOTECHNOLOGY PROTOCOL // ACTIVE',
    'hero.sub': 'PURE NANO-POWER.',
    'hero.desc': "Tony Stark's ultimate masterpiece. The pinnacle of armor engineering, where billions of nanoparticles assemble in milliseconds at quantum precision.",
    'hero.output': 'REACTOR OUTPUT',
    'hero.speed': 'MAX SPEED',
    'hero.integrity': 'ARMOR INTEGRITY',
    'hero.scroll': 'Scroll to Inspect Helmet',
    'helmet.stage': 'PHASE 01 // NEURAL HELMET',
    'helmet.h2_1': 'Bionic Vision &',
    'helmet.h2_2': 'Jarvis HUD Lock-On',
    'helmet.desc': "Advanced optical sensors stream 360° tactical feeds straight to the pilot's retina. Instantly identifies threats with AI-assisted predictive targeting.",
    'helmet.t_label1': 'TARGET TRACKING:',
    'helmet.t_val1': 'LOCKED (TRACKING)',
    'helmet.t_label2': 'BIOMETRIC SYNC:',
    'helmet.t_label3': 'OPTICAL LUMEN:',
    'reactor.stage': 'PHASE 02 // CHEST ARC REACTOR',
    'reactor.h2_1': 'Infinite Power Source:',
    'reactor.h2_2': 'New Element Core',
    'reactor.desc': "Powered by the synthetic new element engineered by Tony Stark, the miniature Arc Reactor channels petawatts of clean energy per second into the entire nanoparticle lattice, thrusters, and F.R.I.D.A.Y.",
    'reactor.meter': 'ARC REACTOR ENERGY EFFICIENCY',
    'dive.badge': 'CORE LOCK ENGAGED // 10,000,000°K PLASMA',
    'dive.stage': 'PHASE 03 // DIVE INTO THE CORE',
    'dive.h2_1': 'Inside the Pure Light:',
    'dive.h2_2': 'Quantum Plasma Chamber',
    'dive.desc': "You are now at the epicenter of the quantum plasma chamber directly behind the chest plate. The magnetic containment field confines nuclear fusion plasma with nanometric precision.",
    'dive.spec_label1': 'MAGNETIC FIELD:',
    'dive.spec_val1': '4.85 TESLA (SHIELDED)',
    'dive.spec_label2': 'ION RESONANCE:',
    'dive.spec_label3': 'CORE PLASMA FLOW:',
    'dive.btn': 'Fire Plasma Overdrive Pulse',
    'repulsor.stage': 'PHASE 04 // THRUSTERS & WEAPONS',
    'repulsor.h2_1': 'Supersonic Propulsion &',
    'repulsor.h2_2': 'Plasma Repulsors',
    'repulsor.desc': "Palm and boot repulsors deliver Mach 8 flight capability across atmospheric and space regimes, while unleashing focused plasma beams with devastating defensive firepower.",
    'repulsor.speed': 'Flight Speed',
    'repulsor.temp': 'Beam Heat',
    'repulsor.btn': 'Test Repulsor Charge',
    'specs.tag': 'STARK LABS // NANO-ARCHITECTURE',
    'specs.title': 'Cognitive and Physical Frontiers of the Legend',
    'bento.friday_title': '85th Gen F.R.I.D.A.Y. AI Core',
    'bento.friday_desc': 'Analyzes enemy ordnance in the blink of an eye, morphing nano-shields to counteract ballistic angles in milliseconds.',
    'bento.regen_title': 'Nano-Lattice Regeneration',
    'bento.regen_desc': 'Upon sustaining severe damage, adjacent nanoparticles autonomously reconstruct compromised tissue within seconds.',
    'bento.space_title': 'Deep Space Life Support',
    'bento.space_desc': 'Autonomous life support chamber operating under absolute zero (-273°C) and cosmic radiation.',
    'bento.thor_title': 'Lightning & Energy Absorption Matrix',
    'bento.thor_desc': "Reverse-current capacitors converting hostile electrical discharge—including Thor's lightning—directly into reactor recharge.",
    'footer.copy': '© 2026 Stark Industries Global. All Rights Reserved.',
    'footer.back': 'Back to Top'
  }
};

function initLanguageManager() {
  const langToggles = document.querySelectorAll('.hud-lang-toggle');

  function setLanguage(lang, isInit = false) {
    if (!translations[lang]) return;
    currentActiveLang = lang;

    try {
      localStorage.setItem('stark_lang', lang);
    } catch (e) {}

    document.documentElement.setAttribute('lang', lang);

    // Başlık
    if (translations[lang].pageTitle) {
      document.title = translations[lang].pageTitle;
    }

    // data-i18n elementlerini güncelle
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = translations[lang][key];
      if (val !== undefined) {
        el.textContent = val;
        if (el.hasAttribute('data-original')) {
          el.setAttribute('data-original', val);
        }
      }
    });

    // Sayı sayaçlarının soneklerini (suffix) güncelle
    const counterElements = document.querySelectorAll('.count-up[data-suffix-tr][data-suffix-en]');
    counterElements.forEach(counter => {
      const oldSuffix = lang === 'en' ? counter.getAttribute('data-suffix-tr') : counter.getAttribute('data-suffix-en');
      const newSuffix = lang === 'en' ? counter.getAttribute('data-suffix-en') : counter.getAttribute('data-suffix-tr');
      counter.setAttribute('data-suffix', newSuffix);

      // Eğer sayaç zaten sayılmışsa, sonundaki yazıyı anında güncelle
      if (counter.classList.contains('counted') && oldSuffix) {
        if (counter.textContent.includes(oldSuffix.trim())) {
          counter.textContent = counter.textContent.replace(oldSuffix.trim(), newSuffix.trim());
        }
      }
    });

    // Toggle butonlarındaki aktiflik sınıflarını senkronize et
    langToggles.forEach(toggle => {
      const trOpt = toggle.querySelector('.lang-opt[data-lang="tr"]');
      const enOpt = toggle.querySelector('.lang-opt[data-lang="en"]');
      if (trOpt && enOpt) {
        if (lang === 'en') {
          trOpt.classList.remove('active');
          enOpt.classList.add('active');
        } else {
          trOpt.classList.add('active');
          enOpt.classList.remove('active');
        }
      }
      toggle.setAttribute(
        'title',
        lang === 'en'
          ? 'Active: English — Click to switch to Turkish'
          : 'Aktif: Türkçe — İngilizceye geçmek için tıklayın'
      );
      toggle.setAttribute(
        'aria-label',
        lang === 'en' ? 'Switch Language: English active' : 'Dili Değiştir: Türkçe aktif'
      );
    });

    // Jarvis bip efekti
    if (!isInit && typeof playJarvisBeep === 'function') {
      playJarvisBeep(lang === 'en' ? 740 : 880, 0.05);
    }
  }

  // Buton tıklama dinleyicileri
  langToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      try {
        localStorage.setItem('stark_lang_manual', 'true');
      } catch (err) {}
      const targetOpt = e.target.closest('[data-lang]');
      let nextLang;
      if (targetOpt) {
        nextLang = targetOpt.getAttribute('data-lang');
      } else {
        nextLang = (currentActiveLang === 'tr') ? 'en' : 'tr';
      }
      setLanguage(nextLang, false);
    });
  });

  // IP adresi konumuna göre dili dinamik belirle (Türkiye ise TR, diğer tüm ülkeler ise EN)
  async function detectCountryByIP() {
    try {
      if (localStorage.getItem('stark_lang_manual') === 'true') {
        return; // Kullanıcı dili manuel değiştirdiyse otomatik tespitle ezilmez
      }
    } catch (e) {}

    const endpoints = [
      {
        url: 'https://get.geojs.io/v1/ip/country.json',
        extract: data => data && (data.country_code || data.country)
      },
      {
        url: 'https://ipapi.co/json/',
        extract: data => data && (data.country_code || data.country)
      },
      {
        url: 'https://ipwho.is/',
        extract: data => data && data.country_code
      }
    ];

    let countryCode = null;

    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2600);
        const res = await fetch(ep.url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const json = await res.json();
          const code = ep.extract(json);
          if (code && typeof code === 'string' && code.length === 2) {
            countryCode = code.toUpperCase();
            break;
          }
        }
      } catch (err) {
        // Sonraki servise geç
      }
    }

    if (countryCode) {
      const targetLang = (countryCode === 'TR') ? 'tr' : 'en';
      if (targetLang !== currentActiveLang) {
        // Kullanıcı bu esnada butona basmadıysa uygula
        let isManualNow = false;
        try {
          isManualNow = localStorage.getItem('stark_lang_manual') === 'true';
        } catch (e) {}

        if (!isManualNow) {
          setLanguage(targetLang, false);
        }
      }
    }
  }

  // Başlangıç dilini belirle:
  // 1. Manuel seçim varsa localStorage'dan al
  // 2. Erken html[lang] attribute'unu kontrol et
  // 3. Zaman dilimi & tarayıcı dili (TR ise 'tr', başka ise 'en')
  let initialLang = 'en';
  try {
    const isManual = localStorage.getItem('stark_lang_manual') === 'true';
    if (isManual) {
      const saved = localStorage.getItem('stark_lang');
      if (saved === 'en' || saved === 'tr') initialLang = saved;
    } else {
      const tz = (Intl && Intl.DateTimeFormat) ? Intl.DateTimeFormat().resolvedOptions().timeZone : '';
      const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
      const isTR = (tz && (tz.includes('Istanbul') || tz.includes('Turkey'))) || browserLang.startsWith('tr');
      initialLang = isTR ? 'tr' : 'en';
    }
  } catch (e) {}

  const htmlLang = document.documentElement.getAttribute('lang');
  if (htmlLang === 'en' || htmlLang === 'tr') {
    initialLang = htmlLang;
  }

  setLanguage(initialLang, true);

  // Arka planda IP adresiyle ülke kontrolü gerçekleştir
  detectCountryByIP();
}

/* ==========================================================================
   15. Mobil HUD Navigasyon Çekmecesi (Mobile HUD Drawer)
   ========================================================================== */
function initMobileDrawer() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const drawer = document.getElementById('mobileDrawer');
  const closeBtn = document.getElementById('drawerCloseBtn');
  const backdrop = document.getElementById('drawerBackdrop');
  const drawerLinks = document.querySelectorAll('.drawer-link, #drawerCta');

  if (!menuBtn || !drawer) return;

  function openDrawer() {
    drawer.classList.add('open');
    menuBtn.classList.add('active');
    menuBtn.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (typeof playJarvisBeep === 'function') playJarvisBeep(980, 0.05);
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    menuBtn.classList.remove('active');
    menuBtn.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (drawer.classList.contains('open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  drawerLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeDrawer();
      if (typeof playJarvisBeep === 'function') playJarvisBeep(880, 0.04);
    });
  });

  // ESC tuşu ile kapatma
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });
}

