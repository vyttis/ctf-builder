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
  "lietuviu-kalba": {
    "1-4": [
      { id: "lk-rastingumas-1-4", label: "Raštingumas", subtopics: ["Abėcėlė", "Skaitymas", "Rašyba", "Skyryba"] },
      { id: "lk-tekstai-1-4", label: "Tekstų suvokimas", subtopics: ["Pasakos", "Eilėraščiai", "Pasakojimai"] },
      { id: "lk-kalbejimas-1-4", label: "Kalbėjimas", subtopics: ["Pasakojimas", "Aprašymas", "Dialogas"] },
    ],
    "5-6": [
      { id: "lk-gramatika-5-6", label: "Gramatika", subtopics: ["Daiktavardis", "Būdvardis", "Veiksmažodis", "Linksniavimas"] },
      { id: "lk-tautosaka", label: "Tautosaka", subtopics: ["Mitai", "Pasakos", "Patarlės", "Dainos"] },
      { id: "lk-rasymas-5-6", label: "Teksto kūrimas", subtopics: ["Pasakojimas", "Aprašymas", "Laiškas"] },
    ],
    "7-8": [
      { id: "lk-sintakse", label: "Sintaksė", subtopics: ["Sakinio dalys", "Sudėtiniai sakiniai", "Skyryba"] },
      { id: "lk-literatura-7-8", label: "Literatūra", subtopics: ["Žanrai", "Kūrinio analizė", "Autoriai"] },
      { id: "lk-rasymas-7-8", label: "Rašymas", subtopics: ["Samprotavimas", "Charakteristika", "Recenzija"] },
    ],
    "9-10": [
      { id: "lk-literatura-9-10", label: "Lietuvių literatūra", subtopics: ["Donelaitis", "Maironis", "Žemaitė", "XX a. rašytojai"] },
      { id: "lk-stilistika", label: "Stilistika", subtopics: ["Kalbos stiliai", "Meninės raiškos priemonės", "Tekstynas"] },
      { id: "lk-argumentavimas", label: "Argumentavimas", subtopics: ["Teiginys", "Argumentai", "Samprotavimas"] },
    ],
    "11-12": [
      { id: "lk-literatura-11-12", label: "Lietuvių ir pasaulio literatūra", subtopics: ["Klasikai", "Modernistai", "Šiuolaikiniai autoriai"] },
      { id: "lk-analize", label: "Teksto analizė", subtopics: ["Kontekstas", "Prasmė", "Interpretacija"] },
      { id: "lk-rasinys", label: "Samprotaujamasis rašinys", subtopics: ["Teiginio formulavimas", "Argumentavimas", "Išvados"] },
    ],
  },
  "pasaulio-pazinimas": {
    "1-4": [
      { id: "pp-gamta", label: "Gamta aplink mus", subtopics: ["Augalai", "Gyvūnai", "Orai", "Metų laikai"] },
      { id: "pp-zmogus", label: "Žmogus ir sveikata", subtopics: ["Kūno dalys", "Jausmai", "Mityba", "Saugumas"] },
      { id: "pp-visuomene", label: "Visuomenė ir aplinka", subtopics: ["Šeima", "Miestas", "Lietuva", "Pasaulis"] },
    ],
  },
  "gamta-ir-zmogus": {
    "5-6": [
      { id: "giz-gyvoji", label: "Gyvoji gamta", subtopics: ["Gyvų organizmų įvairovė", "Augalai", "Gyvūnai", "Grybai ir bakterijos"] },
      { id: "giz-zmogus", label: "Žmogaus kūnas", subtopics: ["Judėjimo sistema", "Mityba ir virškinimas", "Higiena"] },
      { id: "giz-ekosistemos", label: "Ekosistemos", subtopics: ["Mitybos grandinės", "Gamtos apsauga", "Aplinkos tarša"] },
      { id: "giz-negyvoji", label: "Negyvoji gamta", subtopics: ["Vanduo", "Oras", "Dirvožemis", "Saulės sistema"] },
    ],
  },
  fizika: {
    "7-8": [
      { id: "fiz-mechanika-7-8", label: "Mechanika", subtopics: ["Greitis", "Jėga", "Inercija", "Svertai"] },
      { id: "fiz-siluma-7-8", label: "Šiluminiai reiškiniai", subtopics: ["Temperatūra", "Šilumos perdavimas", "Garavimas"] },
      { id: "fiz-elektra-7-8", label: "Elektros reiškiniai", subtopics: ["Elektros krūvis", "Srovė", "Grandinė"] },
    ],
    "9-10": [
      { id: "fiz-optika", label: "Optika", subtopics: ["Šviesa", "Lęšiai", "Spektras", "Šviesos atspindys"] },
      { id: "fiz-magnetizmas", label: "Elektromagnetizmas", subtopics: ["Magnetai", "Elektromagnetinė indukcija", "Transformatoriai"] },
      { id: "fiz-bangos", label: "Bangos", subtopics: ["Mechaninės bangos", "Garsas", "Elektromagnetinės bangos"] },
    ],
    "11-12": [
      { id: "fiz-kvantine", label: "Kvantinė fizika", subtopics: ["Fotonai", "Atomo sandara", "Branduolinė fizika"] },
      { id: "fiz-reliatyvumo", label: "Reliatyvumo teorija", subtopics: ["Specialioji reliatyvumo teorija", "Erdvė ir laikas"] },
      { id: "fiz-termodinamika", label: "Termodinamika", subtopics: ["Dujų dėsniai", "Entropija", "Šiluminiai varikliai"] },
    ],
  },
  chemija: {
    "7-8": [
      { id: "chem-medziagos", label: "Medžiagos ir jų savybės", subtopics: ["Agregatinės būsenos", "Grynos medžiagos", "Mišiniai"] },
      { id: "chem-atomai", label: "Atomų sandara", subtopics: ["Elementai", "Periodinė lentelė", "Molekulės"] },
    ],
    "9-10": [
      { id: "chem-reakcijos", label: "Cheminės reakcijos", subtopics: ["Reakcijų tipai", "Lygtys", "Greitis"] },
      { id: "chem-tirpalai", label: "Tirpalai", subtopics: ["Rūgštys", "Bazės", "Druskos", "pH"] },
      { id: "chem-organine-9-10", label: "Organinė chemija", subtopics: ["Angliavandeniliai", "Alkoholiai", "Karboksirūgštys"] },
    ],
    "11-12": [
      { id: "chem-organine-11-12", label: "Organinė chemija", subtopics: ["Baltymai", "Angliavandeniai", "Riebalai", "Polimerai"] },
      { id: "chem-termochemija", label: "Termochemija", subtopics: ["Reakcijų šiluma", "Pusiausvyra", "Katalizatoriai"] },
      { id: "chem-elektrochemija", label: "Elektrochemija", subtopics: ["Galvaninis elementas", "Elektrolizė", "Korozija"] },
    ],
  },
  informatika: {
    "5-6": [
      { id: "inf-ik", label: "Informacinės technologijos", subtopics: ["Kompiuterio sandara", "Failai", "Internetas", "Saugumas"] },
      { id: "inf-scratch", label: "Programavimo pagrindai", subtopics: ["Scratch", "Algoritmai", "Ciklai", "Sąlygos"] },
    ],
    "7-8": [
      { id: "inf-algoritmai-7-8", label: "Algoritmai", subtopics: ["Sekos", "Ciklai", "Funkcijos", "Klaidos"] },
      { id: "inf-duomenys-7-8", label: "Duomenų apdorojimas", subtopics: ["Skaičiuoklė", "Formulės", "Grafikai"] },
    ],
    "9-10": [
      { id: "inf-python", label: "Python programavimas", subtopics: ["Sintaksė", "Sąrašai", "Funkcijos", "Objektai"] },
      { id: "inf-tinklai", label: "Kompiuterių tinklai", subtopics: ["IP adresai", "Protokolai", "Kibernetinis saugumas"] },
    ],
    "11-12": [
      { id: "inf-algoritmika", label: "Algoritmika", subtopics: ["Rūšiavimas", "Paieška", "Rekursija", "Sudėtingumas"] },
      { id: "inf-db", label: "Duomenų bazės", subtopics: ["SQL", "Reliacinis modelis", "Normalizavimas"] },
      { id: "inf-ai", label: "Dirbtinis intelektas", subtopics: ["Mašininis mokymasis", "Neuroniniai tinklai", "Etika"] },
    ],
  },
  biologija: {
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
