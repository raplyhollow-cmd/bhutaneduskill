/**
 * TEACHING RESOURCES DATABASE
 *
 * Curated collection of teaching methods, YouTube videos, NCERT links,
 * and practice materials for Bhutanese middle school curriculum.
 *
 * This is static data that can be expanded over time.
 */

// ============================================================================
// TEACHING METHODS BY SUBJECT
// ============================================================================

export interface TeachingMethod {
  description: string;
  methods: string[];
  tips: string[];
}

export const teachingMethods: Record<string, Record<string, TeachingMethod>> = {
  math: {
    algebra: {
      description: "Algebraic expressions, equations, and problem-solving",
      methods: [
        "Visual method: Use algebra tiles and visual representations",
        "Step-by-step method: Break down complex problems into smaller steps",
        "Real-world application: Connect algebra to daily life situations",
        "Practice-driven: Lots of solved examples followed by practice problems"
      ],
      tips: [
        "Start with concrete examples before abstract concepts",
        "Use color coding for different terms in expressions",
        "Encourage students to explain their thinking process",
        "Use NCERT exemplar problems for advanced practice"
      ]
    },
    geometry: {
      description: "Shapes, angles, theorems, and proofs",
      methods: [
        "Hands-on: Use physical models and geometric tools",
        "Visualization: Draw diagrams for every problem",
        "Discovery learning: Let students discover theorems through activities",
        "Proof practice: Start with simple proofs, gradually increase complexity"
      ],
      tips: [
        "Always draw rough diagrams before solving",
        "Teach proper use of compass, protractor, and ruler",
        "Use GeoGebra for interactive demonstrations",
        "Connect geometry to real-life objects and architecture"
      ]
    },
    arithmetic: {
      description: "Number systems, fractions, decimals, percentages",
      methods: [
        "Concrete to abstract: Start with objects, then numbers",
        "Visual fraction models: Use fraction bars and circles",
        "Mental math strategies: Teach quick calculation techniques",
        "Word problems: Practice converting words to equations"
      ],
      tips: [
        "Use money and shopping examples for percentages",
        "Teach LCM and HCF visually with rectangular models",
        "Practice times tables daily for speed",
        "Use number lines for negative numbers"
      ]
    }
  },
  science: {
    physics: {
      description: "Force, motion, energy, electricity, and light",
      methods: [
        "Experiment-based: Learn by doing experiments",
        "Demonstration first: Show the concept, then explain theory",
        "Problem-solving approach: Apply concepts to solve problems",
        "Visual learning: Use simulations and videos"
      ],
      tips: [
        "Connect physics to everyday phenomena",
        "Use PhET simulations for virtual experiments",
        "Emphasize understanding units and dimensional analysis",
        "Practice drawing circuit diagrams and ray diagrams"
      ]
    },
    chemistry: {
      description: "Atoms, molecules, reactions, acids and bases",
      methods: [
        "Visual models: Use ball-and-stick models for molecules",
        "Lab experiments: Hands-on experience with reactions",
        "Periodic table patterns: Teach trends in the table",
        "Real-world connections: Chemistry in daily life"
      ],
      tips: [
        "Use color coding for different elements",
        "Teach balancing equations with visual methods",
        "Connect chemical reactions to cooking and digestion",
        "Practice writing chemical formulas regularly"
      ]
    },
    biology: {
      description: "Living organisms, cells, human body, ecosystems",
      methods: [
        "Observation: Use specimens and microscope work",
        "Diagrams: Draw and label biological structures",
        "Comparative study: Compare different organisms/systems",
        "Field activities: Nature walks and ecosystem observation"
      ],
      tips: [
        "Use diagrams extensively for plant and animal anatomy",
        "Connect body systems to real health issues",
        "Create food web and food chain activities",
        "Use models for cell structure and organ systems"
      ]
    }
  },
  english: {
    grammar: {
      description: "Parts of speech, tenses, sentence structure",
      methods: [
        "Pattern practice: Recognize and practice grammatical patterns",
        "Context-based: Learn grammar through reading and writing",
        "Error correction: Learn by finding and fixing mistakes",
        "Games and activities: Grammar through fun exercises"
      ],
      tips: [
        "Teach tenses with timeline visualizations",
        "Use color coding for different parts of speech",
        "Practice with sentences from textbooks and literature",
        "Connect grammar rules to writing improvement"
      ]
    },
    writing: {
      description: "Essays, reports, letters, and creative writing",
      methods: [
        "Process writing: Brainstorm, draft, revise, edit, publish",
        "Model texts: Study good examples before writing",
        "Peer review: Students give feedback on each other's work",
        "Writing prompts: Regular practice with varied topics"
      ],
      tips: [
        "Teach paragraph structure with topic sentences",
        "Use graphic organizers for essay planning",
        "Encourage reading to improve writing",
        "Provide specific, actionable feedback"
      ]
    },
    literature: {
      description: "Prose, poetry, drama, and literary analysis",
      methods: [
        "Active reading: Annotate, question, and connect while reading",
        "Discussion-based: Explore themes through class discussion",
        "Creative response: Respond through art, drama, or writing",
        "Comparative analysis: Compare different texts and themes"
      ],
      tips: [
        "Connect literature to students' lives and experiences",
        "Use multimedia adaptations (films, audio) alongside text",
        "Teach literary devices with examples from familiar media",
        "Encourage multiple interpretations of texts"
      ]
    }
  },
  dzongkha: {
    grammar: {
      description: "Dzongkha grammar, sentence structure, and composition",
      methods: [
        "Pattern practice: Learn grammatical patterns through repetition",
        "Text-based: Learn grammar from authentic Dzongkha texts",
        "Oral practice: Speak correctly to internalize grammar",
        "Writing practice: Apply grammar rules in composition"
      ],
      tips: [
        "Use authentic Dzongkha literature as models",
        "Connect grammar to speaking improvement",
        "Practice letter writing and formal composition",
        "Use traditional Dzongkha teaching methods alongside modern ones"
      ]
    }
  }
};

