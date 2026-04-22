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
  daile: {
    "1-4": [
      { id: "dl-piesimas-1-4", label: "Piešimas", subtopics: ["Linija ir kontūras", "Formos", "Spalvos", "Natiurmortas"] },
      { id: "dl-spalvos-1-4", label: "Spalvų pažinimas", subtopics: ["Pagrindinės spalvos", "Šiltos ir šaltos", "Spalvų maišymas"] },
      { id: "dl-amatai-1-4", label: "Kūrybiniai darbai", subtopics: ["Aplikacija", "Lipdymas", "Kolažas", "Origami"] },
    ],
    "5-6": [
      { id: "dl-kompozicija-5-6", label: "Kompozicija", subtopics: ["Perspektyva", "Proporcijos", "Simetrija", "Dinamika"] },
      { id: "dl-grafika", label: "Grafika", subtopics: ["Estampas", "Piešinys anglimi", "Iliustracija"] },
      { id: "dl-menas-istorija-5-6", label: "Meno istorija", subtopics: ["Priešistorinis menas", "Senovės civilizacijų menas", "Lietuvių liaudies menas"] },
    ],
    "7-8": [
      { id: "dl-tapyba", label: "Tapyba", subtopics: ["Akvarelė", "Guašas", "Aliejiniai dažai", "Portretas"] },
      { id: "dl-skulptura", label: "Skulptūra", subtopics: ["Reljefas", "Apvalioji skulptūra", "Medžiagos"] },
      { id: "dl-renesansas", label: "Renesanso menas", subtopics: ["Leonardo da Vinci", "Mikelandželas", "Rafaelis"] },
    ],
    "9-10": [
      { id: "dl-stiliai", label: "Meno stiliai", subtopics: ["Impresionizmas", "Modernizmas", "Siurrealizmas", "Abstrakcionizmas"] },
      { id: "dl-dizainas", label: "Dizainas", subtopics: ["Grafinis dizainas", "Interjeras", "Produkto dizainas", "Tipografija"] },
      { id: "dl-lietuvos-menas", label: "Lietuvos menas", subtopics: ["Čiurlionis", "Šiuolaikiniai menininkai", "Vilniaus dailės akademija"] },
    ],
  },
  muzika: {
    "1-4": [
      { id: "mz-ritmas-1-4", label: "Ritmas ir garsas", subtopics: ["Ritmo suvokimas", "Garso aukštis", "Tempas", "Dinamika"] },
      { id: "mz-dainavimas-1-4", label: "Dainavimas", subtopics: ["Vaikų dainelės", "Lietuvių liaudies dainos", "Kanonas"] },
      { id: "mz-instrumentai-1-4", label: "Muzikos instrumentai", subtopics: ["Mušamieji", "Styginiai", "Pučiamieji", "Klavišiniai"] },
    ],
    "5-6": [
      { id: "mz-notos", label: "Natų rašto pagrindai", subtopics: ["Penklinė", "Natų vardai", "Pauzės", "Takto dalybos"] },
      { id: "mz-liaudies", label: "Lietuvių liaudies muzika", subtopics: ["Sutartinės", "Kalendorinės dainos", "Darbo dainos"] },
      { id: "mz-orkestras", label: "Orkestras ir ansamblis", subtopics: ["Simfoninis orkestras", "Choras", "Kamerinė muzika"] },
    ],
    "7-8": [
      { id: "mz-kompozitoriai", label: "Klasikos kompozitoriai", subtopics: ["Bachas", "Mocartas", "Bethovenas", "Chopenas"] },
      { id: "mz-zanrai", label: "Muzikos žanrai", subtopics: ["Klasikinė", "Džiazas", "Rokas", "Popmuzika", "Folkloras"] },
      { id: "mz-lietuvos-muzika", label: "Lietuvos muzikos istorija", subtopics: ["Čiurlionis", "Šiuolaikiniai kompozitoriai", "Operos ir baleto teatras"] },
    ],
    "9-10": [
      { id: "mz-epochos", label: "Muzikos epochos", subtopics: ["Barokas", "Klasicizmas", "Romantizmas", "XX a. muzika"] },
      { id: "mz-analize", label: "Muzikos analizė", subtopics: ["Forma", "Harmonija", "Melodija", "Tema ir variacijos"] },
      { id: "mz-technologijos", label: "Muzika ir technologijos", subtopics: ["Garso įrašymas", "Elektroninė muzika", "DAW programos"] },
    ],
  },
  technologijos: {
    "1-4": [
      { id: "th-medziagos-1-4", label: "Medžiagos ir jų savybės", subtopics: ["Popierius", "Audinys", "Mediena", "Plastikas"] },
      { id: "th-konstravimas-1-4", label: "Konstravimas", subtopics: ["Aplikavimas", "Lankstymas", "Klijavimas", "Siuvimas"] },
      { id: "th-saugumas-1-4", label: "Saugus darbas", subtopics: ["Įrankiai", "Asmeninė sauga", "Darbo tvarka"] },
    ],
    "5-6": [
      { id: "th-mityba-5-6", label: "Mityba ir kulinarija", subtopics: ["Maisto piramidė", "Paprasti patiekalai", "Higiena virtuvėje"] },
      { id: "th-tekstile", label: "Tekstilė", subtopics: ["Audinių rūšys", "Siuvimas", "Mezgimas", "Aplikacija"] },
      { id: "th-mediena-5-6", label: "Darbas su mediena", subtopics: ["Medienos rūšys", "Įrankiai", "Paprasti gaminiai"] },
    ],
    "7-8": [
      { id: "th-projektavimas", label: "Projektavimas ir konstravimas", subtopics: ["Brėžiniai", "Modeliavimas", "Prototipų kūrimas"] },
      { id: "th-mityba-7-8", label: "Mityba ir sveikata", subtopics: ["Sveika mityba", "Receptai", "Maisto ruošimo technika"] },
      { id: "th-dizainas", label: "Dizaino pagrindai", subtopics: ["Formos ir funkcija", "Medžiagų parinkimas", "Estetika"] },
    ],
    "9-10": [
      { id: "th-elektronika", label: "Elektronika ir robotika", subtopics: ["Grandinės", "Microcontrolleriai", "Arduino", "Sensoriai"] },
      { id: "th-3d", label: "3D modeliavimas ir spausdinimas", subtopics: ["CAD programos", "3D spausdintuvas", "Prototipavimas"] },
      { id: "th-tvarumas", label: "Tvarios technologijos", subtopics: ["Perdirbimas", "Atsinaujinantys resursai", "Žiedinė ekonomika"] },
    ],
  },
  "anglu-kalba": {
    "1-4": [
      { id: "ak-abc-1-4", label: "Abėcėlė ir garsai", subtopics: ["Abėcėlė", "Tarimas", "Skaičiai iki 20", "Spalvos"] },
      { id: "ak-seima-1-4", label: "Šeima ir aš", subtopics: ["Šeimos nariai", "Savęs pristatymas", "Kūno dalys"] },
      { id: "ak-kasdiena-1-4", label: "Kasdienybė", subtopics: ["Mokykla", "Žaislai", "Maistas", "Gyvūnai"] },
    ],
    "5-6": [
      { id: "ak-gramatika-5-6", label: "Pagrindinė gramatika", subtopics: ["Present Simple", "Present Continuous", "Klausimai", "Įvardžiai"] },
      { id: "ak-temos-5-6", label: "Kasdienės temos", subtopics: ["Hobiai", "Maistas", "Drabužiai", "Laisvalaikis"] },
      { id: "ak-skaitymas-5-6", label: "Skaitymas ir klausymas", subtopics: ["Trumpi tekstai", "Dialogai", "Pasakos"] },
    ],
    "7-8": [
      { id: "ak-laikai", label: "Laikai", subtopics: ["Past Simple", "Past Continuous", "Future", "Present Perfect"] },
      { id: "ak-kelione", label: "Kelionės ir kultūra", subtopics: ["Šalys", "JK ir JAV", "Tradicijos", "Maršrutai"] },
      { id: "ak-rasymas-7-8", label: "Rašymas", subtopics: ["El. laiškas", "Trumpas rašinys", "Aprašymas"] },
    ],
    "9-10": [
      { id: "ak-gramatika-9-10", label: "Pažengusi gramatika", subtopics: ["Modal verbs", "Conditionals", "Passive voice", "Reported speech"] },
      { id: "ak-aktualijos", label: "Aktualūs klausimai", subtopics: ["Aplinkosauga", "Technologijos", "Sveikata", "Socialiniai tinklai"] },
      { id: "ak-literatura-9-10", label: "Literatūra ir medijos", subtopics: ["Trumpi kūriniai", "Filmai", "Žurnalistika"] },
    ],
    "11-12": [
      { id: "ak-b2", label: "B2 lygis", subtopics: ["Akademinė kalba", "Argumentavimas", "Esė rašymas", "Debatai"] },
      { id: "ak-verslas", label: "Dalykinė anglų kalba", subtopics: ["Darbo pokalbis", "CV", "Dalykinis laiškas", "Prezentacijos"] },
      { id: "ak-kultura-11-12", label: "Kultūra ir literatūra", subtopics: ["Shakespeare", "Šiuolaikiniai autoriai", "Amerikietiška kultūra"] },
    ],
  },
  "antroji-uzsienio-kalba": {
    "5-6": [
      { id: "au-pagrindai-5-6", label: "Kalbos pagrindai", subtopics: ["Abėcėlė", "Tarimas", "Savęs pristatymas", "Skaičiai"] },
      { id: "au-seima-5-6", label: "Šeima ir namai", subtopics: ["Šeimos nariai", "Kambariai", "Daiktai"] },
      { id: "au-mokykla-5-6", label: "Mokykla", subtopics: ["Dalykai", "Mokymosi priemonės", "Tvarkaraštis"] },
    ],
    "7-8": [
      { id: "au-gramatika-7-8", label: "Gramatikos pagrindai", subtopics: ["Esamojo laiko veiksmažodžiai", "Daiktavardžių giminės", "Paprasti klausimai"] },
      { id: "au-maistas", label: "Maistas ir kasdienybė", subtopics: ["Maistas", "Parduotuvė", "Kavinė", "Receptai"] },
      { id: "au-kultura-7-8", label: "Šalies kultūra", subtopics: ["Geografija", "Šventės", "Tradicijos", "Žinomi žmonės"] },
    ],
    "9-10": [
      { id: "au-laikai-9-10", label: "Laikai", subtopics: ["Būtasis laikas", "Būsimasis laikas", "Teigimas ir neigimas"] },
      { id: "au-kelione-9-10", label: "Kelionės", subtopics: ["Maršrutai", "Viešbutis", "Transportas", "Lankytinos vietos"] },
      { id: "au-skaitymas-9-10", label: "Skaitymas ir rašymas", subtopics: ["Trumpi tekstai", "Dialogai", "El. laiškas"] },
    ],
    "11-12": [
      { id: "au-b1", label: "B1 lygis", subtopics: ["Argumentavimas", "Diskusija", "Ilgesni tekstai", "Rašinys"] },
      { id: "au-visuomene", label: "Visuomenė ir aktualijos", subtopics: ["Aplinkos apsauga", "Technologijos", "Studijos užsienyje"] },
      { id: "au-literatura-11-12", label: "Literatūra ir medijos", subtopics: ["Žinomi autoriai", "Filmai", "Žiniasklaida"] },
    ],
  },
  "fizinis-ugdymas": {
    "1-4": [
      { id: "fu-pagrindai-1-4", label: "Judėjimo pagrindai", subtopics: ["Bėgimas", "Šokinėjimas", "Metimas", "Gaudymas"] },
      { id: "fu-zaidimai-1-4", label: "Judrieji žaidimai", subtopics: ["Liaudies žaidimai", "Estafetės", "Komandiniai žaidimai"] },
      { id: "fu-gimnastika-1-4", label: "Gimnastika", subtopics: ["Pratimai", "Ritmika", "Lankstumas", "Pusiausvyra"] },
    ],
    "5-6": [
      { id: "fu-krepsinis-5-6", label: "Krepšinis", subtopics: ["Pagrindiniai veiksmai", "Varymas", "Metimas", "Taisyklės"] },
      { id: "fu-futbolas-5-6", label: "Futbolas", subtopics: ["Kamuolio kontrolė", "Pasavimas", "Smūgis", "Žaidimas"] },
      { id: "fu-lengvoji", label: "Lengvoji atletika", subtopics: ["Bėgimas", "Šokis į tolį", "Metimas", "Ištvermė"] },
    ],
    "7-8": [
      { id: "fu-tinklinis", label: "Tinklinis", subtopics: ["Mušimas", "Perdavimas", "Padavimas", "Taktika"] },
      { id: "fu-sveikata-7-8", label: "Sveikatingumas", subtopics: ["Fizinis pajėgumas", "Mityba ir sportas", "Traumų prevencija"] },
      { id: "fu-plaukimas", label: "Plaukimas", subtopics: ["Krauliai", "Nugara", "Krūtine", "Saugumas vandenyje"] },
    ],
    "9-10": [
      { id: "fu-komanda", label: "Komandiniai sportai", subtopics: ["Rankinis", "Beisbolas", "Taktika", "Lyderystė"] },
      { id: "fu-individualus", label: "Individualūs sportai", subtopics: ["Lengvoji atletika", "Gimnastika", "Stalo tenisas"] },
      { id: "fu-treniruote", label: "Treniruotės principai", subtopics: ["Apšilimas", "Jėgos pratimai", "Aerobika", "Atsipalaidavimas"] },
    ],
    "11-12": [
      { id: "fu-sveika-gyvensena", label: "Sveika gyvensena", subtopics: ["Sporto nauda", "Streso valdymas", "Mityba sportuojant"] },
      { id: "fu-organizavimas", label: "Sporto renginių organizavimas", subtopics: ["Varžybų planavimas", "Teisėjavimas", "Komandos vadovavimas"] },
      { id: "fu-specializacija", label: "Sporto šakų specializacija", subtopics: ["Pasirinkta sporto šaka", "Technika", "Strategija"] },
    ],
  },
  tikyba: {
    "1-4": [
      { id: "tk-sventes-1-4", label: "Religinės šventės", subtopics: ["Kalėdos", "Velykos", "Sekminės", "Tradicijos"] },
      { id: "tk-vertybes-1-4", label: "Vertybės ir santykiai", subtopics: ["Gerumas", "Draugystė", "Šeima", "Meilė artimui"] },
      { id: "tk-biblija-1-4", label: "Biblijos pasakojimai", subtopics: ["Kūrimo istorija", "Jėzaus gyvenimas", "Palyginimai"] },
    ],
    "5-6": [
      { id: "tk-senasis-testamentas", label: "Senasis Testamentas", subtopics: ["Patriarchai", "Moizės dešimt įsakymų", "Karaliai"] },
      { id: "tk-naujasis-testamentas", label: "Naujasis Testamentas", subtopics: ["Evangelijos", "Apaštalų darbai", "Laiškai"] },
      { id: "tk-krikscionybe", label: "Krikščionybės pradžia", subtopics: ["Pirmieji krikščionys", "Bažnyčios formavimasis", "Šventieji"] },
    ],
    "7-8": [
      { id: "tk-religijos", label: "Pasaulio religijos", subtopics: ["Krikščionybė", "Judaizmas", "Islamas", "Budizmas", "Induizmas"] },
      { id: "tk-etika-7-8", label: "Krikščioniška etika", subtopics: ["Sąžinė", "Atsakomybė", "Atleidimas", "Meilė"] },
      { id: "tk-lietuvos-baznycia", label: "Lietuvos Bažnyčios istorija", subtopics: ["Krikštas", "Šventieji Lietuvos globėjai", "Pogrindžio Bažnyčia"] },
    ],
    "9-10": [
      { id: "tk-teologija-9-10", label: "Teologijos pagrindai", subtopics: ["Dievas ir žmogus", "Sakramentai", "Malda", "Gailestingumas"] },
      { id: "tk-moralines", label: "Moralinės dilemos", subtopics: ["Gyvybės šventumas", "Teisingumas", "Taika ir karas"] },
      { id: "tk-ekumenizmas", label: "Ekumenizmas ir dialogas", subtopics: ["Krikščionių susivienijimas", "Tarpreliginis dialogas"] },
    ],
    "11-12": [
      { id: "tk-bioetika", label: "Bioetika", subtopics: ["Gyvybės pradžia", "Eutanazija", "Genų inžinerija", "Žmogaus orumas"] },
      { id: "tk-socialinis-mokymas", label: "Socialinis Bažnyčios mokymas", subtopics: ["Darbas ir teisingumas", "Solidarumas", "Bendrasis gėris"] },
      { id: "tk-tikejimo-paieska", label: "Tikėjimas ir abejonės", subtopics: ["Ateizmas", "Agnostikumas", "Tikėjimo kelias", "Dvasingumas"] },
    ],
  },
  etika: {
    "1-4": [
      { id: "et-as-kitas-1-4", label: "Aš ir kiti", subtopics: ["Savęs pažinimas", "Draugystė", "Empatija", "Pagarba"] },
      { id: "et-vertybes-1-4", label: "Pagrindinės vertybės", subtopics: ["Sąžiningumas", "Gerumas", "Atsakomybė", "Tolerancija"] },
      { id: "et-taisykles-1-4", label: "Taisyklės ir bendrumas", subtopics: ["Klasės taisyklės", "Bendravimas", "Konfliktų sprendimas"] },
    ],
    "5-6": [
      { id: "et-teisingumas", label: "Teisingumas ir sąžiningumas", subtopics: ["Kas yra teisinga?", "Pažadai", "Melas", "Atsakomybė"] },
      { id: "et-emocijos", label: "Emocijos ir savivertė", subtopics: ["Jausmų atpažinimas", "Pyktis", "Baimė", "Laimė"] },
      { id: "et-visuomene-5-6", label: "Gyvenimas visuomenėje", subtopics: ["Bendruomenė", "Pilietinės pareigos", "Gamtos apsauga"] },
    ],
    "7-8": [
      { id: "et-morale", label: "Moralės pagrindai", subtopics: ["Gėris ir blogis", "Moralinės dilemos", "Sąžinė"] },
      { id: "et-tapatumas", label: "Tapatumas ir skirtumai", subtopics: ["Savęs pažinimas", "Kultūrinis tapatumas", "Įvairovė"] },
      { id: "et-medijos", label: "Etika ir medijos", subtopics: ["Kritinis mąstymas", "Socialiniai tinklai", "Privatumas"] },
    ],
    "9-10": [
      { id: "et-filosofija-9-10", label: "Etinės teorijos", subtopics: ["Utilitarizmas", "Deontologija", "Dorybių etika"] },
      { id: "et-dilemos", label: "Šiuolaikinės etinės dilemos", subtopics: ["Aplinkosauga", "Gyvybės klausimai", "Technologijų etika"] },
      { id: "et-zmogaus-teises", label: "Žmogaus teisės", subtopics: ["Visuotinė deklaracija", "Diskriminacija", "Tolerancija"] },
    ],
    "11-12": [
      { id: "et-profesine", label: "Profesinė etika", subtopics: ["Darbo etika", "Korupcija", "Verslo etika", "Medikų etika"] },
      { id: "et-globalios", label: "Globaliniai klausimai", subtopics: ["Karai", "Migracija", "Klimato kaita", "Nelygybė"] },
      { id: "et-gyvenimo-prasme", label: "Gyvenimo prasmė", subtopics: ["Laimė", "Pareigos", "Savirealizacija", "Mirties samprata"] },
    ],
  },
  filosofija: {
    "11-12": [
      { id: "fl-pagrindai", label: "Filosofijos įvadas", subtopics: ["Kas yra filosofija?", "Filosofijos sritys", "Filosofavimo metodas"] },
      { id: "fl-senoves", label: "Senovės filosofija", subtopics: ["Sokratas", "Platonas", "Aristotelis", "Stoikai"] },
      { id: "fl-naujieji", label: "Naujųjų laikų filosofija", subtopics: ["Dekartas", "Kantas", "Hegelis", "Nietzsche"] },
      { id: "fl-xx-a", label: "XX a. filosofija", subtopics: ["Egzistencializmas", "Fenomenologija", "Analitinė filosofija"] },
      { id: "fl-etika", label: "Etinė filosofija", subtopics: ["Utilitarizmas", "Deontologija", "Moralinės dilemos"] },
      { id: "fl-pazinimas", label: "Pažinimo teorija", subtopics: ["Racionalumas", "Empirizmas", "Tiesos samprata", "Abejonė"] },
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
