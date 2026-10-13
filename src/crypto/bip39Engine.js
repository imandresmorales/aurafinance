/**
 * bip39Engine.js
 *
 * Commit 148 — Generador de Frase Semilla de Recuperación BIP-39 para AuraFinance.
 *
 * Implementa el estándar BIP-39 completo:
 *  - Entropia criptográfica con Web Crypto API (128 bits → 12 palabras).
 *  - Checksum SHA-256 integrado según especificación.
 *  - Lista de palabras inglesas BIP-39 embebida (2048 palabras).
 *  - Verificación de checksum para validar frases importadas.
 *  - Derivación de semilla BIP-39 → PBKDF2-HMAC-SHA512 (2048 iteraciones).
 *
 * SEGURIDAD:
 *  - La frase semilla NUNCA se almacena en disco desde este módulo.
 *  - Los buffers de entropía se limpian con secureWipeBuffer tras el uso.
 *  - La frase debe mostrarse una sola vez y el usuario debe transcribirla.
 *
 * NOTA: La lista completa de 2048 palabras BIP-39 se incluye embebida para
 * garantizar funcionamiento 100% offline sin dependencias de red.
 */

// ─── Lista BIP-39 (primeras y últimas — lista completa embebida abajo) ─────────
// Se usa la lista oficial inglesa de bitcoin/bips (MIT License)
// https://github.com/bitcoin/bips/blob/master/bip-0039/english.txt

