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

| Comando                                                                                                             | Cosa fa                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `/elder roll dice [difficulty] [bonus] [hunger] [take_half] [reason]`                                               | Test standard, Power o Self-Control. Pulsanti per Willpower, Beast's Bargain e Try again                                                   |
| `/elder contest dice opponent_dice [opponent] [attribute] [opponent_attribute] [hunger] [opponent_hunger] [reason]` | Test contrapposto: vince chi fa più successi; in parità l'Attributo più alto, poi chi ha iniziato                                          |
| `/elder prolonged start \| roll \| status \| cancel`                                                                | Compito prolungato: 3, 5, 7 o 10 successi in 3, 5 o 7 tiri; un Painful o Bestial Failure lo fa fallire subito                              |
| `/elder npc dice [difficulty] [bonus] [take_half] [reason]`                                                         | Test per un PNG con il pool della sua scheda, senza meccaniche da giocatore                                                                |
| `/elder frenzy type [dice] [humanity] [hunger] [difficulty] [bonus]`                                                | Resistere alla frenesia: Composure + Resolve, al massimo tanti dadi quanta Umanità; per la frenesia da fame la Difficoltà sono i dadi Fame |
| `/elder masquerade show \| mark \| clear \| set \| threat`                                                          | Masquerade Tracker del tavolo (0-10) e threat test del Narratore                                                                           |
| `/elder session new [chronicle] \| end \| storyteller \| language`                                                  | Nuova sessione (con `chronicle` il canale gioca quella Cronaca), fine sessione, Narratore del canale o lingua del tavolo                   |
| `/elder character create \| sheet \| list \| set \| edit \| give \| delete`                                         | Personaggi dei giocatori, salvati sul VPS: scheda con pulsanti + e −, Hunger calcolata dalla Vitae                                         |
| `/elder chronicle create \| list \| live \| invite \| remove \| edit \| archive`                                    | Cronache del Narratore: giocatori, Masquerade Tracker, setta e Cronaca in onda                                                             |

Esempio: `/elder roll dice:7 difficulty:2 hunger:1 reason:Scalare il muro`. Discord passa da un campo all'altro col Tab.

### Come appaiono i tiri

Sopra il riepilogo del tiro il bot mostra i dadi come icone grandi, dal più alto al più basso, con il numero disegnato su ciascuna. I dadi Fame stanno su una seconda riga, in rosso:

- d10 grigio (rosso scuro per la Fame): da 1 a 5, fallimento;
- d10 verde (rosso per la Fame): da 6 a 9, successo;
- d10 verde acceso (rosso acceso per la Fame): 10, due successi;
- d10 nero con il numero rosso: 1 su un dado Fame, rischio di Bestial Failure.

Le icone sono emoji dell'applicazione: il bot le carica da solo all'avvio e sostituisce quelle vecchie quando cambiano. Con più di 27 dadi, o se le emoji non sono ancora caricate, i dadi compaiono come numeri nei campi **Dadi** e **Hunger**. Le facce sono disegnate da `scripts/build-dice.sh` (serve ImageMagick): per cambiare forma o colori modifica lo script e rilancialo.

Lo stato (test prolungati, Masquerade Tracker, Narratore, lingua) è salvato per canale in un file SQLite: un canale corrisponde a un tavolo di gioco. Ogni tavolo ha il suo **Narratore**: chi fa `/elder session new` in un canale che non ne ha ancora uno lo diventa, e può passare il ruolo con `/elder session storyteller user`. `/elder session end` chiude la partita: azzera lo stato del canale e libera il ruolo di Narratore, ma lascia il Masquerade Tracker, che appartiene alla cronaca. Gli amministratori del server (permesso Gestisci server) contano sempre come Narratore, così un tavolo non resta bloccato. Solo il Narratore può usare `/elder session`, modificare il Masquerade Tracker e concedere o rifiutare un Beast's Bargain.

## Lingue

Il bot risponde a ciascuno nella lingua del suo client Discord: inglese, italiano, spagnolo, francese o tedesco, e inglese per tutte le altre lingue. Anche le descrizioni dei comandi seguono la lingua di Discord; i nomi dei comandi e delle opzioni restano in inglese.

Il Narratore può fissare la lingua del tavolo con `/elder session language`: una lingua (`English`, `Italiano`, `Español`, `Français`, `Deutsch`) vale per tutti nel canale, `Auto (Discord language)` torna alla lingua di ciascuno. `/elder session end` riporta il tavolo ad automatica.

I termini di gioco del playtest restano in inglese in ogni lingua: Hunger, Willpower, Painful Failure, Bestial Failure, Critical Win, Beast's Bargain, Taking Half, Try again, Masquerade Tracker e così via.

Per aggiungere una lingua copia `src/i18n/en.ts` in un nuovo file (ad esempio `src/i18n/pt.ts`, tipizzato `Messages` come `it.ts`), traduci i testi lasciando invariati i `{segnaposto}`, poi registralo in `src/i18n/index.ts` (`Locale`, `CATALOGS`, `LANGUAGE_NAMES` e il codice di Discord in `DISCORD_LOCALES`). I test controllano che il nuovo file abbia tutte le chiavi e gli stessi segnaposto. Dopo, registra di nuovo i comandi per pubblicare le descrizioni tradotte.

## Overlay per OBS

La cartella [`overlay/`](overlay/README.md) contiene **Elder Overlay**, un programma separato dal bot. Mostra in OBS i tracciati dei personaggi (Health, Vitae, Willpower, Humanity, Hunger dice e Masquerade Tracker) come cornici attorno alle webcam, e si comanda da un pannello in OBS o dallo Stream Deck. Gira solo sul PC di chi trasmette e non viene incluso nell'immagine Docker del bot.

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

Un sito dove giocatori e Narratore entrano con il loro account Discord e vedono i propri personaggi e le proprie Cronache. Arriva da Internet solo attraverso un tunnel Cloudflare: il VPS non apre porte, e la porta del pannello (8080) non è pubblicata, la raggiunge solo il container `cloudflared`.

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

Il login chiede a Discord solo il permesso `identify` (ID e nome). La sessione è un cookie `HttpOnly` e `Secure` che dura 30 giorni; nel database c'è solo la sua impronta. Ogni modifica richiede un token anti-CSRF, e i tentativi di login sono limitati a 10 al minuto per indirizzo. Per togliere il pannello basta svuotare `PANEL_URL` e `COMPOSE_PROFILES` e rifare `docker compose up -d`.

## Termini e privacy

[Termini di servizio](TERMS.md) · [Informativa sulla privacy](PRIVACY.md)
