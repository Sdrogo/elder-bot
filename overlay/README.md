# Elder Overlay

Overlay per OBS con i tracciati dei personaggi di **Vampire: The Masquerade 6e (Alpha 2.0)**: Health, Vitae, Willpower, Humanity, Hunger dice e il Masquerade Tracker dello Storyteller. Ogni giocatore ha una cornice attorno alla propria webcam di Discord.

È un piccolo programma che gira **solo sul tuo PC**, accanto a OBS. Non è collegato al bot e non apre niente sul VPS.

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
4. **Una Browser Source per cornice**: URL `http://127.0.0.1:7777/frame?pg=<id>`, dove l'id è quello che il pannello mostra in "Indirizzi per OBS e Stream Deck" (per esempio `lucrezia`). Per lo Storyteller usa `?pg=storyteller`. Lascia il CSS personalizzato predefinito: lo sfondo è già trasparente.
5. **Un gruppo per giocatore**: metti nel gruppo il ritaglio sotto e la cornice sopra, poi spostali e ridimensionali insieme. La cornice si adatta a qualsiasi dimensione.
6. **Facoltativo**: sul ritaglio, il filtro _Maschera immagine/fusione_ arrotonda gli angoli della webcam.

Se qualcuno entra o esce dalla chiamata, Discord ridispone la griglia e quel ritaglio va rifatto.

### Stile

Le cornici mostrano i numeri (Health 5/7, Vitae 9/10…). Il danno baneful e le violations compaiono come nota rossa sotto il numero, e la Fame è un d10 rosso con il numero dentro. Per avere le caselle della scheda aggiungi `&stile=caselle` all'URL della Browser Source.

## Simboli di clan e sette

I simboli sono marchi di Paradox Interactive, quindi non stanno nel repository. Metti i PNG in `overlay/symbols/`: devono essere sagome bianche su sfondo trasparente, perché il programma le colora con il colore del clan. Se un file manca, la targhetta mostra solo il nome.

| File                                                                                        | Simbolo             |
| ------------------------------------------------------------------------------------------- | ------------------- |
| `banuhaqim.png`, `brujah.png`, `gangrel.png`, `hecata.png`, `lasombra.png`, `malkavian.png` | clan                |
| `ministry.png`, `nosferatu.png`, `ravnos.png`, `salubri.png`, `toreador.png`, `tremere.png` | clan                |
| `tzimisce.png`, `ventrue.png`, `caitiff.png`, `thinblood.png`                               | clan                |
| `camarilla.png`, `camarilla-v5.png`, `anarch.png`, `sabbat.png`                             | setta (Storyteller) |

## Stream Deck

Ogni tasto è una richiesta **POST** a un indirizzo come questo, con l'header `X-Elder-Token` uguale al contenuto di `overlay/data/token.txt`:

```
http://127.0.0.1:7777/api/adjust?pg=lucrezia&track=health&delta=-1
```

| Parametro | Valori                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------- |
| `pg`      | id del personaggio (non serve per `masquerade`)                                                               |
| `track`   | `health`, `vitae`, `willpower`, `humanity`, `hunger`, `masquerade`                                            |
| `field`   | `current` (predefinito); `baneful` e `max` per Health; `max` per Vitae e Willpower; `violations` per Humanity |
| `delta`   | quanto aggiungere, per esempio `-1` o `1` (predefinito `1`)                                                   |

La risposta è `{"ok":true,"value":4}`, con il nuovo valore: alcuni plugin possono mostrarlo sul tasto. Per impostare un valore preciso usa `/api/set` con `value` al posto di `delta`. Se il plugin non permette header personalizzati, puoi usare `Authorization: Bearer <token>` oppure aggiungere `&token=<token>` all'indirizzo.

## Sicurezza

Il programma è pensato per non esporre niente fuori dal tuo PC:

- ascolta solo su `127.0.0.1`, quindi nessun altro dispositivo della rete può raggiungerlo, e il VPS non è coinvolto;
- ogni modifica richiede il token segreto, confrontato a tempo costante;
- rifiuta le richieste che arrivano da altri siti aperti nel browser (header `Origin`) e quelle indirizzate a un altro nome host (DNS rebinding);
- le pagine hanno una Content-Security-Policy restrittiva e mostrano nomi e testi sempre come testo, mai come HTML;
- i valori sono controllati e limitati alle regole di ogni tracciato, le richieste sopra 4 KB vengono rifiutate e uno `state.json` danneggiato viene messo da parte invece di bloccare l'avvio;
- le Browser Source leggono soltanto: il token compare solo nel pannello, che non va mai catturato in diretta.