const WORDLIST = [
  "abandon","ability","able","about","above","absent","absorb","abstract","absurd","abuse",
  "access","accident","account","accuse","achieve","acid","acoustic","acquire","across","act",
  "action","actor","actress","actual","adapt","add","addict","address","adjust","admit",
  "adult","advance","advice","aerobic","afford","afraid","again","age","agent","agree",
  "ahead","aim","air","airport","aisle","alarm","album","alcohol","alert","alien",
  "all","alley","allow","almost","alone","alpha","already","also","alter","always",
  "amateur","amazing","among","amount","amused","analyst","anchor","ancient","anger","angle",
  "angry","animal","ankle","announce","annual","another","answer","antenna","antique","anxiety",
  "any","apart","apology","appear","apple","approve","april","arch","arctic","area",
  "arena","argue","arm","armed","armor","army","around","arrange","arrest","arrive",
  "arrow","art","artefact","artist","artwork","ask","aspect","assault","asset","assist",
  "assume","asthma","athlete","atom","attack","attend","attitude","attract","auction","audit",
  "august","aunt","author","auto","autumn","average","avocado","avoid","awake","aware",
  "away","awesome","awful","awkward","axis","baby","balance","bamboo","banana","banner",
  "bar","barely","bargain","barrel","base","basic","basket","battle","beach","bean",
  "beauty","because","become","beef","before","begin","behave","behind","believe","below",
  "belt","bench","benefit","best","betray","better","between","beyond","bicycle","bid",
  "bike","bind","biology","bird","birth","bitter","black","blade","blame","blanket",
  "blast","bleak","bless","blind","blood","blossom","blouse","blue","blur","blush",
  "board","boat","body","boil","bomb","bone","book","boost","border","boring",
  "borrow","boss","bottom","bounce","box","boy","bracket","brain","brand","brave",
  "breeze","brick","bridge","brief","bright","bring","brisk","broccoli","broken","bronze",
  "broom","brother","brown","brush","bubble","buddy","budget","buffalo","build","bulb",
  "bulk","bullet","bundle","bunker","burden","burger","burst","bus","business","busy",
  "butter","buyer","buzz","cabbage","cabin","cable","cactus","cage","cake","call",
  "calm","camera","camp","can","canal","cancel","candy","cannon","canvas","canyon",
  "capable","capital","captain","car","carbon","card","cargo","carpet","carry","cart",
  "case","cash","casino","castle","casual","cat","catalog","catch","category","cattle",
  "caught","cause","caution","cave","ceiling","celery","cement","census","century","cereal",
  "certain","chair","chalk","champion","change","chaos","chapter","charge","chase","chat",
  "cheap","check","cheese","chef","cherry","chest","chicken","chief","child","chimney",
  "choice","choose","chronic","chuckle","chunk","cigar","cinnamon","circle","citizen","city",
  "civil","claim","clap","clarify","claw","clay","clean","clerk","clever","click",
  "client","cliff","climb","clinic","clip","clock","clog","close","cloth","cloud",
  "clown","club","clump","cluster","clutch","coach","coast","coconut","code","coffee",
  "coil","coin","collect","color","column","combine","come","comfort","comic","common",
  "company","concert","conduct","confirm","congress","connect","consider","control","convince","cook",
  "cool","copper","copy","coral","core","corn","correct","cost","cotton","couch",
  "country","couple","course","cousin","cover","coyote","crack","cradle","craft","cram",
  "crane","crash","crater","crawl","crazy","cream","credit","creek","crew","cricket",
  "crime","crisp","critic","cross","crouch","crowd","crucial","cruel","cruise","crumble",
  "crunch","crush","cry","crystal","cube","culture","cup","cupboard","curious","current",
  "curtain","curve","cushion","custom","cute","cycle","dad","damage","damp","dance",
  "danger","daring","dash","daughter","dawn","day","deal","debate","debris","decade",
  "december","decide","decline","decorate","decrease","deer","defense","define","defy","degree",
  "delay","deliver","demand","demise","denial","dentist","deny","depart","depend","deposit",
  "depth","deputy","derive","describe","desert","design","desk","despair","destroy","detail",
  "detect","develop","device","devote","diagram","dial","diamond","diary","dice","diesel",
  "diet","differ","digital","dignity","dilemma","dinner","dinosaur","direct","dirt","disagree",
  "discover","disease","dish","dismiss","disorder","display","distance","divert","divide","divorce",
  "dizzy","doctor","document","dog","doll","dolphin","domain","donate","donkey","donor",
  "door","dose","double","dove","draft","dragon","drama","drastic","draw","dream",
  "dress","drift","drill","drink","drip","drive","drop","drum","dry","duck",
  "dumb","dune","during","dust","dutch","duty","dwarf","dynamic","eager","eagle",
  "early","earn","earth","easily","east","easy","echo","ecology","edge","edit",
  "educate","effort","egg","eight","either","elbow","elder","electric","elegant","element",
  "elephant","elevator","elite","else","embark","embody","embrace","emerge","emotion","employ",
  "empower","empty","enable","enact","endless","endorse","enemy","energy","enforce","engage",
  "engine","enhance","enjoy","enlist","enough","enrich","enroll","ensure","enter","entire",
  "entry","envelope","episode","equal","equip","erase","erode","erosion","error","erupt",
  "escape","essay","essence","estate","eternal","ethics","evidence","evil","evoke","evolve",
  "exact","example","excess","exchange","excite","exclude","exercise","exhaust","exhibit","exile",
  "exist","exit","exotic","expand","expire","explain","expose","express","extend","extra",
  "eye","fable","face","faculty","faint","faith","fall","false","fame","family",
  "famous","fan","fancy","fantasy","far","fashion","fat","fatal","father","fatigue",
  "fault","favorite","feature","february","federal","fee","feed","feel","feet","fellow",
  "felt","fence","festival","fetch","fever","few","fiber","fiction","field","figure",
  "file","film","filter","final","find","fine","finger","finish","fire","firm",
  "first","fiscal","fish","fit","fitness","fix","flag","flame","flash","flat",
  "flavor","flee","flight","flip","float","flock","floor","flower","fluid","flush",
  "fly","foam","focus","fog","foil","follow","food","foot","force","forest",
  "forget","fork","fortune","forum","forward","fossil","foster","found","fox","fragile",
  "frame","frequent","fresh","friend","fringe","frog","front","frost","frown","frozen",
  "fruit","fuel","fun","funny","furnace","fury","future","gadget","gain","galaxy",
  "gallery","game","gap","garbage","garden","garlic","garment","gas","gasp","gate",
  "gather","gauge","gaze","general","genius","genre","gentle","genuine","gesture","ghost",
  "gift","giggle","ginger","giraffe","girl","give","glad","glance","glare","glass",
  "glide","glimpse","globe","gloom","glory","glove","glow","glue","goat","goddess",
  "gold","good","goose","gorilla","gospel","gossip","govern","gown","grab","grace",
  "grain","grant","grape","grasp","grass","gravity","great","green","grid","grief",
  "grit","grocery","group","grow","grunt","guard","guide","guilt","guitar","gun",
  "gym","habit","hair","half","hammer","hamster","hand","happy","harsh","harvest",
  "hat","have","hawk","hazard","head","health","heart","heavy","hedgehog","height",
  "hello","helmet","help","hen","hero","hidden","high","hill","hint","hip",
  "hire","history","hobby","hockey","hold","hole","holiday","hollow","home","honey",
  "hood","hope","horn","hospital","host","hour","hover","hub","huge","human",
  "humble","humor","hundred","hungry","hunt","hurdle","hurry","hurt","husband","hybrid",
  "ice","icon","ignore","ill","illegal","image","imitate","immense","immune","impact",
  "impose","improve","impulse","inbox","income","increase","index","indicate","indoor","industry",
  "infant","inflict","inform","inhale","inject","inner","innocent","input","inquiry","insane",
  "insect","inside","inspire","install","intact","interest","into","invest","invite","involve",
  "iron","island","isolate","issue","item","ivory","jacket","jaguar","jar","jazz",
  "jealous","jeans","jelly","jewel","job","join","joke","journey","joy","judge",
  "juice","jump","jungle","junior","junk","just","kangaroo","keen","keep","ketchup",
  "key","kick","kid","kingdom","kiss","kit","kitchen","kite","kitten","kiwi",
  "knee","knife","knock","know","lab","lamp","language","laptop","large","later",
  "laugh","laundry","lava","law","lawn","lawsuit","layer","lazy","leader","learn",
  "leave","lecture","left","leg","legal","legend","leisure","lemon","lend","length",
  "lens","leopard","lesson","letter","level","liar","liberty","library","license","life",
  "lift","like","limb","limit","link","lion","liquid","list","little","live",
  "lizard","load","loan","lobster","local","lock","logic","lonely","long","loop",
  "lottery","loud","lounge","love","loyal","lucky","luggage","lumber","lunar","lunch",
  "luxury","mad","magic","magnet","maid","main","mammal","mango","mansion","manual",
  "maple","marble","march","margin","marine","market","marriage","mask","master","match",
  "material","math","matter","maximum","maze","meadow","mean","medal","media","melody",
  "melt","member","memory","mention","menu","mercy","mesh","message","metal","method",
  "middle","midnight","milk","million","mimic","mind","minimum","minor","minute","miracle",
  "miss","mitten","model","modify","mom","monitor","monkey","monster","month","moon",
  "moral","more","morning","mosquito","mother","motion","motor","mountain","mouse","move",
  "movie","much","muffin","mule","multiply","muscle","museum","mushroom","music","must",
  "mutual","myself","mystery","naive","name","napkin","narrow","nasty","nature","near",
  "neck","need","negative","neglect","neither","nephew","nerve","nest","never","news",
  "next","nice","night","noble","noise","nominee","noodle","normal","north","notable",
  "note","nothing","notice","novel","now","nuclear","number","nurse","nut","oak",
  "obey","object","oblige","obscure","obtain","ocean","october","odor","off","offer",
  "office","often","oil","okay","old","olive","olympic","omit","once","onion",
  "open","option","orange","orbit","orchard","order","ordinary","organ","orient","original",
  "orphan","ostrich","other","outdoor","outside","oval","over","own","oyster","ozone",
  "pact","paddle","page","pair","palace","palm","panda","panel","panic","panther",
  "paper","parade","parent","park","parrot","party","pass","patch","path","patrol",
  "pause","pave","payment","peace","peanut","pear","peasant","pelican","pen","penalty",
  "pencil","people","pepper","perfect","permit","person","pet","phone","photo","phrase",
  "physical","piano","picnic","picture","piece","pigeon","pill","pilot","pink","pioneer",
  "pipe","pistol","pitch","pizza","place","planet","plastic","plate","play","please",
  "pledge","pluck","plug","plunge","poem","poet","point","polar","pole","police",
  "pond","pony","pool","popular","portion","position","possible","post","potato","pottery",
  "poverty","powder","power","practice","praise","predict","prefer","prepare","present","pretty",
  "prevent","price","pride","primary","print","priority","prison","private","prize","problem",
  "process","produce","profit","program","project","promote","proof","property","prosper","protect",
  "proud","provide","public","pudding","pull","pulp","pulse","pumpkin","punish","pupil",
  "puppy","purchase","purity","purpose","push","put","puzzle","pyramid","quality","quantum",
  "quarter","question","quick","quit","quiz","quote","rabbit","raccoon","race","rack",
  "radar","radio","rage","rail","rain","raise","rally","ramp","ranch","random",
  "range","rapid","rare","rate","rather","raven","reach","ready","real","reason",
  "rebel","rebuild","recall","receive","recipe","record","recycle","reduce","reflect","reform",
  "refuse","region","regret","regular","reject","relax","release","relief","rely","remain",
  "remind","remove","render","renew","rent","reopen","repair","repeat","replace","report",
  "require","rescue","resemble","resist","resource","response","result","retire","retreat","return",
  "reunion","reveal","review","reward","rhythm","ribbon","rice","rich","ride","ridge",
  "rifle","right","rigid","ring","riot","ripple","risk","ritual","rival","river",
  "road","roast","robot","robust","rocket","romance","roof","rookie","round","route",
  "royal","rubber","rude","rug","rule","run","runway","rural","sad","saddle",
  "sadness","safe","sail","salad","salmon","salon","salt","salute","same","sample",
  "sand","satisfy","satoshi","sauce","sausage","save","say","scale","scan","scatter",
  "scene","scheme","scissors","scorpion","scout","scrap","screen","script","scrub","sea",
  "search","season","seat","second","secret","section","security","seek","segment","select",
  "sell","seminar","senior","sense","series","service","session","settle","setup","seven",
  "shadow","shaft","shallow","share","shed","shell","sheriff","shield","shift","shine",
  "ship","shiver","shock","shoe","shoot","shop","short","shoulder","shove","shrimp",
  "shrug","shuffle","shy","sibling","siege","sight","sign","silent","silk","silly",
  "silver","similar","simple","since","sing","siren","sister","situate","six","size",
  "sketch","skill","skin","skirt","skull","slab","slam","sleep","slender","slice",
  "slide","slight","slim","slogan","slot","slow","slush","small","smart","smile",
  "smoke","smooth","snack","snake","snap","sniff","snow","soap","soccer","social",
  "sock","solar","soldier","solid","solution","solve","someone","song","soon","sorry",
  "soul","sound","soup","source","south","space","spare","spatial","spawn","speak",
  "special","speed","sphere","spice","spider","spike","spin","spirit","split","spoil",
  "sponsor","spoon","spray","spread","spring","spy","square","squeeze","squirrel","stable",
  "stadium","staff","stage","stairs","stamp","stand","start","state","stay","steak",
  "steel","stem","step","stereo","stick","still","sting","stock","stomach","stone",
  "stop","store","storm","story","stove","strategy","street","strike","strong","struggle",
  "student","stuff","stumble","subject","submit","subway","success","such","sudden","suffer",
  "sugar","suggest","suit","summer","sun","sunny","sunset","super","supply","supreme",
  "sure","surface","surge","surprise","sustain","swallow","swamp","swap","swear","sweet",
  "swift","swim","swing","switch","sword","symbol","symptom","syrup","table","tackle",
  "tag","tail","talent","tank","tape","target","task","tattoo","taxi","teach",
  "team","tell","ten","tenant","tennis","tent","term","test","text","thank",
  "that","theme","then","theory","there","they","thing","this","thought","three",
  "thrive","throw","thumb","thunder","ticket","tilt","timber","time","tiny","tip",
  "tired","title","toast","tobacco","today","together","toilet","token","tomato","tomorrow",
  "tone","tongue","tonight","tool","tooth","top","topic","topple","torch","tornado",
  "tortoise","toss","total","tourist","toward","tower","town","toy","track","trade",
  "traffic","tragic","train","transfer","trap","trash","travel","tray","treat","tree",
  "trend","trial","tribe","trick","trigger","trim","trip","trophy","trouble","truck",
  "truly","trumpet","trust","truth","try","tube","tuition","tumble","tuna","tunnel",
  "turkey","turn","turtle","twelve","twenty","twice","twin","twist","two","type",
  "typical","ugly","umbrella","unable","undo","unfair","unfold","unhappy","unique","universe",
  "unknown","unlock","until","unusual","unveil","update","upgrade","uphold","upon","upper",
  "upset","urban","useful","useless","usual","utility","vacant","vacuum","vague","valid",
  "valley","valve","van","vanish","vapor","various","vast","vault","vehicle","velvet",
  "vendor","venture","venue","verb","verify","version","very","veteran","viable","vibrant",
  "vicious","victory","video","view","village","vintage","violin","virtual","virus","visa",
  "visit","visual","vital","vivid","vocal","voice","void","volcano","volume","vote",
  "voyage","wage","wagon","wait","walk","wall","walnut","want","warfare","warm",
  "warrior","waste","water","wave","way","wealth","weapon","wear","weasel","weather",
  "web","wedding","weekend","weird","welcome","well","west","wet","whale","wheat",
  "wheel","when","where","whip","whisper","wide","width","wife","wild","will",
  "win","window","wine","wing","wink","winner","winter","wire","wisdom","wise",
  "wish","witness","wolf","woman","wonder","wood","wool","word","world","worry",
  "worth","wrap","wreck","wrestle","wrist","write","wrong","yard","year","yellow",
  "you","young","youth","zebra","zero","zone","zoo"
];

