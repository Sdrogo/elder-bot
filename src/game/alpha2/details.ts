// Longer explanations shown when a player expands a Lifepath, Merit, Discipline or power in the
// panel. They are our own Italian summaries of the Alpha 2.0 Player Packet: the mechanics, in
// our words, never the packet's text (Paradox IP). Paragraphs are separated by blank lines.

/** Discipline powers, by power id. The first line sums up cost, opposition, range and duration. */
export const POWER_DETAILS: Record<string, string> = {
  // Animalism
  'aspect-of-the-beast': `Costo 1 Vitae · nessun contrasto · su di te · una scena.

Prendi una caratteristica di un animale: il fiuto del lupo, gli occhi del gufo, l’udito del pipistrello, le zampe della rana, la coda del gatto. Finché dura aggiungi i tuoi pallini nella Disciplina a tutti i test fuori dal conflitto in cui quella caratteristica aiuta.

Maturing: a 3 pallini due caratteristiche insieme, a 5 tre.`,
  'bestial-instinct': `Costo 1 Vitae · nessun contrasto · su di te · una scena.

Senti la presenza di vampiri e altre creature soprannaturali entro distanza Short, anche senza cercarle, ma non dove si trovano esattamente. Aggiungi i pallini nella Disciplina ai test di Awareness o Investigation che riguardano qualcosa di soprannaturale. Non rivela chi è nascosto con poteri come Obfuscate; a discrezione del Narratore un test riuscito ti fa localizzare la creatura.

Maturing: a 3 pallini scegli un tipo di creatura che conosci (per esempio i ghoul) e ne localizzi gli esemplari in portata senza test.`,
  'sweet-whispers': `Costo 1 Vitae · contrasto Composure + Resolve (solo in certi casi) · Short · una notte o fino al compimento.

Dai un ordine semplice, di una frase, a un animale che vedi. Il test serve solo se l’animale è legato a un’altra creatura soprannaturale (ghoul, famiglio) o se il compito è troppo strano o pericoloso; un animale agitato o ostile può avere +1 o +2 dadi. L’animale esegue alla lettera e non si fa del male.

Maturing: a 2 pallini comandi altri 2 animali della stessa famiglia per ogni pallino; a 5 un intero branco o gruppo misto, e puoi ordinare anche compiti pericolosi per loro.`,
  'animal-messenger': `Costo 1 Vitae · contrasto Composure + Resolve se l’animale non vuole · Close (tocco) · una notte.

Affidi a un animale un messaggio di al massimo un minuto. Devi sapere dove si trova il destinatario o avere un oggetto legato a lui. L’animale lo cerca e ripete il messaggio con la tua voce; se non lo trova in tempo il messaggio va perso.

Maturing: a 4 pallini dura una settimana e il messaggio arriva a 5 minuti; a 6 un mese e 10 minuti.`,
  'call-of-the-wild': `Costo 1 Vitae · contrasto Composure + Resolve dell’animale più vicino · Medium · una scena.

Imiti il verso di una famiglia di animali (canidi, corvidi, felini, roditori…) e li richiami. Arrivano amichevoli ma restano solo nei paraggi: per farli agire servono altri poteri o tratti. Con una vittoria arriva un animale; con margine 1 un quarto di quelli in portata, 2 la metà, 3 la maggior parte, 4 tutti.

Maturing: a 3 pallini due famiglie insieme, a 4 quattro, a 5 tutti gli animali in portata.`,
  'feral-claws': `Costo 1 Vitae · azione minore · su di te · una scena.

Unghie che diventano artigli, bocca che diventa fauci. I tuoi attacchi a mani nude con questa arma infliggono danni pari ai tuoi pallini in Strength.

Maturing: a 6 pallini, spendendo 2 Vitae in più, i danni diventano baneful.`,
  'beast-shape': `Costo 2 Vitae · azione minore · su di te · una scena.

Ti trasformi in un animale che conosci, grande al massimo come te e non più piccolo di un topo. Tieni le tue statistiche, aggiungi i pallini nella Disciplina ai test in cui quell’animale è avvantaggiato e ne ottieni le capacità (volare, respirare sott’acqua). In forma animale non parli, se non con animali della stessa famiglia, e non usi poteri Social o Mental se non su di loro. Conosci tante forme quanti sono i pallini; per impararne una nuova ne bevi il sangue e ne dimentichi un’altra durante il giorno. Niente forme umane né copie di un animale preciso.

Maturing: a 4 pallini animali fino al doppio della tua taglia, a 6 fino al triplo, a 8 qualunque animale di cui hai assaggiato il sangue.`,
  'plague-of-beasts': `Costo 2 Vitae · contrasto Stamina + Composure · Medium · una scena.

Marchi un bersaglio e gli animali vicini lo tormentano. Margine 0: un animale, −1 dado a tutti i test. Margine 1: un quarto degli animali, −2. Margine 2: la metà, e all’inizio di ogni suo turno subisce danni pari a metà dei tuoi pallini. Margine 3: la maggior parte, danni pari ai pallini. Margine 4: tutti, −3. Finisce se gli animali non lo raggiungono, se ne vanno o muoiono.

Maturing: a 5 pallini colpisci fino a metà dei tuoi pallini in bersagli, e a livelli più alti tutti i bersagli in portata; i danni li assegni tu.`,
  // Auspex
  analyze: `Costo 1 Vitae · nessun contrasto · tocco · una scena o finché lo tocchi.

Tocchi un oggetto e sai cosa contiene come se l’avessi aperto o esaminato: il legno e la vernice di un tavolo, i contatti, le app e gli appuntamenti di un telefono, il contenuto di una scatola chiusa. Supera serrature e codici, ma non apre fisicamente niente. Se smetti di toccarlo perdi le informazioni.

Maturing: a 3 pallini dettagli più profondi (produttore, età, guasti) e tutti i dati non cifrati di un dispositivo; a 5 ciò che è nascosto (scomparti segreti, cifrari, password, file protetti); a 7 anche ciò che è protetto da poteri soprannaturali di livello inferiore ai tuoi pallini.`,
  'heightened-senses': `Costo 1 Vitae · azione minore o reazione · su di te · una scena.

Raddoppi la portata di vista, udito e olfatto e aggiungi i pallini nella Disciplina ai test di Awareness e Investigation. Come reazione lo attivi mentre fai uno di quei test. Rumori, luci o odori molto forti richiedono un test di Dexterity + Wits, altrimenti −2 dadi ai test basati sui sensi fino a fine scena.

Maturing: a 3 pallini, entro distanza Short, vedi nella penombra, senti i battiti del cuore, il calore dei corpi, l’alcol nel fiato, il sangue nell’aria; la penalità per uno shock sensoriale vicino sale a −3.`,
  'sense-the-unseen': `Costo 1 Vitae · azione minore o reazione · su di te · una scena.

Percepisci creature e poteri soprannaturali entro distanza Short. Per scovare una creatura nascosta da un potere vinci un Power test contro chi l’ha creato; per un oggetto nascosto o le tracce di un potere, contro una Difficoltà pari al livello del potere. Se trovi un vampiro capisci anche se ha commesso diablerie. Non svela cosa sia il potere se non l’hai mai visto, e non serve contro chi si nasconde con mezzi normali.`,
  premonition: `Costo 1 Vitae · azione minore o reazione · su di te · una scena.

Lampi di intuizione. Fuori dal conflitto ti mostrano, in modo spesso criptico, un indizio sfuggito o un pericolo vicino. In conflitto ti avvertono di un nemico o di un rischio entro distanza Short: aggiungi metà dei pallini nella Disciplina per difenderti da quel bersaglio o evitare quel pericolo. Come reazione lo attivi quando vieni attaccato, e l’attaccante diventa il bersaglio.`,
  psychometry: `Costo 1 Vitae · Difficoltà decisa dal Narratore · tocco · un turno.

Tocchi un oggetto legato a un momento emotivamente intenso e leggi l’impronta che ha lasciato. La Difficoltà dipende da quanto tempo è passato e da quanto è stato forte l’evento: l’arma di un omicidio di pochi giorni fa è 2, una lettera di tre secoli fa è 5 o più. Con una vittoria ottieni la risposta a una domanda sull’oggetto, più una per ogni punto di margine.`,
  telepathy: `Costo 1 Vitae · azione minore · contrasto Wits + Resolve se non è consenziente · Short · una scena.

Mandi pensieri semplici, emozioni e sensazioni a chi vedi, senza test. Leggi i pensieri superficiali di chi è d’accordo senza test; su chi non vuole serve un Power test, e se è un vampiro o un’altra creatura soprannaturale spendi anche 1 Willpower. Leggi un pensiero più uno per punto di margine.

Maturing: a 4 pallini pensieri più profondi e conversazione telepatica a due fino a distanza Long; a 6 una rete telepatica con metà dei tuoi pallini in partecipanti consenzienti.`,
  clairvoyance: `Costo 2 Vitae · nessun contrasto · Medium · una scena.

Proietti vista e udito in un punto entro distanza Medium che puoi vedere (anche tramite una telecamera o uno specchio) o in cui sei già stato.

Maturing: a 5 pallini fino a distanza Long; a 7 fino a Far Away, anche in luoghi che non vedi e dove non sei mai stato.`,
  'share-senses': `Costo 2 Vitae · contrasto Wits + Resolve se non è consenziente · Short · una scena.

Ti colleghi a uno, alcuni o tutti i sensi di una creatura che vedi, continuando a percepire i tuoi. Una volta agganciata può allontanarsi senza interrompere l’effetto. Se ha il tuo sangue in corpo funziona a qualunque distanza e senza test. Il bersaglio non se ne accorge. Se usi tutti i suoi sensi hai −1 dado a tutti i test.

Maturing: a 6 pallini dura una notte; a 8 finché non lo interrompi, e puoi tenerlo attivo su metà dei tuoi pallini in bersagli.`,
  // Celerity
  'cats-grace': `Costo 1 Vitae · azione minore · su di te · una scena.

Cammini e corri su cornicioni, cavi e appoggi stretti vincendo automaticamente i test di Dexterity per l’equilibrio, purché reggano il tuo peso.

Maturing: a 2 pallini corri su muri e pali, a 3 sui soffitti, a 5 sull’acqua. Devi iniziare e finire il turno in piedi su una superficie solida, altrimenti cadi o affondi.`,
  'kinetic-disruption': `Costo 1 Vitae · Power test contro Difficoltà 0 · tocco · istantaneo.

Fai vibrare le mani a velocità incredibile e scarichi l’energia su un oggetto che tocchi, che si crepa e si deforma: chi lo usa ha −2 dadi finché non viene riparato. I successi dicono cosa puoi danneggiare: 1 plastica, legno, vetro; 2 ferro, cemento, granito; 3 ferro rinforzato, acciaio, vetro antiproiettile; 4 acciaio temprato; 5 titanio e diamante.

Maturing: a 2 pallini l’oggetto va in pezzi; a 3 puoi invece attaccare una creatura aggiungendo metà dei pallini ai danni a mani nude o con armi leggere da mischia; a 5 anche con armi medie, a 7 con armi pesanti.`,
  'rapid-reflexes': `Costo 1 Vitae · azione minore · su di te · un turno, più uno per successo.

+2 dadi ai test di difesa Dodge. Fai un Power test contro Difficoltà 0: dura un turno in più per ogni successo.

Maturing: il bonus sale a +3 a 3 pallini, +4 a 5, +5 a 7.`,
  blink: `Costo 1 Vitae · azione minore · su di te · una scena.

Ogni turno ti muovi fino a distanza Medium con il movimento normale, senza perdere l’azione.

Maturing: a 4 pallini, se ti sei mosso nel turno, il primo attacco in mischia ha un bonus pari a metà dei pallini nella Disciplina.`,
  'rush-job': `Costo 1 Vitae · azione minore · su di te · una scena.

Fai in un attimo ciò che richiede tempo: un compito da un turno intero diventa un’azione minore, uno da una scena (fino a 30 minuti) richiede un minuto. Accelera anche altri poteri, ma non attacchi, difese, diablerie o qualunque cosa contrastata da un avversario.

Maturing: a 4 pallini due compiti lunghi insieme, a 6 tre.`,
  'willful-grace': `Costo 1 Willpower · azione minore · su di te · una scena.

+1 Dexterity fino a fine scena. Conta come Blood Surge e ti permette di superare di 1 il limite di Blood Surge del tuo tier.

Maturing: a 4 pallini puoi spendere altra Willpower, +1 Dexterity per ognuna, sempre senza superare di più di 1 il limite del tuo tier.`,
  'blurred-passage': `Costo 2 Vitae · azione minore · su di te · un turno.

Fai vibrare una parte del corpo (un braccio, una gamba, la testa) e la fai passare attraverso la materia solida: prendi un oggetto da una mano oltre un muro, sposti una sedia dietro una porta. Se a fine turno quella parte è ancora dentro un oggetto si danneggia gravemente (−2 dadi finché non la curi) e, a discrezione del Narratore, può persino staccarsi. Con 1 Willpower a fine turno lo prolunghi di un turno.

Maturing: a 5 pallini attraversi gli oggetti con tutto il corpo, vestiti e piccoli oggetti compresi; se finisci il turno dentro qualcosa vieni espulso, subisci 10 danni e hai gli Attributi fisici menomati fino al prossimo riposo diurno.`,
  'fighters-alacrity': `Costo 2 Vitae · azione minore · su di te · un turno, prolungabile.

Un’azione in più in questo turno, che deve usare un Attributo fisico. La mantieni pagando 1 Willpower all’inizio di ogni turno successivo; se non paghi finisce.

Maturing: a 6 pallini fino a 2 azioni extra, a 8 fino a 3, pagando 1 Willpower per azione extra a ogni turno.`,
  // Corruption
  contradict: `Costo 1 Vitae · contrasto Composure + Resolve · Short · un turno.

Con una vittoria il bersaglio usa la sua prossima azione per dire o fare il contrario di ciò che intendeva: l’agente lascia andare il prigioniero, la proposta di matrimonio diventa un’accusa. Non può essere spinto a farsi del male.

Maturing: a 3 pallini dura una scena e il bersaglio cambia obiettivi, argomenti o linea d’azione per tutta la durata.`,
  'doubt-competence': `Costo 1 Vitae · contrasto Composure + Resolve · Short · una scena.

Scegli un’attività (dipingere, attaccare…): con una vittoria il bersaglio ha −1 dado a tutti i test legati a quell’attività. Finisce prima se vince uno di quei test con margine di almeno 2.

Maturing: a 3 pallini, se è un vampiro, paga 1 Willpower in più per ogni potere di Disciplina che attiva; a 5 colpisci tanti bersagli quanti sono i tuoi pallini.`,
  'nightmare-glimpses': `Costo 1 Vitae · contrasto Composure + Resolve · Short · una scena.

Guardandolo negli occhi diventi per lui l’incarnazione delle sue paure. Con una vittoria ha −2 dadi a tutti i test contro di te, tranne quelli per fuggire. Finisce se non ti vede più.

Maturing: a 3 pallini la penalità sale a −3 e il bersaglio fa di tutto per scappare; a 5 colpisci metà dei tuoi pallini in bersagli, con un test per ciascuno.`,
  'dark-secrets': `Costo 1 Vitae · contrasto Composure + Resolve · Short · istantaneo.

Con una vittoria il bersaglio si lascia sfuggire uno dei suoi segreti più vergognosi e personali; più alto il margine, più profondo il segreto. Se lo usi contro di lui in una situazione sociale hai +2 dadi ai test Social, con i limiti decisi dal Narratore (per esempio una volta per segreto).`,
  'poison-heart': `Costo 1 Vitae · contrasto Composure + Resolve · Short · una scena.

Parli alla Bestia di un vampiro e lo spingi verso la frenesia: con una vittoria, fino a fine scena ha una penalità pari al margine (minimo −1) ai test per resistere alla frenesia.

Maturing: a 4 pallini colpisci metà dei tuoi pallini in bersagli.`,
  tainted: `Costo 1 Vitae · contrasto Composure + Resolve · Short · una scena.

Il bersaglio ripensa ai suoi atti più vergognosi: con una vittoria ha −2 dadi a tutti i test Social oppure Mental, a tua scelta. Nel suo turno può spendere un’azione minore e 1 Willpower per farti ripetere il test (senza la penalità): se lo vince, l’effetto finisce.

Maturing: a 4 pallini colpisci metà dei tuoi pallini in bersagli.`,
  estrange: `Costo 2 Vitae · contrasto Composure + Resolve · tocco · una scena.

Tocchi il bersaglio e lo stacchi dai suoi alleati: con una vittoria non può usare l’azione di aiuto, ha −2 dadi per difendere o aiutare gli alleati, i suoi Blood Bond scendono di un livello e ignora ogni vinculum.

Maturing: a 5 pallini metà dei tuoi pallini in bersagli, fino a distanza Short.`,
  'fool-the-hearts-eye': `Costo 2 Vitae · contrasto Composure + Resolve · Short · una scena.

Con una vittoria il bersaglio ti tratta come una persona cara: si fida, ti aiuta e ti difende, e hai +2 dadi ai test Social contro di lui. Finisce se tu o i tuoi alleati lo aggredite, lo minacciate o lo costringete.

Maturing: a 5 pallini metà dei tuoi pallini in bersagli.`,
  // Dominate
  apathy: `Costo 1 Vitae · contrasto Stamina + Composure (vittoria automatica se consenziente) · Short · una scena.

Parlando con calma e guardandolo negli occhi spegni le emozioni del bersaglio: +1 dado per resistere a effetti legati a emozioni forti (frenesia compresa), ma −2 dadi a tutti i test che non riguardano la sua sopravvivenza.

Maturing: a 3 pallini +2 e −3; a 5 metà dei tuoi pallini in bersagli, che non riescono nemmeno a spostarsi da dove sono.`,
  'cloud-memory': `Costo 1 Vitae · contrasto Intelligence + Resolve · Short · permanente.

Con una vittoria il bersaglio (non un animale) dimentica fino agli ultimi 5 minuti, a tua scelta. Non vedi i suoi ricordi: è una cancellatura in blocco, e lui si accorge del buco ma non della causa.

Maturing: a 3 pallini crei, cambi o cancelli fino a 10 minuti di ricordi delle ultime 24 ore, puntando momenti precisi ma alla cieca; a 5 fino a un’ora di ricordi degli ultimi 5 anni, con precisione chirurgica (per esempio sostituire un volto); a 7 fino a 24 ore, di qualunque epoca.`,
  command: `Costo 1 Vitae · contrasto Composure + Resolve · Short · una notte o fino al compimento.

Un ordine verbale di una frase a chi ti vede, ti sente e capisce la tua lingua (non animali). Con una vittoria obbedisce come un burattino, alla lettera e con azioni semplici. Non può raccontare segreti o ricordi profondi, non coglie sottintesi e non fa nulla contro la sua natura o dannoso per sé: se ci provi l’effetto si rompe.

Maturing: a 3 pallini un bersaglio in più per ogni pallino, tutti con lo stesso ordine; a 5 puoi ordinare anche azioni pericolose o dannose per lui.`,
  'stifle-will': `Costo 1 Vitae · contrasto Composure + Resolve · Short · un turno, più uno per punto di margine.

Con una vittoria il bersaglio non può spendere Willpower in alcun modo e ha −2 dadi ai test di Self-Control.

Maturing: a 4 pallini metà dei tuoi pallini in bersagli.`,
  'submerged-directive': `Costo 1 Vitae · contrasto Composure + Resolve · Short · istantaneo o una notte.

Impianti nel subconscio un ordine anche complesso, da eseguire subito o quando scatta un innesco semplice e sensoriale (la prossima persona che vede, una canzone, un luogo) entro la fine della notte. Niente contro la sua natura o dannoso per sé.

Maturing: a 4 pallini l’ordine può restare dormiente a tempo indeterminato finché l’innesco non scatta; a 6 metà dei tuoi pallini in bersagli.`,
  'suppress-mind': `Costo 1 Vitae · contrasto Intelligence + Resolve · Short · una scena.

Con una vittoria abbassi uno degli Attributi mentali del bersaglio di tanti punti quanto il margine.`,
  'deliver-command': `Costo 1 Vitae più il costo del potere impiantato · nessun contrasto · Short · una notte o finché non scatta.

Impianti in un portatore (che può non saperlo) un altro tuo potere di Dominate di livello almeno uno inferiore ai tuoi pallini, e sarà lui a consegnarlo. Stabilisci il bersaglio finale o un innesco (il prossimo che entra da quella porta). Se il potere richiede un test lo fai al momento della consegna, e sai quando avviene.

Maturing: a 5 pallini il portatore lo conserva finché non riesce a consegnarlo o muore.`,
  'sap-will': `Costo 1 Vitae · azione minore · contrasto Composure + Resolve · Short · una scena.

Scegli un bersaglio: per tutta la scena, ogni volta che faresti un test Social contro di lui fai invece un Power test, e con una vittoria infliggi danni alla sua Willpower pari a metà dei tuoi pallini nella Disciplina.

Maturing: a 6 pallini i danni sono pari ai tuoi pallini.`,
  // Fortitude
  fortify: `Costo 1 Vitae · reazione · su di te · un turno.

Quando subisci un attacco in mischia fai un Power test contro la riserva dell’attaccante al posto della difesa normale; se vinci non subisci danni. Fino all’inizio del tuo prossimo turno puoi usarlo al posto di ogni difesa, pagando la Vitae solo la prima volta. Il Narratore può escludere certi attacchi, come il fuoco.

Maturing: a 2 pallini anche contro attacchi a distanza; a 3 dura 2 turni; a 5 una scena.`,
  'hardened-skin': `Costo 1 Vitae o più · azione minore o reazione · su di te · una scena.

La pelle diventa cuoio: riduci tutti i danni fisici di 1 per ogni Vitae spesa, fino a metà dei tuoi pallini nella Disciplina, insieme alla riduzione di Vampiric Endurance. Non vale contro i danni baneful di sole e fuoco. Come reazione lo attivi quando vieni attaccato.`,
  'unswayable-mind': `Costo 1 Vitae · azione minore o reazione · su di te · una scena.

Aggiungi metà dei pallini nella Disciplina ai test per resistere a fascino, coercizione e influenze sulla mente, compresi i poteri di Disciplina. Come reazione lo attivi quando sei bersaglio di un test Social in conflitto o di un effetto mentale.`,
  'restore-limb': `Costo 1 Vitae · su di te · permanente.

Togli ogni menomazione da uno dei tuoi arti ferito, che torna integro.

Maturing: a 3 pallini, dando 1 Vitae a un consenziente a distanza Close, curi un suo arto (può creare un Blood Bond); a 4 rigeneri un tuo arto perso, se ne hai gran parte; a 5 lo fai per un altro, sempre con 1 Vitae.`,
  'shared-resilience': `Costo 1 Vitae (data al bersaglio) · Close · una scena.

Fai bere 1 Vitae a un consenziente (può creare un Blood Bond): per la scena lui riduce i danni del tuo modificatore di generazione, in aggiunta alla sua resistenza, e tu smetti di ridurli.`,
  unmoving: `Costo 1 Vitae · azione minore · su di te · una scena o finché vuoi.

Nessuno può spostarti contro la tua volontà: niente atterramenti né trascinamenti durante una presa (anche se ti possono ancora afferrare). Aggiungi metà dei pallini nella Disciplina alle difese contro le prese.`,
  purification: `Costo 2 Vitae · azione minore · su di te · permanente.

Ti liberi dagli effetti di un potere Social o Mental da 1 pallino usato su di te (non se usato a un livello più alto tramite Maturing). Se il potere è continuo, come Awe, ne sei protetto per il resto della scena. Funziona solo se hai ancora il controllo delle tue azioni (sì con Apathy, no con Command). Per poteri di livello più alto serve un Power test contro chi li ha usati; se fallisci riprovi solo la notte dopo.

Maturing: senza test fino ai poteri da 2 pallini a 4 pallini, fino a 3 a 5.`,
  'retributive-hide': `Costo 2 Vitae · azione minore o reazione · su di te · una scena.

Chi ti colpisce ne paga il prezzo: i proiettili si distruggono, le armi da mischia si rovinano finché non vengono riparate, e se ti colpisce una parte del corpo la creatura subisce metà dei danni che subisci tu (dopo le riduzioni). Non vale per i danni baneful.

Maturing: a 6 pallini, con 1 Vitae in più, la creatura subisce gli stessi danni che subisci tu.`,
  // Obfuscate (inganna i sensi: non funziona su telecamere, microfoni e altri dispositivi)
  conceal: `Costo 1 Vitae · contrasto Wits + Awareness (solo a un’ispezione attenta) · tocco · una scena.

Nascondi su di te tanti piccoli oggetti quanti sono i tuoi pallini, armi leggere comprese: chi ti guarda di sfuggita non li nota, chi ti perquisisce con cura deve battere il tuo Power test. Se un oggetto si allontana da te, con 1 Willpower resta nascosto finché non si tradisce da solo (un bicchiere che si rompe, una pistola che cade).

Maturing: a 3 pallini anche oggetti e armi medie, a 5 anche grandi e armi pesanti.`,
  'silence-of-death': `Costo 1 Vitae · su di te · una scena.

Non fai alcun rumore per chi è a portata d’orecchio. Non inganna i microfoni né copre i suoni che provochi fuori di te (una porta sbattuta, un oggetto lanciato).

Maturing: a 3 pallini il silenzio si estende fino a distanza Close attorno a te, anche sugli altri; a 4 lo attivi come azione minore; a 6 fino a distanza Short, scegliendo quali suoni zittire.`,
  'unseen-passage': `Costo 1 Vitae · su di te · una scena.

Immobile vicino a un riparo, diventi difficile da notare: chi non ti cerca ti ignora, e contro chi ti cerca aggiungi i pallini nella Disciplina ai test per nasconderti (per esempio Wits + Subterfuge contro Wits + Awareness). Vale per ciò che indossi e porti, non per altre persone. Finisce se ti muovi, attacchi, fai rumore o vieni scoperto.

Maturing: a 2 pallini puoi muoverti, purché non attiri l’attenzione; a 4 non serve un riparo, sparisci anche sotto gli occhi di chi ti guarda, come azione minore; a 5, con 1 Willpower, nascondi anche alleati vicini (tanti quanti i tuoi pallini) che restano entro distanza Short.`,
  'double-talk': `Costo 1 Vitae · azione minore · contrasto Intelligence + Wits (solo chi sospetta) · Short · una scena.

Scegli tanti ascoltatori quanti sono i tuoi pallini: capiscono i messaggi nascosti nelle tue frasi, gli altri sentono solo il discorso normale. Chi sospetta qualcosa può provare a decifrarli, e lo fermi con un Power test.`,
  'fools-gold': `Costo 1 Vitae · contrasto Intelligence + Wits (solo se lo tocca a lungo) · Short · una scena.

Fai sembrare un’altra cosa fino a metà dei tuoi pallini in piccoli oggetti, armi leggere comprese. Chi li tocca a lungo ne sente la vera consistenza e può smascherarli; se vinci il Power test continua a credere a ciò che vede, e il Narratore può fargli persino sentire ciò che vede.

Maturing: a 4 pallini anche oggetti e armi medie, a 6 grandi e armi pesanti.`,
  'mind-tricks': `Costo 1 Vitae · contrasto Wits + Resolve · Short · una scena.

Piccole allucinazioni ai margini dei sensi: un sussurro, un movimento con la coda dell’occhio, un odore improvviso. Scegli fino a metà dei tuoi pallini in bersagli; chi perde il test è confuso e ha −2 dadi ai test basati sui sensi.`,
  'horrid-reality': `Costo 2 Vitae · contrasto Composure + Wits (i mortali sono colpiti automaticamente) · Short · una scena.

Il bersaglio vede, sente e tocca la sua paura più specifica e la crede reale: −2 dadi ai test. Tu non sai cosa vede. Finisce se qualcuno lo convince che non è vero; durante un conflitto puoi opporti come reazione con un Power test contro Charisma + Persuasion di chi prova a convincerlo.`,
  'mask-of-a-thousand-faces': `Costo 2 Vitae · su di te · una scena.

Diventi uno sconosciuto qualunque che ci si aspetta di vedere lì (l’operaio in un cantiere): finché la tua presenza è plausibile nessuno sospetta e puoi anche conversare. Non ti dà documenti né supera controlli d’identità. Anche i vestiti sembrano anonimi.

Maturing: a 4 pallini assumi l’aspetto di una persona precisa che hai visto, anche solo in foto; chi sospetta deve battere il tuo Power test con Wits + Awareness. A 6 il volto anonimo copre anche metà dei tuoi pallini in consenzienti entro distanza Short.`,
  // Oblivion
  'cloud-of-darkness': `Costo 1 Vitae · Short · una scena.

Crei una nube d’ombra larga fino a distanza Close attorno a un punto che vedi. Chi è dentro aggiunge metà dei tuoi pallini ai test per muoversi furtivo e nascondersi; i test basati sulla vista tra dentro e fuori hanno una penalità pari a metà dei tuoi pallini. Le luci normali dentro la nube si affievoliscono.

Maturing: a 3 pallini la sposti fino a distanza Short con un’azione minore e attutisce i suoni; a 5 si estende fino a distanza Short.`,
  'shadow-play': `Costo 1 Vitae · Short · una scena.

Dai alle ombre la forma che vuoi (la sagoma di un lupo, di un’altra creatura): un’ombra per pallino, piatte e non più grandi di te, che puoi muovere e cambiare finché restano entro distanza Short. Aggiungi metà dei tuoi pallini ai test in cui l’illusione aiuta, come far credere di avere rinforzi dietro l’angolo.

Maturing: a 3 pallini immagini grandi il doppio di te; a 5 il triplo e distanza Medium; a 7 dieci volte.`,
  'shadow-tools': `Costo 1 Vitae · Close · una scena.

Crei oggetti, attrezzi o vestiti semplici d’ombra solida, tanti quanti i tuoi pallini, non più grandi di te e senza meccanismi complessi né armi. Funzionano come quelli veri finché restano in ombra e svaniscono alla luce forte.

Maturing: a 3 pallini anche armi, ma non armi che richiedono munizioni.`,
  'draining-darkness': `Costo 1 Vitae · azione minore · contrasto Charisma + Resolve · Short · una scena.

Allunghi la tua ombra sotto un bersaglio. Finché ci resta sopra, con un’azione e un Power test gli togli Willpower pari al margine (almeno 1). Nel tuo turno puoi spostare l’ombra su un altro bersaglio; se a fine turno non è sotto nessuno, il potere finisce.`,
  'grasping-shadows': `Costo 1 Vitae · contrasto Dexterity + Athletics · Short · una scena.

L’ombra del bersaglio diventa solida e lo afferra: con una vittoria è immobilizzato come in una presa. Ogni volta che prova a liberarsi ripeti il test; se perdi, scappa. Con un’azione fai stringere l’ombra: Power test contro Strength + Stamina, e con una vittoria infliggi metà dei tuoi pallini più il margine in danni. Finisce se l’ombra viene toccata dal sole.

Maturing: a 4 pallini afferri metà dei tuoi pallini in bersagli; per stritolarne più di uno a turno paghi 1 Willpower per ognuno in più.`,
  'shadow-mask': `Costo 1 Vitae · azione minore · su di te · una scena.

Immobile nell’ombra o nel buio sei difficile da scoprire: chi ti cerca deve battere il tuo Power test con Wits + Awareness, a meno che tu non ti muova o attiri l’attenzione. Nel frattempo puoi usare poteri che non richiedono movimento.

Maturing: a 4 pallini nascondi anche metà dei tuoi pallini in consenzienti entro distanza Close, che devono restare immobili.`,
  'night-terrors': `Costo 2 Vitae · azione minore · contrasto Composure + Resolve · Short · una scena.

Un’ondata d’ombre in cui ognuno vede i propri incubi. Scegli fino a tanti bersagli quanti i tuoi pallini: chi perde ha gli Attributi mentali menomati. Nei turni successivi, con un’azione minore e un nuovo test, menomi anche gli Attributi sociali di un bersaglio già colpito; per farlo su più bersagli paghi 1 Willpower per ognuno in più.`,
  'shadow-step': `Costo 2 Vitae · azione minore · Short · un turno.

Entri in un’ombra che ti copre entro distanza Close ed esci da un’altra ombra abbastanza grande che vedi entro distanza Short.

Maturing: a 4 pallini porti con te metà dei tuoi pallini in consenzienti vicini; a 5 anche non consenzienti, con un Power test contro Dexterity + Athletics (senza test se sono legati); a 6 riappari fino a distanza Medium.`,
  // Potence
  'bull-rush': `Costo 1 Vitae · su di te · un turno.

Carichi una creatura entro distanza Short (il movimento non conta nel tuo normale) e la attacchi in mischia con un bonus pari a metà dei tuoi pallini (almeno +1). Se vinci, oltre agli effetti dell’attacco cade a terra.

Maturing: a 3 pallini la scagli anche fino a distanza Close: se urta qualcosa subisce metà dei tuoi pallini in danni extra, e lo stesso chi viene colpito; a 4 fino a Short, a 5 fino a Medium.`,
  imprint: `Costo 1 Vitae · azione minore o reazione · su di te · un turno.

Affondi dita e piedi in una superficie solida, anche l’acciaio, e aggiungi i pallini nella Disciplina contro ogni tentativo di spostarti. Come reazione lo attivi quando qualcosa sta per spostarti contro la tua volontà.

Maturing: a 3 pallini dura una scena e puoi arrampicarti sui muri e camminare sul soffitto, lasciando piccole impronte.`,
  'soaring-leap': `Costo 1 Vitae · azione minore · su di te · un turno.

Salti ovunque entro distanza Short, sopra ostacoli e creature; se un salto richiede un test aggiungi i tuoi pallini.

Maturing: a 2 pallini, con 1 Willpower, atterri con violenza: Power test contro Strength + Stamina di chi è entro distanza Close, e chi perde cade a terra. A 3 lo attivi anche come reazione quando cadi, e se atterri con violenza dimezzi i danni della caduta e l’altra metà la subiscono quelli che atterri.`,
  'bone-breaker': `Costo 1 Vitae · istantaneo.

Un attacco mirato in mischia (−2 dadi) a una parte del corpo: se vinci fa i danni normali e storpia l’arto, che dà −2 dadi a tutti i test che lo usano finché non viene curato. Se l’attacco fallisce, con 1 Willpower tieni l’effetto per l’attacco successivo nel turno seguente.

Maturing: a 5 pallini, con 2 Vitae in più, strappi via l’arto (la decapitazione segue le regole normali dei colpi mirati).`,
  earthshock: `Costo 1 Vitae · contrasto Strength + Stamina · Short · istantaneo.

Colpisci il suolo e l’onda raggiunge una creatura che tocca la stessa superficie: se vinci subisce metà dei tuoi pallini più il margine in danni e cade a terra. Lascia segni evidenti: crepe, vetri rotti, piastrelle spaccate.

Maturing: a 4 pallini tanti bersagli quanti i tuoi pallini, a 6 chiunque tu scelga in portata, con un test per ciascuno.`,
  'powerful-strike': `Costo 1 Vitae · istantaneo.

Un attacco in mischia che, se vince, infligge danni extra pari ai tuoi pallini nella Disciplina. Se fallisce, con 1 Willpower tieni l’effetto per l’attacco successivo nel turno seguente.`,
  'strike-true': `Costo 2 Vitae · azione minore · su di te · un turno.

Il tuo prossimo attacco in mischia va a segno senza test e non si può schivare né parare; i danni si calcolano come per un successo con margine pari a metà dei tuoi pallini.`,
  'war-cry': `Costo 2 Vitae · contrasto Composure + Resolve · Short · una scena.

Un urlo che terrorizza: scegli tanti bersagli quanti i tuoi pallini, e chi perde ha −2 dadi a tutti i test che non servono a fuggire. Per tutta la scena aggiungi metà dei tuoi pallini ai test per resistere alla paura, compresa la frenesia da terrore.`,
  // Presence
  awe: `Costo 1 Vitae · azione minore · Short · una scena.

Scegli un effetto, centrato su di te; a inizio turno lo cambi con 1 Willpower. Stupire: aggiungi i tuoi pallini ai test Social con Expression o Persuasion contro chi è in portata. Ispirare: gli alleati in portata aggiungono metà dei tuoi pallini agli stessi test. Minacciare: scegli fino al doppio dei tuoi pallini in nemici (non animali) e fai un Power test contro Composure + Resolve; chi perde ha una penalità pari a metà dei tuoi pallini ai test per resistere a intimidazioni e paura, anche da poteri.`,
  'dread-gaze': `Costo 1 Vitae · contrasto Composure + Resolve (i mortali comuni perdono sempre) · Medium · una scena.

Il bersaglio si sente giudicato e ha paura: −2 dadi a tutti i test finché ti vede. Finisce se a fine turno non lo vedi più o è oltre distanza Medium.

Maturing: a 3 pallini, con 1 Willpower all’inizio del suo turno e un nuovo test, la penalità sale a −3; con margine 3 o più un mortale fugge e un vampiro paga 1 Willpower per ogni azione diretta contro di te. A 4 un bersaglio in più per pallino e la distanza non conta più; a 5 basta anche la voce.`,
  impassion: `Costo 1 Vitae · contrasto Composure + Resolve se non è consenziente · Short · una scena.

Fai provare a un bersaglio (non animale) un’emozione intensa che descrivi tu; il Narratore può dargli −2 dadi ai test che quell’emozione ostacola. Finisce se il suo stato emotivo cambia o se inizia il turno oltre distanza Medium.

Maturing: a 2 pallini 2 bersagli in più per pallino, con la stessa emozione; a 3, con un’azione e 1 Willpower, getti un mortale in crisi emotiva (−3 dadi e reazioni incontrollate decise dal Narratore); a 5 puoi farlo a un vampiro, che va in frenesia.`,
  'captivating-gaze': `Costo 1 Vitae · contrasto Composure + Resolve · Medium · uno o più turni.

Incroci lo sguardo del bersaglio e lo incanti: non si muove e ti fissa (ma si difende dagli attacchi) per 1 turno più il margine, finché non distogli lo sguardo o finché non subisce danni. Può spendere 1 Willpower per ripetere il test e liberarsi.

Maturing: a 4 pallini basta che lui ti veda (bendarlo o coprirgli gli occhi lo libera); a 8 metà dei tuoi pallini in bersagli.`,
  'compose-yourself': `Costo 1 Vitae · tocco · una scena.

Chi tocchi non rischia la frenesia per un fallimento bestiale e ha +2 dadi per resistere alla paura e alla frenesia da terrore o da rabbia.

Maturing: a 4 pallini metà dei tuoi pallini in bersagli entro distanza Short.`,
  'redirect-desire': `Costo 1 Vitae · contrasto Composure + Resolve · Short · una scena.

Sposti i desideri del bersaglio verso ciò che vuoi tu: una sedia, una birra, un’altra stanza. I mortali di solito non resistono, a meno che tu non vada contro le loro convinzioni profonde. Ha −2 dadi ai test che non riguardano il nuovo desiderio. Niente desideri che lo danneggino in modo diretto ed evidente.

Maturing: a 4 pallini metà dei tuoi pallini in bersagli.`,
  'friends-to-enemies': `Costo 2 Vitae · contrasto Composure + Resolve di ciascuno · Short · una scena.

Scegli due creature (non animali) alleate o nemiche tra loro e rafforzi o indebolisci il legame, lo stesso per entrambe. Rafforzare: si trattano da amici, +2 dadi per aiutarsi o proteggersi. Indebolire: si vedono come una minaccia, niente aiuto reciproco e −2 dadi per aiutarsi o proteggersi.

Maturing: a 6 pallini una seconda coppia, a 8 una terza.`,
  'transcendent-aura': `Costo 2 Vitae · contrasto Composure + Resolve · Medium · una scena o finché non aggredisci.

Un’aura che attira o respinge; puoi escluderne tante creature quanti i tuoi pallini. Attrarre: chi prova ad allontanarsi senza permesso, se perde, non va oltre distanza Short e, se è più lontano, si avvicina. Respingere: chi prova ad avvicinarsi senza permesso, se perde, non arriva a distanza Close. L’aura non serve a intrappolare o bloccare qualcuno né gli fa perdere il turno.`,
  // Tellurgy
  decay: `Costo 1 Vitae · contrasto Dexterity + Athletics (oggetto portato) o Dexterity + Stamina (creatura) · tocco · permanente.

Il tuo tocco accelera il tempo. Un oggetto libero invecchia subito fino a un mese, a tua scelta: marcisce, si crepa, arrugginisce. Su un oggetto indossato o su una creatura fai un Power test con −2 dadi, come un colpo mirato; una creatura invecchia della metà rispetto a un oggetto e, se vince, è immune fino alla notte dopo. Nei mortali il tempo può causare disidratazione, malattie, Attributi menomati o la morte; sui vampiri l’effetto lo decide il Narratore (nessuno, un Attributo fisico menomato, perdita di Vitae, aspetto cadaverico).

Maturing: gli anni crescono con i pallini (oggetto/creatura): 2 pallini sei mesi/tre mesi, 3 un anno/sei mesi, 4 cinque anni/due anni e mezzo, 5 dieci/cinque anni, 6 cinquanta/venticinque, 7 cento/cinquanta; a 8 una creatura invecchia quanto un oggetto, fino a duecento anni.`,
  'eyes-of-the-deep': `Costo 1 Vitae · Power test contro Difficoltà 0 · tocco · un turno.

Tocchi acqua ferma o lenta (una pozzanghera, un ruscello, un lago) e vedi, come in un sogno veloce, i fatti principali avvenuti lì intorno. I successi dicono quanto indietro: 1 un giorno, 2 una settimana, 3 un mese, 4 un anno, 5 o più dieci anni.`,
  'hidden-roads': `Costo 1 Vitae · Power test contro Difficoltà 0 · Close · un’ora per pallino.

Versi la Vitae su una strada o un sentiero: i tuoi successi diventano la Difficoltà del test di Wits + Survival di chi ti insegue o cerca un luogo lungo quella strada che vuoi nascondere. Chi fallisce si perde, la strada sembra infinita o gira su se stessa. Chi passa senza cercarti non è toccato. Devi restare sulla strada o entro distanza Close.

Maturing: a 3 pallini proteggi anche chi è entro distanza Short e versa 1 Vitae o perde 1 Health sulla strada.`,
  'endurance-of-stone': `Costo 1 Vitae · azione minore · su di te · una scena.

Ti ricopri di terra e pietra: riduci tutti i danni di metà dei tuoi pallini, in aggiunta a Vampiric Endurance, senza mai scendere a 0. Non vale contro i danni baneful di sole e fuoco. Devi essere vicino a terra, roccia o materiali naturali simili.`,
  'gathering-wind': `Costo 1 Vitae · contrasto Wits + Resolve se non sono consenzienti · Far Away · una notte.

Chiami col vento fino a tanti alleati quanti i tuoi pallini verso un luogo in cui sei stato, all’aperto. Sentono una leggera spinta, sanno quanto distano e che li vuoi lì; finché il vento li raggiunge hanno +2 dadi per trovarti, trovare il luogo o superare gli ostacoli (a discrezione del Narratore anche in attacco e difesa contro chi li blocca). Con 1 Willpower cambi destinazione.`,
  'gaze-of-misfortune': `Costo 1 Vitae · contrasto Charisma + Resolve · Short · una scena.

Con una vittoria il prossimo test del bersaglio che usa un Attributo da te scelto ha una penalità pari al doppio del margine (almeno −2); poi l’effetto finisce. Non puoi usarlo su chi lo ha già addosso.

Maturing: a 4 pallini vale per i prossimi due test, a 6 per tre.`,
  'curse-of-life': `Costo 2 Vitae · contrasto Stamina + Resolve · Short · una scena.

Riempi un vampiro o un altro non morto di vita: fame, sete, sudore, bisogni corporali, sensi più deboli. Con una vittoria ha una penalità ai test pari a 2 più il margine e, se è un vampiro, non può usare Blood Surge sugli Attributi fisici.`,
  miasma: `Costo 2 Vitae · contrasto Wits + Stamina · Medium · una scena.

Una nube verdastra fino a distanza Short attorno a un punto che vedi: chi è dentro ha −2 dadi ai test basati sulla vista. La prima volta che una creatura entra o inizia il turno nella nube fai un Power test: se vinci è disorientata e si muove in direzione casuale finché resta dentro. I mortali subiscono 1 danno a ogni inizio turno.

Maturing: a 5 pallini il gas è acido: 2 danni ai mortali e 1 alle creature soprannaturali.`,
  // Vicissitude
  'body-sculpting': `Costo 1 Vitae · su di te · una notte.

Rimodelli pelle, muscoli e ossa: una modifica all’attivazione e una per azione, fino a tante quanti i tuoi pallini (oltre devi toglierne una vecchia). Ogni modifica dà +1 dado ai test in cui aiuta (palmature per nuotare, orecchie più grandi, mani da arrampicata, aspetto seducente o spaventoso), mai più di +3 in un test. Non crea nuovi arti né cambia molto la tua taglia.

Maturing: a 3 pallini anche su una creatura che tocchi (se non è consenziente, Power test contro Stamina + Resolve e al massimo metà dei tuoi pallini in modifiche); le modifiche che la ostacolano danno −1, fino a −3.`,
  'detachable-parts': `Costo 1 Vitae · su di te · una notte.

Ti stacchi un organo di senso (occhio, orecchio, dito, naso, lingua) e lo posi entro distanza Close: continua a percepire anche quando te ne vai, ma non si muove. Ne stacchi fino a tanti quanti i tuoi pallini; se togli tutti quelli di un senso, quel senso funziona solo da lì. Se a fine durata è ancora staccato marcisce, e ricrearlo costa un’azione e 1 Vitae.

Maturing: a 3 pallini anche una mano o un piede che compie un’azione semplice; a 5 un braccio o una gamba che attacca in mischia (se attaccate entrambi nello stesso turno, −2 dadi a tutti e due).`,
  'weight-of-a-feather': `Costo 1 Vitae · azione minore o reazione · su di te · una scena.

Riduci la tua massa: non fai scattare i sensori di pressione e dimezzi i danni da caduta, urti e lanci. Come reazione lo attivi davanti a uno di questi pericoli.

Maturing: a 3 pallini anche su metà dei tuoi pallini in creature che tocchi.`,
  'body-blade': `Costo 1 Vitae · azione minore · su di te · una notte.

Trasformi una parte del corpo (braccio, gamba, testa) in un’arma da mischia leggera o media d’ossa e muscoli, che fa i danni di quell’arma. Il Narratore può concedere vantaggi legati alla forma, come decapitare con una lama o atterrare con una testa a martello.

Maturing: +1 danno a 4 pallini, +2 a 6.`,
  'bone-shield': `Costo 1 Vitae · azione minore · su di te · una scena o finché si rompe.

Le ossa di un braccio formano uno scudo: pari gli attacchi in mischia e a distanza con un Power test al posto della parata normale. −2 dadi ai lavori di precisione con quel braccio. Si rompe dopo aver parato un numero di attacchi pari al doppio dei tuoi pallini.`,
  'flesh-disguise': `Costo 1 Vitae · su di te · una notte.

Modelli il tuo volto su quello di una persona precisa e aggiungi i tuoi pallini ai test per spacciarti per lei; con un’azione cambi volto. Non imita voce, postura o modi di fare.

Maturing: a 3 pallini anche sul volto di chi tocchi (se non è consenziente, Power test contro Stamina + Resolve); in alternativa al bonus aggiungi i tuoi pallini alla Difficoltà di chi vuole smascherare il travestimento. A 4 cambi tutto il corpo, con bonus doppio ai test di Subterfuge per travestirsi.`,
  multilimb: `Costo 2 Vitae · su di te · una notte.

Ti fai crescere arti in più, fino a metà dei tuoi pallini; li togli quando vuoi, in uno spruzzo di sangue. Col Narratore decidi cosa danno (presa, equilibrio, corsa, più oggetti in mano), con un bonus massimo pari a metà dei tuoi pallini. Non danno azioni extra, ma possono dare dadi in più a un attacco con più braccia.

Maturing: a 6 pallini anche su una creatura che tocchi (se non è consenziente, Power test contro Stamina + Resolve); se l’arto la ostacola ha una penalità pari a metà dei tuoi pallini.`,
  'twist-flesh': `Costo 2 Vitae · contrasto Stamina + Resolve · tocco · una notte.

Storpi l’arto che tocchi: con una vittoria subisce danni pari al margine e il bersaglio ha −2 dadi ai test con quell’arto finché non viene curato. Con 1 Willpower a fine notte prolunghi l’effetto, se è entro distanza Short.

Maturing: a 6 pallini puoi far marcire e cadere l’arto; la ferita si richiude senza altri danni.`,
};

