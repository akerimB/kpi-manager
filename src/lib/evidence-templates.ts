// KPI-specific evidence templates based on kanıt.txt

export interface EvidenceTemplate {
  kpiNumber: number
  shCode: string
  kpiTitle: string
  requiredEvidences: {
    type: 'required' | 'optional' | 'recommended'
    fileName: string
    fileType: string[]
    description: string
    category: string
  }[]
  aiAnalysisMethods: string[]
  sampleNaming: string[]
  validationRules: {
    requiredFields: string[]
    fileSize: { min: number; max: number }
    timeframe: string
  }
}

export const EVIDENCE_TEMPLATES: EvidenceTemplate[] = [
  // SH1.1 - Farkındalık artış oranı
  {
    kpiNumber: 1,
    shCode: 'SH1.1',
    kpiTitle: 'Farkındalık artış oranı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH1.1_on_anket_ham_verisi',
        fileType: ['CSV', 'XLSX'],
        description: 'Ön anket ham verisi (katılımcı ID, yanıtlar, demografik)',
        category: 'REPORT'
      },
      {
        type: 'required',
        fileName: 'SH1.1_son_anket_ham_verisi',
        fileType: ['CSV', 'XLSX'],
        description: 'Son anket ham verisi (aynı katılımcılar)',
        category: 'REPORT'
      },
      {
        type: 'required',
        fileName: 'SH1.1_orneklem_plani',
        fileType: ['PDF', 'DOCX'],
        description: 'Örneklem planı ve metodoloji',
        category: 'REPORT'
      },
      {
        type: 'recommended',
        fileName: 'SH1.1_anket_formu',
        fileType: ['PDF'],
        description: 'Kullanılan anket formu',
        category: 'REPORT'
      },
      {
        type: 'recommended',
        fileName: 'SH1.1_etkinlik_katilim',
        fileType: ['XLSX', 'CSV'],
        description: 'Etkinlik katılım listeleri',
        category: 'LOG'
      }
    ],
    aiAnalysisMethods: [
      'Örneklem/yanıt yanlılığını kontrol',
      'Ön-son t-testi',
      'Etki büyüklüğü (Cohen d)',
      'Sektör/il/OSB kırılımında fark analizi',
      'Açık uçlu yanıtlara konu modelleme'
    ],
    sampleNaming: [
      'SH1.1_on_anket_2024Q4.csv',
      'SH1.1_son_anket_2024Q4.csv',
      'SH1.1_orneklem_plani_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['firmIdHash', 'nace4d', 'province', 'employees'],
      fileSize: { min: 1024, max: 10 * 1024 * 1024 }, // 1KB - 10MB
      timeframe: 'Ön ve son anket arasında min 3 ay fark olmalı'
    }
  },

  // SH1.1 - Ortak farkındalık etkinliği
  {
    kpiNumber: 2,
    shCode: 'SH1.1',
    kpiTitle: 'Ortak farkındalık etkinliği düzenlenen kilit kurum sayısı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH1.1_etkinlik_takvimi',
        fileType: ['XLSX', 'CSV'],
        description: 'Takvim/etkinlik kayıtları',
        category: 'LOG'
      },
      {
        type: 'required',
        fileName: 'SH1.1_protokoller_mou',
        fileType: ['PDF'],
        description: 'Protokoller/MoU belgeleri',
        category: 'CERTIFICATE'
      },
      {
        type: 'required',
        fileName: 'SH1.1_katilimci_listeleri',
        fileType: ['XLSX', 'CSV'],
        description: 'Katılımcı listeleri (kurum adı, rol, sektör)',
        category: 'LOG'
      },
      {
        type: 'optional',
        fileName: 'SH1.1_gorsel_dokumantasyon',
        fileType: ['JPG', 'PNG', 'ZIP'],
        description: 'Görsel dokümantasyon',
        category: 'IMAGE'
      }
    ],
    aiAnalysisMethods: [
      'Kurum eşleşmesi (ad eşleme)',
      'Çift kayıt temizliği',
      'Benzersiz kurum sayımı',
      'Etkinlik etki puanı (katılımcı×rol)',
      'Sektörel kapsama haritası'
    ],
    sampleNaming: [
      'SH1.1_etkinlik_takvimi_2024Q4.xlsx',
      'SH1.1_protokoller_2024Q4.pdf',
      'SH1.1_katilimci_listesi_2024Q4.csv'
    ],
    validationRules: {
      requiredFields: ['kurumAdi', 'sektorKodu', 'etkinlikTarihi'],
      fileSize: { min: 1024, max: 25 * 1024 * 1024 },
      timeframe: 'Etkinlikler dönem içinde gerçekleşmiş olmalı'
    }
  },

  // SH1.2 - Program katılımcılarının istihdam olma oranı
  {
    kpiNumber: 3,
    shCode: 'SH1.2',
    kpiTitle: 'Program katılımcılarının istihdam olma oranı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH1.2_katilimci_listesi',
        fileType: ['XLSX', 'CSV'],
        description: 'Program katılımcı listesi (ID, bilgiler)',
        category: 'LOG'
      },
      {
        type: 'required',
        fileName: 'SH1.2_yerlestirme_kayitlari',
        fileType: ['XLSX', 'CSV'],
        description: 'Yerleştirme kayıtları',
        category: 'REPORT'
      },
      {
        type: 'recommended',
        fileName: 'SH1.2_mezun_takip',
        fileType: ['XLSX', 'PDF'],
        description: 'Kariyer merkezi/mezun takip',
        category: 'REPORT'
      },
      {
        type: 'optional',
        fileName: 'SH1.2_sgk_eslestirme',
        fileType: ['CSV'],
        description: 'SGK eşleştirme çıktıları (anonim)',
        category: 'LOG'
      }
    ],
    aiAnalysisMethods: [
      'Takip oranı ve örneklem yanlılığı',
      '12 ay içinde istihdam oranı',
      'Sektör/meslek kodu eşleşmesi',
      'Karşılaştırma grubu ile fark'
    ],
    sampleNaming: [
      'SH1.2_katilimci_listesi_2024Q4.csv',
      'SH1.2_yerlestirme_2024Q4.xlsx',
      'SH1.2_sgk_eslestirme_anonim_2024Q4.csv'
    ],
    validationRules: {
      requiredFields: ['katilimciId', 'programTuru', 'baslangicTarihi', 'bitisTarihi'],
      fileSize: { min: 1024, max: 5 * 1024 * 1024 },
      timeframe: '12 ay takip süresi gerekli'
    }
  },

  // SH2.1 - Kârlılık oranı
  {
    kpiNumber: 11,
    shCode: 'SH2.1',
    kpiTitle: 'Kârlılık oranı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH2.1_gelir_tablosu',
        fileType: ['XLSX', 'PDF'],
        description: 'Gelir tablosu (aylık/çeyreklik)',
        category: 'REPORT'
      },
      {
        type: 'required',
        fileName: 'SH2.1_faaliyet_raporu',
        fileType: ['PDF', 'DOCX'],
        description: 'Faaliyet raporu',
        category: 'REPORT'
      },
      {
        type: 'required',
        fileName: 'SH2.1_mali_tablolar',
        fileType: ['XLSX'],
        description: 'Mali tablolar detayı',
        category: 'REPORT'
      }
    ],
    aiAnalysisMethods: [
      'Net/operasyonel kârlılık hesabı',
      'Mevsimsellik arındırma',
      'Sektör bazlı benchmark',
      'Anormal gider/gelir tespiti'
    ],
    sampleNaming: [
      'SH2.1_gelir_tablosu_2024Q4.xlsx',
      'SH2.1_faaliyet_raporu_2024Q4.pdf',
      'SH2.1_mali_tablolar_2024Q4.xlsx'
    ],
    validationRules: {
      requiredFields: ['donem', 'gelir', 'gider', 'netKar'],
      fileSize: { min: 10 * 1024, max: 10 * 1024 * 1024 },
      timeframe: 'Son 4 çeyrek verisi gerekli'
    }
  },

  // SH3.3 - OEE
  {
    kpiNumber: 22,
    shCode: 'SH3.3',
    kpiTitle: 'Genel Ekipman Etkinliği (OEE)',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH3.3_mes_scada_logs',
        fileType: ['CSV', 'JSON'],
        description: 'MES/SCADA logları',
        category: 'LOG'
      },
      {
        type: 'required',
        fileName: 'SH3.3_vardiya_durus',
        fileType: ['XLSX', 'CSV'],
        description: 'Vardiya duruş kayıtları',
        category: 'LOG'
      },
      {
        type: 'required',
        fileName: 'SH3.3_parca_sayaclari',
        fileType: ['CSV'],
        description: 'Parça başı sayaçlar',
        category: 'LOG'
      }
    ],
    aiAnalysisMethods: [
      'OEE=K×P×K hesabı',
      'Kayıp ağacı analizi',
      'Sektör referanslarıyla gap analizi'
    ],
    sampleNaming: [
      'SH3.3_mes_logs_2024Q4.csv',
      'SH3.3_vardiya_durus_2024Q4.xlsx',
      'SH3.3_parca_sayaci_2024Q4.csv'
    ],
    validationRules: {
      requiredFields: ['makineId', 'tarih', 'planlananSure', 'calisanSure', 'uretimMiktari'],
      fileSize: { min: 10 * 1024, max: 100 * 1024 * 1024 },
      timeframe: 'Günlük veri, minimum 1 ay'
    }
  },

  // SH4.3 - Müdahale sonrası verimlilik artışı
  {
    kpiNumber: 32,
    shCode: 'SH4.3',
    kpiTitle: 'Müdahale sonrası ortalama verimlilik artışı (%)',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH4.3_on_uretkenlik',
        fileType: ['XLSX', 'CSV'],
        description: 'Ön üretkenlik ölçümleri (saat başı çıktı)',
        category: 'REPORT'
      },
      {
        type: 'required',
        fileName: 'SH4.3_son_uretkenlik',
        fileType: ['XLSX', 'CSV'],
        description: 'Son üretkenlik ölçümleri',
        category: 'REPORT'
      },
      {
        type: 'recommended',
        fileName: 'SH4.3_vsm_smed_raporlari',
        fileType: ['PDF'],
        description: 'VSM/SMED/TPM raporları',
        category: 'REPORT'
      },
      {
        type: 'optional',
        fileName: 'SH4.3_hurda_yeniden_isleme',
        fileType: ['XLSX'],
        description: 'Hurda/yeniden işleme verileri',
        category: 'LOG'
      }
    ],
    aiAnalysisMethods: [
      'Ön-son fark (bağlam değişkenleriyle normalize)',
      'Sektörel kıyas (örn. metalde çevrim süresi)',
      'İstatistiksel anlamlılık testi'
    ],
    sampleNaming: [
      'SH4.3_on_uretkenlik_2024Q3.xlsx',
      'SH4.3_son_uretkenlik_2024Q4.xlsx',
      'SH4.3_vsm_raporu_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['olcumTarihi', 'saatBasiCikti', 'hurdaOrani', 'cevrimSuresi'],
      fileSize: { min: 5 * 1024, max: 25 * 1024 * 1024 },
      timeframe: 'Müdahale öncesi/sonrası min 4 hafta veri'
    }
  },

  // KPI 4 - SH1.2 - Toplam eğitim (kişi×saat)
  {
    kpiNumber: 4,
    shCode: 'SH1.2',
    kpiTitle: 'Toplam eğitim (kişi×saat)',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH1.2_lms_katilim_loglari',
        fileType: ['CSV', 'XLSX'],
        description: 'LMS/katılım logları',
        category: 'LOG'
      },
      {
        type: 'required',
        fileName: 'SH1.2_egitim_plani',
        fileType: ['XLSX', 'PDF'],
        description: 'Eğitim planı',
        category: 'REPORT'
      },
      {
        type: 'recommended',
        fileName: 'SH1.2_egitmen_raporlari',
        fileType: ['PDF', 'DOCX'],
        description: 'Eğitmen raporları',
        category: 'REPORT'
      }
    ],
    aiAnalysisMethods: [
      'Kişi×saat otomatik toplama',
      'No show ve tekrar kayıt ayıklama',
      'Sektöre göre kişi×saat dağılımı',
      'Kişi başı maliyet/çıktı ilişkisi'
    ],
    sampleNaming: [
      'SH1.2_lms_loglar_2024Q4.csv',
      'SH1.2_egitim_plani_2024Q4.xlsx',
      'SH1.2_egitmen_raporu_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['katilimciId', 'egitimKodu', 'baslangicSaati', 'bitisSaati'],
      fileSize: { min: 1024, max: 50 * 1024 * 1024 },
      timeframe: 'Dönem içinde gerçekleşen eğitimler'
    }
  },

  // KPI 5 - SH1.3 - Yönlendirme sonucu destek programları
  {
    kpiNumber: 5,
    shCode: 'SH1.3',
    kpiTitle: 'Yönlendirme sonucu destek programlarından yararlanan KOBİ sayısı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH1.3_yonlendirme_kayitlari',
        fileType: ['XLSX', 'CSV'],
        description: 'Yönlendirme kayıtları (KOSGEB/TÜBİTAK/KA/AB)',
        category: 'LOG'
      },
      {
        type: 'required',
        fileName: 'SH1.3_kabul_yazilari',
        fileType: ['PDF'],
        description: 'Kabul yazıları',
        category: 'CERTIFICATE'
      },
      {
        type: 'recommended',
        fileName: 'SH1.3_proje_sozlesmeleri',
        fileType: ['PDF'],
        description: 'Proje sözleşmeleri',
        category: 'CERTIFICATE'
      }
    ],
    aiAnalysisMethods: [
      'Yönlendirme→başvuru→kabul huni analizi',
      'Sektör/il bazında dönüşüm oranı',
      'Kabul edilenlerin tutar/tema dağılımı'
    ],
    sampleNaming: [
      'SH1.3_yonlendirme_2024Q4.xlsx',
      'SH1.3_kabul_yazilari_2024Q4.pdf',
      'SH1.3_proje_sozlesme_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['kobi_id', 'program_turu', 'yonlendirme_tarihi', 'sonuc'],
      fileSize: { min: 1024, max: 25 * 1024 * 1024 },
      timeframe: 'Yönlendirme ve sonuç arasında max 12 ay'
    }
  },

  // KPI 6 - SH1.4 - Proje sürdürülebilirlik oranı
  {
    kpiNumber: 6,
    shCode: 'SH1.4',
    kpiTitle: 'Proje tamamlandıktan sonra sürdürülebilirlik oranı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH1.4_6ay_takip_anketi',
        fileType: ['CSV', 'XLSX'],
        description: '6 ay takip anketleri',
        category: 'REPORT'
      },
      {
        type: 'required',
        fileName: 'SH1.4_12ay_takip_anketi',
        fileType: ['CSV', 'XLSX'],
        description: '12 ay takip anketleri',
        category: 'REPORT'
      },
      {
        type: 'recommended',
        fileName: 'SH1.4_yerinde_gozlem',
        fileType: ['PDF', 'DOCX'],
        description: 'Yerinde gözlem formu',
        category: 'REPORT'
      },
      {
        type: 'optional',
        fileName: 'SH1.4_foto_video_kanit',
        fileType: ['JPG', 'PNG', 'MP4'],
        description: 'Foto/video kanıtı',
        category: 'IMAGE'
      }
    ],
    aiAnalysisMethods: [
      'Uygulamaların devam oranı',
      'Kontrol listesi puanı',
      'Sektörel kalıcılık farkı (örn. gıda vs metal)'
    ],
    sampleNaming: [
      'SH1.4_6ay_takip_2024Q4.csv',
      'SH1.4_12ay_takip_2024Q4.csv',
      'SH1.4_yerinde_gozlem_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['proje_id', 'kobi_id', 'takip_tarihi', 'sürdürülebilirlik_durumu'],
      fileSize: { min: 1024, max: 100 * 1024 * 1024 },
      timeframe: 'Proje bitimi sonrası 6-12 ay takip'
    }
  },

  // KPI 7 - SH1.4 - Karbon emisyonu azalış oranı
  {
    kpiNumber: 7,
    shCode: 'SH1.4',
    kpiTitle: 'Karbon emisyonu azalış oranı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH1.4_enerji_faturalari',
        fileType: ['PDF', 'XLSX'],
        description: 'Enerji/utility faturaları',
        category: 'REPORT'
      },
      {
        type: 'required',
        fileName: 'SH1.4_sayac_mes_kayitlari',
        fileType: ['CSV', 'XLSX'],
        description: 'Sayaç/MES kayıtları',
        category: 'LOG'
      },
      {
        type: 'recommended',
        fileName: 'SH1.4_iso14064_raporu',
        fileType: ['PDF'],
        description: 'ISO 14064 raporları',
        category: 'CERTIFICATE'
      },
      {
        type: 'optional',
        fileName: 'SH1.4_olcum_formlari',
        fileType: ['XLSX', 'PDF'],
        description: 'Ölçüm formları',
        category: 'REPORT'
      }
    ],
    aiAnalysisMethods: [
      'Baz çizgi→sonrası normalize tüketim (hava/derece gün, üretim hacmi)',
      '%CO₂ eşdeğer azalış',
      'Sektörel kıyas (örn. tekstil kg kumaş başına)'
    ],
    sampleNaming: [
      'SH1.4_enerji_fatura_2024Q4.pdf',
      'SH1.4_mes_kayit_2024Q4.csv',
      'SH1.4_iso14064_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['tarih', 'enerji_tuketimi', 'uretim_miktari', 'co2_emisyonu'],
      fileSize: { min: 1024, max: 50 * 1024 * 1024 },
      timeframe: 'Baz çizgi ve sonrası min 6 ay veri'
    }
  },

  // KPI 8 - SH1.5 - Olgunluk seviyesi
  {
    kpiNumber: 8,
    shCode: 'SH1.5',
    kpiTitle: 'Belirli olgunluk seviyesine ulaşan KOBİ sayısı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH1.5_olgunluk_degerlendirme',
        fileType: ['XLSX', 'CSV'],
        description: 'Olgunluk değerlendirme çıktıları (SIRI, DDX, TPM)',
        category: 'REPORT'
      },
      {
        type: 'required',
        fileName: 'SH1.5_denetim_raporlari',
        fileType: ['PDF'],
        description: 'Denetim raporları',
        category: 'REPORT'
      }
    ],
    aiAnalysisMethods: [
      'Skor eşiklere göre sınıflama',
      'Öncesi sonrası ilerleme',
      'Sektör/ölçek kırılımında olgunluk haritası'
    ],
    sampleNaming: [
      'SH1.5_siri_degerlendirme_2024Q4.xlsx',
      'SH1.5_denetim_raporu_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['kobi_id', 'olgunluk_turu', 'on_skor', 'son_skor'],
      fileSize: { min: 1024, max: 25 * 1024 * 1024 },
      timeframe: 'Değerlendirmeler arası min 6 ay'
    }
  },

  // KPI 9 - SH1.6 - Çoklu alan hizmet oranı
  {
    kpiNumber: 9,
    shCode: 'SH1.6',
    kpiTitle: 'Birden fazla temel alanda hizmet alan KOBİ oranı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH1.6_crm_hizmet_gecmisi',
        fileType: ['XLSX', 'CSV'],
        description: 'CRM hizmet geçmişi (yalın/dijital/yeşil/dirençlilik etiketleri)',
        category: 'LOG'
      },
      {
        type: 'recommended',
        fileName: 'SH1.6_sozlesme_kapsami',
        fileType: ['PDF', 'XLSX'],
        description: 'Sözleşme kapsamı',
        category: 'CERTIFICATE'
      }
    ],
    aiAnalysisMethods: [
      'Bütüncül hizmet tanımı (≥2 alan)',
      'Oran ve sektör bazında çoklu hizmet örüntüleri (market basket)'
    ],
    sampleNaming: [
      'SH1.6_crm_hizmet_2024Q4.xlsx',
      'SH1.6_sozlesme_kapsam_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['kobi_id', 'hizmet_alani', 'baslangic_tarihi', 'bitis_tarihi'],
      fileSize: { min: 1024, max: 25 * 1024 * 1024 },
      timeframe: 'Dönem içinde aktif hizmetler'
    }
  },

  // KPI 10 - SH1.6 - Öğren Dönüş Program tamamlama
  {
    kpiNumber: 10,
    shCode: 'SH1.6',
    kpiTitle: 'Öğren Dönüş Programını tamamlayan KOBİ sayısı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH1.6_program_roster',
        fileType: ['XLSX', 'CSV'],
        description: 'Program roster',
        category: 'LOG'
      },
      {
        type: 'required',
        fileName: 'SH1.6_modul_tamamlama',
        fileType: ['CSV', 'XLSX'],
        description: 'Modül tamamlama logları',
        category: 'LOG'
      },
      {
        type: 'recommended',
        fileName: 'SH1.6_bitirme_raporu',
        fileType: ['PDF', 'DOCX'],
        description: 'Bitirme raporu',
        category: 'REPORT'
      }
    ],
    aiAnalysisMethods: [
      'Tamamlama oranı',
      'Modül bazlı darboğaz',
      'Sektörel tamamlama farkları'
    ],
    sampleNaming: [
      'SH1.6_program_roster_2024Q4.xlsx',
      'SH1.6_modul_log_2024Q4.csv',
      'SH1.6_bitirme_raporu_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['kobi_id', 'program_kodu', 'modul_kodu', 'tamamlama_tarihi'],
      fileSize: { min: 1024, max: 25 * 1024 * 1024 },
      timeframe: 'Program süresi içinde tamamlananlar'
    }
  },

  // KPI 12 - SH2.1 - Gelir artış oranı
  {
    kpiNumber: 12,
    shCode: 'SH2.1',
    kpiTitle: 'Ortalama yıllık gelir artış oranı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH2.1_faturalama_kayitlari',
        fileType: ['CSV', 'XLSX'],
        description: 'Faturalama kayıtları',
        category: 'LOG'
      },
      {
        type: 'required',
        fileName: 'SH2.1_tahakkuk_raporlari',
        fileType: ['XLSX', 'PDF'],
        description: 'Tahakkuk raporları',
        category: 'REPORT'
      },
      {
        type: 'recommended',
        fileName: 'SH2.1_yillik_gelir_ozeti',
        fileType: ['XLSX', 'PDF'],
        description: 'Yıllık gelir özeti',
        category: 'REPORT'
      }
    ],
    aiAnalysisMethods: [
      'CAGR ve yıl içi trend',
      'Sektör/ürün bazında büyüme katkısı',
      'Kaynak analizi (yeni×mevcut müşteri)'
    ],
    sampleNaming: [
      'SH2.1_faturalama_2024Q4.csv',
      'SH2.1_tahakkuk_2024Q4.xlsx',
      'SH2.1_gelir_ozet_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['tarih', 'gelir_tutari', 'musteri_id', 'hizmet_kodu'],
      fileSize: { min: 1024, max: 50 * 1024 * 1024 },
      timeframe: 'Son 12 ay gelir verileri'
    }
  },

  // KPI 13 - SH2.2 - Bütçeye uyum oranı
  {
    kpiNumber: 13,
    shCode: 'SH2.2',
    kpiTitle: 'Bütçeye uyum oranı (%)',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH2.2_butce_gerceklesen',
        fileType: ['XLSX', 'CSV'],
        description: 'Bütçe vs Gerçekleşen tabloları',
        category: 'REPORT'
      },
      {
        type: 'recommended',
        fileName: 'SH2.2_revizyon_kararlari',
        fileType: ['PDF', 'DOCX'],
        description: 'Revizyon kararları',
        category: 'REPORT'
      }
    ],
    aiAnalysisMethods: [
      'Sapma ayrıştırma (fiyat/hacim/mix)',
      'Sektör projeleri kaynaklı sapmaların ısı haritası'
    ],
    sampleNaming: [
      'SH2.2_butce_gerceklesen_2024Q4.xlsx',
      'SH2.2_revizyon_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['kalem_kodu', 'butce_tutari', 'gerceklesen_tutari', 'donem'],
      fileSize: { min: 1024, max: 25 * 1024 * 1024 },
      timeframe: 'Dönemsel bütçe karşılaştırmaları'
    }
  },

  // KPI 14 - SH2.3 - Yeni KOBİ müşteri kazanım
  {
    kpiNumber: 14,
    shCode: 'SH2.3',
    kpiTitle: 'Yeni KOBİ müşteri kazanım sayısı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH2.3_crm_lead_donusum',
        fileType: ['CSV', 'XLSX'],
        description: 'CRM lead→müşteri dönüşüm kayıtları',
        category: 'LOG'
      },
      {
        type: 'required',
        fileName: 'SH2.3_sozlesmeler',
        fileType: ['PDF'],
        description: 'Sözleşmeler',
        category: 'CERTIFICATE'
      }
    ],
    aiAnalysisMethods: [
      'Satış hunisi analizi',
      'Kanal/sector bazında kazanım',
      'İlk yıl CLV tahmini'
    ],
    sampleNaming: [
      'SH2.3_crm_donusum_2024Q4.csv',
      'SH2.3_sozlesme_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['musteri_id', 'lead_kaynagi', 'sozlesme_tarihi', 'ilk_hizmet_tutari'],
      fileSize: { min: 1024, max: 50 * 1024 * 1024 },
      timeframe: 'Dönem içinde kazanılan yeni müşteriler'
    }
  },

  // KPI 15 - SH2.3 - KOBİ başına hizmet geliri
  {
    kpiNumber: 15,
    shCode: 'SH2.3',
    kpiTitle: 'KOBİ başına ortalama faturalandırılan hizmet geliri',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH2.3_fatura_satir_dokumu',
        fileType: ['CSV', 'XLSX'],
        description: 'Fatura satır dökümü (hizmet kodu, saat, tutar)',
        category: 'LOG'
      },
      {
        type: 'recommended',
        fileName: 'SH2.3_sozlesme_kapsami',
        fileType: ['PDF', 'XLSX'],
        description: 'Sözleşme kapsamı',
        category: 'CERTIFICATE'
      }
    ],
    aiAnalysisMethods: [
      'KOBİ segmentine göre ARPU',
      'Paket mix optimizasyonu',
      'Sektör×hizmet kârlılık matrisi'
    ],
    sampleNaming: [
      'SH2.3_fatura_satir_2024Q4.xlsx',
      'SH2.3_sozlesme_kapsam_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['kobi_id', 'hizmet_kodu', 'saat', 'tutar', 'tarih'],
      fileSize: { min: 1024, max: 75 * 1024 * 1024 },
      timeframe: 'Dönem içinde faturalandırılan hizmetler'
    }
  },

  // KPI 16 - SH2.4 - Operasyonel maliyet karşılanma
  {
    kpiNumber: 16,
    shCode: 'SH2.4',
    kpiTitle: 'Operasyonel maliyetlerin öz gelirle karşılanma oranı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH2.4_gider_merkezi_raporlari',
        fileType: ['XLSX', 'CSV'],
        description: 'Gider merkezi raporları',
        category: 'REPORT'
      },
      {
        type: 'required',
        fileName: 'SH2.4_bordro',
        fileType: ['XLSX', 'PDF'],
        description: 'Bordrolar',
        category: 'REPORT'
      },
      {
        type: 'recommended',
        fileName: 'SH2.4_kira_enerji_giderleri',
        fileType: ['PDF', 'XLSX'],
        description: 'Kira/enerji giderleri',
        category: 'REPORT'
      }
    ],
    aiAnalysisMethods: [
      'Cost to Income oranı',
      'Maliyet sürücüleri (aktivite tabanlı)',
      'Sektör odaklı fiyatlandırma eşiği'
    ],
    sampleNaming: [
      'SH2.4_gider_merkezi_2024Q4.xlsx',
      'SH2.4_bordro_2024Q4.pdf',
      'SH2.4_kira_enerji_2024Q4.xlsx'
    ],
    validationRules: {
      requiredFields: ['gider_kalemi', 'tutar', 'tarih', 'merkez_kodu'],
      fileSize: { min: 1024, max: 25 * 1024 * 1024 },
      timeframe: 'Aylık operasyonel giderler'
    }
  },

  // KPI 17 - SH2.4 - Yeni gelir getirici hizmet
  {
    kpiNumber: 17,
    shCode: 'SH2.4',
    kpiTitle: 'Yıllık başlatılan yeni gelir getirici hizmet sayısı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH2.4_urun_yasam_dongusu',
        fileType: ['XLSX', 'CSV'],
        description: 'Ürün/hizmet yaşam döngüsü kayıtları',
        category: 'LOG'
      },
      {
        type: 'required',
        fileName: 'SH2.4_lanseman_tutanaklari',
        fileType: ['PDF', 'DOCX'],
        description: 'Lansman tutanakları',
        category: 'REPORT'
      },
      {
        type: 'recommended',
        fileName: 'SH2.4_egitim_icerikleri',
        fileType: ['PDF', 'PPTX'],
        description: 'Eğitim içerikleri',
        category: 'REPORT'
      }
    ],
    aiAnalysisMethods: [
      'Yeni hizmet pipeline\'ı',
      'Lansman sonrası 6-12 ay tutunma',
      'Sektör eşleşme skoru'
    ],
    sampleNaming: [
      'SH2.4_yasam_dongusu_2024Q4.xlsx',
      'SH2.4_lanseman_2024Q4.pdf',
      'SH2.4_egitim_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['hizmet_kodu', 'lanseman_tarihi', 'hedef_segment', 'beklenen_gelir'],
      fileSize: { min: 1024, max: 25 * 1024 * 1024 },
      timeframe: 'Yıl içinde lansmanı yapılan hizmetler'
    }
  },

  // KPI 18 - SH2.5 - Dış finansman
  {
    kpiNumber: 18,
    shCode: 'SH2.5',
    kpiTitle: 'Dış finansman toplamı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH2.5_hibe_sozlesme_taahhut',
        fileType: ['PDF'],
        description: 'Hibe/sözleşme/taahhüt mektupları',
        category: 'CERTIFICATE'
      },
      {
        type: 'recommended',
        fileName: 'SH2.5_banka_kalkinma_yazismalari',
        fileType: ['PDF', 'DOCX'],
        description: 'Banka/kalkınma ajansı yazışmaları',
        category: 'CERTIFICATE'
      }
    ],
    aiAnalysisMethods: [
      'Kaynak türü bazında finansman portföyü',
      'Crowding in etkisi (MF müdahalesi sonrası)'
    ],
    sampleNaming: [
      'SH2.5_hibe_sozlesme_2024Q4.pdf',
      'SH2.5_banka_yazisma_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['kaynak_turu', 'tutar', 'sozlesme_tarihi', 'proje_kodu'],
      fileSize: { min: 1024, max: 50 * 1024 * 1024 },
      timeframe: 'Dönem içinde alınan finansmanlar'
    }
  },

  // KPI 19 - SH4.8 - Personel elde tutma (note: SH4.8 in document)
  {
    kpiNumber: 19,
    shCode: 'SH4.8',
    kpiTitle: 'Personel elde tutma oranı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH4.8_ik_cikis_giris',
        fileType: ['CSV', 'XLSX'],
        description: 'İK çıkış/giriş kayıtları',
        category: 'LOG'
      },
      {
        type: 'required',
        fileName: 'SH4.8_kadro_plani',
        fileType: ['XLSX', 'PDF'],
        description: 'Kadro planı',
        category: 'REPORT'
      },
      {
        type: 'recommended',
        fileName: 'SH4.8_exit_interview',
        fileType: ['PDF', 'DOCX'],
        description: 'Exit interview özetleri',
        category: 'REPORT'
      }
    ],
    aiAnalysisMethods: [
      'Yıllık turnover',
      'Roller/birimler bazında risk',
      'Sektörel rekabet etkisi (maaş/işgücü piyasası verisi ile)'
    ],
    sampleNaming: [
      'SH4.8_ik_kayit_2024Q4.csv',
      'SH4.8_kadro_plan_2024Q4.xlsx',
      'SH4.8_exit_interview_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['personel_id', 'giris_tarihi', 'cikis_tarihi', 'pozisyon'],
      fileSize: { min: 1024, max: 10 * 1024 * 1024 },
      timeframe: 'Yıllık personel hareketleri'
    }
  },

  // KPI 20 - SH3.1 - Çalışan başına eğitim
  {
    kpiNumber: 20,
    shCode: 'SH3.1',
    kpiTitle: 'Çalışan başına yıllık eğitim süresi',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH3.1_lms_raporlari',
        fileType: ['CSV', 'XLSX'],
        description: 'LMS raporları',
        category: 'LOG'
      },
      {
        type: 'required',
        fileName: 'SH3.1_egitim_katilim_formlari',
        fileType: ['PDF', 'XLSX'],
        description: 'Eğitim katılım formları',
        category: 'LOG'
      },
      {
        type: 'recommended',
        fileName: 'SH3.1_sertifikalar',
        fileType: ['PDF'],
        description: 'Sertifikalar',
        category: 'CERTIFICATE'
      }
    ],
    aiAnalysisMethods: [
      'Kişi başı saat',
      'Kritik rol bazında boşluk',
      'Sektör gereksinimine uyum (örn. gıda için HACCP modülleri)'
    ],
    sampleNaming: [
      'SH3.1_lms_rapor_2024Q4.csv',
      'SH3.1_katilim_form_2024Q4.xlsx',
      'SH3.1_sertifika_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['personel_id', 'egitim_kodu', 'sure_saat', 'tamamlama_tarihi'],
      fileSize: { min: 1024, max: 25 * 1024 * 1024 },
      timeframe: 'Yıllık eğitim kayıtları'
    }
  },

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
  },

  // KPI 29-41: SH4 KPIs (Compact Format)
  { kpiNumber: 29, shCode: 'SH4.1', kpiTitle: 'Paydaş geri bildirimlerinden iyileştirme yapılan süreç/hizmet sayısı', requiredEvidences: [{ type: 'required', fileName: 'SH4.1_geri_bildirim_sistemi', fileType: ['CSV', 'XLSX'], description: 'Geri bildirim sistemi (ticket/CX)', category: 'LOG' }, { type: 'required', fileName: 'SH4.1_degisiklik_kayitlari', fileType: ['PDF', 'DOCX'], description: 'Değişiklik kayıtları', category: 'LOG' }], aiAnalysisMethods: ['Geri bildirim→aksiyon iz sürme', 'VOC tema analizi', 'Sektör bazlı memnuniyet farkları'], sampleNaming: ['SH4.1_geri_bildirim_2024Q4.csv', 'SH4.1_degisiklik_2024Q4.pdf'], validationRules: { requiredFields: ['geri_bildirim_id', 'kaynagi', 'tema', 'aksiyon_durumu'], fileSize: { min: 1024, max: 25 * 1024 * 1024 }, timeframe: 'Geri bildirim ve aksiyon arasında max 90 gün' } },
  { kpiNumber: 30, shCode: 'SH4.2', kpiTitle: 'Marka tanınırlık oranı', requiredEvidences: [{ type: 'required', fileName: 'SH4.2_hedef_kitle_anketi', fileType: ['CSV', 'XLSX'], description: 'Hedef kitle anketi', category: 'REPORT' }], aiAnalysisMethods: ['Tanınırlık skoru', 'Frekans erişim', 'Sektör spesifik bilinirlik boşlukları'], sampleNaming: ['SH4.2_anket_2024Q4.csv'], validationRules: { requiredFields: ['katilimci_id', 'taninirlik_skoru', 'sektorel_kategori'], fileSize: { min: 1024, max: 15 * 1024 * 1024 }, timeframe: 'Altı aylık tanınırlık araştırmaları' } },
  { kpiNumber: 31, shCode: 'SH4.2', kpiTitle: 'Olumlu haber/içerik sayısı', requiredEvidences: [{ type: 'required', fileName: 'SH4.2_basin_kupurleri', fileType: ['PDF', 'XLSX'], description: 'Basın kupürleri', category: 'REPORT' }], aiAnalysisMethods: ['Duygu sınıflandırma', 'İçerik kaynak kalitesi', 'Sektör odaklı görünürlük'], sampleNaming: ['SH4.2_basin_kupuru_2024Q4.pdf'], validationRules: { requiredFields: ['icerik_id', 'kaynak', 'duygu_skoru', 'yayin_tarihi'], fileSize: { min: 1024, max: 50 * 1024 * 1024 }, timeframe: 'Aylık medya takibi' } },
  { kpiNumber: 33, shCode: 'SH4.3', kpiTitle: 'Hizmetleri tavsiye etme oranı (NPS)', requiredEvidences: [{ type: 'required', fileName: 'SH4.3_nps_anket_ham_verisi', fileType: ['CSV', 'XLSX'], description: 'NPS anket ham verisi', category: 'REPORT' }], aiAnalysisMethods: ['NPS hesaplama', 'Gerekçe temaları', 'Sektör/ölçek bazında dağılım', 'NPS→tekrar satın alma korelasyonu'], sampleNaming: ['SH4.3_nps_anket_2024Q4.csv'], validationRules: { requiredFields: ['musteri_id', 'nps_puani', 'hizmet_kodu', 'anket_tarihi'], fileSize: { min: 1024, max: 10 * 1024 * 1024 }, timeframe: 'Hizmet sonrası max 30 gün içinde anket' } },
  { kpiNumber: 34, shCode: 'SH4.3', kpiTitle: 'Tekrar hizmet alan KOBİ oranı', requiredEvidences: [{ type: 'required', fileName: 'SH4.3_crm_siparis_yenileme', fileType: ['CSV', 'XLSX'], description: 'CRM sipariş/yenileme kayıtları', category: 'LOG' }], aiAnalysisMethods: ['Kohort tekrar oranı', 'Sektör ve hizmet tipi bazında elde tutma eğrileri'], sampleNaming: ['SH4.3_siparis_yenileme_2024Q4.csv'], validationRules: { requiredFields: ['kobi_id', 'ilk_hizmet_tarihi', 'ikinci_hizmet_tarihi', 'hizmet_kodu'], fileSize: { min: 1024, max: 25 * 1024 * 1024 }, timeframe: 'İki hizmet arası min 30 gün max 24 ay' } },
  { kpiNumber: 35, shCode: 'SH4.4', kpiTitle: 'Çalışan memnuniyeti/bağlılığı', requiredEvidences: [{ type: 'required', fileName: 'SH4.4_calisan_anketleri_enps', fileType: ['CSV', 'XLSX'], description: 'Çalışan anketleri (eNPS)', category: 'REPORT' }], aiAnalysisMethods: ['Memnuniyet sürücüleri (SHAP/anket maddeleri)', 'Birim/rol farkları', 'Sektör yetenek piyasası etkisi'], sampleNaming: ['SH4.4_enps_anket_2024Q4.csv'], validationRules: { requiredFields: ['personel_id', 'memnuniyet_puani', 'departman', 'anket_tarihi'], fileSize: { min: 1024, max: 15 * 1024 * 1024 }, timeframe: 'Yıllık çalışan memnuniyet anketi' } },
  { kpiNumber: 36, shCode: 'SH4.5', kpiTitle: 'Sosyal sorumluluk faydalanan kişi sayısı', requiredEvidences: [{ type: 'required', fileName: 'SH4.5_proje_faydalanici_listeleri', fileType: ['XLSX', 'CSV'], description: 'Proje faydalanıcı listeleri', category: 'LOG' }, { type: 'required', fileName: 'SH4.5_etkinlik_kayitlari', fileType: ['XLSX', 'PDF'], description: 'Etkinlik kayıtları', category: 'LOG' }], aiAnalysisMethods: ['Sayı doğrulama', 'Hedef kitle uyumu', 'Etki ölçümü (ör. beceri kazanımı anketi)'], sampleNaming: ['SH4.5_faydalanici_2024Q4.xlsx', 'SH4.5_etkinlik_2024Q4.pdf'], validationRules: { requiredFields: ['faydalanici_id', 'proje_kodu', 'katilim_tarihi', 'hedef_kategori'], fileSize: { min: 1024, max: 25 * 1024 * 1024 }, timeframe: 'Proje süresi boyunca' } },
  { kpiNumber: 37, shCode: 'SH4.6', kpiTitle: 'MF hizmetlerinden yararlanıp ödül/derece alan işletme sayısı', requiredEvidences: [{ type: 'required', fileName: 'SH4.6_odul_belgeleri', fileType: ['PDF'], description: 'Ödül belgeleri', category: 'CERTIFICATE' }, { type: 'required', fileName: 'SH4.6_basvuru_dosyalari', fileType: ['PDF', 'DOCX'], description: 'Başvuru dosyaları', category: 'REPORT' }], aiAnalysisMethods: ['Ödül türü/itibarı', 'Müdahale→ödül olasılık modeli (lojistik regresyon)'], sampleNaming: ['SH4.6_odul_belge_2024Q4.pdf', 'SH4.6_basvuru_2024Q4.pdf'], validationRules: { requiredFields: ['isletme_id', 'odul_turu', 'alinma_tarihi', 'mf_hizmet_kodu'], fileSize: { min: 1024, max: 50 * 1024 * 1024 }, timeframe: 'MF hizmeti sonrası max 24 ay içinde ödül' } },
  { kpiNumber: 38, shCode: 'SH4.7', kpiTitle: 'Üniversite/AR-GE ile yürütülen aktif ortak proje sayısı', requiredEvidences: [{ type: 'required', fileName: 'SH4.7_proje_sozlesmeleri', fileType: ['PDF'], description: 'Proje sözleşmeleri', category: 'CERTIFICATE' }, { type: 'required', fileName: 'SH4.7_tubitak_ab_kayitlari', fileType: ['PDF', 'XLSX'], description: 'TÜBİTAK/AB kayıtları', category: 'CERTIFICATE' }], aiAnalysisMethods: ['Proje TRL aşaması', 'Bütçe ve partner türüne göre ısı haritası', 'Sektör odağı'], sampleNaming: ['SH4.7_proje_sozlesme_2024Q4.pdf', 'SH4.7_tubitak_kayit_2024Q4.xlsx'], validationRules: { requiredFields: ['proje_kodu', 'partner_universite', 'baslangic_tarihi', 'trl_seviyesi'], fileSize: { min: 1024, max: 50 * 1024 * 1024 }, timeframe: 'Aktif proje durumu' } },
  { kpiNumber: 39, shCode: 'SH4.7', kpiTitle: 'Birlikte geliştirilen ürün/hizmet, metodoloji veya yayın sayısı', requiredEvidences: [{ type: 'required', fileName: 'SH4.7_yayin_doileri', fileType: ['XLSX', 'CSV'], description: 'Yayın DOİ\'leri', category: 'CERTIFICATE' }], aiAnalysisMethods: ['Atıf/etki', 'Sektörel uygulanabilirlik sınıflaması', 'Bilgi erişim puanı'], sampleNaming: ['SH4.7_yayin_doi_2024Q4.csv'], validationRules: { requiredFields: ['cikti_turu', 'baslik', 'yayin_tarihi', 'partner_kurum'], fileSize: { min: 1024, max: 25 * 1024 * 1024 }, timeframe: 'Geliştirme ve yayın süreçleri' } },
  { kpiNumber: 40, shCode: 'SH4.8', kpiTitle: 'Uluslararası kurumlarla stratejik ortaklık sayısı', requiredEvidences: [{ type: 'required', fileName: 'SH4.8_mou_isbirligi_anlasmalar', fileType: ['PDF'], description: 'MoU/işbirliği anlaşmaları', category: 'CERTIFICATE' }], aiAnalysisMethods: ['Ortaklık derinlik skoru (süre, ortak faaliyet sayısı)', 'Bölge/ülke ve sektör odağı'], sampleNaming: ['SH4.8_mou_anlaşma_2024Q4.pdf'], validationRules: { requiredFields: ['partner_kurum', 'ulke', 'anlaşma_tarihi', 'faaliyet_alani'], fileSize: { min: 1024, max: 25 * 1024 * 1024 }, timeframe: 'Aktif ortaklık anlaşmaları' } },
  { kpiNumber: 41, shCode: 'SH4.8', kpiTitle: 'Uluslararası benchmark analizi sayısı', requiredEvidences: [{ type: 'required', fileName: 'SH4.8_benchmark_raporlari', fileType: ['PDF', 'DOCX'], description: 'Benchmark raporları', category: 'REPORT' }, { type: 'required', fileName: 'SH4.8_veri_setleri', fileType: ['CSV', 'XLSX'], description: 'Veri setleri', category: 'LOG' }], aiAnalysisMethods: ['Eşleştirilmiş kıyas (ölçeklendirme/normalize)', 'Sektörel gap analizi ve yol haritası önerileri'], sampleNaming: ['SH4.8_benchmark_rapor_2024Q4.pdf', 'SH4.8_veri_set_2024Q4.csv'], validationRules: { requiredFields: ['benchmark_konu', 'karsilastirma_ulkeleri', 'analiz_tarihi'], fileSize: { min: 1024, max: 100 * 1024 * 1024 }, timeframe: 'Yıllık benchmark çalışmaları' } }
]

