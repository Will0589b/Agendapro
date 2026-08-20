export type ServiceIcon =
  | "scissors"
  | "heart"
  | "briefcase"
  | "graduation"
  | "camera"
  | "wrench"
  | "monitor"
  | "dumbbell"
  | "sparkles";

export type ServiceTemplate = {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: number;
  icon: ServiceIcon;
};

export const serviceTemplates: ServiceTemplate[] =
  [
    // Beleza

    {
      id: "haircut",
      name: "Corte de cabelo",
      category: "Beleza",
      description:
        "Corte de cabelo personalizado.",
      duration: 30,
      icon: "scissors",
    },
    {
      id: "male-haircut",
      name: "Corte masculino",
      category: "Beleza",
      description:
        "Corte masculino personalizado.",
      duration: 30,
      icon: "scissors",
    },
    {
      id: "female-haircut",
      name: "Corte feminino",
      category: "Beleza",
      description:
        "Corte feminino personalizado.",
      duration: 60,
      icon: "scissors",
    },
    {
      id: "beard",
      name: "Barba",
      category: "Beleza",
      description:
        "Modelagem e acabamento da barba.",
      duration: 30,
      icon: "scissors",
    },
    {
      id: "manicure",
      name: "Manicure",
      category: "Beleza",
      description:
        "Cuidados e acabamento das unhas.",
      duration: 45,
      icon: "sparkles",
    },
    {
      id: "pedicure",
      name: "Pedicure",
      category: "Beleza",
      description:
        "Cuidados e acabamento dos pés.",
      duration: 45,
      icon: "sparkles",
    },
    {
      id: "makeup",
      name: "Maquiagem",
      category: "Beleza",
      description:
        "Maquiagem profissional personalizada.",
      duration: 60,
      icon: "sparkles",
    },
    {
      id: "eyebrow",
      name: "Design de sobrancelhas",
      category: "Beleza",
      description:
        "Modelagem e design de sobrancelhas.",
      duration: 30,
      icon: "sparkles",
    },

    // Saúde e bem-estar

    {
      id: "medical-appointment",
      name: "Consulta",
      category: "Saúde e bem-estar",
      description:
        "Atendimento individual com horário marcado.",
      duration: 60,
      icon: "heart",
    },
    {
      id: "therapy",
      name: "Sessão de terapia",
      category: "Saúde e bem-estar",
      description:
        "Sessão individual de acompanhamento.",
      duration: 50,
      icon: "heart",
    },
    {
      id: "physiotherapy",
      name: "Fisioterapia",
      category: "Saúde e bem-estar",
      description:
        "Sessão individual de fisioterapia.",
      duration: 60,
      icon: "heart",
    },
    {
      id: "nutrition",
      name: "Consulta nutricional",
      category: "Saúde e bem-estar",
      description:
        "Avaliação e orientação nutricional.",
      duration: 60,
      icon: "heart",
    },
    {
      id: "massage",
      name: "Massagem",
      category: "Saúde e bem-estar",
      description:
        "Sessão de massagem e relaxamento.",
      duration: 60,
      icon: "heart",
    },

    // Educação

    {
      id: "private-class",
      name: "Aula particular",
      category: "Educação",
      description:
        "Aula individual personalizada.",
      duration: 60,
      icon: "graduation",
    },
    {
      id: "mentoring",
      name: "Mentoria",
      category: "Educação",
      description:
        "Sessão individual de mentoria.",
      duration: 60,
      icon: "graduation",
    },
    {
      id: "training",
      name: "Treinamento",
      category: "Educação",
      description:
        "Treinamento profissional personalizado.",
      duration: 90,
      icon: "graduation",
    },

    // Fotografia e vídeo

    {
      id: "photo-session",
      name: "Ensaio fotográfico",
      category: "Fotografia e vídeo",
      description:
        "Sessão fotográfica personalizada.",
      duration: 90,
      icon: "camera",
    },
    {
      id: "event-coverage",
      name: "Cobertura de evento",
      category: "Fotografia e vídeo",
      description:
        "Cobertura fotográfica de evento.",
      duration: 180,
      icon: "camera",
    },
    {
      id: "video-recording",
      name: "Gravação de vídeo",
      category: "Fotografia e vídeo",
      description:
        "Sessão profissional de gravação.",
      duration: 120,
      icon: "camera",
    },

    // Manutenção

    {
      id: "general-maintenance",
      name: "Manutenção geral",
      category: "Manutenção",
      description:
        "Avaliação e execução de manutenção.",
      duration: 60,
      icon: "wrench",
    },
    {
      id: "electrical-repair",
      name: "Manutenção elétrica",
      category: "Manutenção",
      description:
        "Avaliação e reparo elétrico.",
      duration: 60,
      icon: "wrench",
    },
    {
      id: "furniture-assembly",
      name: "Montagem de móveis",
      category: "Manutenção",
      description:
        "Serviço de montagem de móveis.",
      duration: 120,
      icon: "wrench",
    },

    // Tecnologia

    {
      id: "it-support",
      name: "Suporte de TI",
      category: "Tecnologia",
      description:
        "Suporte técnico para computadores e sistemas.",
      duration: 60,
      icon: "monitor",
    },
    {
      id: "computer-maintenance",
      name: "Manutenção de computador",
      category: "Tecnologia",
      description:
        "Diagnóstico e manutenção de computador.",
      duration: 90,
      icon: "monitor",
    },
    {
      id: "website-development",
      name: "Desenvolvimento de site",
      category: "Tecnologia",
      description:
        "Reunião para desenvolvimento de site.",
      duration: 60,
      icon: "monitor",
    },
    {
      id: "technology-consulting",
      name: "Consultoria de TI",
      category: "Tecnologia",
      description:
        "Consultoria especializada em tecnologia.",
      duration: 60,
      icon: "monitor",
    },

    // Atividade física

    {
      id: "personal-training",
      name: "Treino com personal",
      category: "Atividade física",
      description:
        "Treino individual acompanhado.",
      duration: 60,
      icon: "dumbbell",
    },
    {
      id: "physical-assessment",
      name: "Avaliação física",
      category: "Atividade física",
      description:
        "Avaliação física individual.",
      duration: 60,
      icon: "dumbbell",
    },

    // Serviços profissionais

    {
      id: "consulting",
      name: "Consultoria",
      category: "Serviços profissionais",
      description:
        "Atendimento de consultoria especializada.",
      duration: 60,
      icon: "briefcase",
    },
    {
      id: "business-meeting",
      name: "Reunião profissional",
      category: "Serviços profissionais",
      description:
        "Reunião individual com horário marcado.",
      duration: 60,
      icon: "briefcase",
    },
  ];