/** What every Discipline power has in common, shown once above the Disciplines. */
export const DISCIPLINE_RULES = `Per usare un potere fai un Power test: Attributo del potere + pallini nella Disciplina. Se fallisci il potere si attiva comunque ma non ha effetto, e hai speso azione e Vitae.

Ogni potere ha un livello (i pallini minimi per impararlo), una categoria (Physical, Social o Mental), un costo in Vitae o Willpower, una distanza e una durata. Se il bersaglio può opporsi fai un test contrastato contro la riserva indicata; se il potere agisce senza il suo creatore presente, la Difficoltà è il livello del potere.

Maturing: molti poteri migliorano quando hai più pallini nella Disciplina, anche temporaneamente con Blood Surge. Puoi chiudere un tuo potere in qualunque momento senza spendere azioni.`;

/** Disciplines, by id: what they do and which clans have them. */
export const DISCIPLINE_DETAILS: Record<string, string> = {
  animalism: `Il legame con la Bestia ti mette in contatto con gli animali: parli con loro, li chiami, li comandi, ne prendi le capacità fino a trasformarti in uno di loro.

Clan: Gangrel, Nosferatu, Tzimisce.`,
  auspex: `Sensi oltre l’umano: vedere e sentire più lontano, cogliere ciò che è nascosto o soprannaturale, leggere oggetti, pensieri e lampi di futuro.

Clan: Giovanni, Malkavian, Salubri, Toreador, Tremere.`,
  bloodsorcery: `Magia del sangue: piegare la Vitae per ottenere effetti prodigiosi. Il pacchetto Alpha 2.0 non ne descrive ancora i poteri.

Clan: Banu Haqim, Tremere.`,
  celerity: `Velocità e grazia soprannaturali: schivare, correre su muri e acqua, attraversare la materia, agire più volte in un turno.

Clan: Banu Haqim, Brujah, Gangrel, Toreador.`,
  corruption: `Il tentatore: incrina convinzioni, lealtà e fiducia in se stessi, scava nei segreti e avvelena mente e legami, spesso senza che la vittima se ne accorga.

Clan: Ministry. Contiene temi delicati (vergogna, dipendenza): parlatene al tavolo prima di sceglierla.`,
  dominate: `Controllo della mente: ordini a cui obbedire, ricordi cancellati o riscritti, volontà spente, comandi che restano in attesa di un innesco.

Clan: Lasombra, Malkavian, Tremere, Tzimisce, Ventrue. Contiene temi delicati (controllo, memoria): parlatene al tavolo prima di sceglierla.`,
  fortitude: `Resistenza del corpo e della mente: incassare colpi e influenze, rigenerare arti, condividere la tua tenacia con gli alleati.

Clan: Gangrel, Ministry, Salubri, Ventrue.`,
  necromancy: `Il rapporto con i morti: parlare con gli spiriti, governare il decadimento, comandare morti e non morti. Il pacchetto Alpha 2.0 non ne descrive ancora i poteri.

Clan: Giovanni.`,
  obfuscate: `Inganna i sensi altrui: nasconde te, i tuoi oggetti e i tuoi alleati, crea illusioni e volti falsi. Agisce sulle menti, quindi non inganna telecamere, microfoni e altri dispositivi.

Clan: Banu Haqim, Malkavian, Ministry, Nosferatu, Ravnos, Salubri.`,
  oblivion: `Le ombre dell’Abisso: nubi di buio, ombre che afferrano o prosciugano, passaggi da un’ombra all’altra. Un’ombra “piatta” aderisce alle superfici; una “nube” o un oggetto “solido” ha volume e si comporta come la cosa che rappresenta.

Clan: Lasombra.`,
  potence: `Forza bruta e abilità marziale: cariche, salti enormi, colpi che spezzano ossa e fanno tremare il suolo.

Clan: Brujah, Giovanni, Lasombra, Nosferatu.`,
  presence: `Le emozioni altrui: stupire, ispirare o minacciare, calmare, creare o spezzare legami, attirare o respingere. Utile soprattutto nei conflitti e nelle scene sociali.

Clan: Brujah, Ravnos, Toreador, Ventrue. Contiene temi delicati (manipolazione emotiva): parlatene al tavolo prima di sceglierla.`,
  tellurgy: `Un legame distorto con la natura: invecchiare cose e creature, leggere il passato nell’acqua, confondere le strade, chiamare il vento, maledire con la sfortuna o con la vita stessa.

Clan: Ravnos, Tzimisce.`,
  vicissitude: `Modellare la carne: rimodellare il proprio corpo e quello altrui, staccare parti, trasformare ossa in armi e scudi, cambiare volto.

Clan: Tzimisce.`,
};