// ============================================================================
// YOUTUBE VIDEO RESOURCES
// ============================================================================

export const videoResources: Record<string, Record<string, Array<{
  title: string;
  url: string;
  duration: string;
  channel: string;
  level: "basic" | "intermediate" | "advanced";
}>>> = {
  math: {
    algebra: [
      {
        title: "Algebra Basics for Beginners",
        url: "https://www.youtube.com/watch?v=NybHckSEQBI",
        duration: "23:00",
        channel: "Khan Academy",
        level: "basic"
      },
      {
        title: "Introduction to Algebra",
        url: "https://www.youtube.com/watch?v=LwCRRUa8yTU",
        duration: "11:30",
        channel: "Khan Academy",
        level: "basic"
      },
      {
        title: "Algebraic Expressions - NCERT Class 10",
        url: "https://www.youtube.com/watch?v=kBqTEeEFcQc",
        duration: "15:45",
        channel: "M Learning India",
        level: "intermediate"
      },
      {
        title: "Linear Equations in One Variable",
        url: "https://www.youtube.com/watch?v=JF2kR4_zbr8",
        duration: "18:20",
        channel: "Khan Academy",
        level: "intermediate"
      },
      {
        title: "Quadratic Equations - Complete Chapter",
        url: "https://www.youtube.com/watch?v=iMjOVJ0XrLM",
        duration: "45:00",
        channel: "M Learning India",
        level: "advanced"
      }
    ],
    geometry: [
      {
        title: "Introduction to Geometry",
        url: "https://www.youtube.com/watch?v=302eJ3TzJQU",
        duration: "12:00",
        channel: "Khan Academy",
        level: "basic"
      },
      {
        title: "Triangles - NCERT Class 10",
        url: "https://www.youtube.com/watch?v=OnfclJYHULo",
        duration: "32:00",
        channel: "M Learning India",
        level: "intermediate"
      },
      {
        title: "Circles - Complete Chapter",
        url: "https://www.youtube.com/watch?v=Y53nE8LMdTg",
        duration: "28:00",
        channel: "M Learning India",
        level: "intermediate"
      }
    ],
    arithmetic: [
      {
        title: "Fractions - Introduction",
        url: "https://www.youtube.com/watch?v=n0FZhQ_GkKw",
        duration: "15:30",
        channel: "Khan Academy",
        level: "basic"
      },
      {
        title: "Percentage - NCERT Class 8",
        url: "https://www.youtube.com/watch?v=YGH1J74ffgg",
        duration: "22:00",
        channel: "M Learning India",
        level: "intermediate"
      }
    ]
  },
  science: {
    physics: [
      {
        title: "Force and Newton's Laws of Motion",
        url: "https://www.youtube.com/watch?v=KKWW7ZfMFcY",
        duration: "18:00",
        channel: "Khan Academy",
        level: "intermediate"
      },
      {
        title: "Electricity - NCERT Class 10",
        url: "https://www.youtube.com/watch?v=Qp28OHFT8_g",
        duration: "35:00",
        channel: "M Learning India",
        level: "intermediate"
      },
      {
        title: "Light - Reflection and Refraction",
        url: "https://www.youtube.com/watch?v=pTVgHE9pPfc",
        duration: "28:00",
        channel: "M Learning India",
        level: "intermediate"
      }
    ],
    chemistry: [
      {
        title: "Chemical Reactions and Equations",
        url: "https://www.youtube.com/watch?v=pO4ldDXt2a8",
        duration: "22:00",
        channel: "Khan Academy",
        level: "intermediate"
      },
      {
        title: "Acids, Bases and Salts - NCERT Class 10",
        url: "https://www.youtube.com/watch?v=k9Cw-GlH5vU",
        duration: "30:00",
        channel: "M Learning India",
        level: "intermediate"
      }
    ],
    biology: [
      {
        title: "Life Processes - NCERT Class 10",
        url: "https://www.youtube.com/watch?v=2L2YHCCNRg4",
        duration: "40:00",
        channel: "M Learning India",
        level: "intermediate"
      },
      {
        title: "Heredity and Evolution",
        url: "https://www.youtube.com/watch?v=9VS5-w22_mI",
        duration: "25:00",
        channel: "Khan Academy",
        level: "intermediate"
      }
    ]
  },
  english: {
    grammar: [
      {
        title: "Parts of Speech - Complete Lesson",
        url: "https://www.youtube.com/watch?v=hM0xEjPd2_I",
        duration: "20:00",
        channel: "English with Lucy",
        level: "basic"
      },
      {
        title: "Tenses - Past, Present, Future",
        url: "https://www.youtube.com/watch?v=VFJqVPp1bOw",
        duration: "18:00",
        channel: "Learn English",
        level: "intermediate"
      }
    ],
    writing: [
      {
        title: "How to Write an Essay",
        url: "https://www.youtube.com/watch?v=6uV0WjkP7Sg",
        duration: "14:00",
        channel: "Learn English",
        level: "basic"
      },
      {
        title: "Formal Letter Writing Format",
        url: "https://www.youtube.com/watch?v=JfdoX0p-5GM",
        duration: "12:00",
        channel: "SuccessCDs Education",
        level: "intermediate"
      }
    ]
  }
};

