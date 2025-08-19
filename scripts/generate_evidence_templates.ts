import { prisma } from '@/lib/prisma'

// kanıt.txt'ten çıkarılan KPI-kanıt eşleşmeleri
const KPI_EVIDENCE_MAPPING = {
  1: { // SH1.1 Farkındalık artış oranı
    files: ['farkindalik_on_anket.csv', 'farkindalik_son_anket.csv', 'orneklem_plani.pdf', 'etkinlik_katilim.xlsx'],
    types: ['text/csv', 'text/csv', 'application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    categories: ['REPORT', 'REPORT', 'REPORT', 'LOG'],
    analysis: 'Örneklem/yanıt yanlılığı kontrol, ön-son t-testi, Cohen d etki büyüklüğü, sektör/il/OSB kırılım analizi',
    naceRelevant: ['10', '25', '29', '13'] // Gıda, Metal, Otomotiv, Tekstil
  },
  2: { // SH1.1 Ortak farkındalık etkinliği kurum sayısı
    files: ['etkinlik_takvimi.xlsx', 'protokoller_mou.pdf', 'katilimci_listesi.csv', 'etkinlik_fotograflari.zip'],
    types: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf', 'text/csv', 'application/zip'],
    categories: ['LOG', 'CERTIFICATE', 'LOG', 'IMAGE'],
    analysis: 'Kurum eşleşmesi, çift kayıt temizliği, benzersiz kurum sayımı, etkinlik etki puanı hesabı',
    naceRelevant: ['20', '26', '28', '32'] // Kimya, Elektronik, Makine, Medikal
  },
  3: { // SH1.2 Program katılımcılarının istihdam oranı
    files: ['katilimci_listesi.csv', 'yerlestirme_kayitlari.xlsx', 'sgk_eslestirme_anonim.csv', 'mezun_takip.pdf'],
    types: ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'application/pdf'],
    categories: ['LOG', 'REPORT', 'LOG', 'REPORT'],
    analysis: 'Takip oranı hesabı, örneklem yanlılığı kontrolü, 12 ay istihdam oranı, sektör/meslek kodu eşleşmesi',
    naceRelevant: ['13', '14', '15', '25'] // Tekstil grubu, Metal
  },
  4: { // SH1.2 Toplam eğitim (kişi×saat)
    files: ['lms_katilim_log.csv', 'egitim_plani.xlsx', 'egitmen_raporu.pdf'],
    types: ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf'],
    categories: ['LOG', 'REPORT', 'REPORT'],
    analysis: 'Kişi×saat otomatik toplama, no-show ayıklama, sektörel kişi×saat dağılımı, maliyet/çıktı analizi',
    naceRelevant: ['10', '20', '25', '29'] // Çeşitli sektörler
  },
  5: { // SH1.3 Destek programlarından yararlanan KOBİ sayısı
    files: ['yonlendirme_kayitlari.xlsx', 'kosgeb_kabul_yazilari.pdf', 'tubitak_proje_sozlesmeleri.pdf', 'ab_hibe_belgeleri.pdf'],
    types: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf', 'application/pdf', 'application/pdf'],
    categories: ['LOG', 'CERTIFICATE', 'CERTIFICATE', 'CERTIFICATE'],
    analysis: 'Yönlendirme→başvuru→kabul huni analizi, sektör/il bazında dönüşüm oranı, tutar/tema dağılımı',
    naceRelevant: ['22', '23', '26', '28'] // Plastik, Mermer, Elektronik, Makine
  },
  6: { // SH1.4 Sürdürülebilirlik oranı
    files: ['6ay_takip_anketi.csv', '12ay_takip_anketi.csv', 'yerinde_gozlem.pdf', 'sct_talimatlari.pdf'],
    types: ['text/csv', 'text/csv', 'application/pdf', 'application/pdf'],
    categories: ['REPORT', 'REPORT', 'REPORT', 'REPORT'],
    analysis: 'Uygulamaların devam oranı, kontrol listesi puanı, sektörel kalıcılık farkı (gıda vs metal)',
    naceRelevant: ['10', '25', '20', '29'] // Gıda, Metal, Kimya, Otomotiv
  },
  7: { // SH1.4 Karbon emisyonu azalış oranı
    files: ['enerji_faturalari.pdf', 'mes_kayitlari.csv', 'iso14064_raporu.pdf', 'olcum_formlari.xlsx'],
    types: ['application/pdf', 'text/csv', 'application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    categories: ['REPORT', 'LOG', 'CERTIFICATE', 'REPORT'],
    analysis: 'Baz çizgi→sonrası normalize tüketim, %CO₂ eşdeğer azalış, sektörel kıyas (tekstil kg/kumaş)',
    naceRelevant: ['13', '20', '23', '24'] // Tekstil, Kimya, Mermer, Çelik
  },
  8: { // SH1.5 Olgunluk seviyesine ulaşan KOBİ sayısı
    files: ['siri_degerlendirme.xlsx', 'ddx_raporu.pdf', 'tpm_olgunluk.pdf', 'denetim_raporlari.pdf'],
    types: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf', 'application/pdf', 'application/pdf'],
    categories: ['REPORT', 'REPORT', 'REPORT', 'REPORT'],
    analysis: 'Skor eşiklere göre sınıflama, öncesi-sonrası ilerleme, sektör/ölçek kırılımında olgunluk haritası',
    naceRelevant: ['25', '26', '28', '29'] // Metal, Elektronik, Makine, Otomotiv
  },
  // SH2 KPI'ları
  11: { // SH2.1 Kârlılık oranı
    files: ['gelir_tablosu.xlsx', 'faaliyet_raporu.pdf', 'mali_tablolar_q4.xlsx'],
    types: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    categories: ['REPORT', 'REPORT', 'REPORT'],
    analysis: 'Net/operasyonel kârlılık hesabı, mevsimsellik arındırma, sektör bazlı benchmark, anormal gider/gelir tespiti',
    naceRelevant: ['10', '20', '25', '29'] // Geniş sektör yelpazesi
  },
  12: { // SH2.1 Yıllık gelir artış oranı
    files: ['faturalama_kayitlari.csv', 'tahakkuk_raporlari.xlsx', 'yillik_gelir_ozeti.pdf'],
    types: ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf'],
    categories: ['LOG', 'REPORT', 'REPORT'],
    analysis: 'CAGR ve yıl içi trend, sektör/ürün bazında büyüme katkısı, kaynak analizi (yeni×mevcut müşteri)',
    naceRelevant: ['13', '22', '26', '28'] // Tekstil, Plastik, Elektronik, Makine
  },
  // SH3 KPI'ları
  20: { // SH3.1 Çalışan başına eğitim süresi
    files: ['lms_egitim_raporlari.csv', 'katilim_formlari.xlsx', 'sertifikalar.pdf'],
    types: ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf'],
    categories: ['LOG', 'LOG', 'CERTIFICATE'],
    analysis: 'Kişi başı saat hesabı, kritik rol bazında boşluk analizi, sektör gereksinimine uyum (HACCP modülleri)',
    naceRelevant: ['10', '20', '25', '32'] // Gıda, Kimya, Metal, Medikal
  },
  22: { // SH3.3 OEE/etkinlik göstergesi
    files: ['mes_scada_logs.csv', 'vardiya_durus_kayitlari.xlsx', 'parca_sayaclari.csv'],
    types: ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
    categories: ['LOG', 'LOG', 'LOG'],
    analysis: 'OEE=K×P×K hesabı, kayıp ağacı analizi, sektör referanslarıyla gap analizi',
    naceRelevant: ['25', '29', '13', '26'] // Metal, Otomotiv, Tekstil, Elektronik
  },
  // SH4 KPI'ları
  30: { // SH4.2 Marka tanınırlık oranı
    files: ['hedef_kitle_anketi.csv', 'dijital_erisim_stats.xlsx', 'medya_olcum_panolari.pdf'],
    types: ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf'],
    categories: ['REPORT', 'LOG', 'REPORT'],
    analysis: 'Tanınırlık skoru hesabı, frekans erişim analizi, sektör spesifik bilinirlik boşlukları',
    naceRelevant: ['10', '13', '20', '25'] // Çeşitli sektörler
  },
  32: { // SH4.3 Müdahale sonrası verimlilik artışı
    files: ['on_uretkenlik_olcumleri.xlsx', 'son_uretkenlik_olcumleri.xlsx', 'vsm_smed_raporlari.pdf'],
    types: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf'],
    categories: ['REPORT', 'REPORT', 'REPORT'],
    analysis: 'Ön-son fark hesabı (bağlam değişkenleriyle normalize), sektörel kıyas (metalde çevrim süresi)',
    naceRelevant: ['25', '29', '13', '28'] // Metal, Otomotiv, Tekstil, Makine
  }
}

async function generateEvidenceTemplates() {
  const factories = await prisma.modelFactory.findMany({ select: { id: true, code: true } })
  const kpis = await prisma.kpi.findMany({ select: { id: true, number: true } })
  const period = '2024-Q4'
  let created = 0

  for (const factory of factories) {
    for (const kpi of kpis) {
      const mapping = KPI_EVIDENCE_MAPPING[kpi.number as keyof typeof KPI_EVIDENCE_MAPPING]
      if (!mapping) continue

      // Her KPI için birden fazla kanıt dosyası ekle
      for (let i = 0; i < mapping.files.length; i++) {
        const fileName = mapping.files[i]
        const fileType = mapping.types[i]
        const category = mapping.categories[i]
        const naceCode = mapping.naceRelevant[i % mapping.naceRelevant.length]
        
        const exists = await prisma.kpiEvidence.findFirst({
          where: { kpiId: kpi.id, factoryId: factory.id, period, fileName }
        })
        if (exists) continue

        // Gerçekçi meta veriler
        const meta = {
          analysisMethod: mapping.analysis,
          kpiNumber: kpi.number,
          fileSequence: i + 1,
          totalFiles: mapping.files.length,
          generated: true,
          qualityScore: Math.random() * 0.3 + 0.7 // 0.7-1.0 arası
        }

        await prisma.kpiEvidence.create({
          data: {
            kpiId: kpi.id,
            factoryId: factory.id,
            period,
            fileName,
            fileType,
            fileSize: Math.floor(Math.random() * 5000000) + 100000, // 100KB-5MB
            fileUrl: `https://example.com/evidence/${factory.code}/${fileName}`,
            description: `${mapping.analysis.split(',')[0]} - ${fileName}`,
            category,
            nace4d: `${naceCode}.${Math.floor(Math.random() * 99).toString().padStart(2, '0')}`,
            nace2d: naceCode,
            province: factory.code,
            zoneType: ['OSB', 'Serbest Bölge', 'Sanayi Sitesi'][Math.floor(Math.random() * 3)],
            employees: Math.floor(Math.random() * 500) + 50,
            revenue: Math.floor(Math.random() * 10000000) + 1000000,
            hasExport: Math.random() > 0.4,
            meta
          }
        })
        created++
      }
    }
  }

  console.log(`Generated ${created} evidence templates based on kanıt.txt specifications`)
}

async function main() {
  await generateEvidenceTemplates()
}

main().catch(e => { console.error(e); process.exit(1) })
