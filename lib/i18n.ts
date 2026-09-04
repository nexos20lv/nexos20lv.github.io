export type Lang = "fr" | "en";

export const LANGUAGES: Lang[] = ["fr", "en"];
export const DEFAULT_LANG: Lang = "fr";

type Leaf = Record<Lang, string>;
type Node = Leaf | { [key: string]: Node };

function isLeaf(node: Node): node is Leaf {
  return typeof (node as Leaf).fr === "string";
}

export const DICT: Record<string, Node> = {
  header: {
    availability: { fr: "Disponible pour de nouvelles missions", en: "Available for hire" },
    lang: { fr: "FR", en: "EN" },
  },
  hero: {
    greeting: { fr: "Hello, je suis", en: "Hello, I am" },
    roleLine: { fr: "Je conçois des applications web et systèmes d'information robustes, alliant performance et design soigné.", en: "I design robust web applications and information systems, combining performance and clean design." },
    cv: { fr: "Mon CV", en: "My Resume" },
    hire: { fr: "Me contacter", en: "Contact me" },
    scroll: { fr: "Défiler vers le bas", en: "Scroll down" },
    keysHint: { fr: "Ou utilisez les touches 1-4", en: "Or use keys 1-4" },
  },
  stack: {
    title: { fr: "Expertise Technique", en: "Technical Stack" },
    hint: { fr: "Survolez (ou touchez) les touches pour en savoir plus", en: "Hover (or tap) the keys to reveal details" },
    hintMobile: { fr: "Mes compétences principales", en: "My core competencies" },
  },
  experience: {
    title: { fr: "Expérience", en: "Experience" },
    subtitle: { fr: "Un parcours riche en projets et en défis techniques.", en: "A rich journey of projects and technical challenges." },
  },
  projects: {
    title: { fr: "Projets Récents", en: "Recent Work" },
    viewMore: { fr: "Voir les détails", en: "View details" },
    kicker: { fr: "Projet", en: "Project" },
  },
  contact: {
    kicker: { fr: "Une idée de projet ?", en: "Have a project in mind?" },
    title: { fr: "Travaillons ensemble", en: "Let's build together" },
    body: { fr: "Je suis toujours ouvert aux nouveaux projets, missions freelance ou opportunités excitantes. Envoyez-moi un message !", en: "I'm always open to new projects, freelance gigs, or exciting opportunities. Reach out!" },
    copyEmail: { fr: "Copier l'email", en: "Copy email" },
    openMail: { fr: "Ouvrir votre messagerie", en: "Open mail app" },
    github: { fr: "GitHub", en: "GitHub" },
    linkedin: { fr: "LinkedIn", en: "LinkedIn" },
    footer: { fr: "Conçu et développé avec passion", en: "Designed & built with passion" },
  },
  nav: {
    home: { fr: "Accueil", en: "Home" },
    stack: { fr: "Compétences", en: "Stack" },
    experience: { fr: "Expérience", en: "Experience" },
    project: { fr: "Projet", en: "Project" },
    contact: { fr: "Contact", en: "Contact" },
    aria: { fr: "Navigation des sections", en: "Section navigation" },
  },
  picker: {
    language: { fr: "Changer de langue", en: "Switch language" },
    season: { fr: "Changer de saison", en: "Switch season" },
  },
  keyboard: {
    taglines: {
      javascript: { fr: "Le cœur du web", en: "The core of the web" },
      typescript: { fr: "JS avec des super-pouvoirs", en: "JS with superpowers" },
      html5: { fr: "La structure de tout", en: "The skeleton of the web" },
      css3: { fr: "Le style et la forme", en: "Style and shape" },
      tailwindcss: { fr: "Le CSS utilitaire et rapide", en: "Utility-first CSS" },
      python: { fr: "Le roi des scripts et de l'IA", en: "Scripts & AI king" },
      godotengine: { fr: "Création de jeux 2D/3D", en: "2D/3D Game Dev" },
      react: { fr: "Interfaces interactives", en: "Interactive UIs" },
      nextdotjs: { fr: "Le framework React ultime", en: "The React framework" },
      nodedotjs: { fr: "Le JS côté serveur", en: "Server-side JS" },
      electron: { fr: "Applications de bureau cross-platform", en: "Cross-platform desktop apps" },
      webrtc: { fr: "Communications temps réel P2P", en: "Real-time P2P communications" },
      arduino: { fr: "Électronique & IoT", en: "Electronics & IoT" },
      docker: { fr: "Conteneurisation", en: "Containerization" },
      git: { fr: "Contrôle de version", en: "Version control" },
    }
  },
  seasons: {
    spring: { fr: "Printemps", en: "Spring" },
    summer: { fr: "Été", en: "Summer" },
    autumn: { fr: "Automne", en: "Autumn" },
    winter: { fr: "Hiver", en: "Winter" },
  },
};

export function translate(path: string, lang: Lang): string {
  const keys = path.split('.');
  let current: Node | undefined = DICT;

  for (const key of keys) {
    if (!current || isLeaf(current)) {
      console.warn('Missing translation:', path);
      return path;
    }
    current = current[key];
  }

  if (current && isLeaf(current)) {
    return current[lang] || current[DEFAULT_LANG];
  }

  return path;
}
