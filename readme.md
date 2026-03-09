# F1 Telemetri CLI

Formula 1 verilerini terminal üzerinden analiz etmek için yazılmış Go tabanlı CLI aracı.
Gecmis veriler icin Jolpica API, canli veriler icin OpenF1 API kullanilir.

## Kurulum

Go 1.22 veya uzeri gereklidir.
```bash
git clone https://github.com/muhammedSeyrek/f1-telemetry
cd f1-telemetry
go build -o f1.exe .
```

## Kullanim

### Interaktif Menu
```bash
.\f1.exe
```

Program basladiginda iki mod sunar:

- Gecmis Veriler — tamamlanmis yaris verileri
- Canli Mod — yaris haftasonu aktif olur

### Direkt Komutlar
```bash
.\f1.exe son                        # Son yaris sonucu
.\f1.exe sonuc 2024 5               # 2024 sezonu 5. yaris
.\f1.exe sezon 2024                 # Sezon ozeti
.\f1.exe siralama 2024              # Suruco sampiyonasi
.\f1.exe takim 2024                 # Constructor sampiyonasi
.\f1.exe takvim 2025                # Yaris takvimi
.\f1.exe pit 2024 5                 # Pit stop analizi
.\f1.exe quali 2024 5               # Qualifying sonuclari
.\f1.exe grid 2024 5                # Grid vs Finish analizi
.\f1.exe karsilastir VER HAM 2024 5 # Tek yaris suruco karsilastirmasi
```

### Suruco Karsilastirma (Menu)

Menu uzerinden suruco karsilastirmasi yapilirken iki mod sunulur:

- Tek yaris: secilen yaristaki verileri karsilastirir
- Tum sezon: tur tur sonuclar, istatistikler ve ASCII grafik

Suruco secimi kod (VER, HAM), soyad veya yaris numarasi ile yapilabilir.

## Canli Mod

OpenF1 API uzerinden yaklasik 3 saniye gecikmeli veri saglar.
Yaris haftasonu disinda "aktif oturum bulunamadi" uyarisi verir, bu normaldir.

Canli modda sunular mevcuttur:

- Timing Tower: pozisyon, aralik, son tur zamani, lastik bilgisi (4sn guncelleme)
- Race Control: guvenlik arabasi, bayrak ve diger mesajlar (3sn guncelleme)
- Pit Takip: pit stop suresi, lastik compound, hangi turda girildi (5sn guncelleme)
- Arac Karsilastirma: throttle, fren, DRS, hiz, vites (2sn guncelleme)

Tum canli ekranlar CTRL+C ile kapatilir.

## Veri Kaynaklari

Jolpica F1 API — gecmis yaris verileri, 2024 sezonuna kadar tam, 2025 ve 2026 kismi
OpenF1 API — canli telemetri, TV yayinindan yaklasik 3 saniye gecikmeli

## Proje Yapisi
```
f1-telemetry/
├── main.go
├── go.mod
└── internal/
    ├── api/
    │   ├── client.go       # Jolpica API istemcisi
    │   └── openf1.go       # OpenF1 canli API istemcisi
    ├── models/
    │   ├── models.go       # Gecmis veri modelleri
    │   └── live.go         # Canli veri modelleri
    ├── display/
    │   └── display.go      # Terminal ciktilari
    └── live/
        └── monitor.go      # Canli izleme dongusu
```