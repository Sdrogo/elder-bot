# elder-bot

Bot Discord per tirare i dadi con le regole del playtest di **Vampire: The Masquerade 6e (Alpha 2.0)**.

Le regole vengono dal Player Packet (cap. 4, "Rules of the Night") e dallo Storyteller Packet dell'Alpha 2.0:

- il pool è Attributo + Abilità (o Disciplina, o Composure + Resolve) più bonus e malus, e si tirano d10;
- un dado da **6 in su** è un successo, un **10 vale 2 successi**; vincere con un 10 è un **Critical Win**;
- la **Difficoltà** è il numero di successi da ottenere (non toglie più dadi); il bot mostra il margine di successo o di fallimento;
- nessun successo è un **Painful Failure**: oltre al fallimento arriva una complicazione;
- i **dadi Fame** (opzione `hunger`, da 0 a 5, oppure calcolati dalla Vitae del personaggio salvato) sostituiscono dadi normali; un fallimento con un 1 su un dado Fame è un **Bestial Failure**;
- **Willpower**: 1 punto per ritirare fino a 3 dadi normali, una volta per test;
- **Beast's Bargain** dopo un fallimento semplice, **Taking Half** fuori dallo stress, **Try again** con Difficoltà +1;
- niente più Quickening, Drama né Livello dei PNG.

## Comandi

La guida completa per i giocatori, in inglese, è in [docs/GUIDE.md](docs/GUIDE.md).

Tutti i comandi stanno sotto `/elder`, così il bot aggiunge una sola voce al server.

