# F1 Telemetri

Formula 1 verilerini analiz etmek icin Go tabanlı CLI aracı ve web arayuzu.
Gecmis veriler icin Jolpica API, canli veriler icin OpenF1 API kullanilir.

---

## Gereksinimler

- Go 1.22 veya uzeri (CLI icin)
- Modern bir tarayici (Web arayuzu icin — kurulum gerekmez)

---

## Derleme ve Calistirma

### Windows

```bat
git clone https://github.com/muhammedSeyrek/f1-telemetry
cd f1-telemetry
go build -o f1.exe .
f1.exe
```

### Linux / macOS

```bash
git clone https://github.com/muhammedSeyrek/f1-telemetry
cd f1-telemetry
go build -o f1 .
./f1
```

### Dogrudan calistirma (derleme olmadan)

```bash
go run .
```

---

## CLI Kullanimi

### Interaktif Menu

```bash
# Windows
f1.exe

# Linux / macOS
./f1
```

Program basladiginda iki mod sunar:

- Gecmis Veriler: tamamlanmis yaris verileri
- Canli Mod: yaris haftasonu aktif olur

### Direkt Komutlar

```bash
f1 son                        # Son yaris sonucu
f1 sonuc 2024 5               # 2024 sezonu 5. yaris
f1 sezon 2024                 # Sezon ozeti
f1 siralama 2024              # Suruco sampiyonasi
f1 takim 2024                 # Constructor sampiyonasi
f1 takvim 2025                # Yaris takvimi
f1 pit 2024 5                 # Pit stop analizi
f1 quali 2024 5               # Qualifying sonuclari
f1 grid 2024 5                # Grid vs Finish analizi
f1 karsilastir VER HAM 2024 5 # Tek yaris suruco karsilastirmasi
```

Windows'ta `f1` yerine `f1.exe` kullanin.

### Suruco Karsilastirma (Menu)

Menu uzerinden suruco karsilastirmasi yapilirken iki mod sunulur:

- Tek yaris: secilen yaristaki verileri karsilastirir
- Tum sezon: tur tur sonuclar, istatistikler ve ASCII grafik

Suruco secimi kod (VER, HAM), soyad veya yaris numarasi ile yapilabilir.

---

## Web Arayuzu

Derleme veya sunucu gerekmez. `frontend/index.html` dosyasini tarayicida acin:

```
frontend/index.html   <-- bu dosyayi cift tiklayarak acin
```

Veya terminal uzerinden:

```bash
# Linux
xdg-open frontend/index.html

# macOS
open frontend/index.html

# Windows
start frontend\index.html
```

Web arayuzu IBM Plex Mono font ve IBM Carbon Design System renk paleti kullanir.
Simdilik mock veri ile calisir; ilerleyen surumlerde Go backend ile entegre edilecektir.

---

## Canli Mod (CLI)

OpenF1 API uzerinden yaklasik 3 saniye gecikmeli veri saglar.
Yaris haftasonu disinda "aktif oturum bulunamadi" uyarisi verir, bu normaldir.

Canli modda sunular mevcuttur:

- Timing Tower: pozisyon, aralik, son tur zamani, lastik bilgisi (4sn guncelleme)
- Race Control: guvenlik arabasi, bayrak ve diger mesajlar (3sn guncelleme)
- Pit Takip: pit stop suresi, lastik compound, hangi turda girildi (5sn guncelleme)
- Arac Karsilastirma: throttle, fren, DRS, hiz, vites (2sn guncelleme)

Tum canli ekranlar CTRL+C ile kapatilir.

---

## Veri Kaynaklari

- Jolpica F1 API: gecmis yaris verileri, 2024 sezonuna kadar tam, 2025+ kismi
- OpenF1 API: canli telemetri, TV yayinindan yaklasik 3 saniye gecikmeli

---

## Proje Yapisi

```
f1-telemetry/
├── main.go
├── go.mod
├── frontend/
│   ├── index.html      # Web arayuzu
│   ├── style.css       # IBM Plex Mono + Carbon Design
│   └── app.js          # Arayuz mantigi ve mock veri
└── internal/
    ├── api/
    │   ├── client.go   # Jolpica API istemcisi
    │   └── openf1.go   # OpenF1 canli API istemcisi
    ├── models/
    │   ├── models.go   # Gecmis veri modelleri
    │   └── live.go     # Canli veri modelleri
    ├── display/
    │   └── display.go  # Terminal ciktilari
    └── live/
        └── monitor.go  # Canli izleme dongusu
```
