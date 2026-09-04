# Contact Worker

Ce Worker reçoit le formulaire statique et transmet le message à Discord. Le webhook ne doit jamais être placé dans le dépôt ni dans le code client.

## Déploiement

Depuis ce dossier :

```bash
npx wrangler login
npx wrangler secret put DISCORD_WEBHOOK_URL
npx wrangler deploy
```

Le formulaire appelle `/api/contact` sur le même domaine que le portfolio. Le domaine `btmpierre.me` doit être géré par Cloudflare avec le proxy orange activé, puis la configuration `wrangler.toml` route uniquement `/api/contact*` vers le Worker. Le reste du site continue d'être servi par GitHub Pages.

Le Worker limite les requêtes à trois par minute et par adresse IP, vérifie l’origine, rejette les contenus trop longs et désactive les mentions Discord.