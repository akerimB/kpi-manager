// Script to generate remaining KPI templates (21-41) from kanıt.txt

const remainingKPIs = [
  // KPI 21 - SH3.2 - Performans değerlendirme
  {
    kpiNumber: 21,
    shCode: 'SH3.2',
    kpiTitle: 'Performans değerlendirme kapsam oranı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH3.2_ik_performans_sistemi',
        fileType: ['CSV', 'XLSX'],
        description: 'İK performans sistemi çıktıları',
        category: 'REPORT'
      },
      {
        type: 'recommended',
        fileName: 'SH3.2_kalibrasyon_tutanaklari',
        fileType: ['PDF', 'DOCX'],
        description: 'Kalibrasyon tutanakları',
        category: 'REPORT'
      }
    ],
    aiAnalysisMethods: [
      'Kapsam oranı',
      'Puan dağılımı anomali',
      'Hedefle uyum'
    ],
    sampleNaming: [
      'SH3.2_performans_sistem_2024Q4.csv',
      'SH3.2_kalibrasyon_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['personel_id', 'degerlendirme_puani', 'hedef_puan', 'donem'],
      fileSize: { min: 1024, max: 10 * 1024 * 1024 },
      timeframe: 'Yıllık performans değerlendirmeleri'
    }
  },

  // KPI 23 - SH3.4 - İç/dış denetim uygunsuzluk
  {
    kpiNumber: 23,
    shCode: 'SH3.4',
    kpiTitle: 'İç/dış denetim uygunsuzluk/ikaz sayısı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH3.4_denetim_raporlari',
        fileType: ['PDF'],
        description: 'Denetim raporları (ISO, mali, idari)',
        category: 'REPORT'
      },
      {
        type: 'required',
        fileName: 'SH3.4_capa_listeleri',
        fileType: ['XLSX', 'CSV'],
        description: 'CAPA listeleri',
        category: 'LOG'
      }
    ],
    aiAnalysisMethods: [
      'Uygunsuzlukların kritikliği',
      'Kök neden kümeleme',
      'Kapanış süresi analizi'
    ],
    sampleNaming: [
      'SH3.4_denetim_rapor_2024Q4.pdf',
      'SH3.4_capa_liste_2024Q4.xlsx'
    ],
    validationRules: {
      requiredFields: ['denetim_turu', 'uygunsuzluk_kodu', 'kritiklik', 'acilma_tarihi'],
      fileSize: { min: 1024, max: 50 * 1024 * 1024 },
      timeframe: 'Denetim dönemleri'
    }
  },

  // KPI 24 - SH3.5 - Stratejik hedeflere ulaşma
  {
    kpiNumber: 24,
    shCode: 'SH3.5',
    kpiTitle: 'Stratejik hedeflere genel ulaşma oranı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH3.5_okr_kpi_panolari',
        fileType: ['XLSX', 'CSV'],
        description: 'OKR/KPI panoları',
        category: 'REPORT'
      },
      {
        type: 'required',
        fileName: 'SH3.5_stratejik_plan_izleme',
        fileType: ['PDF', 'XLSX'],
        description: 'Stratejik plan izleme dosyaları',
        category: 'REPORT'
      }
    ],
    aiAnalysisMethods: [
      'Hedef gerçekleşme RAG',
      'Stratejik katkı matrisleri',
      'Sektör öncelikleriyle hizalama'
    ],
    sampleNaming: [
      'SH3.5_okr_pano_2024Q4.xlsx',
      'SH3.5_plan_izleme_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['hedef_kodu', 'hedef_deger', 'gerceklesen_deger', 'donem'],
      fileSize: { min: 1024, max: 25 * 1024 * 1024 },
      timeframe: 'Çeyreklik hedef izleme'
    }
  },

  // KPI 25 - SH3.6 - Belge/akreditasyon
  {
    kpiNumber: 25,
    shCode: 'SH3.6',
    kpiTitle: 'Alınan belge/akreditasyon sayısı (ISO, EFQM vb.)',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH3.6_sertifikalar',
        fileType: ['PDF'],
        description: 'Sertifikalar/PDF',
        category: 'CERTIFICATE'
      },
      {
        type: 'recommended',
        fileName: 'SH3.6_akreditasyon_denetim',
        fileType: ['PDF'],
        description: 'Akreditasyon denetim raporları',
        category: 'REPORT'
      }
    ],
    aiAnalysisMethods: [
      'Kapsam & süreklilik (geçerlilik tarihi)',
      'Sektör için kritik sertifikalar ısısı (gıda IFS/BRC, otomotiv IATF vb.)'
    ],
    sampleNaming: [
      'SH3.6_iso_sertifika_2024Q4.pdf',
      'SH3.6_denetim_rapor_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['sertifika_turu', 'verilis_tarihi', 'gecerlilik_tarihi'],
      fileSize: { min: 1024, max: 25 * 1024 * 1024 },
      timeframe: 'Dönem içinde alınan/yenilenen sertifikalar'
    }
  },

  // KPI 26 - SH3.6 - Çalışan iyileştirme önerisi
  {
    kpiNumber: 26,
    shCode: 'SH3.6',
    kpiTitle: 'Çalışan başına onaylanmış iyileştirme önerisi sayısı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH3.6_kaizen_oneri_sistemi',
        fileType: ['CSV', 'XLSX'],
        description: 'Kaizen/Öneri sistemi kayıtları',
        category: 'LOG'
      },
      {
        type: 'recommended',
        fileName: 'SH3.6_kabul_odul_listeleri',
        fileType: ['XLSX', 'PDF'],
        description: 'Kabul/ödül listeleri',
        category: 'LOG'
      }
    ],
    aiAnalysisMethods: [
      'Öneri hızı (100 çalışan/ay)',
      'Tasarruf etkisi tahmini',
      'Tema madenciliği'
    ],
    sampleNaming: [
      'SH3.6_oneri_sistem_2024Q4.csv',
      'SH3.6_odul_liste_2024Q4.xlsx'
    ],
    validationRules: {
      requiredFields: ['personel_id', 'oneri_kodu', 'oneri_tarihi', 'durum'],
      fileSize: { min: 1024, max: 15 * 1024 * 1024 },
      timeframe: 'Dönem içinde verilen öneriler'
    }
  },

  // KPI 27 - SH3.7 - Dijital platform kullanım
  {
    kpiNumber: 27,
    shCode: 'SH3.7',
    kpiTitle: 'CRM/ERP/LMS vb. dijital platform kullanım oranı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH3.7_sistem_kullanim_loglari',
        fileType: ['CSV', 'JSON'],
        description: 'Sistem kullanım logları (oturum, aktif kullanıcı, işlem hacmi)',
        category: 'LOG'
      },
      {
        type: 'recommended',
        fileName: 'SH3.7_lisans_listeleri',
        fileType: ['XLSX', 'PDF'],
        description: 'Lisans listeleri',
        category: 'REPORT'
      }
    ],
    aiAnalysisMethods: [
      'Aktiflik oranı, özellik kullanım derinliği',
      'Sektörler için kritik modül kullanımı (örn. izlenebilirlik)'
    ],
    sampleNaming: [
      'SH3.7_kullanim_log_2024Q4.csv',
      'SH3.7_lisans_liste_2024Q4.xlsx'
    ],
    validationRules: {
      requiredFields: ['kullanici_id', 'sistem_adi', 'oturum_tarihi', 'sure_dakika'],
      fileSize: { min: 1024, max: 100 * 1024 * 1024 },
      timeframe: 'Aylık sistem kullanım verileri'
    }
  },

  // KPI 28 - SH3.8 - Diğer MF benimsenen pratik
  {
    kpiNumber: 28,
    shCode: 'SH3.8',
    kpiTitle: 'Diğer MF\'lerce benimsenen iyi pratik sayısı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH3.8_iyi_uygulama_kayitlari',
        fileType: ['PDF', 'DOCX'],
        description: 'İyi uygulama kayıtları',
        category: 'REPORT'
      },
      {
        type: 'required',
        fileName: 'SH3.8_paylasim_oturum_tutanaklari',
        fileType: ['PDF', 'DOCX'],
        description: 'Paylaşım oturumu tutanakları',
        category: 'LOG'
      },
      {
        type: 'recommended',
        fileName: 'SH3.8_referanslar',
        fileType: ['PDF', 'XLSX'],
        description: 'Referanslar',
        category: 'CERTIFICATE'
      }
    ],
    aiAnalysisMethods: [
      'Benimsenme oranı',
      'Benimsendiği sektör/kapsam',
      'Etki puanı'
    ],
    sampleNaming: [
      'SH3.8_iyi_uygulama_2024Q4.pdf',
      'SH3.8_paylasim_tutanak_2024Q4.pdf',
      'SH3.8_referans_2024Q4.xlsx'
    ],
    validationRules: {
      requiredFields: ['pratik_kodu', 'paylasim_tarihi', 'hedef_mf', 'benimsenme_durumu'],
      fileSize: { min: 1024, max: 25 * 1024 * 1024 },
      timeframe: 'Paylaşım ve benimseme süreçleri'
    }
  }
];

console.log('Remaining KPI Templates (21-28):');
console.log(JSON.stringify(remainingKPIs, null, 2));
