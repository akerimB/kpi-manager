# KPI Manager - Kullanıcı Hesapları

## Demo Giriş Sistemi

Sistemde 3 farklı rol seviyesi bulunmaktadır:

### 1. **ADMIN** - System Admin
- **Email:** admin@kobimodel.gov.tr  
- **Şifre:** Admin123!
- **Yetkiler:** 
  - Strateji İzleme sayfasına erişim ✅
  - Tüm model fabrika verilerini görme ✅
  - Rol değiştirme (Model Fabrika/Üst Yönetim görünümü) ✅
  - Tüm analitik raporlara erişim ✅

### 2. **UPPER_MANAGEMENT** - Üst Yönetim
- **Email:** ust.yonetim@kobimodel.gov.tr
- **Şifre:** UstYon123!
- **Yetkiler:**
  - Strateji İzleme sayfasına erişim ✅
  - Tüm model fabrika verilerini görme ✅
  - Analitik raporlara erişim ✅
  - Eylem/Faz izleme ✅

### 3. **MODEL_FACTORY** - Tüm 15 Model Fabrika Kullanıcıları

| # | Şehir | Email | Şifre | Fabrika ID |
|---|-------|-------|--------|-----------|
| 1 | **Adana** | adana@kobimodel.gov.tr | Adana123! | cmebmec0a0007gpvewan8fteb |
| 2 | **Ankara** | ankara@kobimodel.gov.tr | Ankara123! | cmebmec020000gpveb9ewqio0 |
| 3 | **Bursa** | bursa@kobimodel.gov.tr | Bursa123! | cmebmec060001gpved4wzoa1i |
| 4 | **Denizli** | denizli@kobimodel.gov.tr | Denizli123! | cmebmec0c000agpveur7svu8r |
| 5 | **Eskişehir** | eskisehir@kobimodel.gov.tr | Eskişehir123! | cmebmec0b0008gpve0h73wefe |
| 6 | **Gaziantep** | gaziantep@kobimodel.gov.tr | Gaziantep123! | cmebmec070002gpveev4g7r2v |
| 7 | **Kayseri** | kayseri@kobimodel.gov.tr | Kayseri123! | cmebmec090004gpveghxdwyuw |
| 8 | **Kocaeli** | kocaeli@kobimodel.gov.tr | Kocaeli123! | cmebmec0d000bgpvez84cki35 |
| 9 | **Konya** | konya@kobimodel.gov.tr | Konya123! | cmebmec090005gpvep0rxmljz |
| 10 | **Malatya** | malatya@kobimodel.gov.tr | Malatya123! | cmebmec0d000cgpveu4t34ysn |
| 11 | **Mersin** | mersin@kobimodel.gov.tr | Mersin123! | cmebmec0a0006gpvexv9vprdx |
| 12 | **Samsun** | samsun@kobimodel.gov.tr | Samsun123! | cmebmec0c0009gpvejqbibf0h |
| 13 | **Tekirdağ** | tekirdag@kobimodel.gov.tr | Tekirdağ123! | cmebmec0e000dgpveiwmi4eo2 |
| 14 | **Trabzon** | trabzon@kobimodel.gov.tr | Trabzon123! | cmebmec0f000egpveges02p3j |
| 15 | **İzmir** | izmir@kobimodel.gov.tr | İzmir123! | cmebmec080003gpve0qsf64du |

**Tüm Model Fabrika Kullanıcıları için Ortak Yetkiler:**
- Sadece kendi fabrika verilerini görme ✅
- KPI girişi yapabilme ✅
- Strateji sayfasına ERİŞEMEZ ❌

## Hızlı Test Girişleri (Browser Console)

### Admin Girişi:
```javascript
fetch('/api/auth/demo-login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({role: 'ADMIN'})
}).then(r => r.json()).then(data => {
  localStorage.setItem('authToken', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  window.location.reload();
});
```

### Üst Yönetim Girişi:
```javascript
fetch('/api/auth/demo-login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({role: 'UPPER_MANAGEMENT'})
}).then(r => r.json()).then(data => {
  localStorage.setItem('authToken', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  window.location.reload();
});
```

### Adana Model Fabrika Girişi:
```javascript
fetch('/api/auth/demo-login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({role: 'MODEL_FACTORY', factoryCode: 'ADANA'})
}).then(r => r.json()).then(data => {
  localStorage.setItem('authToken', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  window.location.reload();
});
```

## Admin Rol Değiştirme

Admin kullanıcısı farklı roller arasında geçiş yapabilir:

### Model Fabrika Görünümüne Geçiş:
```javascript
fetch('/api/auth/switch-role', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({targetRole: 'MODEL_FACTORY', factoryId: 'cmebmec0a0007gpvewan8fteb'})
}).then(r => r.json()).then(data => {
  localStorage.setItem('authToken', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  window.location.reload();
});
```

### Üst Yönetim Görünümüne Geçiş:
```javascript
fetch('/api/auth/switch-role', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({targetRole: 'UPPER_MANAGEMENT'})
}).then(r => r.json()).then(data => {
  localStorage.setItem('authToken', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  window.location.reload();
});
```

## Önemli Notlar

1. **Strateji İzleme** sayfası sadece ADMIN ve UPPER_MANAGEMENT rollerine açıktır
2. **Admin** hem model fabrika hem de üst yönetim ekranlarına erişebilir
3. **Model Fabrika** kullanıcıları sadece kendi fabrikalarının verilerini görebilir
4. Tüm şifreler güvenlik için güçlü yapıda oluşturulmuştur
