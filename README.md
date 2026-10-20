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

| Comando                                                                                                        | Cosa fa                                                                                                              |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `/roll dice [difficulty] [bonus] [quickening] [combat] [reason] [ignore_traits]`                               | Test standard, Power o Self-Control. Pulsanti per Overqualified, No Dice Left, Devil's Bargain e Try again           |
| `/contest dice (opponent_dice \| opponent_npc_level) [attribute] [opponent_attribute] [opponent] [difficulty]` | Test contrapposto. Pareggio tra PG: vince l'Attributo più alto. Contro un PNG: chi ha iniziato o decide il Narratore |
| `/prolonged start \| roll \| status \| cancel`                                                                 | Test prolungato: 3, 5, 7 o 10 successi in 3, 5 o 7 tiri                                                              |
| `/npc level`                                                                                                   | Test per un PNG controllato da un giocatore: pool 2 × Livello                                                        |
| `/quickening show \| add \| spend \| success \| set`                                                           | Quickening del giocatore nel canale                                                                                  |
| `/drama show \| add \| spend \| trait \| clear_traits`                                                         | Drama del Narratore. `trait` costa 2 Drama e aggiunge da −3 a +3 dadi a tutti i `/roll` della scena                  |
| `/session new \| scene`                                                                                        | Nuova sessione (Quickening a 0, Drama = 1 per PG) o nuova scena (via scene trait e Devil's Bargain)                  |

Lo stato (Quickening, Drama, scene trait, test prolungati) è salvato per canale in un file SQLite: un canale corrisponde a un tavolo di gioco. Al momento chiunque nel canale può usare i comandi del Narratore.

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

## Deploy su Oracle Cloud Always Free

1. Crea un account su [cloud.oracle.com](https://cloud.oracle.com) (serve una carta per la verifica; le risorse Always Free non vengono addebitate).
2. **Compute → Instances → Create instance**. Immagine: Ubuntu 24.04. Shape: **VM.Standard.A1.Flex** (ARM, Always Free) con 1 OCPU e 6 GB di RAM. Carica o genera la chiave SSH e scaricala.
3. Il bot si collega lui a Discord, quindi non serve aprire porte in ingresso oltre a SSH.
4. Collegati e installa Docker:
   ```bash
   ssh ubuntu@<IP-pubblico>
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker ubuntu && exit   # poi ricollegati
   ```
5. Scarica il bot e crea il file `.env` direttamente sul server (non copiarlo da chat):
   ```bash
   git clone https://github.com/Sdrogo/elder-bot.git && cd elder-bot
   cp .env.example .env && nano .env
   ```
6. Avvia il bot e registra i comandi:
   ```bash
   docker compose up -d --build
   docker compose run --rm elder-bot node dist/deploy-commands.js
   docker compose logs -f   # deve comparire "Connesso come ..."
   ```
7. Per aggiornare: `git pull && docker compose up -d --build`. I dati restano nel volume `elder-bot-data`; `restart: unless-stopped` riavvia il bot anche dopo un reboot.

Senza `DISCORD_GUILD_ID` i comandi vengono registrati su tutti i server e possono metterci fino a un'ora a comparire.
