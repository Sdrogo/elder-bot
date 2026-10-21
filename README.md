# elder-bot

Bot Discord per tirare i dadi con le regole del playtest di **Vampire: The Masquerade 6e (Alpha 1.0)**.

Le regole vengono dal Player Packet (cap. 4, "Rules of the Night") e dallo Storyteller Packet. Non sono quelle della V5:

- il pool è Attributo + Abilità − Difficoltà, mai sotto 0, e si tirano d10;
- un dado da **8 in su** è un successo, ogni successo oltre il primo è un successo extra;
- nessun 8+ ma almeno un 1 è un **Painful Failure** (Choose Your Pain);
- ogni 10 dà 1 **Quickening** (massimo 5, si azzera a fine sessione);
- con 4 o più dadi dopo la Difficoltà puoi prendere un successo base senza tirare (**Overqualified**, non in attacco o difesa);
- niente dadi Fame e niente critici a coppie di 10.

## Comandi

La guida completa per i giocatori, in inglese, è in [docs/GUIDE.md](docs/GUIDE.md).

Tutti i comandi stanno sotto `/elder`, così il bot aggiunge una sola voce al server.

| Comando                                                                                                              | Cosa fa                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/elder roll dice [difficulty] [bonus] [quickening] [combat] [reason] [ignore_traits]`                               | Test standard, Power o Self-Control. Pulsanti per Overqualified, No Dice Left, Devil's Bargain, Choose Your Pain e Try again                                               |
| `/elder contest dice (opponent_dice \| opponent_npc_level) [attribute] [opponent_attribute] [opponent] [difficulty]` | Test contrapposto. Pareggio tra PG: vince l'Attributo più alto. Contro un PNG: chi ha iniziato o decide il Narratore                                                       |
| `/elder prolonged start \| roll \| status \| cancel`                                                                 | Test prolungato: 3, 5, 7 o 10 successi in 3, 5 o 7 tiri                                                                                                                    |
| `/elder npc level`                                                                                                   | Test per un PNG: pool 2 × Livello, senza meccaniche da giocatore                                                                                                           |
| `/elder quickening show \| add \| spend \| success \| set`                                                           | Quickening del giocatore nel canale                                                                                                                                        |
| `/elder drama show \| add \| spend \| trait \| clear_traits`                                                         | Drama del Narratore. `trait` costa 2 Drama e aggiunge da −3 a +3 dadi a tutti i `/elder roll` della scena                                                                  |
| `/elder session new \| scene \| end \| storyteller \| language`                                                      | Nuova sessione (Quickening a 0, Drama = 1 per PG), nuova scena (via scene trait e Devil's Bargain), fine sessione (azzera tutto), Narratore del canale o lingua del tavolo |

Esempio: `/elder roll dice:7 difficulty:2 reason:Scalare il muro`. Discord passa da un campo all'altro col Tab.

### Come appaiono i tiri

Sopra il riepilogo del tiro il bot mostra i dadi come icone grandi, dal più alto al più basso, con il numero disegnato su ciascuna:

- teschio rosso: 1;
- pallino grigio con la cifra: da 2 a 7, fallimento;
- ankh verde: 8 e 9, successo;
- ankh verde acceso: 10, successo che dà Quickening.

Le icone sono emoji dell'applicazione: il bot le carica da solo all'avvio e sostituisce quelle vecchie quando cambiano. Con più di 27 dadi, o se le emoji non sono ancora caricate, i dadi compaiono come numeri nel campo **Dadi**. Le immagini nascono dai disegni in `assets/dice/art`: dopo averli modificati rigenera le facce con `scripts/build-dice.sh` (serve ImageMagick).

Lo stato (Quickening, Drama, scene trait, test prolungati) è salvato per canale in un file SQLite: un canale corrisponde a un tavolo di gioco. Ogni tavolo ha il suo **Narratore**: chi fa `/elder session new` in un canale che non ne ha ancora uno lo diventa, e può passare il ruolo con `/elder session storyteller user`. `/elder session end` chiude la partita: azzera lo stato del canale e libera il ruolo di Narratore. Gli amministratori del server (permesso Gestisci server) contano sempre come Narratore, così un tavolo non resta bloccato. Solo il Narratore può usare `/elder session`, `/elder drama` (tranne `show`), accettare o rifiutare un Devil's Bargain e modificare il Quickening di un altro giocatore. Chi tira non può rispondere al proprio bargain.

## Lingue

Il bot risponde a ciascuno nella lingua del suo client Discord: inglese, italiano, spagnolo, francese o tedesco, e inglese per tutte le altre lingue. Anche le descrizioni dei comandi seguono la lingua di Discord; i nomi dei comandi e delle opzioni restano in inglese.

Il Narratore può fissare la lingua del tavolo con `/elder session language`: una lingua (`English`, `Italiano`, `Español`, `Français`, `Deutsch`) vale per tutti nel canale, `Auto (Discord language)` torna alla lingua di ciascuno. `/elder session end` riporta il tavolo ad automatica.

I termini di gioco del playtest restano in inglese in ogni lingua: Quickening, Drama, Painful Failure, Devil's Bargain, Overqualified, No Dice Left, Choose Your Pain, Try again, scene trait e così via.

Per aggiungere una lingua copia `src/i18n/en.ts` in un nuovo file (ad esempio `src/i18n/pt.ts`, tipizzato `Messages` come `it.ts`), traduci i testi lasciando invariati i `{segnaposto}`, poi registralo in `src/i18n/index.ts` (`Locale`, `CATALOGS`, `LANGUAGE_NAMES` e il codice di Discord in `DISCORD_LOCALES`). I test controllano che il nuovo file abbia tutte le chiavi e gli stessi segnaposto. Dopo, registra di nuovo i comandi per pubblicare le descrizioni tradotte.

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

Se l'aggiornamento cambia i comandi (nomi o opzioni), registrali di nuovo con `docker compose run --rm elder-bot node dist/deploy-commands.js`: sostituisce quelli vecchi. Ogni tanto aggiungi `--pull` alla build (`docker compose build --pull && docker compose up -d`) per scaricare le patch di sicurezza dell'immagine Node. I dati restano nel volume `elder-bot-data` e `restart: unless-stopped` riavvia il bot anche dopo un reboot.

Senza `DISCORD_GUILD_ID` i comandi vengono registrati su tutti i server e possono metterci fino a un'ora a comparire.

## Termini e privacy

[Termini di servizio](TERMS.md) · [Informativa sulla privacy](PRIVACY.md)