/** Merits, by id. */
export const MERIT_DETAILS: Record<string, string> = {
  'bond-famulus': `Trasformi uno dei tuoi animali ghoul, legato a te da un Blood Bond di terzo livello, in un famulus: un’ora di legame e 3 Vitae (se lo prendi alla creazione ce l’hai già). Sentite l’uno l’umore dell’altro. I tuoi poteri di Animalism su di lui costano meno del tuo modificatore di generazione; la sua riserva Mental e la riduzione dei danni salgono dello stesso valore.

Uno solo alla volta, due con 5 pallini in Animalism. Se muore o il legame si spezza perdi Willpower pari al doppio del modificatore di generazione e aspetti la notte dopo per legarne un altro.`,
  'bond-resistant': `+2 dadi a ogni test per agire contro la volontà o gli ordini diretti di chi ti tiene con un Blood Bond, compresi i suoi poteri di Disciplina.`,
  'chain-the-psyche': `Chi è sotto un tuo potere di Dominate e prova a disobbedire, o a recuperare i ricordi che hai alterato, sente un dolore che lo blocca: per farlo spende 1 Willpower e ha comunque −2 dadi a tutto ciò che non serve a eseguire il tuo ordine (−4 con 5 pallini in Dominate). Dura quanto il potere, o una settimana per pallino in Dominate per i poteri permanenti o lunghi.`,
  'code-of-honor': `Segui un codice personale, da definire col Narratore: +1 dado ai test di Self-Control in cui il codice ti aiuta a restare lucido e ai test contrastati per non agire contro di esso.`,
  'eidetic-memory': `Ricordi senza test ogni dettaglio visto o sentito nell’ultimo decennio. Per ricordi più vecchi il Narratore può chiedere tempo o un test, a cui aggiungi la tua Intelligence anche se il test la usa già.`,
  'enchanting-presence': `I mortali che bersagli con i tuoi poteri di Presence hanno −2 dadi per resistere (−3 con 5 pallini in Presence). Da Ancilla in su vale anche contro le creature soprannaturali.`,
  fleetness: `Aggiungi i tuoi pallini in Celerity ai test di Dexterity legati alla velocità fuori dal conflitto.`,
  'flexible-limbs': `+2 dadi ai test in cui la flessibilità ti aiuta a muoverti o a liberarti: passare in spazi stretti, sfilarti da corde e prese.`,
  'forgettable-face': `Hai un volto che nessuno ricorda, a meno che tu non sfoggi qualcosa di vistoso: +2 dadi a Subterfuge per confonderti nella folla o passare inosservato in un gruppo.`,
  'friends-in-high-places': `Ti muovi a tuo agio nell’alta società: +2 dadi a tutti i test Social con l’élite, anche nei conflitti sociali, e quando sfrutti le tue conoscenze per ottenere informazioni o entrare in luoghi esclusivi.`,
  'friends-in-low-places': `Conosci la malavita e i bassifondi: +2 dadi a tutti i test Social con il mondo criminale, anche nei conflitti sociali, e per raccogliere informazioni o accedere a luoghi legati alla malavita senza dare nell’occhio.`,
  'from-a-different-time': `Sei stato Abbracciato in un’altra epoca e la ricordi bene: +2 dadi ai test che la riguardano, come usare oggetti di allora, ricordarne fatti o discuterne.`,
  'hunger-strength': `Quando hai 3 o più dadi Fame la Bestia ti presta forza: +2 dadi ai test di Strength, anche in conflitto.`,
  'intimidating-presence': `+2 dadi per intimidire o mettere a disagio chi ti vede. Il Narratore può trasformarlo in una penalità quando cerchi di calmare o convincere chi non ti conosce.`,
  might: `Aggiungi i tuoi pallini in Potence ai test di Strength per sollevare e trasportare fuori dal conflitto.`,
  'monstrous-facade': `Con un’azione minore mostri l’aspetto della Bestia (artigli, zanne, occhi rossi, odore selvatico) e con un’altra lo nascondi. Non cambia le statistiche, ma dà +3 dadi per spaventare o intimidire quando lo sfrutti. Rischi di violare la Masquerade, e il Narratore può darti una penalità quando cerchi di rassicurare o convincere i mortali.`,
  'prestigious-sire': `Il tuo Sire (o il tuo padrone, se sei un ghoul) è stimato da una setta o da un clan che scegli: +2 dadi ai test Social con quel gruppo quando la sua reputazione ti aiuta. Con i loro rivali può diventare una penalità.`,
  prowess: `Aggiungi i tuoi pallini in Potence ai test di attacco a mani nude.`,
  'street-rat': `Scegli una città: ne conosci ogni strada e scorciatoia, +2 dadi per orientarti e trovare luoghi. A discrezione del Narratore puoi impararne un’altra con un’azione di downtime, al posto della prima.`,
  'subdued-hunger': `+2 dadi ai test di Self-Control per resistere alla frenesia da fame.`,
  'tough-skin': `La tua pelle è dura come cuoio: per Vampiric Endurance il tuo modificatore di generazione conta 1 in più.`,
  vengeance: `Scegli una persona, un gruppo o un’organizzazione che ti ha fatto un torto: +1 dado ai test che portano avanti la tua vendetta o che agiscono direttamente contro di loro, anche in conflitto. Se il bersaglio muore o sparisce dal gioco ne scegli un altro alla fine della storia.`,
  wrecker: `Aggiungi i tuoi pallini in Potence ai test di attacco in mischia contro oggetti inanimati.`,
};