// KPI numarasına göre template al
export function getEvidenceTemplateByKPI(kpiNumber: number): EvidenceTemplate | undefined {
  return EVIDENCE_TEMPLATES.find(template => template.kpiNumber === kpiNumber)
}

// SH koduna göre template'leri al
export function getEvidenceTemplatesBySH(shCode: string): EvidenceTemplate[] {
  return EVIDENCE_TEMPLATES.filter(template => template.shCode === shCode)
}

// Dosya adı önerisi oluştur
export function generateEvidenceFileName(
  shCode: string, 
  evidenceType: string, 
  period: string, 
  extension: string = 'xlsx'
): string {
  const sanitizedType = evidenceType.toLowerCase().replace(/[^a-z0-9]/g, '_')
  return `${shCode}_${sanitizedType}_${period}.${extension}`
}

// Validasyon kurallarını kontrol et
export function validateEvidenceFile(
  file: File, 
  template: EvidenceTemplate, 
  metadata: any
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Dosya boyutu kontrolü
  if (file.size < template.validationRules.fileSize.min) {
    errors.push(`Dosya boyutu çok küçük (min: ${template.validationRules.fileSize.min} bytes)`)
  }
  if (file.size > template.validationRules.fileSize.max) {
    errors.push(`Dosya boyutu çok büyük (max: ${template.validationRules.fileSize.max} bytes)`)
  }
  
  // Gerekli alanlar kontrolü
  for (const field of template.validationRules.requiredFields) {
    if (!metadata[field] || metadata[field] === '') {
      errors.push(`Gerekli alan eksik: ${field}`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Tüm KPI'lar için özet
export function getAllKPIEvidenceSummary() {
  return EVIDENCE_TEMPLATES.map(template => ({
    kpiNumber: template.kpiNumber,
    shCode: template.shCode,
    kpiTitle: template.kpiTitle,
    requiredCount: template.requiredEvidences.filter(e => e.type === 'required').length,
    recommendedCount: template.requiredEvidences.filter(e => e.type === 'recommended').length,
    optionalCount: template.requiredEvidences.filter(e => e.type === 'optional').length,
    aiMethodsCount: template.aiAnalysisMethods.length
  }))
}