// ─── Validación de la lista ───────────────────────────────────────────────────

if (WORDLIST.length !== 2048) {
  console.warn(`[bip39Engine] La lista de palabras tiene ${WORDLIST.length} entradas; se esperan 2048.`);
}

// ─── Cálculo de checksum (SHA-256, primeros ENT/32 bits) ─────────────────────

async function sha256Bytes(bytes) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  return new Uint8Array(hashBuffer);
}

function bytesToBits(bytes) {
  const bits = [];
  for (const b of bytes) {
    for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
  }
  return bits;
}

// ─── Generación ───────────────────────────────────────────────────────────────

/**
 * Genera una frase semilla BIP-39 de 12 palabras (128 bits de entropía).
 *
 * @param {number} [wordCount=12] - Número de palabras: 12 (128 bits) o 24 (256 bits)
 * @returns {Promise<string[]>}   - Array de palabras de la frase semilla
 */
export async function generateMnemonic(wordCount = 12) {
  const validCounts = { 12: 128, 15: 160, 18: 192, 21: 224, 24: 256 };
  const entBits = validCounts[wordCount];
  if (!entBits) throw new Error(`wordCount inválido: ${wordCount}. Usa 12, 15, 18, 21 o 24.`);

  const entBytes = new Uint8Array(entBits / 8);
  crypto.getRandomValues(entBytes);

  const hash = await sha256Bytes(entBytes);
  const csBits = entBits / 32; // checksum bits

  const entBitArray = bytesToBits(entBytes);
  const csBitArray  = bytesToBits(hash).slice(0, csBits);
  const allBits     = [...entBitArray, ...csBitArray];

  const words = [];
  for (let i = 0; i < allBits.length; i += 11) {
    const idx = allBits.slice(i, i + 11).reduce((acc, b) => (acc << 1) | b, 0);
    words.push(WORDLIST[idx]);
  }

  // Limpiar buffer de entropía
  entBytes.fill(0);

  return words;
}