// ============================================================================
// NCERT LINKS
// ============================================================================

export const ncertLinks: Record<string, Record<string, string>> = {
  math: {
    algebra: "https://ncert.nic.in/textbook/pdf/mathem1.pdf", // Class 10
    geometry: "https://ncert.nic.in/textbook/pdf/mathem3.pdf", // Class 10
    arithmetic: "https://ncert.nic.in/textbook/pdf/mathe1.pdf" // Class 8
  },
  science: {
    physics: "https://ncert.nic.in/textbook/pdf/emsc1.pdf", // Class 10
    chemistry: "https://ncert.nic.in/textbook/pdf/emsc1.pdf", // Class 10
    biology: "https://ncert.nic.in/textbook/pdf/emsc1.pdf" // Class 10
  },
  english: {
    grammar: "https://ncert.nic.in/textbook/pdf/fe1.pdf", // Class 10
    writing: "https://ncert.nic.in/textbook/pdf/fe2.pdf" // Class 10
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getTeachingMethods(subject: string, topic?: string) {
  if (topic && teachingMethods[subject]?.[topic]) {
    return teachingMethods[subject][topic];
  }
  if (teachingMethods[subject]) {
    return Object.values(teachingMethods[subject])[0];
  }
  return null;
}

export function getVideosForTopic(subject: string, topic: string) {
  return videoResources[subject]?.[topic] || [];
}

export function getNCERTLink(subject: string, topic?: string) {
  if (topic && ncertLinks[subject]?.[topic]) {
    return ncertLinks[subject][topic];
  }
  if (ncertLinks[subject]) {
    return Object.values(ncertLinks[subject])[0];
  }
  return null;
}
