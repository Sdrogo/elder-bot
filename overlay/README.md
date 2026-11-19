# Elder Overlay

Overlay per OBS con i tracciati dei personaggi di **Vampire: The Masquerade 6e (Alpha 2.0)**: Health, Vitae, Willpower, Humanity, Hunger dice e il Masquerade Tracker dello Storyteller. Ogni giocatore ha una cornice attorno alla propria webcam di Discord.

È un piccolo programma che gira **solo sul tuo PC**, accanto a OBS. Può funzionare da solo, oppure collegarsi al pannello web del bot e mostrare la Cronaca in onda (vedi [Collegamento al bot](#collegamento-al-bot)). In entrambi i casi sul tuo PC non apre niente verso Internet.

- **Cornici**: ogni personaggio è una Browser Source di OBS, con sfondo trasparente.
- **Pannello**: un Custom Browser Dock di OBS, con i pulsanti + e − e la gestione dei personaggi.
- **Stream Deck**: ogni tasto invia una richiesta HTTP al programma.
- **Stato**: tutti i valori stanno in `overlay/data/state.json` e restano salvati tra un avvio e l'altro.

## Cosa serve

- **Node.js 22.18 o più recente** (la versione LTS da [nodejs.org](https://nodejs.org) va bene). Il programma non ha altre dipendenze e non serve `npm install`.
- OBS Studio 28 o più recente.
- Per lo Stream Deck, un plugin che invii richieste HTTP **POST** con un header personalizzato, per esempio "API Ninja" o "Web Requests" dallo Stream Deck Store.

## Avvio

Su Windows fai doppio clic su `overlay/avvia-overlay.cmd` e lascia aperta la finestra mentre usi OBS. In alternativa, dalla cartella del repository:

```bash
npm run overlay
```

Il programma ascolta su `http://127.0.0.1:7777`. Per cambiare porta imposta la variabile `ELDER_OVERLAY_PORT`. Al primo avvio crea `overlay/data/token.txt`: è il codice segreto che lo Stream Deck deve inviare. Non condividerlo e non mostrarlo in diretta.

## Configurare OBS

1. **Pannello**: menu _Docks → Custom Browser Docks_, nome `Elder Overlay`, URL `http://127.0.0.1:7777/dock`. Da qui crei i personaggi con "+ Nuovo".
2. **Cattura di Discord**: una sola _Cattura finestra_ di Discord in vista griglia. Tieni la finestra di Discord sempre alla stessa dimensione.
3. **Un ritaglio per giocatore**: copia la cattura e incollala con _Incolla (riferimento)_, così il costo resta quello di una cattura sola. Su ogni copia ritaglia la webcam di un giocatore con Alt+trascina, o con il filtro _Ritaglia/Riempi_.
4. **Una sola Browser Source per tutte le cornici**: URL `http://127.0.0.1:7777/scena`, larghezza 1920, altezza 1080, posizione 0,0, sopra tutti i ritagli. Lascia il CSS personalizzato predefinito: lo sfondo è già trasparente. La pagina disegna una cornice per personaggio, tutte della stessa dimensione e in posizioni fisse, più quella dello Storyteller per ultima. Ogni cornice ha la forma 16:9 di una webcam di Discord; la griglia sceglie quante colonne usare per avere le cornici più grandi possibili e resta centrata.
5. **Metti ogni ritaglio nella sua cornice**: nel pannello apri "Posizioni dei ritagli nella scena", che elenca per ogni personaggio X, Y, larghezza e altezza. In OBS seleziona il ritaglio, premi Ctrl+E (_Modifica trasformazione_) e inserisci _Posizione_ X e Y; poi imposta _Tipo di riquadro di delimitazione_ su "Adatta all'interno" e _Dimensione del riquadro_ con larghezza e altezza. Le posizioni cambiano solo se aggiungi o togli un personaggio.
6. **Facoltativo**: sul ritaglio, il filtro _Maschera immagine/fusione_ arrotonda gli angoli della webcam.

Se qualcuno entra o esce dalla chiamata, Discord ridispone la griglia e quel ritaglio va rifatto.

Preferisci una sorgente per cornice? `http://127.0.0.1:7777/frame?pg=<id>` (l'id è nel pannello, per esempio `lucrezia`) o `?pg=storyteller` disegna una sola cornice che riempie la Browser Source.

### Stile

Ogni cornice è un passe-partout: un'unica fascia scura e semitrasparente attorno alla webcam, con un filo del colore del clan sul bordo. Nella fascia sopra ci sono simbolo, nome e clan; in quella sotto i numeri (Health 5/7, Willpower, Vitae, Humanity). Il danno baneful e le violations compaiono come ✕ rossa accanto al numero (Health 5/5 ✕2), e la Hunger è un d10 rosso accanto alla Vitae. I dadi Hunger non si cambiano a mano: seguono la Vitae come nella tabella Hunger Dice per Vitae (Player Packet p. 103), un dado ogni quinto circa di Vitae speso. Con massimo 10 (neonate) 9-8 Vitae danno 1 dado e 1-0 ne danno 5; con 15 (ancilla) e 20 (elder) le soglie si allargano allo stesso modo. Per avere le caselle della scheda aggiungi `&stile=caselle` all'URL della Browser Source. Con una Browser Source `/frame` la cornice lascia attorno a sé lo spazio per le fasce: allinea il ritaglio della webcam al filo colorato, non al bordo della sorgente.

Targhette, numeri e dadi hanno sempre la stessa dimensione, pensata per una scena 1920×1080: nella pagina `/scena` e ridimensionando una Browser Source `/frame` cambia solo la cornice. Per ingrandirli o rimpicciolirli aggiungi `&scala=`, per esempio `&scala=1.2` o `&scala=0.8` (da 0.3 a 3).

## Simboli di clan e sette

I simboli sono marchi di Paradox Interactive, quindi non stanno nel repository. Metti i PNG in `overlay/symbols/`: devono essere sagome bianche su sfondo trasparente, perché il programma le colora con il colore del clan. Se un file manca, la targhetta mostra solo il nome.

| File                                                                                        | Simbolo             |
| ------------------------------------------------------------------------------------------- | ------------------- |
| `banuhaqim.png`, `brujah.png`, `gangrel.png`, `hecata.png`, `lasombra.png`, `malkavian.png` | clan                |
| `ministry.png`, `nosferatu.png`, `ravnos.png`, `salubri.png`, `toreador.png`, `tremere.png` | clan                |
| `tzimisce.png`, `ventrue.png`, `caitiff.png`, `thinblood.png`                               | clan                |
| `camarilla.png`, `camarilla-v5.png`, `anarch.png`, `sabbat.png`                             | setta (Storyteller) |

## Collegamento al bot

Se usi il pannello web del bot, l'overlay può prendere da lì personaggi e tracciati della Cronaca **in onda**: quando metti in onda un'altra Cronaca (dal pannello, da Discord o dallo Stream Deck) le cornici cambiano da sole.

1. Nel pannello web, sezione **Overlay di OBS**, premi _Crea la chiave_ e copia indirizzo e chiave. La chiave si vede una volta sola.
2. Nel dock di OBS apri **Collega al bot**, incolla indirizzo (per esempio `https://panel.elderbot.party`) e chiave, e premi _Collega_.

Da quel momento:

- l'overlay chiede al bot lo stato ogni 3 secondi (la risposta è minima se non è cambiato niente);
- i pulsanti + e − del dock e i tasti dello Stream Deck cambiano i tracciati **sul bot**, quindi li vedono anche il pannello e Discord. I massimi derivano da Attributi e livello e si cambiano dal pannello web, come nome, clan e setta;
- se ci sono più Cronache, il dock mostra un pulsante per ognuna per metterla in onda;
- se il bot non risponde, le cornici restano con gli ultimi valori ricevuti: la diretta non si svuota.

La chiave sta in `overlay/data/bot.json`, leggibile solo dal tuo utente. Collegando, i personaggi locali vengono sostituiti da quelli della Cronaca in onda; _Scollega_ torna al funzionamento locale e lascia gli ultimi valori ricevuti. Per bloccare una chiave persa basta _Revoca_ o _Nuova chiave_ nel pannello web.

## Stream Deck

Ogni tasto è una richiesta **POST** a un indirizzo come questo, con l'header `X-Elder-Token` uguale al contenuto di `overlay/data/token.txt`:

```
http://127.0.0.1:7777/api/adjust?pg=lucrezia&track=health&delta=-1
```

| Parametro | Valori                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------- |
| `pg`      | id del personaggio (non serve per `masquerade`)                                                               |
| `track`   | `health`, `vitae`, `willpower`, `humanity`, `masquerade`                                                      |
| `field`   | `current` (predefinito); `baneful` e `max` per Health; `max` per Vitae e Willpower; `violations` per Humanity |
| `delta`   | quanto aggiungere, per esempio `-1` o `1` (predefinito `1`)                                                   |

Collegato al bot, un tasto per Cronaca la mette in onda: `POST http://127.0.0.1:7777/api/live?cronaca=<id>`, con lo stesso header. L'id della Cronaca compare passando il mouse sul suo pulsante nel dock (per esempio `testament`).

La risposta è `{"ok":true,"value":4}`, con il nuovo valore: alcuni plugin possono mostrarlo sul tasto. Per impostare un valore preciso usa `/api/set` con `value` al posto di `delta`. Se il plugin non permette header personalizzati, puoi usare `Authorization: Bearer <token>` oppure aggiungere `&token=<token>` all'indirizzo.

## Sicurezza

Il programma è pensato per non esporre niente fuori dal tuo PC:

- ascolta solo su `127.0.0.1`, quindi nessun altro dispositivo della rete può raggiungerlo, e il VPS non è coinvolto;
- ogni modifica richiede il token segreto, confrontato a tempo costante;
- rifiuta le richieste che arrivano da altri siti aperti nel browser (header `Origin`) e quelle indirizzate a un altro nome host (DNS rebinding);
- le pagine hanno una Content-Security-Policy restrittiva e mostrano nomi e testi sempre come testo, mai come HTML;
- i valori sono controllati e limitati alle regole di ogni tracciato, le richieste sopra 4 KB vengono rifiutate e uno `state.json` danneggiato viene messo da parte invece di bloccare l'avvio;
- le Browser Source leggono soltanto: il token compare solo nel pannello, che non va mai catturato in diretta.
