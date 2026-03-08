export interface CurriculumTopic {
  id: string
  label: string
  subtopics: string[]
}

// Grade band key: "1-4", "5-6", "7-8", "9-10", "11-12"
// Subject id → grade band → topics
export const CURRICULUM_TOPICS: Record<string, Record<string, CurriculumTopic[]>> = {
  matematika: {
    "1-4": [
      { id: "skaiciai-1-4", label: "Skaičiai ir skaičiavimai", subtopics: ["Natūralieji skaičiai iki 10 000", "Sudėtis ir atimtis", "Daugyba ir dalyba", "Dešimtainė skaičių sistema"] },
      { id: "matavimas-1-4", label: "Matavimas", subtopics: ["Ilgis ir masė", "Laikas", "Pinigai", "Perimetras ir plotas"] },
      { id: "geometrija-1-4", label: "Geometrija", subtopics: ["Figūros ir jų savybės", "Simetrija", "Koordinatės plokštumoje"] },
      { id: "duomenys-1-4", label: "Duomenys ir tikimybė", subtopics: ["Duomenų rinkimas", "Diagramos", "Lentelės"] },
    ],
    "5-6": [
      { id: "nat-skaiciai", label: "Natūralieji skaičiai", subtopics: ["Dešimtainė sistema", "Dalumas", "Didžiausias bendrasis daliklis", "Mažiausias bendrasis kartotinis"] },
      { id: "trupmenys", label: "Trupmenys", subtopics: ["Paprastosios trupmenys", "Dešimtainės trupmenys", "Veiksmai su trupmenomis", "Trupmenų palyginimas"] },
      { id: "geometrija-5-6", label: "Geometrija", subtopics: ["Kampai", "Trikampiai", "Keturkampiai", "Plotas ir perimetras", "Tūris"] },
      { id: "procentai", label: "Procentai", subtopics: ["Procento sąvoka", "Procentų skaičiavimas", "Nuolaidos ir palūkanos"] },
      { id: "statistika-5-6", label: "Statistika", subtopics: ["Vidurkis", "Mediana", "Diagramos", "Duomenų analizė"] },
    ],
    "7-8": [
      { id: "algebra-7-8", label: "Algebra", subtopics: ["Reiškiniai", "Lygtys", "Nelygybės", "Tiesinės funkcijos", "Kvadratiniai reiškiniai"] },
      { id: "geometrija-7-8", label: "Geometrija", subtopics: ["Pitagoro teorema", "Panašieji trikampiai", "Apskritimas", "Erdvinės figūros"] },
      { id: "statistika-7-8", label: "Statistika ir tikimybės", subtopics: ["Tikimybės sąvoka", "Kombinatorika", "Statistiniai rodikliai"] },
      { id: "proporcijos", label: "Proporcijos ir santykiai", subtopics: ["Tiesioginis proporcingumas", "Atvirkštinis proporcingumas", "Masteliai"] },
    ],
    "9-10": [
      { id: "funkcijos", label: "Funkcijos", subtopics: ["Kvadratinė funkcija", "Laipsninė funkcija", "Rodiklinė funkcija", "Logaritminė funkcija"] },
      { id: "lygtys-9-10", label: "Lygtys ir nelygybės", subtopics: ["Kvadratinės lygtys", "Lygčių sistemos", "Nelygybių sistemos"] },
      { id: "trigonometrija", label: "Trigonometrija", subtopics: ["Sinusas, kosinusas, tangentas", "Trigonometrinės tapatybės", "Trikampių sprendimas"] },
      { id: "geometrija-9-10", label: "Geometrija", subtopics: ["Vektoriai", "Koordinačių geometrija", "Erdvinė geometrija"] },
    ],
    "11-12": [
      { id: "analize", label: "Matematinė analizė", subtopics: ["Ribos", "Išvestinė", "Integralas", "Funkcijų tyrimas"] },
      { id: "tikimybes-11-12", label: "Tikimybių teorija", subtopics: ["Sąlyginė tikimybė", "Bernulio bandymai", "Normalusis skirstinys"] },
      { id: "algebra-11-12", label: "Algebra", subtopics: ["Kompleksiniai skaičiai", "Polinomai", "Matricų pagrindai"] },
    ],
  },
  biologija: {
    "5-6": [
      { id: "gyvoji-gamta", label: "Gyvoji gamta", subtopics: ["Gyvų organizmų įvairovė", "Augalai", "Gyvūnai", "Grybai ir bakterijos"] },
      { id: "zmogaus-kunas-5-6", label: "Žmogaus kūnas", subtopics: ["Judėjimo sistema", "Mityba ir virškinimas", "Higiena"] },
      { id: "ekosistemos-5-6", label: "Ekosistemos", subtopics: ["Mitybos grandinės", "Gamtos apsauga", "Aplinkos tarša"] },
    ],
    "7-8": [
      { id: "lastele", label: "Ląstelė", subtopics: ["Ląstelės sandara", "Ląstelės dalijimasis", "Augalinė ir gyvūninė ląstelė"] },
      { id: "augalai-7-8", label: "Augalų biologija", subtopics: ["Fotosintezė", "Augalų dauginimasis", "Augalų prisitaikymas"] },
      { id: "gyvunai-7-8", label: "Gyvūnų biologija", subtopics: ["Stuburiniai", "Bestuburiai", "Gyvūnų elgsena"] },
      { id: "zmogaus-kunas-7-8", label: "Žmogaus kūnas", subtopics: ["Kraujotakos sistema", "Kvėpavimo sistema", "Nervų sistema", "Hormonai"] },
      { id: "genetika-pagrindai", label: "Genetikos pagrindai", subtopics: ["Paveldimumas", "DNR", "Genai ir požymiai"] },
    ],
    "9-10": [
      { id: "genetika-9-10", label: "Genetika", subtopics: ["Mendelio dėsniai", "Chromosomos", "Mutacijos", "Genetinė inžinerija"] },
      { id: "evoliucija", label: "Evoliucija", subtopics: ["Darwino teorija", "Natūrali atranka", "Rūšių atsiradimas"] },
      { id: "ekologija", label: "Ekologija", subtopics: ["Populiacijos", "Biomai", "Biologinė įvairovė", "Klimato kaita"] },
      { id: "mikrobiologija", label: "Mikrobiologija", subtopics: ["Bakterijos", "Virusai", "Imunitetas", "Vakcinos"] },
    ],
    "11-12": [
      { id: "molekuline", label: "Molekulinė biologija", subtopics: ["DNR replikacija", "Baltymų sintezė", "Genų raiška"] },
      { id: "biotechnologijos", label: "Biotechnologijos", subtopics: ["GMO", "Klonavimas", "Genų terapija"] },
      { id: "neurofiziologija", label: "Neurofiziologija", subtopics: ["Nervinis impulsas", "Smegenų veikla", "Jutimo organai"] },
    ],
  },
  geografija: {
    "5-6": [
      { id: "zemele", label: "Žemėlapiai ir orientavimasis", subtopics: ["Kompasas", "Žemėlapio masteliai", "Geografinės koordinatės"] },
      { id: "zemes-sandara", label: "Žemės sandara", subtopics: ["Žemės sluoksniai", "Uolienos ir mineralai", "Dirvožemis"] },
      { id: "vanduo", label: "Vanduo Žemėje", subtopics: ["Vandens apytaka", "Upės ir ežerai", "Vandenynai"] },
      { id: "orai", label: "Orai ir klimatas", subtopics: ["Temperatūra", "Krituliai", "Vėjas", "Klimato juostos"] },
    ],
    "7-8": [
      { id: "kontinentai", label: "Pasaulio žemynai", subtopics: ["Europa", "Azija", "Afrika", "Šiaurės ir Pietų Amerika", "Australija"] },
      { id: "lietuvos-gamta", label: "Lietuvos gamta", subtopics: ["Reljefas", "Klimatas", "Augalija ir gyvūnija", "Saugomos teritorijos"] },
      { id: "gyventojai", label: "Gyventojai", subtopics: ["Demografija", "Migracija", "Urbanizacija"] },
    ],
    "9-10": [
      { id: "tektonika", label: "Tektonika", subtopics: ["Plokščių tektonika", "Žemės drebėjimai", "Ugnikalniai"] },
      { id: "klimatologija", label: "Klimatologija", subtopics: ["Klimato veiksniai", "Klimato kaita", "El Niño"] },
      { id: "ekonomine-geo", label: "Ekonominė geografija", subtopics: ["Gamtos ištekliai", "Pramonė", "Žemės ūkis", "Transportas"] },
      { id: "globalizacija", label: "Globalizacija", subtopics: ["Tarptautinė prekyba", "Kultūrų sąveika", "Aplinkos problemos"] },
    ],
    "11-12": [
      { id: "geopolitika", label: "Geopolitika", subtopics: ["Valstybių sandara", "Tarptautinės organizacijos", "Konfliktai"] },
      { id: "tvarus-vystymasis", label: "Tvarus vystymasis", subtopics: ["Darnus vystymasis", "Atsinaujinanti energija", "Aplinkosauga"] },
      { id: "gis", label: "GIS ir nuotoliniai tyrimai", subtopics: ["Geografinės informacinės sistemos", "Palydoviniai vaizdai", "Duomenų analizė"] },
    ],
  },
  istorija: {
    "5-6": [
      { id: "senove", label: "Senovė", subtopics: ["Senovės Egiptas", "Senovės Graikija", "Senovės Roma", "Senovės civilizacijos"] },
      { id: "lietuvos-pradzia", label: "Lietuvos pradžia", subtopics: ["Baltų gentys", "Lietuvos valstybės kūrimasis", "Mindaugas"] },
      { id: "viduramziai-5-6", label: "Viduramžiai", subtopics: ["Riteriai", "Pilys", "Bažnyčios vaidmuo"] },
    ],
    "7-8": [
      { id: "viduramziai", label: "Viduramžiai", subtopics: ["Feodalinė santvarka", "Kryžiaus žygiai", "Renesansas"] },
      { id: "ldk", label: "Lietuvos Didžioji Kunigaikštystė", subtopics: ["Gediminas", "Vytautas", "Liublino unija", "Abiejų Tautų Respublika"] },
      { id: "naujieji-laikai", label: "Naujieji laikai", subtopics: ["Didieji geografiniai atradimai", "Reformacija", "Apšvietos epocha"] },
    ],
    "9-10": [
      { id: "revoliucijos", label: "Revoliucijos", subtopics: ["Prancūzijos revoliucija", "Pramonės revoliucija", "1848 m. revoliucijos"] },
      { id: "xix-a", label: "XIX amžius", subtopics: ["Tautų pavasaris", "Lietuvos tautinis atgimimas", "Baudžiavos panaikinimas"] },
      { id: "xx-a-pradzia", label: "XX a. pradžia", subtopics: ["Pirmasis pasaulinis karas", "Lietuvos nepriklausomybė 1918", "Tarpukaris"] },
      { id: "ii-pasaulinis", label: "Antrasis pasaulinis karas", subtopics: ["Holokaustas", "Okupacijos", "Rezistencija"] },
    ],
    "11-12": [
      { id: "saltasis-karas", label: "Šaltasis karas", subtopics: ["NATO ir Varšuvos paktas", "Branduolinis ginklavimasis", "Kosmoso lenktynės"] },
      { id: "sovietine-okupacija", label: "Sovietinė okupacija", subtopics: ["Trėmimai", "Partizaninis judėjimas", "Sąjūdis"] },
      { id: "nepriklausomybe", label: "Nepriklausomybės atkūrimas", subtopics: ["Kovo 11-oji", "Sausio 13-oji", "Eurointegracijos kelias"] },
      { id: "siuolaikinis-pasaulis", label: "Šiuolaikinis pasaulis", subtopics: ["Globalizacija", "ES", "Terorizmas", "Technologijų revoliucija"] },
    ],
  },
  steam: {
    "1-4": [
      { id: "gamta-eksperimentai", label: "Gamtos eksperimentai", subtopics: ["Vandens savybės", "Augalų augimas", "Magnetai", "Šviesa ir šešėliai"] },
      { id: "technologijos-1-4", label: "Technologijos", subtopics: ["Paprastos mašinos", "Programavimo pagrindai", "Robotika pradedantiesiems"] },
      { id: "kurybiskumas", label: "Kūrybiškumas", subtopics: ["Dizainas", "3D modeliavimas", "Skaitmeninis menas"] },
    ],
    "5-6": [
      { id: "fizika-pagrindai", label: "Fizikos pagrindai", subtopics: ["Jėga ir judėjimas", "Energija", "Elektra", "Garsas"] },
      { id: "chemija-pagrindai", label: "Chemijos pagrindai", subtopics: ["Medžiagų savybės", "Mišiniai ir tirpalai", "Cheminės reakcijos"] },
      { id: "programavimas-5-6", label: "Programavimas", subtopics: ["Scratch", "Algoritminis mąstymas", "Žaidimų kūrimas"] },
    ],
    "7-8": [
      { id: "inzinerija", label: "Inžinerija", subtopics: ["Konstrukcijų projektavimas", "3D spausdinimas", "Elektronika"] },
      { id: "aplinkosauga", label: "Aplinkosauga", subtopics: ["Atsinaujinanti energija", "Perdirbimas", "Ekologinis pėdsakas"] },
      { id: "duomenys-7-8", label: "Duomenų mokslas", subtopics: ["Duomenų rinkimas", "Vizualizacija", "Kritinis mąstymas"] },
    ],
    "9-10": [
      { id: "robotika", label: "Robotika", subtopics: ["Arduino", "Sensoriai", "Automatizacija"] },
      { id: "ai-pagrindai", label: "Dirbtinis intelektas", subtopics: ["Mašininis mokymasis", "Vaizdų atpažinimas", "Chatbotai"] },
      { id: "bioinzinerija", label: "Bioinžinerija", subtopics: ["Bionika", "Medicinos technologijos", "Genetinė inžinerija"] },
    ],
    "11-12": [
      { id: "moksliniai-tyrimai", label: "Moksliniai tyrimai", subtopics: ["Tyrimų metodologija", "Statistinė analizė", "Mokslinės publikacijos"] },
      { id: "inovacijos", label: "Inovacijos", subtopics: ["Startuoliai", "Dizaino mąstymas", "Prototipavimas"] },
      { id: "etika-technologijos", label: "Etika ir technologijos", subtopics: ["Privatumas", "DI etika", "Socialinė atsakomybė"] },
    ],
  },
}

function getGradeBand(grade: number): string {
  if (grade <= 4) return "1-4"
  if (grade <= 6) return "5-6"
  if (grade <= 8) return "7-8"
  if (grade <= 10) return "9-10"
  return "11-12"
}

export function getTopicsForSubjectAndGrade(subjectId: string, grade: number): CurriculumTopic[] {
  const band = getGradeBand(grade)
  return CURRICULUM_TOPICS[subjectId]?.[band] ?? []
}

export function getCurriculumContext(subjectId: string, grade: number, topicId?: string): string {
  const topics = getTopicsForSubjectAndGrade(subjectId, grade)
  if (topics.length === 0) return ""

  const band = getGradeBand(grade)
  const lines: string[] = [`Programa: ${band} klasių grupė`]

  if (topicId) {
    const topic = topics.find((t) => t.id === topicId)
    if (topic) {
      lines.push(`Tema: ${topic.label}`)
      lines.push(`Potemės: ${topic.subtopics.join(", ")}`)
    }
  } else {
    lines.push("Galimos temos:")
    topics.forEach((t) => {
      lines.push(`- ${t.label}: ${t.subtopics.join(", ")}`)
    })
  }

  return lines.join("\n")
}
