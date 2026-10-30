
const wishScreen = document.getElementById("wishScreen");
const birthdayScreen = document.getElementById("birthdayScreen");

const countdown = document.getElementById("countdown");
const timerProgress = document.getElementById("timerProgress");
const wishButton = document.getElementById("wishButton");
const wishHint = document.getElementById("wishHint");

const shootingStar = document.getElementById("shootingStar");
const starsContainer = document.getElementById("stars");

const micButton = document.getElementById("micButton");
const blowHint = document.getElementById("blowHint");

const flame = document.getElementById("flame");
const smoke = document.getElementById("smoke");
const finalMessage = document.getElementById("finalMessage");
const confetti = document.getElementById("confetti");

let timeLeft = 10;
let wishCompleted = false;
let candleOut = false;

let audioContext = null;
let microphoneStream = null;
let analyser = null;
let microphoneFrame = null;

// YILDIZLAR
for (let i = 0; i < 85; i++) {
  const star = document.createElement("div");
  star.className = "star";

  star.style.left = Math.random() * 100 + "%";
  star.style.top = Math.random() * 100 + "%";
  star.style.animationDelay = Math.random() * 4 + "s";
  star.style.animationDuration = 2 + Math.random() * 4 + "s";

  starsContainer.appendChild(star);
}

// GERİ SAYIM
const timer = setInterval(() => {
  if (wishCompleted) {
    clearInterval(timer);
    return;
  }

  timeLeft--;

  countdown.textContent =
    "00:" + String(timeLeft).padStart(2, "0");

  timerProgress.style.transform =
    `scaleX(${timeLeft / 10})`;

  if (timeLeft <= 0) {
    clearInterval(timer);
    wishHint.textContent =
      "Dileğin hazırsa yıldız seni bekliyor...";
  }
}, 1000);

// DİLEĞİ TUTTUM
wishButton.addEventListener("click", () => {
  if (wishCompleted) return;

  wishCompleted = true;
  clearInterval(timer);

  wishButton.disabled = true;
  wishHint.textContent = "Dileğin yıldızlara ulaştı...";

  shootingStar.classList.add("shoot");

  setTimeout(() => {
    wishScreen.classList.remove("active");
    birthdayScreen.classList.add("active");
  }, 1900);
});

// MİKROFONU DURDUR
function stopMicrophone() {
  if (microphoneFrame !== null) {
    cancelAnimationFrame(microphoneFrame);
    microphoneFrame = null;
  }

  if (microphoneStream) {
    microphoneStream.getTracks().forEach(track => track.stop());
    microphoneStream = null;
  }

  analyser = null;

  if (audioContext) {
    const context = audioContext;
    audioContext = null;
    context.close().catch(() => {});
  }
}

// MUM SÖNDÜRME
function blowOutCandle() {
  if (candleOut) return;

  candleOut = true;

  flame.classList.add("out");
  smoke.classList.add("show");

  micButton.style.display = "none";
  blowHint.textContent = "Dileğin gerçek olsun... ♡";

  stopMicrophone();

  setTimeout(() => {
    finalMessage.hidden = false;
    createConfetti();
  }, 1200);
}

// KONFETİ
function createConfetti() {
  const colors = [
    "#e9b5d1",
    "#fff0df",
    "#b98468",
    "#e7c69d",
    "#d7a2b6"
  ];

  for (let i = 0; i < 85; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";

    piece.style.left = Math.random() * 100 + "%";
    piece.style.background =
      colors[Math.floor(Math.random() * colors.length)];

    piece.style.animationDuration =
      3 + Math.random() * 3 + "s";

    piece.style.animationDelay =
      Math.random() * 1.5 + "s";

    confetti.appendChild(piece);
    piece.addEventListener("animationend", () => piece.remove());
  }
}

// MİKROFONLA GERÇEK ÜFLEME ALGILAMA
micButton.addEventListener("click", async () => {
  if (candleOut || microphoneStream) return;

  if (!navigator.mediaDevices?.getUserMedia) {
    blowHint.textContent =
      "Mikrofon için siteyi HTTPS veya localhost üzerinden aç.";
    return;
  }

  micButton.disabled = true;
  micButton.textContent = "Mikrofon hazırlanıyor...";

  try {
    microphoneStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });

    if (candleOut) {
      stopMicrophone();
      return;
    }

    audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();

    await audioContext.resume();

    const source = audioContext.createMediaStreamSource(
      microphoneStream
    );

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.35;

    source.connect(analyser);

    const frequencyData = new Uint8Array(
      analyser.frequencyBinCount
    );

    const timeData = new Uint8Array(
      analyser.fftSize
    );

    let blowFrames = 0;
    let lastFrameTime = 0;

    micButton.style.display = "none";
    blowHint.textContent =
      "Mikrofon açık. Şimdi mumuna doğru üfle...";

    function detectBlow(timestamp) {
      if (candleOut || !analyser) return;

      microphoneFrame = requestAnimationFrame(detectBlow);

      // Yaklaşık 30 ölçüm/saniye
      if (timestamp - lastFrameTime < 33) return;
      lastFrameTime = timestamp;

      analyser.getByteTimeDomainData(timeData);
      analyser.getByteFrequencyData(frequencyData);

      // SES ŞİDDETİ
      let sum = 0;

      for (let i = 0; i < timeData.length; i++) {
        const sample = (timeData[i] - 128) / 128;
        sum += sample * sample;
      }

      const volume = Math.sqrt(sum / timeData.length);

      // ÜFLEMEYE BENZEYEN GENİŞ BANTLI SES
      const binWidth = audioContext.sampleRate / analyser.fftSize;

      let noiseSum = 0;
      let noiseCount = 0;

      let lowSum = 0;
      let lowCount = 0;

      for (let i = 0; i < frequencyData.length; i++) {
        const frequency = i * binWidth;

        if (frequency >= 1000 && frequency <= 6000) {
          noiseSum += frequencyData[i];
          noiseCount++;
        }

        if (frequency >= 100 && frequency <= 700) {
          lowSum += frequencyData[i];
          lowCount++;
        }
      }

      const highNoise = noiseCount
        ? noiseSum / noiseCount
        : 0;

      const lowNoise = lowCount
        ? lowSum / lowCount
        : 0;

      // Hem güçlü hem de hava sesi içeren ses aranıyor.
     const looksLikeBlow =
  volume > 0.025 &&
  highNoise > 20 &&
  highNoise > lowNoise * 0.35;

      if (looksLikeBlow) {
        blowFrames++;
      } else {
        blowFrames = Math.max(0, blowFrames - 2);
      }

      // Yaklaşık yarım saniyelik üfleme
      if (blowFrames >= 10) {
        blowOutCandle();
      }
    }

    microphoneFrame = requestAnimationFrame(detectBlow);

  } catch (error) {
    console.error("Mikrofon hatası:", error);

    stopMicrophone();

    micButton.disabled = false;
    micButton.style.display = "block";
    micButton.textContent = "Mikrofonu tekrar dene";

    blowHint.textContent =
      "Mikrofon izni verilmedi veya mikrofon açılamadı.";
  }
});
