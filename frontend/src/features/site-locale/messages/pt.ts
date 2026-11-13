import type { SiteMessages } from "./en";

/** Brazilian Portuguese copy for the public site. Same shape as `en.ts`. */
export const pt: SiteMessages = {
  common: {
    getStarted: "Começar",
    comingSoon: "Em breve",
    homeAriaLabel: "Página inicial do Hone",
    language: "Idioma",
    useInBrowser: "Usar no navegador",
  },
  nav: {
    ariaLabel: "Navegação principal",
    product: "Produto",
    howItWorks: "Como funciona",
    getTheApp: "Baixe o app",
    openMenu: "Abrir menu",
    closeMenu: "Fechar menu",
  },
  footer: {
    tagline: "Afie o raciocínio que as entrevistas realmente avaliam.",
    groups: {
      product: "Produto",
      company: "Empresa",
      legal: "Legal",
    },
    links: {
      features: "Recursos",
      demo: "Demo",
      about: "Sobre",
      blog: "Blog",
      contact: "Contato",
      terms: "Termos",
      privacy: "Privacidade",
    },
    rights: "Hone. Todos os direitos reservados.",
    builtFor: "Feito para engenheiros que levam o ofício a sério.",
  },
  video: {
    playing: "Demo · Ao vivo",
  },
  backedBy: {
    label: "Apoiado por",
    ariaLabel:
      "Apoiado pela Borderless — abre borderlesscoding.com em uma nova aba",
  },
  hero: {
    titleStart: "Pratique a entrevista que",
    titleEmphasis: "define sua carreira",
    subtitle:
      "Entrevistas simuladas com IA, baseadas no seu currículo, para engenheiros de software — feedback estruturado, cobertura de tópicos e a prática que fica.",
    score: {
      tag: "Nota da entrevista",
      delta: "↑ 12 pts vs. última sessão",
    },
    topics: {
      tag: "Cobertura de tópicos",
      rows: [
        { topic: "System Design", level: "Forte" },
        { topic: "APIs", level: "Forte" },
        { topic: "Algoritmos", level: "Revisar" },
        { topic: "Trade-offs", level: "Evoluindo" },
        { topic: "Escalabilidade", level: "Forte" },
      ],
    },
    feedback: {
      title: "Feedback",
      tag: "System Design · App de corridas",
      body: "Você delimitou bem o gargalo. Aprofunde os trade-offs de consistência antes de propor shards.",
    },
    composerPlaceholder: "Pergunte qualquer coisa…",
    activation: {
      tag: "Ativação",
      delta: "↑ 5,5× vs. semana passada",
    },
  },
  socialProof: {
    eyebrow: "Usado por engenheiros de",
  },
  features: {
    title: "Afie seu raciocínio de engenharia",
    subtitle:
      "com entrevistas simuladas com IA feitas para engenheiros de software modernos.",
    pillars: {
      resume: {
        tag: "Currículo",
        title: "Construído a partir da sua experiência",
        description:
          "Nada de bancos de perguntas genéricas. O Hone cruza seu currículo com a vaga e monta entrevistas que exploram as lacunas que realmente aparecem nos processos seletivos.",
        cta: "Analisar meu currículo →",
        videoLabel:
          "Enviando um currículo em PDF no Hone e acompanhando o processamento",
      },
      session: {
        tag: "Prática",
        title: "Sessões ao vivo com IA",
        description:
          "Perguntas de follow-up que seguem seu raciocínio — trade-offs, gargalos e profundidade — para que respostas decoradas parem de funcionar.",
        cta: "Experimentar uma sessão →",
        videoLabel:
          "Escolhendo nível Júnior e 5 turnos, e iniciando uma entrevista ao vivo com IA",
      },
      review: {
        tag: "Revisão",
        title: "Feito para evolução real",
        description:
          "Cobertura de mais de 40 áreas, notas confiáveis e um relatório que mostra exatamente onde focar seus estudos.",
        cta: "Ver um relatório de exemplo →",
        videoLabel:
          "Feedback final e tópicos priorizados para revisar após uma sessão",
      },
    },
  },
  chatDemo: {
    eyebrow: "Demo ao vivo",
    title: "Veja a entrevista na prática",
    subtitle:
      "Uma sessão real do Hone: você responde e o entrevistador de IA aprofunda seu raciocínio com follow-ups ao vivo — como numa entrevista de verdade.",
    recordedLabel: "Gravado de uma sessão real",
    videoLabel:
      "Um candidato responde a uma pergunta e o entrevistador de IA transmite o follow-up em uma sessão real do Hone",
  },
  interviewDemo: {
    sessionTag: "Sessão de entrevista",
    labels: {
      role: "Cargo",
      company: "Empresa",
      difficulty: "Dificuldade",
      duration: "Duração",
      focusAreas: "Áreas de foco",
      context: "Contexto",
    },
    meta: {
      level: "Nível Sênior",
      role: "Engenheiro Backend",
      company: "Nubank",
      difficulty: "Sênior",
      duration: "45 min (Simulação)",
      focusAreas:
        "System Design, Sistemas Distribuídos, Escalabilidade, Trade-offs",
    },
    candidate: "Candidato",
    interviewer: "Entrevistador IA",
    timeLocale: "pt-BR",
    composePlaceholder: "Digite sua resposta…",
    composeHint: "Enter para enviar",
    sendAriaLabel: "Enviar mensagem",
    initialMessages: [
      "Vamos começar com uma pergunta de system design. Imagine que você está construindo um ledger de pagamentos distribuído na escala do Nubank. Como você lidaria com o trade-off entre consistência e disponibilidade quando ocorre uma partição de rede entre dois data centers?",
      "Eu priorizaria consistência forte para transações financeiras, usando um protocolo de consenso como Raft ou Paxos para eleição de líder. O custo é uma latência maior durante partições, mas evitamos cenários de gasto duplo. Para caminhos com muita leitura, usaria réplicas seguidoras com staleness limitado.",
      "Boa abordagem. Você mencionou eleição de líder — como lidaria com cenários de split-brain se a partição durar mais que o timeout do lease? Me explique sua estratégia de fencing.",
    ],
    context: {
      idle: "Analisando a resposta do candidato sobre o trade-off entre consistência e disponibilidade.",
      typing: "Avaliando a profundidade técnica da resposta sobre sistemas distribuídos…",
      complete:
        "Demo concluída. Crie uma conta para fazer uma entrevista completa e personalizada.",
    },
    turns: [
      {
        aiResponse:
          "Boa resposta sobre fencing tokens. Agora vamos mais fundo — se você usa um sistema baseado em quórum, o que acontece quando perde exatamente metade dos nós? Como decide se aceita escritas?",
        contextText:
          "Explorando a mecânica de quórum e as políticas de aceite de escrita em falhas parciais.",
      },
      {
        aiResponse:
          "Você tocou em tolerância a partições. Na prática, como desenharia sua camada de observabilidade para detectar e alertar sobre split-brain antes que ele corrompa dados? Quais métricas acompanharia?",
        contextText:
          "Avaliando o design de observabilidade para falhas de consenso distribuído.",
      },
      {
        aiResponse:
          "Última pergunta — se o time de produto pedir para relaxar a consistência em um caminho de leitura não crítico, como você documentaria e comunicaria esse trade-off para stakeholders não técnicos?",
        contextText:
          "Avaliando a comunicação de trade-offs técnicos para stakeholders não técnicos.",
      },
      {
        aiResponse:
          "Isso encerra esta sessão de demonstração. Você mostrou um raciocínio sistêmico sólido. Pronto para praticar com o seu currículo e perguntas sob medida? Crie uma conta gratuita e comece sua primeira entrevista simulada com IA.",
        contextText:
          "Demo concluída. Crie uma conta para fazer uma entrevista completa e personalizada.",
      },
    ],
  },
  previews: {
    eyebrow: "Depois de cada sessão",
    title: "Você responde. O Hone mostra exatamente onde você está.",
    dashboardTag: "Painel de progresso",
    feedbackTag: "Relatório de feedback",
    report: {
      tag: "Relatório da sessão",
      title: "System Design — App de corridas",
      metrics: [
        { label: "Pensamento independente", value: "Alto" },
        { label: "Respostas decoradas", value: "0" },
        { label: "Raciocínio validado", value: "100%" },
      ],
      strengthsTag: "Pontos fortes",
      strengths: [
        "Explicou trade-offs sem precisar de estímulo",
        "Identificou o gargalo da abordagem O(n²)",
        "Propôs uma estratégia de escala horizontal",
      ],
      growthTag: "Pontos a desenvolver",
      growthAreas: [
        "Aplicação do teorema CAP em casos de borda",
        "Latência vs. throughput",
        "Profundidade em algoritmos de consenso",
      ],
    },
    dashboard: {
      performanceScore: "Nota de desempenho",
      sessions: "Sessões",
      topicCoverage: "Cobertura de tópicos",
      topics: [
        "System Design",
        "Algoritmos",
        "Sistemas Distribuídos",
        "APIs & REST",
        "Modelagem de Dados",
        "Escalabilidade",
      ],
    },
  },
  quote: {
    title: "Por que candidatos estão migrando para o Hone",
    quote:
      "“Você não se eleva ao nível da entrevista. Você cai ao nível da sua preparação.”",
    attribution: "— A filosofia por trás do Hone",
  },
  installApp: {
    title: "Instale o app do Hone",
    body: "Pratique entrevistas em qualquer lugar. Adicione o Hone ao celular ou ao computador em segundos.",
    points: [
      "Abre em tela cheia, como um app nativo",
      "A um toque da tela inicial",
      "Sem loja de apps, sempre atualizado",
    ],
    getTheApp: "Baixe o app",
    howToInstall: "Como instalar",
  },
  cta: {
    title: "Experimente o Hone grátis. Primeira entrevista em menos de um minuto.",
    body: "Envie seu currículo ou use o modo demo. Sem cartão de crédito.",
  },
  download: {
    hero: {
      platforms: "Hone para iPhone, Android e desktop",
      launchNotice:
        "O app do Hone será lançado em breve. O acesso antecipado está disponível abaixo.",
      titleStart: "Pratique entrevistas",
      titleEmphasis: "onde estiver",
      subtitle:
        "Coloque o Hone na sua tela inicial. Entrevistas simuladas baseadas no seu currículo, feedback instantâneo e sua lista de estudos — a um toque, em tela cheia, sem loja de apps.",
    },
    phone: {
      caption:
        "Hone rodando como app instalado: uma entrevista de system design ao vivo, baseada no currículo, em um celular, com feedback da sessão e lista de estudos.",
      topic: "System Design",
      progress: "Pleno · Pergunta 3 de 6",
      live: "Ao vivo",
      interviewer: "Entrevistador IA",
      question:
        "Seu currículo cita um serviço de feed com 2M de DAU. Como você faria o sharding sem hot partitions?",
      answer:
        "Consistent hashing pelo ID do usuário e isolar as chaves de celebridades em um caminho fan-out-on-read.",
      followUp: "Boa. O que quebra primeiro quando uma celebridade posta",
      composer: "Digite sua resposta…",
      feedbackTag: "Feedback da sessão",
      feedbackBody:
        "Boa leitura dos trade-offs. Aprofunde em invalidação de cache.",
      backlogTag: "Lista de estudos",
      backlog: [
        { topic: "Invalidação de cache", tag: "Novo" },
        { topic: "Rate limiting", tag: "Revisar" },
      ],
    },
    benefits: {
      eyebrow: "Por que instalar",
      title: "O mesmo Hone, feito para os momentos que você realmente tem",
      items: [
        {
          title: "Foco em tela cheia",
          body: "Sem abas, sem barra de endereço. Só você e o entrevistador, como em um app nativo.",
        },
        {
          title: "A um toque da tela inicial",
          body: "Encaixe uma rodada no trajeto ou entre reuniões, sem caçar a aba certa.",
        },
        {
          title: "Leve e rápido",
          body: "Poucos toques para instalar, nada pesado para baixar. Abre direto nas suas sessões.",
        },
        {
          title: "Funciona em qualquer dispositivo",
          body: "iPhone, Android, Mac, Windows ou Linux. Mesma conta, mesmo progresso em todo lugar.",
        },
        {
          title: "Sem loja de apps",
          body: "Instale direto pelo navegador. Sem conta na loja, sem fila de aprovação.",
        },
        {
          title: "Sempre atualizado",
          body: "As melhorias chegam na próxima vez que você abrir. Nada para atualizar manualmente.",
        },
      ],
    },
    platforms: {
      eyebrow: "Como instalar",
      title: "Três passos em qualquer dispositivo",
      intro:
        "O Hone é instalado pelo navegador em menos de um minuto. Escolha seu dispositivo.",
      introDetected:
        "O Hone é instalado pelo navegador em menos de um minuto. Escolha seu dispositivo — já selecionamos o que você está usando.",
      tablistLabel: "Escolha seu dispositivo",
      tabs: {
        ios: {
          label: "iPhone e iPad",
          hint: "Safari",
          note: "Usando o Chrome ou outro navegador no iPhone? Abra esta página no Safari primeiro para uma instalação mais confiável.",
        },
        android: {
          label: "Android",
          hint: "Chrome",
          note: "O Samsung Internet também funciona: abra o menu e toque em Adicionar página a → Tela inicial.",
        },
        desktop: {
          label: "Desktop",
          hint: "Chrome, Edge, Safari",
          note: "O Hone instalado abre em uma janela própria e pode ser fixado no Dock ou na barra de tarefas.",
        },
      },
    },
    steps: {
      ios: [
        {
          title: "Toque em {icon} Compartilhar",
          detail:
            "No Safari, fica na barra de ferramentas inferior (ou superior, no iPad).",
          glyphLabel: "Compartilhar",
        },
        {
          title: "Escolha {icon} Adicionar à Tela de Início",
          detail: "Role a folha de compartilhamento se a opção não aparecer logo.",
          glyphLabel: "Adicionar",
        },
        {
          title: "Toque em Adicionar",
          detail: "O Hone aparece na sua tela inicial e abre em tela cheia.",
          glyphLabel: "",
        },
      ],
      android: [
        {
          title: "Abra o {icon} menu do Chrome",
          detail: "Ou toque no botão Instalar desta página quando ele aparecer.",
          glyphLabel: "Menu",
        },
        {
          title: "Toque em Instalar app",
          detail: "Em algumas versões, aparece como Adicionar à tela inicial.",
          glyphLabel: "",
        },
        {
          title: "Confirme em Instalar",
          detail: "O Hone aparece na gaveta de apps e na sua tela inicial.",
          glyphLabel: "",
        },
      ],
      desktop: [
        {
          title: "Abra o Hone no Chrome ou no Edge",
          detail: "No Mac com Safari, use Arquivo → Adicionar ao Dock.",
          glyphLabel: "",
        },
        {
          title: "Clique em {icon} na barra de endereço",
          detail: "Não vê o ícone? Abra o menu do navegador e procure Instalar Hone.",
          glyphLabel: "Instalar",
        },
        {
          title: "Clique em Instalar",
          detail:
            "O Hone ganha janela própria, ícone no Dock ou na barra de tarefas e atalho.",
          glyphLabel: "",
        },
      ],
    },
    faq: {
      eyebrow: "Dúvidas",
      title: "Perguntas frequentes",
      items: [
        {
          q: "O app é gratuito?",
          a: "Sim. Instalar o Hone não custa nada — é o mesmo Hone que você usa no navegador, com a mesma conta e o mesmo plano. Comece grátis, sem cartão de crédito.",
        },
        {
          q: "Quanto espaço ele ocupa?",
          a: "Muito pouco. O Hone é um web app, então não há download grande — seu dispositivo guarda só um ícone e um pequeno cache para abrir rápido. Suas entrevistas e seu progresso ficam na sua conta, não no celular.",
        },
        {
          q: "Preciso de conexão com a internet?",
          a: "Sim. O entrevistador de IA e o feedback rodam ao vivo, então as sessões de prática precisam de conexão — assim como no navegador.",
        },
        {
          q: "Como desinstalo?",
          a: "No iPhone ou Android, toque e segure o ícone do Hone e escolha Remover app ou Desinstalar. No computador, abra o Hone, use o menu da janela e escolha Desinstalar. Sua conta e seu histórico continuam intactos.",
        },
        {
          q: "É seguro?",
          a: "Sim. O Hone roda dentro do sandbox de segurança do navegador e é servido via HTTPS pelo mesmo site que você já usa. A instalação não pede acesso a contatos, localização nem qualquer permissão extra.",
        },
      ],
    },
    ctaBand: {
      title: "Sua próxima rodada de prática está a um toque.",
      body: "Instale o Hone e continue praticando onde estiver. Comece grátis.",
    },
    installCta: {
      installed: "O Hone está instalado neste dispositivo.",
      openHone: "Abrir o Hone",
      installHone: "Instalar o Hone",
      fineprint: "Grátis · Instala em segundos · Sem loja de apps",
      iosGuide: "Instale no iPhone em 3 toques",
      addToHomeScreen: "Adicionar à Tela de Início",
      safariGuide: "Abra esta página no Safari",
      safariBody:
        "No iPhone, a instalação funciona melhor pelo Safari. Copie o link, cole no Safari e toque em Compartilhar → Adicionar à Tela de Início.",
      safariNote:
        "Em versões recentes do iOS, alguns navegadores também oferecem Adicionar à Tela de Início no menu de compartilhamento.",
      androidGuide: "Instale no Android",
      keepInBrowser: "Ou continue usando o Hone no navegador",
      linkCopied: "Link copiado",
      copyLink: "Copiar link",
    },
  },
  installBanner: {
    title: "Instale o Hone",
    body: "Abra suas sessões de prática com um toque, em tela cheia.",
    installApp: "Instalar app",
    iosTap: "Toque em",
    iosShare: "Compartilhar",
    iosThen: "no Safari e depois em",
    iosAddToHomeScreen: "Adicionar à Tela de Início",
    dismiss: "Dispensar aviso de instalação",
  },
  comingSoonDialog: {
    title: "O app do Hone está chegando",
    body: "Ainda estamos desenvolvendo o app instalável. Enquanto isso, o Hone funciona muito bem direto no navegador — mesma conta, mesmo progresso.",
    useInBrowser: "Usar no navegador",
    gotIt: "Entendi",
  },
};