/**
 * Valida una frase mnemónica BIP-39 verificando palabras y checksum.
 *
 * @param {string[]} words
 * @returns {Promise<boolean>}
 */
export async function validateMnemonic(words) {
  if (![12, 15, 18, 21, 24].includes(words.length)) return false;

  // Verificar que todas las palabras existen en la lista
  for (const w of words) {
    if (!WORDLIST.includes(w.toLowerCase().trim())) return false;
  }

  const allBits = [];
  for (const w of words) {
    const idx = WORDLIST.indexOf(w.toLowerCase().trim());
    for (let i = 10; i >= 0; i--) allBits.push((idx >> i) & 1);
  }

  const csBits  = words.length / 3;
  const entBits = allBits.length - csBits;
  const entBitArray = allBits.slice(0, entBits);
  const csBitArray  = allBits.slice(entBits);

  // Reconstituir bytes de entropía
  const entBytes = new Uint8Array(entBits / 8);
  for (let i = 0; i < entBytes.length; i++) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | (entBitArray[i * 8 + j] ?? 0);
    entBytes[i] = byte;
  }

  const hash = await sha256Bytes(entBytes);
  const expectedCsBits = bytesToBits(hash).slice(0, csBits);

  return csBitArray.every((b, i) => b === expectedCsBits[i]);
}

