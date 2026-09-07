# NeXoS_20 - Portfolio

Bienvenue sur le code source de mon portfolio interactif 3D, développé avec **Next.js**, **React Three Fiber** et **Tailwind CSS**.

## ✨ Fonctionnalités

- **Expérience 3D Interactive** : Clavier mécanique 3D rendu avec WebGL.
- **Thème sombre néon** : Interface utilisateur moderne avec des tons violets profonds (#8b5cf6, #7c3aed).
- **Statut Discord en temps réel** : Intégration de l'API Lanyard pour afficher mon activité (Visual Studio Code, Spotify, statut en ligne).
- **Système de Projets** : Fiches de présentation modulaires gérées via \data/projects.json\.
- **Formulaire de contact** : Directement intégré sans rechargement de page.

## 🛠️ Stack Technique

- **Framework** : Next.js 14 (App Router)
- **3D** : Three.js, React Three Fiber, Drei
- **Style** : Tailwind CSS
- **Animations** : Lenis (smooth scroll), Intersection Observer
- **Données** : Lanyard API

## 🚀 Installation & Développement

1. Clonez ce dépôt :
\\\ash
git clone https://github.com/nexos20lv/portfolio.git
cd portfolio
\\\

2. Installez les dépendances :
\\\ash
npm install
\\\

3. Lancez le serveur de développement :
\\\ash
npm run dev
\\\
Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur pour voir le résultat.

## 💡 Ajouter un Projet Facilement (`data/projects.json`)

Il suffit d'ajouter un nouvel objet dans `data/projects.json`. **Tous les champs techniques (numéro, section, alignement, highlights, icônes du clavier 3D, navigation latérale) sont 100% automatiques !**

Exemple minimal :
```json
{
  "name": "Mon Super Projet",
  "stack": ["Python", "FastAPI", "Docker"],
  "desc": "Description du projet en une ou deux phrases...",
  "github": "https://github.com/nexos20lv/mon-projet",
  "media": ["/projects/mon-image.jpg"]
}
```

- **Clavier 3D dynamique :** En faisant défiler la page jusqu'au projet, le clavier 3D fait une rotation et remplace automatiquement ses touches par la stack de ce projet (ex: Python, FastAPI, Docker), qui s'illuminent en surbrillance.
- **Barre latérale automatique :** Une nouvelle puce numérotée est ajoutée automatiquement avec son raccourci clavier.
- **Multilingue optionnel :** Vous pouvez fournir une simple chaîne de texte OU un objet `{ "fr": "...", "en": "..." }`.

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

