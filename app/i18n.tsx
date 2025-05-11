import i18n from 'i18next';
import { title } from 'process';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next) // Connects i18n to React
  .init({
    resources: {
      en: {
        translation: {
          menu: {
            about: "About",
            journey: "Journey",
            projects: "Projects",
            contact: "Contact",
            cv: "CV",
            mail: "Mail"
          },
          hero: {
            title: {
              fullstack: "Fullstack Developer",
              engineer: "Software Engineer",
              openSource: "and open-source contributor"
            },
            description: {
              phrase1: "Hey, I’m <strong>Arden BOUET</strong> a <strong>fullstack developer</strong> with a soft spot for clean code, smooth user experiences, and building digital tools that actually make life easier. I work mostly with <strong>Laravel</strong> and enjoy creating web apps, <strong>SaaS platforms</strong>, and automating everyday tasks to help things run better.",
              phrase2: "Whether it’s streamlining workflows or bringing new ideas to life, I’m all about building smart, scalable solutions with a practical edge. Always open to fun challenges, fresh ideas, and meaningful collaborations."
            }, 
            stack: "Technologies I love working with"
          },

          experiences: {
            title: "PROFESSIONAL EXPERIENCES",
            cardTitlte: "Professional Experiences",
            projects: {
              title: "Works",
              see: "See the project"
            },
            jobs: {
            
              petroleumProductionIntern: {
                title: "Petroleum Production Intern",
                where: "China National Petroleum Corporation International Tchad (CNPCIC) - Rônier / Mimosa / Baobab, Chad",
                when: "12/2012 ~ 10/2013",
                point1: "Conducted inspections and verification of oil and water production wells, ensuring operational efficiency and compliance with safety standards.",
                point2: "Collaborated on data input into the CNPCIC oilfield production database, enhancing system optimization while developing strong problem-solving and teamwork skills.",
                skills: "<b>Skills:</b> Natural Resources, Data Analysis, Oil Production, Problem-Solving, Communication, Technical Support, Team Collaboration, Operational Efficiency, Energy Systems."
              }

            },
            download: "Download my resume"
          },

          educations: {
            title: "EDUCATION AND TRAINING",
            schools: {
              school1: {
                title: "University of Nairobi",
                when: "11/2021 – 09/2025",
                where: "Kenya",
                detail: "PhD in Physics (Energy Specialization, including Renewable Energy)"
              },
            }, 

          },

          publications: {
            title: "PUBLICATIONS",
            posts: {
              post1: {
                author: 'Phd. MAHAMAT ADOUM ABDOULAYE',
                title: "Optimal Sizing of a Hybrid Solar-Wind System",
                date: "1 July 2024",
                desc: "Addressing Africa's electricity access challenges, particularly in Sub-Saharan Africa and Chad, through the adoption of hybrid solar-wind systems with energy storage to provide sustainable, affordable, and reliable power for rural electrification."
              },
              post2: {
                author: 'Phd. MAHAMAT ADOUM ABDOULAYE',
                title: "Optimal sizing of hybrid energy systems for rural electrification in Chad",
                date: "27 Feb 2024",
                desc: "Techno-economic and environmental optimization of a hybrid PV/Wind/Battery/Fuel Cell system for rural electrification in Chad."
              },
              post3: {
                author: 'Phd. MAHAMAT ADOUM ABDOULAYE',
                title: "PV intermittency impact on Senegal's grid frequency",
                date: "July 2020",
                desc: "Analyzing the impact of photovoltaic (PV) intermittency on frequency management in the Senegalese electricity grid."
              },
            },
          },

          contact: {
            title: "Do not hesitate to get in touch",
          }

        }
      },
      fr: {
        translation: {
          welcome: "Bienvenue",
          menu: {
            about: "À propos",
            journey: "Parcours",
            projects: "Projets",
            contact: "Contact",
            cv: "CV",
            mail: "Mail"
          },
          hero: {
            title: {
              fullstack: "Fullstack Developer",
              engineer: "Software Engineer",
              openSource: "et contributeur open source."
            },
            description: {
              phrase1: "Salut, moi c’est <strong>Arden BOUET</strong> <strong>développeur fullstack</strong> et artisan du code bien fait. J’ai un faible pour les interfaces fluides, les applis qui ont du sens, et les lignes de code qui simplifient la vie. Mon terrain de jeu préféré ? <strong>Laravel</strong>, les <strong>plateformes SaaS</strong> et tout ce qui permet d’automatiser les petites galères du quotidien. J’aime transformer les idées en solutions concrètes, élégantes et efficaces.",
              phrase2: "Qu’il s’agisse d’optimiser des flux de travail ou de donner vie à de nouvelles idées, je suis animé par la création de solutions intelligentes, évolutives et ancrées dans le concret. Toujours partant pour des défis stimulants, des idées neuves et des collaborations qui ont du sens."
            },
            stack: "Outils et technologies dans mon arsenal de dev"
          },
          experiences: {
            title: "EXPÉRIENCES PROFESSIONNELLES",
            cardTitlte: "Expériences Professionnelle",
            projects: {
              title: "Projets",
              see: "Voir le projet"
            },
            jobs: {
            
              petroleumProductionIntern: {
                title: "Stagiaire en Production de Pétrole",
                where: "China National Petroleum Corporation International Tchad (CNPCIC) - Rônier / Mimosa / Baobab, Tchad",
                when: "12/2012 ~ 10/2013",
                point1: "Réalisation des inspections et vérifications des puits de production de pétrole et d'eau, garantissant l'efficacité opérationnelle et le respect des normes de sécurité.",
                point2: "Collaboration sur l'entrée de données dans la base de données de production de pétrole CNPCIC, améliorant l'optimisation du système tout en développant de solides compétences en résolution de problèmes et travail en équipe.",
                skills: "<b>Compétences :</b> Ressources naturelles, Analyse des données, Production de pétrole, Résolution de problèmes, Communication, Support technique, Collaboration en équipe, Efficacité opérationnelle, Systèmes énergétiques."
              }
            },
            download: "Téléchargez mon CV"
          },
          educations: {
            title: "ÉDUCATION ET FORMATION",
            schools: {
              school1: {
                title: "Université de Nairobi",
                when: "11/2021 – 09/2025",
                where: "Kenya",
                detail: "Doctorat en Physique (Spécialisation Énergie, y compris Énergies Renouvelables)"
              },
              school2: {
                title: "Quant Energy Academy (École d'Ingénierie Logicielle pour l'Énergie)",
                when: "11/2024 – 11/2025",
                where: "Royaume-Uni",
                detail: "Formation avancée en Science des Données, Optimisation et Applications de l'Apprentissage Automatique dans l'Énergie"
              },
              school3: {
                title: "MIT Institute for Data, Systems, and Society (IDSS)",
                when: "06/2022 – 10/2022",
                where: "États-Unis d'Amérique",
                detail: "Certificat en Science des Données et Apprentissage Automatique : Prise de Décisions Basée sur les Données"
              },
              school4: {
                title: "KALU Institute | Centre d'Études d'Aide Humanitaire",
                when: "10/2021 – 09/2022",
                where: "Espagne",
                detail: "Master en Coopération Internationale et Aide Humanitaire"
              },
              school5: {
                title: "Université du Cap – École Supérieure de Commerce",
                when: "05/2021 – 10/2021",
                where: "Afrique du Sud",
                detail: "Florence School of Regulation | Italie, Enel Foundation | Italie, Programme Open Africa Power 2021 pour la nouvelle génération de leaders de l'Énergie Propre en Afrique, Régulation pour l'Objectif de Développement Durable 7"
              },
              school6: {
                title: "Université Gaston Berger de Saint-Louis",
                when: "06/2016 – 12/2018",
                where: "Sénégal",
                detail: "Master en Sciences et Technologies, Physique Appliquée, Spécialisation en Énergies Renouvelables"
              },
              school7: {
                title: "Institut des Énergies Renouvelables de Cologne / TH Köln - Université des Sciences Appliquées",
                when: "09/2017",
                where: "Allemagne",
                detail: "École d'Été (Énergies Renouvelables et Efficacité Énergétique)"
              },
              school8: {
                title: "Centre de Formation Sibérien Schlumberger",
                when: "08/2015 – 10/2015",
                where: "Tioumen, Russie",
                detail: "Formation Professionnelle en Prestation de Services et Technologie d'Intégrité des Puits"
              },
              school9: {
                title: "Centre d'Enseignement des Langues",
                when: "03/2014 – 06/2014",
                where: "Le Cap, Afrique du Sud",
                detail: "Cours Intensifs d'Anglais Technique et Général"
              },
              school10: {
                title: "Institut Universitaire du Pétrole de Mao",
                when: "11/2010 – 02/2014",
                where: "N'Djamena, Tchad",
                detail: "Licence en Exploitation des Hydrocarbures, spécialisation en Production Pétrolière"
              }
            }
          },

          publications: {
            title: "PUBLICATIONS",
            posts: {
              post1: {
                author: 'Dr. MAHAMAT ADOUM ABDOULAYE',
                title: "Dimensionnement optimal d'un système hybride solaire-éolien",
                date: "1 Juillet 2024",
                desc: "Aborder les défis d'accès à l'électricité en Afrique, en particulier en Afrique subsaharienne et au Tchad, à travers l'adoption de systèmes hybrides solaire-éolien avec stockage d'énergie pour fournir une énergie durable, abordable et fiable pour l'électrification rurale."
              },
              post2: {
                author: 'Dr. MAHAMAT ADOUM ABDOULAYE',
                title: "Dimensionnement optimal des systèmes énergétiques hybrides pour l'électrification rurale au Tchad",
                date: "27 Février 2024",
                desc: "Optimisation techno-économique et environnementale d'un système hybride PV/Éolien/Batterie/Pile à combustible pour l'électrification rurale au Tchad."
              },
              post3: {
                author: 'Dr. MAHAMAT ADOUM ABDOULAYE',
                title: "Impact de l'intermittence PV sur la fréquence du réseau du Sénégal",
                date: "Juillet 2020",
                desc: "Analyse de l'impact de l'intermittence photovoltaïque (PV) sur la gestion de la fréquence dans le réseau électrique sénégalais."
              },
            },
          }
          
          
        }
      },
    },
    lng: 'en', // Default language
    fallbackLng: 'en', // Fallback language if translation not found
    interpolation: {
      escapeValue: false, // React already handles escaping
    }
  });

export default i18n;