/** Lifepaths, by id: the life behind the Skills and Resources. */
export const LIFEPATH_DETAILS: Record<string, string> = {
  academic: `Hai passato la vita a studiare e fare ricerca in un campo accademico: sai dove cercare le informazioni, come costruire una teoria e sei un esperto della tua materia.`,
  artist: `Scrittore, attore, pittore, designer, scultore o qualunque altro creativo. Forse ti sei dedicato a una sola arte, forse ne hai provate molte cercando il tuo modo di esprimerti.`,
  athlete: `Eri un atleta professionista: forza, agilità e resistenza affinate da anni di allenamento. Magari hai avuto una carriera di successo; ora quelle doti servono ad altro.`,
  conniver: `Vivevi di prontezza e parlantina, ingannando gli altri per ottenere ciò che volevi, per te o per conto di qualcuno. Da vampiro, quello che hai imparato vale oro.`,
  'corporate-executive': `Il tuo campo di battaglia è la sala del consiglio d’amministrazione. Fai ciò che serve per ottenere ciò che vuoi e sai usare chi ti sbarra la strada.`,
  criminal: `Ti guadagnavi da vivere infrangendo la legge, prendendo ciò che volevi o con metodi più sottili. Forse sei stato in prigione o hai lavorato in un’organizzazione, e qualcuno di quegli ambienti è ancora un tuo contatto.`,
  'holy-person': `Hai dedicato parte della vita a studiare e diffondere una fede. Scavando nella teologia e negli angoli più strani delle scritture potresti aver scoperto molto del mondo nascosto, prima di diventarne parte.`,
  investigator: `Risolvevi misteri e situazioni intricate cercando indizi e traendo conclusioni: detective della polizia, investigatore privato o semplicemente qualcuno che non sa smettere di cercare la verità.`,
  mechanic: `Costruivi, riparavi e modificavi motori, macchine e strutture. Magari eri specializzato in un ramo dell’ingegneria, ma ciò che sai si applica a molte situazioni.`,
  military: `Hai servito nelle forze armate e conosci la guerra e la sopravvivenza. Le armi sono gli attrezzi di cui ti fidi di più, e forse sei ancora in contatto con i compagni con cui sei passato dall’inferno.`,
  occultist: `Hai studiato in modo ossessivo ciò che gli altri chiamano superstizione: tomi polverosi, pergamene antiche, gli angoli bui di internet. Ora fai parte di quel mondo oscuro, e quelle conoscenze possono servirti.`,
  physician: `Hai studiato e praticato la medicina, con almeno una specializzazione. Sai curare gli altri e te stesso; anche se da vampiro serve meno, conosci il corpo umano meglio di chiunque.`,
  politician: `Facevi politica: leggi, accordi, battaglie per l’opinione pubblica. Hai imparato che il gioco si regge sulla trattativa e che gran parte di esso si svolge ben oltre i confini della legge.`,
  programmer: `Conosci molti linguaggi e sai creare, riparare o sabotare software e reti. Le tue capacità erano richieste sia da chi rispetta la legge sia da chi la ignora, e nell’epoca dell’intelligenza artificiale contano più che mai.`,
  scientist: `Facevi ricerca in uno o più campi scientifici, tra esperimenti e analisi dei dati. Hai imparato che tutto ha una spiegazione, e in un mondo pieno di mostri devi dimostrarlo ogni notte.`,
  technician: `Sai lavorare con le mani anche senza grandi basi teoriche: sei pieno di risorse e di solito trovi il modo di cavartela.`,
  therapist: `Curavi i disturbi mentali e del comportamento senza farmaci né chirurgia. La tua conoscenza della psiche ha aiutato molte persone e ora può aiutarti a capire la natura dei vampiri.`,
  tracker: `Sai seguire una preda, piazzare trappole e sopravvivere dove si nasconde. Forse sei cresciuto vicino alla natura selvaggia, forse cacciavi per sport; in ogni caso capisci la preda e lo usi a tuo vantaggio.`,
  'blood-deliverer': `I vampiri hanno bisogno di sangue, e alcuni hanno gusti precisi: tu lo trovavi e lo consegnavi. Forse ci hai visto un modo per arricchirti, forse gli anziani ti hanno costretto con la promessa di salire di rango.`,
  'clean-up-crew': `Quando le cose si mettevano male ti chiamavano per far sparire i problemi. Un lavoro sporco, forse imposto, forse scelto per guadagnare favori e boon da chi ne aveva bisogno.`,
  herald: `Lavoravi per le autorità vampiriche della città: accoglievi chi arrivava in Elysium o al Consiglio, annunciavi gli ospiti importanti e portavi i proclami del Principe o del Barone a chi non li aveva sentiti.`,
  hound: `Vale anche per Sweeper e Ductus. Eri il braccio armato dell’autorità locale: con l’addestramento e un po’ di potere tenevi sicuro il dominio e facevi rispettare le regole. Che tu ne abbia abusato o no, gli altri vampiri ti guardano con rancore.`,
  'mask-forger': `I vampiri hanno continuamente bisogno di documenti falsi e tu li fornivi. In una società che vive di menzogne eri prezioso, e lo sapevi sfruttare; il lavoro ti ha anche dato agganci nei bassifondi della società mortale.`,
  molotov: `Ogni setta ha qualche vampiro che, con o senza la sua benedizione, ne diffonde il messaggio, semina caos e convince altri a cambiare bandiera. Eri uno di loro: bravo a creare problemi agli altri e, si spera, a evitarli per te.`,
  'pack-priest': `Guida spirituale di un branco del Sabbat, con saggezza, fanatismo o entrambi. Accompagnavi il tuo branco verso ciò che è davvero: mostri in una fratellanza di mostri.`,
  'torpor-sentinel': `Ti era stato affidato un compito importante e pericoloso: vegliare su un vampiro antico in torpore. Forse ti ha scelto lui, forse un suo progenie, o forse i suoi nemici, per avvisarli se si fosse svegliato.`,
  'blood-genealogist': `Per i vampiri poche cose contano quanto la stirpe, e tu eri specializzato nel ricostruirla attraverso le generazioni. Probabilmente un patrono influente ti apriva archivi e scritti antichi, o hai raccolto tutto con anni di ricerche.`,
  chameleon: `Ti infiltravi in un’altra setta fingendo di farne parte, per spiare per la tua: raccoglievi informazioni, cercavi punti deboli, possibili alleati e convertiti. Un ruolo pericoloso, ma hai imparato ad andartene appena la maschera iniziava a creparsi.`,
  diplomat: `Vale anche per Emissary o Herald. Scelto per carisma, eloquenza e capacità di mimetizzarti, andavi nel dominio di un’altra setta per aprire un dialogo: a volte ti sei limitato a non farti cacciare, altre volte hai stretto alleanze.`,
  'elysium-guard': `La pace dell’Elysium era una tua responsabilità, dentro e fuori. Di solito bastavano due parole dure, ma ogni tanto dovevi occuparti di ego gonfiati e giovani teste calde che avevano bisogno di qualcosa di più.`,
  harpy: `Davi il tono alla società vampirica e decidevi la reputazione degli altri: tenevi il conto di chi doveva favori a chi, potevi innalzare o rovinare un nome e custodivi segreti che tutti cercavano di nascondere.`,
  sheriff: `Vale anche per Warlord. Facevi rispettare le leggi vampiriche e punivi chi le infrangeva: un ruolo di grande autorità e libertà, ma anche di grande responsabilità. Forse ne hai abusato, ma tutti temono le conseguenze di metterti contro.`,
};
