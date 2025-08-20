# KPI Manager Mobile App

Modern KPI yönetimi ve analitik için geliştirilmiş React Native mobil uygulaması.

## 🚀 Özellikler

### 📊 Dashboard
- **Genel Performans Göstergeleri**: Gerçek zamanlı KPI skorları ve başarı oranları
- **Trend Analizi**: Zaman içindeki performans değişimleri
- **Risk Analizi**: Kritik KPI'lar için uyarı sistemi
- **Görselleştirme**: İnteraktif grafikler ve çizelgeler

### 📈 KPI Yönetimi
- **KPI Listesi**: Tüm KPI'ları kategorize edilmiş şekilde görüntüleme
- **Detaylı Görünüm**: Her KPI için ayrıntılı geçmiş ve trend analizi
- **Veri Girişi**: Mobil cihazdan kolay KPI değer girişi
- **Filtreleme**: Kategori, durum ve performansa göre filtreleme

### 🤖 Gelişmiş Analitik
- **Makine Öğrenmesi**: Predictive modeling ve forecasting
- **Trend Analizi**: Otomatik trend tespiti ve analizi
- **Seasonality Detection**: Mevsimsel desen analizi
- **Performance Insights**: AI destekli performans önerileri

### 👤 Kullanıcı Profili
- **Rol Bazlı Erişim**: ADMIN, UPPER_MANAGEMENT, MODEL_FACTORY rolleri
- **Bildirim Ayarları**: E-posta, push ve özel bildirim tercihleri
- **Kişiselleştirme**: Tema, dil ve görünüm ayarları

## 🛠️ Teknoloji Stack

- **Framework**: React Native + Expo
- **Navigation**: React Navigation 6.x
- **UI Library**: React Native Paper (Material Design)
- **Charts**: React Native Chart Kit
- **State Management**: React Hooks + Context API
- **HTTP Client**: Fetch API
- **Secure Storage**: Expo SecureStore
- **Icons**: Expo Vector Icons (Ionicons)

## 📦 Kurulum

### Gereksinimler
- Node.js 16+ 
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (macOS) veya Android Emulator

### Kurulum Adımları

1. **Projeyi klonlayın**
```bash
git clone <repository-url>
cd kpi-manager/mobile
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **Geliştirme sunucusunu başlatın**
```bash
npm start
```

4. **Uygulamayı çalıştırın**
```bash
# iOS için
npm run ios

# Android için
npm run android

# Web için
npm run web
```

## 🏗️ Proje Yapısı

```
mobile/
├── src/
│   ├── components/          # Yeniden kullanılabilir UI bileşenleri
│   ├── screens/            # Ana ekranlar
│   │   ├── DashboardScreen.tsx
│   │   ├── KPIListScreen.tsx
│   │   ├── KPIDetailScreen.tsx
│   │   ├── AnalyticsScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── services/           # API servisleri ve business logic
│   │   └── api.ts
│   ├── theme/              # Tema ve stil konfigürasyonu
│   │   └── index.ts
│   └── types/              # TypeScript tip tanımları
├── assets/                 # Resimler, fontlar, vs.
├── App.tsx                 # Ana uygulama bileşeni
├── app.json               # Expo konfigürasyonu
└── package.json           # Bağımlılıklar ve scriptler
```

## 🎨 Tasarım Sistemi

### Renkler
- **Primary**: #2563eb (Mavi)
- **Secondary**: #64748b (Gri)
- **Success**: #059669 (Yeşil)
- **Warning**: #d97706 (Turuncu)
- **Error**: #dc2626 (Kırmızı)

### Tipografi
- **Heading 1**: 32px, Bold
- **Heading 2**: 24px, Bold
- **Heading 3**: 20px, SemiBold
- **Body**: 16px, Regular
- **Caption**: 14px, Regular

### Spacing
- XS: 4px
- SM: 8px
- MD: 16px
- LG: 24px
- XL: 32px
- XXL: 48px

## 🔐 Güvenlik

### Kimlik Doğrulama
- JWT token bazlı kimlik doğrulama
- Secure token storage (Expo SecureStore)
- Otomatik token yenileme

### API Güvenliği
- HTTPS only communication
- Request/response validation
- Error handling ve logging

## 📊 API Entegrasyonu

### Base URL
- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

### Ana Endpoint'ler

```typescript
// Kimlik doğrulama
POST /auth/signin
POST /auth/signout

// Dashboard
GET /analytics/overview
GET /analytics/executive-summary

// KPI'lar
GET /kpis
GET /kpis/:id/values
POST /kpi-values

// Makine öğrenmesi
POST /ml?action=forecast
POST /ml?action=train
GET /ml?action=models

// Kullanıcı profili
GET /user/profile
PUT /user/profile
```

## 🧪 Test

```bash
# Unit testler
npm test

# E2E testler
npm run test:e2e

# Coverage raporu
npm run test:coverage
```

## 📱 Build ve Deployment

### Development Build
```bash
expo build:android
expo build:ios
```

### Production Build
```bash
expo build:android --type app-bundle
expo build:ios --type archive
```

### App Store Deployment
```bash
expo upload:android
expo upload:ios
```

## 🔧 Konfigürasyon

### Environment Variables
```bash
# .env dosyası
API_BASE_URL=http://localhost:3000/api
APP_ENV=development
VERSION=1.0.0
```

### Expo Configuration
```json
{
  "expo": {
    "name": "KPI Manager Mobile",
    "slug": "kpi-manager-mobile",
    "version": "1.0.0",
    "platforms": ["ios", "android", "web"]
  }
}
```

## 🤝 Katkıda Bulunma

1. Bu repository'yi fork edin
2. Feature branch'i oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

## 📞 Destek

- **Dokümantasyon**: [Expo Docs](https://docs.expo.dev/)
- **React Native**: [RN Docs](https://reactnative.dev/docs/getting-started)
- **Issues**: GitHub Issues sekmesini kullanın

## 🚀 Roadmap

### v1.1.0
- [ ] Offline mode desteği
- [ ] Push notification sistemi
- [ ] Dark mode desteği
- [ ] Biometric authentication

### v1.2.0
- [ ] AR/VR integration
- [ ] Advanced data visualization
- [ ] Real-time collaboration
- [ ] Voice commands

## 📈 Performance

### Optimizasyonlar
- Lazy loading ile component yükleme
- Image optimization ve caching
- API response caching
- Bundle size optimization

### Metrics
- First Load: < 3s
- Bundle Size: < 50MB
- Memory Usage: < 100MB
- Battery Impact: Minimal

---

**KPI Manager Mobile** - Modern KPI yönetimi artık cebinizde! 📱✨
