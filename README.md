# Studio Bot

Bot Discord + panel web pour le serveur communautaire d'un studio de jeux Roblox.

**MVP v1** — voir la section [Feuille de route](#feuille-de-route) pour ce qui n'est volontairement pas
encore implémenté.

---

## Sommaire

- [Fonctionnalités du MVP v1](#fonctionnalités-du-mvp-v1)
- [Stack technique](#stack-technique)
- [Installation](#installation)
- [Créer l'application Discord](#créer-lapplication-discord)
- [Configurer le fichier .env](#configurer-le-fichier-env)
- [Lancer le projet](#lancer-le-projet)
- [Permissions Discord nécessaires](#permissions-discord-nécessaires)
- [Utilisation du panel](#utilisation-du-panel)
- [Architecture](#architecture)
- [Ajouter une nouvelle action](#ajouter-une-nouvelle-action)
- [Limitations Discord connues](#limitations-discord-connues)
- [Sécurité](#sécurité)
- [Feuille de route](#feuille-de-route)

---

## Fonctionnalités du MVP v1

- Panel web protégé par connexion Discord (OAuth2)
- Envoi d'un message texte dans un salon depuis le panel
- Boutons Discord configurables déclenchant une action : donner / retirer / basculer un rôle,
  envoyer un message privé, ou répondre uniquement à l'utilisateur (éphémère)
- Message de bienvenue personnalisable (texte ou embed) avec variables
- Logs configurables (arrivée/départ, rôle modifié, interaction bouton, commande utilisée, erreurs)
- Commandes slash `/ping`, `/help`, `/setup`
- Support multi-serveur dès le départ (même si un seul serveur est utilisé au lancement)
- Architecture d'actions extensible pour ajouter facilement de nouvelles fonctionnalités

## Stack technique

| Composant | Choix | Pourquoi |
|---|---|---|
| Langage | TypeScript | Sécurité de typage pour un système d'actions génériques amené à grossir |
| Bot | discord.js v14 | API moderne (boutons, interactions), branche stable actuelle |
| Serveur web | Express | Écosystème mature, simplicité, suffisant pour un panel interne |
| Vues | EJS | HTML simple avec un minimum de logique, sans build frontend |
| Base de données | SQLite + Prisma | Zéro serveur à gérer, migrations versionnées, Prisma Studio pour inspecter les données |
| Auth panel | OAuth2 Discord (implémentation maison) | Pas de dépendance supplémentaire, contrôle total de la vérification des droits |

---

## Installation

Prérequis : Node.js 18.17 ou supérieur.

```bash
npm install
```

Cette commande installe les dépendances et exécute automatiquement `prisma generate`
(génère le client de base de données typé à partir de `prisma/schema.prisma`).

---

## Créer l'application Discord

1. Rends-toi sur le [portail développeur Discord](https://discord.com/developers/applications) et clique sur **New Application**.
2. Donne-lui un nom (ex : "Studio Bot"), puis va dans l'onglet **Bot** :
   - Clique sur **Reset Token** pour obtenir le token du bot → à mettre dans `DISCORD_TOKEN`.
   - Active **Server Members Intent** dans la section "Privileged Gateway Intents" (nécessaire pour les
     messages de bienvenue). Laisse **Message Content Intent** désactivé : le bot n'en a pas besoin.
3. Va dans l'onglet **OAuth2** :
   - Note le **Client ID** → `DISCORD_CLIENT_ID`.
   - Génère un **Client Secret** → `DISCORD_CLIENT_SECRET`.
   - Dans la section **Redirects**, ajoute exactement l'URL utilisée par le panel, par exemple
     `http://localhost:3000/auth/callback` en développement → à recopier dans `DISCORD_REDIRECT_URI`.
4. Toujours dans **OAuth2 > URL Generator** :
   - Coche le scope `bot` et `applications.commands`.
   - Dans "Bot Permissions", coche au minimum : *View Channels, Send Messages, Embed Links,
     Read Message History, Manage Roles* (voir le détail plus bas).
   - Utilise l'URL générée pour inviter le bot sur ton serveur.
5. Dans les paramètres du serveur Discord, place le rôle du bot **au-dessus** de tous les rôles
   qu'il devra attribuer (ex : "Joueur"), sinon il ne pourra pas les gérer (limitation native de
   Discord, voir plus bas).

## Configurer le fichier .env

```bash
cp .env.example .env
```

Remplis les valeurs obtenues à l'étape précédente, puis génère un secret de session :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Colle le résultat dans `SESSION_SECRET`.

## Lancer le projet

**Développement** (rechargement automatique) :

```bash
npm run dev
```

**Enregistrer les commandes slash** (à faire une fois, puis à chaque ajout/modification de commande) :

```bash
# En développement, mets DEV_GUILD_ID dans .env pour une propagation instantanée sur ton serveur de test.
npm run deploy-commands
```

**Production** :

```bash
npm run build
npm start
```

Le panel est alors accessible sur `http://localhost:3000` (ou le port choisi via `PORT`).

---

## Permissions Discord nécessaires

Le bot demande uniquement les permissions utilisées par les fonctionnalités actives, jamais
"Administrateur" :

| Permission | Utilisée pour |
|---|---|
| View Channels | Voir les salons où envoyer des messages/logs |
| Send Messages | Messages, bienvenue, logs, boutons |
| Embed Links | Embeds de bienvenue et de logs |
| Read Message History | Éditer les messages à boutons (ajout/suppression de boutons) |
| Manage Roles | Actions `ADD_ROLE` / `REMOVE_ROLE` / `TOGGLE_ROLE` |

Si tu ajoutes plus tard la modération (timeout/kick/ban) ou les salons vocaux, il faudra ajouter
les permissions correspondantes (`Moderate Members`, `Kick Members`, `Ban Members`, etc.).

---

## Utilisation du panel

1. Utilise `/setup` sur ton serveur Discord (réservé aux administrateurs) pour obtenir le lien direct,
   ou va directement sur `http://localhost:3000` et connecte-toi avec Discord.
2. Sélectionne ton serveur dans la liste.
3. Quatre sections : **Messages**, **Boutons**, **Bienvenue**, **Logs**.

### Boutons

Discord ne permet d'éditer que les messages envoyés par le bot lui-même — impossible d'ajouter un
bouton à un message arbitraire identifié par son ID. Le panel gère donc deux cas :

- **Créer un nouveau message** : le bot poste un nouveau message avec le contenu fourni et un premier
  bouton.
- **Ajouter à un message existant** : uniquement pour les messages déjà créés depuis ce panel — le
  bot édite le message pour y ajouter un bouton supplémentaire (jusqu'à 25 boutons par message, la
  limite imposée par Discord).

### Qui peut administrer le bot ?

Un utilisateur peut accéder au panel d'un serveur s'il a la permission Discord native
**Administrateur**, ou un rôle explicitement ajouté comme "rôle admin du bot" (fonctionnalité à
activer via la base de données pour l'instant — un écran dédié dans le panel est prévu en V1.1).
Cette vérification est toujours refaite côté serveur au moment de la requête, jamais déduite de ce
que le navigateur envoie.

---

## Architecture

```text
src/
├── bot/            → client Discord, commandes slash, événements
├── actions/        → moteur d'actions extensible (le cœur du système)
│   ├── engine.ts   → point d'entrée unique pour exécuter une action
│   └── handlers/   → un fichier par action (ADD_ROLE, SEND_DM, ...)
├── services/       → logique métier réutilisable (permissions, logs, OAuth2, boutons...)
├── web/            → panel Express (routes, vues EJS, middlewares)
├── database/       → client Prisma + store de sessions
├── config/         → variables d'environnement, intents, constantes
└── index.ts        → démarre le bot puis le serveur web
```

Le principe central : **le panel web et les boutons Discord appellent tous les deux le même moteur
d'actions** (`src/actions/engine.ts`). La logique de "donner un rôle" n'existe qu'à un seul endroit,
qu'elle soit déclenchée par un clic de bouton aujourd'hui ou par une autre source plus tard (message
programmé, commande, webhook Roblox...).

## Ajouter une nouvelle action

1. Ajoute le type dans `src/actions/types.ts` (`ActionType` + interface de payload).
2. Crée le handler dans `src/actions/handlers/` (même forme que les fichiers existants).
3. Enregistre-le dans `src/actions/handlers/index.ts`.

Rien d'autre à modifier : ni le panel web, ni le routeur d'interactions (`interactionCreate.ts`)
n'ont besoin de connaître les détails de la nouvelle action.

---

## Limitations Discord connues

- **Réponse éphémère sur réaction** : impossible techniquement. Une réaction emoji n'est pas une
  interaction Discord (pas de jeton d'interaction associé), donc aucune réponse visible uniquement
  par l'utilisateur n'est possible sur une réaction classique. C'est pour cette raison que ce projet
  utilise des **boutons** plutôt que des réactions pour toute action avec retour utilisateur.
- **Édition de message** : Discord ne permet d'éditer (donc d'ajouter un bouton à) que les messages
  envoyés par le bot lui-même.
- **Hiérarchie des rôles** : le bot ne peut jamais attribuer un rôle égal ou supérieur à son propre
  rôle le plus haut sur le serveur. Le panel affiche une erreur claire si ce cas se présente ; la
  seule solution est de déplacer le rôle du bot plus haut dans les paramètres du serveur.
- **Intents privilégiés** : `Server Members Intent` doit être activé manuellement dans le portail
  développeur. Si le bot dépasse 100 serveurs, Discord exige une vérification pour ces intents.
- **Délai de réponse aux interactions** : toute interaction (bouton, commande) doit recevoir une
  première réponse dans les 3 secondes, sous peine d'échec côté Discord.

---

## Sécurité

- Le token du bot et le secret OAuth2 ne sont jamais codés en dur : uniquement via `.env` (non versionné).
- Les droits d'administration du panel sont **toujours revérifiés côté serveur**, directement auprès
  du bot (fetch du membre + vérification de ses rôles/permissions), jamais déduits d'une donnée
  envoyée par le navigateur.
- Le scope OAuth2 demandé est volontairement réduit à `identify` : le panel ne demande jamais la
  liste des serveurs/permissions au nom de l'utilisateur.
- Les sessions sont signées et stockées côté serveur (SQLite), jamais en clair côté client.
- Les erreurs Node.js brutes ne sont jamais affichées à l'utilisateur ; elles sont journalisées côté
  serveur uniquement.

---

## Feuille de route

Fonctionnalités volontairement laissées de côté dans ce MVP, à ajouter une fois validées :

**Utile (V1.1)** : embeds complets pour les messages du panel, tickets, modération légère
(timeout/kick/ban), message de départ / boost serveur, écran dédié pour gérer les rôles admin du bot,
`/config`.

**Optionnel** : intégration Roblox (liaison de compte, synchronisation de grade de groupe), annonces
de mise à jour de jeu, messages programmés, rôles temporaires.