| Comando                                                                                                                                          | Cosa fa                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/elder roll dice \| attribute with [surge] [difficulty] [bonus] [hunger] [take_half] [reason] [npc]`                                            | Test standard, Power o Self-Control: pool come numero oppure dalla scheda (Attributo + Skill/specialità, Disciplina, potere, Attributo, lifepath), con Blood Surge. `npc` per un PNG. Pulsanti per Willpower, reroll ottimale, Beast's Bargain e Try again |
| `/elder contest dice \| attribute with [surge] [opponent] opponent_dice \| opponent_attribute opponent_with [hunger] [opponent_hunger] [reason]` | Test contrapposto: vince chi fa più successi; in parità l'Attributo più alto, poi chi ha iniziato. Pool come numero o dalle schede dei due giocatori                                                                                                       |
| `/elder prolonged start \| roll`                                                                                                                 | Compito prolungato: 3, 5, 7 o 10 successi in 3, 5 o 7 tiri; un Painful o Bestial Failure lo fa fallire subito. Pulsante per annullarlo                                                                                                                     |
| `/elder frenzy type [dice] [humanity] [hunger] [difficulty] [bonus]`                                                                             | Resistere alla frenesia: Composure + Resolve, al massimo tanti dadi quanta Umanità; per la frenesia da fame la Difficoltà sono i dadi Fame                                                                                                                 |
| `/elder masquerade`                                                                                                                              | Masquerade Tracker del tavolo (0-10), con i pulsanti −1, +1 e threat test per il Narratore                                                                                                                                                                 |
| `/elder sheet [character] [public]`                                                                                                              | Scheda del PG con i pulsanti + e − dei tracciati, Hunger calcolata dalla Vitae                                                                                                                                                                             |
| `/elder invite user [chronicle]`                                                                                                                 | Il Narratore invita un giocatore nella Cronaca; il giocatore sceglie il PG con un pulsante                                                                                                                                                                 |
| `/elder panel`                                                                                                                                   | Link al pannello web                                                                                                                                                                                                                                       |

Tutta la gestione di personaggi, Cronache e sessioni sta nel [pannello web](#pannello-web-facoltativo): creare, modificare, cedere o eliminare un PG; creare, modificare, archiviare o cedere una Cronaca; scegliere il canale del tavolo e la lingua; chiudere la sessione.

Esempi: `/elder roll dice:7 difficulty:2 hunger:1 reason:Scalare il muro`, oppure dalla scheda `/elder roll attribute:Dexterity 3 with:Fighting 2 · Hand-to-Hand +1 difficulty:3`. Discord passa da un campo all'altro col Tab.

### Come appaiono i tiri

Sopra il riepilogo del tiro il bot mostra i dadi come icone grandi, dal più alto al più basso, con il numero disegnato su ciascuna. I dadi Fame stanno su una seconda riga, in rosso:

- pallino grigio (rosso scuro per la Fame): da 1 a 5, fallimento;
- ankh verde (rosso per la Fame): da 6 a 9, successo;
- ankh acceso: 10, due successi;
- teschio rosso: 1 su un dado Fame, rischio di Bestial Failure.

Le icone sono emoji dell'applicazione: il bot le carica da solo all'avvio e sostituisce quelle vecchie quando cambiano. Con più di 27 dadi, o se le emoji non sono ancora caricate, i dadi compaiono come numeri nei campi **Dadi** e **Hunger**. Le immagini nascono dai disegni in `assets/dice/art`: dopo averli modificati rigenera le facce con `scripts/build-dice.sh` (serve ImageMagick).

Lo stato è salvato in un file SQLite: un canale corrisponde a un tavolo di gioco. Nel pannello il Narratore sceglie per ogni Cronaca il **canale del tavolo**: lì il Narratore è quello della Cronaca, il Masquerade Tracker è quello della Cronaca e i tiri prendono la Fame dai PG. "Chiudi sessione" nel pannello annulla i compiti prolungati ancora aperti in quel canale; Narratore, lingua e Masquerade Tracker restano, perché appartengono alla Cronaca. Gli amministratori del server (permesso Gestisci server) contano sempre come Narratore, così un tavolo non resta bloccato; in un canale senza Cronaca sono gli unici. Solo il Narratore può modificare il Masquerade Tracker e concedere o rifiutare un Beast's Bargain.

## Lingue

Il bot risponde a ciascuno nella lingua del suo client Discord: inglese, italiano, spagnolo, francese o tedesco, e inglese per tutte le altre lingue. Anche le descrizioni dei comandi seguono la lingua di Discord; i nomi dei comandi e delle opzioni restano in inglese.

Il Narratore può fissare nel pannello la lingua della Cronaca (`English`, `Italiano`, `Español`, `Français`, `Deutsch`): vale per tutti nel suo canale del tavolo. Lasciata vuota, ognuno riceve le risposte nella propria lingua di Discord.

I termini di gioco del playtest restano in inglese in ogni lingua: Hunger, Willpower, Painful Failure, Bestial Failure, Critical Win, Beast's Bargain, Taking Half, Try again, Masquerade Tracker e così via.

Per aggiungere una lingua copia `src/i18n/en.ts` in un nuovo file (ad esempio `src/i18n/pt.ts`, tipizzato `Messages` come `it.ts`), traduci i testi lasciando invariati i `{segnaposto}`, poi registralo in `src/i18n/index.ts` (`Locale`, `CATALOGS`, `LANGUAGE_NAMES` e il codice di Discord in `DISCORD_LOCALES`). I test controllano che il nuovo file abbia tutte le chiavi e gli stessi segnaposto. Dopo, registra di nuovo i comandi per pubblicare le descrizioni tradotte.

## Overlay per OBS

Le cornici attorno alle webcam (Health, Vitae, Willpower, Humanity, Hunger dice e Masquerade Tracker) si possono avere in due modi:

- **Dal bot** (con il [pannello web](#pannello-web-facoltativo) attivo): OBS apre le pagine direttamente dal VPS e mostra la Cronaca in onda, letta dal database. Ogni modifica, da Discord, dal pannello o dallo Stream Deck, arriva in circa un secondo. Sul PC non serve installare niente. Vedi [Overlay di OBS dal bot](#overlay-di-obs-dal-bot).
- **Con Elder Overlay sul PC**: la cartella [`overlay/`](overlay/README.md) contiene un programma che gira accanto a OBS, da solo o collegato al bot.

## Sviluppo in locale

Serve Node.js 22.

```bash
npm install
cp .env.example .env      # poi compila DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID
npm run deploy-commands:dev   # registra i comandi sul server di prova
npm run dev                   # avvia il bot e lo riavvia a ogni modifica
```

Controlli: `npm test`, `npm run typecheck`, `npm run lint`, `npm run format:check`.

Il token non va mai committato: `.env` è escluso da Git. Se finisce per sbaglio in chat o su GitHub, rigeneralo dal Developer Portal (Bot → Reset Token).

## Sicurezza

Nel [Developer Portal](https://discord.com/developers/applications):

- **Bot → Public Bot** disattivato, così solo tu puoi aggiungere il bot a un server;
- **Bot → Privileged Gateway Intents** tutti disattivati: il bot usa solo l'intent `Guilds`;
- invito con gli scope `bot` e `applications.commands` e solo i permessi View Channels, Send Messages, Embed Links e Use External Emojis (niente Administrator).

Sul server:

- `chmod 600 .env`, e nel gruppo `docker` solo il tuo utente (`docker inspect` mostra il token);
- il `compose.yaml` limita già memoria e processi, ruota i log e rende il container di sola lettura tranne `/data`;
- SSH solo con chiave, firewall aperto solo sulle porte necessarie, `unattended-upgrades` attivo.

Il bot non scrive menzioni: un `@everyone` scritto in un nome o in un motivo non notifica nessuno.

## Deploy su una VPS

Il bot gira in un container Docker su qualsiasi VPS Linux (Debian o Ubuntu), anche accanto ad altri container: non apre porte, è lui a collegarsi a Discord, e il `compose.yaml` ne limita memoria e processi.

1. Se sulla VPS non c'è già Docker, installalo:
   ```bash
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker $USER && exit   # poi ricollegati
   ```
2. Scarica il bot e crea il file `.env` direttamente sul server (non copiarlo da chat):
   ```bash
   git clone https://github.com/Sdrogo/elder-bot.git && cd elder-bot
   cp .env.example .env && nano .env && chmod 600 .env
   ```
3. Avvia il bot e registra i comandi:
   ```bash
   docker compose up -d --build
   docker compose run --rm elder-bot node dist/deploy-commands.js
   docker compose logs -f   # deve comparire "Connesso come ..."
   ```

### Aggiornare

```bash
cd ~/elder-bot && git pull && docker compose up -d --build
```

### Backup

Da quando il bot salva personaggi e Cronache, il database va copiato ogni notte. Sulla VPS, con `crontab -e`, aggiungi questa riga: alle 4:15 copia il database con il comando `.backup` di SQLite (sicuro anche con il bot acceso) e tiene le ultime 14 copie in `~/elder-bot-backup`.

```cron
15 4 * * * mkdir -p ~/elder-bot-backup && docker run --rm -v elder-bot_elder-bot-data:/data -v ~/elder-bot-backup:/backup alpine:3.22 sh -c 'apk add -q sqlite && sqlite3 /data/elder-bot.db ".backup /backup/elder-bot-$(date +\%F).db"' && ls -1t ~/elder-bot-backup/*.db | tail -n +15 | xargs -r rm
```

Il nome del volume dipende dalla cartella: se non è `elder-bot_elder-bot-data`, controllalo con `docker volume ls`. Per ripristinare, ferma il bot, copia un file di backup nel volume come `elder-bot.db` e riavvia.

Se l'aggiornamento cambia i comandi (nomi o opzioni), registrali di nuovo con `docker compose run --rm elder-bot node dist/deploy-commands.js`: sostituisce quelli vecchi. Ogni tanto aggiungi `--pull` alla build (`docker compose build --pull && docker compose up -d`) per scaricare le patch di sicurezza dell'immagine Node. I dati restano nel volume `elder-bot-data` e `restart: unless-stopped` riavvia il bot anche dopo un reboot.

Senza `DISCORD_GUILD_ID` i comandi vengono registrati su tutti i server e possono metterci fino a un'ora a comparire.

## Pannello web (facoltativo)

Un sito dove giocatori e Narratore entrano con il loro account Discord e gestiscono i propri personaggi senza comandi in chat: tracciati con i pulsanti +/−, nuovi PG, modifiche a nome, clan, livello e Attributi, eliminazione. Il Narratore crea e rinomina le sue Cronache, sceglie quale è in onda, muove la Masquerade, riordina i PG (l'ordine è quello dell'overlay) e li toglie dalla Cronaca; modifica i loro tracciati ma non può eliminarli. Sceglie anche il canale del tavolo e la lingua della Cronaca, chiude la sessione, archivia la Cronaca o la cede a un altro Narratore; il giocatore può cedere un suo PG a un altro. Gli inviti restano su Discord (`/elder invite`), perché il giocatore deve accettare. Sempre dal pannello il Narratore crea la chiave per collegare [Elder Overlay](overlay/README.md#collegamento-al-bot), che così mostra la Cronaca in onda. I PG nuovi si creano sui server Discord che hai in comune con il bot. Arriva da Internet solo attraverso un tunnel Cloudflare: il VPS non apre porte, e la porta del pannello (8080) non è pubblicata, la raggiunge solo il container `cloudflared`.

Serve un dominio gestito da Cloudflare (piano gratuito). Poi:

1. **Tunnel**: in Cloudflare apri _Zero Trust → Networks → Tunnels → Create a tunnel_, tipo _Cloudflared_, e copia il token che compare nel comando di installazione (la lunga stringa dopo `--token`). Non installare niente sul VPS: ci pensa Docker. Nella scheda _Public Hostname_ aggiungi `elder.tuodominio.it` con servizio `HTTP` e URL `elder-bot:8080`.
2. **Discord**: nel [Developer Portal](https://discord.com/developers/applications), app del bot → _OAuth2_: copia il _Client Secret_ (_Reset Secret_ se non lo vedi) e in _Redirects_ aggiungi `https://elder.tuodominio.it/callback`.
3. **`.env` sul VPS** (`nano .env`), con i valori dei passi precedenti:
   ```bash
   PANEL_URL=https://elder.tuodominio.it
   DISCORD_CLIENT_SECRET=...
   TUNNEL_TOKEN=...
   COMPOSE_PROFILES=panel
   ```
4. **Avvio**: `docker compose up -d --build`, poi `docker compose run --rm elder-bot node dist/deploy-commands.js` per il comando `/elder panel`. Nei log deve comparire "Pannello in ascolto sulla porta 8080", e `docker compose logs cloudflared` deve dire "Registered tunnel connection".
5. **Prova**: apri `https://elder.tuodominio.it`, premi "Accedi con Discord" e autorizza. Su Discord, `/elder panel` dà il link a chiunque.

### Overlay di OBS dal bot

Nel pannello, sezione **Overlay di OBS** (visibile a chi è Narratore di almeno una Cronaca):

1. **Browser Source**: copia l'indirizzo _Scena intera_ in una Browser Source di OBS grande quanto la risoluzione scelta in _Scena_ (1920×1080 o 2560×1440), posizione 0,0. Oppure usa gli indirizzi delle singole cornici, uno per PG più quello del Narratore. Gli indirizzi contengono una chiave di sola visione: chi la vede può solo guardare le cornici. _Nuovi indirizzi_ la cambia, e quelli vecchi smettono di funzionare.
2. **Webcam con VDO.Ninja**: su ogni PG del pannello, _Webcam per OBS → Attiva la webcam_ crea un link fisso (lo vedono solo il giocatore e il Narratore). Il giocatore lo apre nel browser del suo PC, sceglie la webcam e lascia la scheda aperta: la webcam compare dentro la sua cornice, nell'ordine della Cronaca, senza ritagli e senza oscurarsi se un'altra finestra va a schermo intero. Il link non manda il microfono: la voce resta su Discord. Il Narratore ha il suo link in _Scena → La tua webcam_. _Nuovo link_ cambia l'indirizzo e quello vecchio smette di comparire.
3. **Scena**: risoluzione (Full HD o 2K), disposizione delle cornici (_Griglia_, _Palco_ col Narratore grande in alto, _Ai lati_ con il centro libero per lo sfondo), lo sfondo (PNG, JPEG o WebP fino a 8 MB, salvato nel database del bot) e il riquadro in basso al centro con l'ultimo tiro della Cronaca in onda: dadi, successi ed esito (Critical Win, Bestial Failure...). Un tiro va alla Cronaca del canale, oppure alla Cronaca in onda dove chi tira ha un PG, oppure a quella in onda del Narratore che tira per un PNG. L'indirizzo _Solo il riquadro dei tiri_ lo mette in una Browser Source a parte.
4. **Ritagli**: chi cattura ancora le webcam in altro modo aggiunge `&webcam=0` all'indirizzo della scena e usa _Posizioni dei ritagli nella scena_ (X, Y, larghezza e altezza).
5. **Dock**: in OBS, _Docks → Custom Browser Docks_ con l'indirizzo del pannello. Fai login con Discord una volta e da lì muovi tracciati, Masquerade e Cronaca in onda.
6. **Stream Deck**: _Crea la chiave_ e usa una richiesta **POST** con l'header `X-Elder-Token` uguale alla chiave, per esempio `https://elder.tuodominio.it/api/overlay/adjust?pg=lucrezia&track=vitae&delta=-1` (gli stessi `track`, `field` e `delta` di Elder Overlay; `pg` è l'id nell'indirizzo della cornice). Per mettere in onda una Cronaca: `/api/overlay/live?cronaca=<id>`.
7. **Simboli dei clan**: sono di Paradox e non stanno nel repository. Copia i PNG nella cartella `symbols/` sul VPS, per esempio dal PC con `scp overlay/symbols/*.png debian@<vps>:~/elder-bot/symbols/`. Il bot li legge in sola lettura e li mostra solo con la chiave di visione.

Se il VPS non risponde le cornici si fermano sugli ultimi valori e si riprendono da sole.

Il login chiede a Discord solo il permesso `identify` (ID e nome). La sessione è un cookie `HttpOnly` e `Secure` che dura 30 giorni; nel database c'è solo la sua impronta. Ogni modifica richiede un token anti-CSRF, e i tentativi di login sono limitati a 10 al minuto per indirizzo. Per togliere il pannello basta svuotare `PANEL_URL` e `COMPOSE_PROFILES` e rifare `docker compose up -d`.

## Termini e privacy

[Termini di servizio](TERMS.md) · [Informativa sulla privacy](PRIVACY.md)
