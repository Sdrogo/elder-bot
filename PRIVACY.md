# Informativa sulla privacy di ElderBot

Ultimo aggiornamento: 19 novembre 2026

ElderBot è un bot Discord che tira i dadi per Vampire: The Masquerade 6ª edizione. Questa pagina spiega quali dati tratta, perché e per quanto tempo.

## Dati raccolti

Il bot riceve da Discord solo le interazioni con i suoi comandi e pulsanti. Non legge i messaggi del canale, non ha accesso al loro contenuto e non raccoglie email, indirizzi IP o dati di pagamento.

Per far funzionare la partita salva, per ogni canale in cui viene usato:

- l'ID Discord del canale e degli utenti che tirano o che fanno da Narratore;
- i valori di gioco: il Masquerade Tracker e l'avanzamento dei compiti prolungati;
- i testi scritti nei comandi che devono restare tra un tiro e l'altro: i nomi dei compiti prolungati.

Se un giocatore crea un personaggio, o un Narratore una Cronaca, il bot salva anche, per ogni server:

- l'ID Discord del proprietario del personaggio e del Narratore della Cronaca;
- il personaggio: nome, clan, livello di gioco, Stamina, Composure, Resolve e i tracciati (Health, Vitae, Willpower, Humanity);
- la Cronaca: nome, setta, Masquerade Tracker, canale in cui si gioca e quali personaggi ne fanno parte;
- un registro delle modifiche ai tracciati (chi, cosa, quando), cancellato dopo 30 giorni.

Se usi il pannello web, al login Discord comunica al bot solo il tuo ID e il tuo nome visualizzato (permesso `identify`). Il bot salva una sessione con questi due dati e l'impronta del cookie di accesso; la sessione scade dopo 30 giorni o quando premi "Esci". Se il Narratore crea una chiave per l'overlay di OBS, il bot ne salva solo l'impronta e la data; la chiave permette solo di leggere la sua Cronaca in onda, muoverne i tracciati e scegliere quale Cronaca è in onda. Il pannello non usa cookie di tracciamento né servizi di analisi. Il traffico passa da Cloudflare, che ne è responsabile secondo la propria [informativa](https://www.cloudflare.com/privacypolicy/).

I risultati dei tiri, i dadi Fame, i motivi e i nomi visualizzati compaiono nei messaggi del bot su Discord ma non vengono salvati dal bot.

## Perché

I dati servono solo a far funzionare il gioco: tenere i punteggi di ogni tavolo e sapere chi è il Narratore. Non vengono usati per pubblicità o profilazione, non vengono venduti né ceduti a terzi.

## Dove e per quanto

I dati stanno in un database sul server privato di chi gestisce il bot, con una copia di sicurezza notturna sullo stesso server che viene sovrascritta dopo 14 giorni. Personaggi e Cronache restano finché il proprietario non li cancella (`/elder character delete`; una Cronaca archiviata resta salvata). Lo stato dei canali resta finché il Narratore non chiude la partita con `/elder session end`, che cancella lo stato del canale, o finché il bot non viene rimosso o spento. I log tecnici, che possono contenere ID Discord in caso di errore, vengono ruotati automaticamente.

## I tuoi diritti

Puoi vedere i tuoi personaggi con `/elder character list` e cancellarli con `/elder character delete`. Per tutto il resto puoi chiedere di vedere o cancellare i dati legati al tuo ID Discord aprendo una [issue su GitHub](https://github.com/Sdrogo/elder-bot/issues) (senza scrivere lì dati personali), oppure chiedere al Narratore di chiudere la partita nel tuo canale. Se sei nell'Unione Europea hai anche i diritti previsti dal GDPR, compreso il reclamo al Garante per la protezione dei dati personali.

## Discord

L'uso di Discord resta regolato dall'[Informativa sulla privacy di Discord](https://discord.com/privacy).

## Modifiche

Questa informativa può cambiare; la versione valida è quella pubblicata qui.