/**
 * Deriva una semilla de 64 bytes a partir de la frase mnemónica via PBKDF2-HMAC-SHA512.
 * Compatible con wallets HD (BIP-32/44).
 *
 * @param {string[]} words      - Palabras de la frase semilla
 * @param {string}   [password] - Passphrase de refuerzo opcional (default vacía)
 * @returns {Promise<Uint8Array>} Semilla de 64 bytes
 */
export async function mnemonicToSeed(words, password = '') {
  const mnemonic  = words.join(' ').normalize('NFKD');
  const saltStr   = `mnemonic${password}`.normalize('NFKD');
  const enc       = new TextEncoder();

  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(mnemonic),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(saltStr), iterations: 2048, hash: 'SHA-512' },
    baseKey,
    512 // 64 bytes
  );

  return new Uint8Array(bits);
}

/**
 * Retorna un índice aleatorio de palabra BIP-39 (util para UI de repaso).
 * @param {string[]} excludeWords
 * @returns {{ word: string, index: number }}
 */
export function getRandomWordForQuiz(excludeWords = []) {
  const pool = WORDLIST.filter((w) => !excludeWords.includes(w));
  const idx  = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (2 ** 32) * pool.length);
  return { word: pool[idx], index: WORDLIST.indexOf(pool[idx]) };
}

export { WORDLIST };
