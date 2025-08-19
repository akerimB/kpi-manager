// SH4 KPI Templates (29-41) from kanıt.txt

const sh4KPIs = `
  // KPI 29 - SH4.1 - Paydaş geri bildirim iyileştirme
  {
    kpiNumber: 29,
    shCode: 'SH4.1',
    kpiTitle: 'Paydaş geri bildirimlerinden iyileştirme yapılan süreç/hizmet sayısı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH4.1_geri_bildirim_sistemi',
        fileType: ['CSV', 'XLSX'],
        description: 'Geri bildirim sistemi (ticket/CX)',
        category: 'LOG'
      },
      {
        type: 'required',
        fileName: 'SH4.1_degisiklik_kayitlari',
        fileType: ['PDF', 'DOCX'],
        description: 'Değişiklik kayıtları',
        category: 'LOG'
      },
      {
        type: 'recommended',
        fileName: 'SH4.1_versiyon_notlari',
        fileType: ['PDF', 'DOCX'],
        description: 'Versiyon notları',
        category: 'REPORT'
      }
    ],
    aiAnalysisMethods: [
      'Geri bildirim→aksiyon iz sürme',
      'VOC tema analizi',
      'Sektör bazlı memnuniyet farkları'
    ],
    sampleNaming: [
      'SH4.1_geri_bildirim_2024Q4.csv',
      'SH4.1_degisiklik_2024Q4.pdf',
      'SH4.1_versiyon_not_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['geri_bildirim_id', 'kaynagi', 'tema', 'aksiyon_durumu'],
      fileSize: { min: 1024, max: 25 * 1024 * 1024 },
      timeframe: 'Geri bildirim ve aksiyon arasında max 90 gün'
    }
  },

  // KPI 30 - SH4.2 - Marka tanınırlık
  {
    kpiNumber: 30,
    shCode: 'SH4.2',
    kpiTitle: 'Marka tanınırlık oranı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH4.2_hedef_kitle_anketi',
        fileType: ['CSV', 'XLSX'],
        description: 'Hedef kitle anketi',
        category: 'REPORT'
      },
      {
        type: 'recommended',
        fileName: 'SH4.2_dijital_erisim_istatistikleri',
        fileType: ['XLSX', 'CSV'],
        description: 'Dijital erişim istatistikleri',
        category: 'LOG'
      },
      {
        type: 'optional',
        fileName: 'SH4.2_medya_olcum_panolari',
        fileType: ['PDF', 'XLSX'],
        description: 'Medya ölçüm panoları',
        category: 'REPORT'
      }
    ],
    aiAnalysisMethods: [
      'Tanınırlık skoru',
      'Frekans erişim',
      'Sektör spesifik bilinirlik boşlukları'
    ],
    sampleNaming: [
      'SH4.2_anket_2024Q4.csv',
      'SH4.2_dijital_erisim_2024Q4.xlsx',
      'SH4.2_medya_olcum_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['katilimci_id', 'taninirlik_skoru', 'sektorel_kategori'],
      fileSize: { min: 1024, max: 15 * 1024 * 1024 },
      timeframe: 'Altı aylık tanınırlık araştırmaları'
    }
  },

  // KPI 31 - SH4.2 - Olumlu haber/içerik
  {
    kpiNumber: 31,
    shCode: 'SH4.2',
    kpiTitle: 'Olumlu haber/içerik sayısı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH4.2_basin_kupurleri',
        fileType: ['PDF', 'XLSX'],
        description: 'Basın kupürleri',
        category: 'REPORT'
      },
      {
        type: 'recommended',
        fileName: 'SH4.2_sosyal_medya_duygu_analizi',
        fileType: ['CSV', 'JSON'],
        description: 'Sosyal medya duygu analizi çıktıları',
        category: 'LOG'
      }
    ],
    aiAnalysisMethods: [
      'Duygu sınıflandırma',
      'İçerik kaynak kalitesi',
      'Sektör odaklı görünürlük'
    ],
    sampleNaming: [
      'SH4.2_basin_kupuru_2024Q4.pdf',
      'SH4.2_duygu_analiz_2024Q4.csv'
    ],
    validationRules: {
      requiredFields: ['icerik_id', 'kaynak', 'duygu_skoru', 'yayin_tarihi'],
      fileSize: { min: 1024, max: 50 * 1024 * 1024 },
      timeframe: 'Aylık medya takibi'
    }
  },

  // KPI 33 - SH4.3 - Hizmet tavsiye etme (NPS)
  {
    kpiNumber: 33,
    shCode: 'SH4.3',
    kpiTitle: 'Hizmetleri tavsiye etme oranı (NPS)',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH4.3_nps_anket_ham_verisi',
        fileType: ['CSV', 'XLSX'],
        description: 'NPS anket ham verisi',
        category: 'REPORT'
      },
      {
        type: 'recommended',
        fileName: 'SH4.3_yorumlar',
        fileType: ['CSV', 'TXT'],
        description: 'Yorumlar',
        category: 'LOG'
      }
    ],
    aiAnalysisMethods: [
      'NPS hesaplama',
      'Gerekçe temaları',
      'Sektör/ölçek bazında dağılım',
      'NPS→tekrar satın alma korelasyonu'
    ],
    sampleNaming: [
      'SH4.3_nps_anket_2024Q4.csv',
      'SH4.3_yorumlar_2024Q4.txt'
    ],
    validationRules: {
      requiredFields: ['musteri_id', 'nps_puani', 'hizmet_kodu', 'anket_tarihi'],
      fileSize: { min: 1024, max: 10 * 1024 * 1024 },
      timeframe: 'Hizmet sonrası max 30 gün içinde anket'
    }
  },

  // KPI 34 - SH4.3 - Tekrar hizmet alan KOBİ
  {
    kpiNumber: 34,
    shCode: 'SH4.3',
    kpiTitle: 'Tekrar hizmet alan KOBİ oranı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH4.3_crm_siparis_yenileme',
        fileType: ['CSV', 'XLSX'],
        description: 'CRM sipariş/yenileme kayıtları',
        category: 'LOG'
      }
    ],
    aiAnalysisMethods: [
      'Kohort tekrar oranı',
      'Sektör ve hizmet tipi bazında elde tutma eğrileri'
    ],
    sampleNaming: [
      'SH4.3_siparis_yenileme_2024Q4.csv'
    ],
    validationRules: {
      requiredFields: ['kobi_id', 'ilk_hizmet_tarihi', 'ikinci_hizmet_tarihi', 'hizmet_kodu'],
      fileSize: { min: 1024, max: 25 * 1024 * 1024 },
      timeframe: 'İki hizmet arası min 30 gün max 24 ay'
    }
  },

  // KPI 35 - SH4.4 - Çalışan memnuniyet/bağlılık
  {
    kpiNumber: 35,
    shCode: 'SH4.4',
    kpiTitle: 'Çalışan memnuniyeti/bağlılığı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH4.4_calisan_anketleri_enps',
        fileType: ['CSV', 'XLSX'],
        description: 'Çalışan anketleri (eNPS)',
        category: 'REPORT'
      },
      {
        type: 'recommended',
        fileName: 'SH4.4_ik_devir_verisi',
        fileType: ['XLSX', 'CSV'],
        description: 'İK devir verisi',
        category: 'LOG'
      },
      {
        type: 'optional',
        fileName: 'SH4.4_odak_grup_notlari',
        fileType: ['PDF', 'DOCX'],
        description: 'Odak grup notları',
        category: 'REPORT'
      }
    ],
    aiAnalysisMethods: [
      'Memnuniyet sürücüleri (SHAP/anket maddeleri)',
      'Birim/rol farkları',
      'Sektör yetenek piyasası etkisi'
    ],
    sampleNaming: [
      'SH4.4_enps_anket_2024Q4.csv',
      'SH4.4_devir_veri_2024Q4.xlsx',
      'SH4.4_odak_grup_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['personel_id', 'memnuniyet_puani', 'departman', 'anket_tarihi'],
      fileSize: { min: 1024, max: 15 * 1024 * 1024 },
      timeframe: 'Yıllık çalışan memnuniyet anketi'
    }
  },

  // KPI 36 - SH4.5 - Sosyal sorumluluk faydalanan
  {
    kpiNumber: 36,
    shCode: 'SH4.5',
    kpiTitle: 'Sosyal sorumluluk faydalanan kişi sayısı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH4.5_proje_faydalanici_listeleri',
        fileType: ['XLSX', 'CSV'],
        description: 'Proje faydalanıcı listeleri',
        category: 'LOG'
      },
      {
        type: 'required',
        fileName: 'SH4.5_etkinlik_kayitlari',
        fileType: ['XLSX', 'PDF'],
        description: 'Etkinlik kayıtları',
        category: 'LOG'
      },
      {
        type: 'recommended',
        fileName: 'SH4.5_katilim_formlari',
        fileType: ['PDF'],
        description: 'Katılım formları',
        category: 'LOG'
      }
    ],
    aiAnalysisMethods: [
      'Sayı doğrulama',
      'Hedef kitle uyumu',
      'Etki ölçümü (ör. beceri kazanımı anketi)'
    ],
    sampleNaming: [
      'SH4.5_faydalanici_2024Q4.xlsx',
      'SH4.5_etkinlik_2024Q4.pdf',
      'SH4.5_katilim_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['faydalanici_id', 'proje_kodu', 'katilim_tarihi', 'hedef_kategori'],
      fileSize: { min: 1024, max: 25 * 1024 * 1024 },
      timeframe: 'Proje süresi boyunca'
    }
  },

  // KPI 37 - SH4.6 - Ödül/derece alan işletme
  {
    kpiNumber: 37,
    shCode: 'SH4.6',
    kpiTitle: 'MF hizmetlerinden yararlanıp ödül/derece alan işletme sayısı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH4.6_odul_belgeleri',
        fileType: ['PDF'],
        description: 'Ödül belgeleri',
        category: 'CERTIFICATE'
      },
      {
        type: 'required',
        fileName: 'SH4.6_basvuru_dosyalari',
        fileType: ['PDF', 'DOCX'],
        description: 'Başvuru dosyaları',
        category: 'REPORT'
      },
      {
        type: 'recommended',
        fileName: 'SH4.6_mf_referans_yazilari',
        fileType: ['PDF'],
        description: 'MF referans yazıları',
        category: 'CERTIFICATE'
      }
    ],
    aiAnalysisMethods: [
      'Ödül türü/itibarı',
      'Müdahale→ödül olasılık modeli (lojistik regresyon)'
    ],
    sampleNaming: [
      'SH4.6_odul_belge_2024Q4.pdf',
      'SH4.6_basvuru_2024Q4.pdf',
      'SH4.6_referans_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['isletme_id', 'odul_turu', 'alinma_tarihi', 'mf_hizmet_kodu'],
      fileSize: { min: 1024, max: 50 * 1024 * 1024 },
      timeframe: 'MF hizmeti sonrası max 24 ay içinde ödül'
    }
  },

  // KPI 38 - SH4.7 - Üniversite/AR-GE proje
  {
    kpiNumber: 38,
    shCode: 'SH4.7',
    kpiTitle: 'Üniversite/AR-GE ile yürütülen aktif ortak proje sayısı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH4.7_proje_sozlesmeleri',
        fileType: ['PDF'],
        description: 'Proje sözleşmeleri',
        category: 'CERTIFICATE'
      },
      {
        type: 'required',
        fileName: 'SH4.7_tubitak_ab_kayitlari',
        fileType: ['PDF', 'XLSX'],
        description: 'TÜBİTAK/AB kayıtları',
        category: 'CERTIFICATE'
      },
      {
        type: 'recommended',
        fileName: 'SH4.7_ilerleme_raporlari',
        fileType: ['PDF', 'DOCX'],
        description: 'Proje planı ve ilerleme raporları',
        category: 'REPORT'
      }
    ],
    aiAnalysisMethods: [
      'Proje TRL aşaması',
      'Bütçe ve partner türüne göre ısı haritası',
      'Sektör odağı'
    ],
    sampleNaming: [
      'SH4.7_proje_sozlesme_2024Q4.pdf',
      'SH4.7_tubitak_kayit_2024Q4.xlsx',
      'SH4.7_ilerleme_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['proje_kodu', 'partner_universite', 'baslangic_tarihi', 'trl_seviyesi'],
      fileSize: { min: 1024, max: 50 * 1024 * 1024 },
      timeframe: 'Aktif proje durumu'
    }
  },

  // KPI 39 - SH4.7 - Geliştirilen ürün/hizmet/yayın
  {
    kpiNumber: 39,
    shCode: 'SH4.7',
    kpiTitle: 'Birlikte geliştirilen ürün/hizmet, metodoloji veya yayın sayısı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH4.7_yayin_doileri',
        fileType: ['XLSX', 'CSV'],
        description: 'Yayın DOİ\'leri',
        category: 'CERTIFICATE'
      },
      {
        type: 'recommended',
        fileName: 'SH4.7_prototip_kayitlari',
        fileType: ['PDF', 'DOCX'],
        description: 'Prototip kayıtları',
        category: 'REPORT'
      },
      {
        type: 'optional',
        fileName: 'SH4.7_metod_dokumanlari',
        fileType: ['PDF', 'DOCX'],
        description: 'Metod dokümanları',
        category: 'REPORT'
      }
    ],
    aiAnalysisMethods: [
      'Atıf/etki',
      'Sektörel uygulanabilirlik sınıflaması',
      'Bilgi erişim puanı'
    ],
    sampleNaming: [
      'SH4.7_yayin_doi_2024Q4.csv',
      'SH4.7_prototip_2024Q4.pdf',
      'SH4.7_metodoloji_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['cikti_turu', 'baslik', 'yayin_tarihi', 'partner_kurum'],
      fileSize: { min: 1024, max: 25 * 1024 * 1024 },
      timeframe: 'Geliştirme ve yayın süreçleri'
    }
  },

  // KPI 40 - SH4.8 - Uluslararası ortaklık
  {
    kpiNumber: 40,
    shCode: 'SH4.8',
    kpiTitle: 'Uluslararası kurumlarla stratejik ortaklık sayısı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH4.8_mou_isbirligi_anlasmalar',
        fileType: ['PDF'],
        description: 'MoU/işbirliği anlaşmaları',
        category: 'CERTIFICATE'
      },
      {
        type: 'recommended',
        fileName: 'SH4.8_ortak_etkinlik_protokolleri',
        fileType: ['PDF'],
        description: 'Ortak etkinlik protokolleri',
        category: 'CERTIFICATE'
      },
      {
        type: 'optional',
        fileName: 'SH4.8_konsorsiyum_listeleri',
        fileType: ['XLSX', 'PDF'],
        description: 'Konsorsiyum listeleri',
        category: 'REPORT'
      }
    ],
    aiAnalysisMethods: [
      'Ortaklık derinlik skoru (süre, ortak faaliyet sayısı)',
      'Bölge/ülke ve sektör odağı'
    ],
    sampleNaming: [
      'SH4.8_mou_anlaşma_2024Q4.pdf',
      'SH4.8_etkinlik_protokol_2024Q4.pdf',
      'SH4.8_konsorsiyum_2024Q4.xlsx'
    ],
    validationRules: {
      requiredFields: ['partner_kurum', 'ulke', 'anlaşma_tarihi', 'faaliyet_alani'],
      fileSize: { min: 1024, max: 25 * 1024 * 1024 },
      timeframe: 'Aktif ortaklık anlaşmaları'
    }
  },

  // KPI 41 - SH4.8 - Uluslararası benchmark
  {
    kpiNumber: 41,
    shCode: 'SH4.8',
    kpiTitle: 'Uluslararası benchmark analizi sayısı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH4.8_benchmark_raporlari',
        fileType: ['PDF', 'DOCX'],
        description: 'Benchmark raporları',
        category: 'REPORT'
      },
      {
        type: 'required',
        fileName: 'SH4.8_veri_setleri',
        fileType: ['CSV', 'XLSX'],
        description: 'Veri setleri',
        category: 'LOG'
      },
      {
        type: 'recommended',
        fileName: 'SH4.8_karsilastirma_metodolojisi',
        fileType: ['PDF', 'DOCX'],
        description: 'Karşılaştırma metodolojisi dosyası',
        category: 'REPORT'
      }
    ],
    aiAnalysisMethods: [
      'Eşleştirilmiş kıyas (ölçeklendirme/normalize)',
      'Sektörel gap analizi ve yol haritası önerileri'
    ],
    sampleNaming: [
      'SH4.8_benchmark_rapor_2024Q4.pdf',
      'SH4.8_veri_set_2024Q4.csv',
      'SH4.8_metodoloji_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['benchmark_konu', 'karsilastirma_ulkeleri', 'analiz_tarihi'],
      fileSize: { min: 1024, max: 100 * 1024 * 1024 },
      timeframe: 'Yıllık benchmark çalışmaları'
    }
  }
`;

console.log('SH4 KPI Templates (29-41):');
console.log(sh4KPIs);
