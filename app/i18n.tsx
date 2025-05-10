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
            projects: "Experiences",
            contact: "Contact",
            cv: "CV",
            mail: "Mail"
          },
          hero: {
            title: {
              strategist: "Sustainable Energy Strategist",
              engineer: "Energy & Petroleum Engineer"
            },
            description: {
              phrase1: "Hello, I am <strong>PhD. MAHAMAT ADOUM ABDOULAYE</strong>, an energy specialist with over a decade of experience in <strong>petroleum engineering</strong> and <strong>renewable energy</strong>. Having worked across Africa, Asia, and Europe, I am passionate about driving innovative and sustainable energy solutions. My expertise includes hybrid <strong>renewable energy systems</strong>, <strong>hydrogen storage</strong>, <strong>carbon capture technologies</strong>, and <strong>data-driven optimization</strong>.",
              phrase2: "Fluent in English, French, and Arabic, I excel at translating complex technical concepts into actionable strategies, fostering collaborations, and leading initiatives to address global energy and <strong>climate challenges</strong>."
            }, 
          },

          experiences: {
            title: "PROFESSIONAL EXPERIENCES",
            cardTitlte: "Professional Experiences",
            jobs: {
              // Job 1
              researchScientist:{
                title: "Research Scientist",
                where: "Distributed Energy Team, Korea Institute of Energy Research | Jeju, South Korea",
                when: "11/2022 ~ 12/2024",
                point1: "Led the development of renewable energy integration models, combining battery and hydrogen storage with sector coupling, optimizing energy efficiency and promoting carbon neutrality in diverse settings.",
                point2: "Designed long-duration energy storage systems and conducted advanced energy modeling, while providing technical assistance, fostering collaboration, and supporting financing for energy transition projects.",
                skills: "<b>Skills:</b> Energy Modeling, Written Communication, Power Systems Analysis, Digital Energy Solutions, Data Visualization, Capacity Building, oral and written communication skills, ability to work independently, Strategy Development, Technical Support, Renewable Energy Financing.",
              },

              energyExpert: {
                title: "Energy Expert",
                where: "Ginger SOFRECO, Central African Power Pool (PEAC) | N'Djamena, Chad",
                when: "06/2022 ~ 08/2022; 11/2021 ~ 01/2022",
                point1: "Analyzed regional energy frameworks and supported national investment plans, focusing on clean energy integration, energy access, and infrastructure improvement in Chad and neighboring regions.",
                point2: "Conducted data analysis for electricity systems planning, contributed to national electricity master plans, and provided strategic guidance on energy access and transition in low-income areas.",
                skills: "<b>Skills:</b> Power Systems, Data Collection, Energy Policy, International Development, Energy Efficiency, Transmission, Resource Mobilization, Strategy Development, Technical Support, Network Development, Clean Energy, Capacity Building, Research, Investment Operations, Financial Analysis."
              },
            
              chiefOperatingOfficer: {
                title: "Chief Operating Officer",
                where: "Group Business Services (GBS Group) | N’djamena, Chad",
                when: "06/2020 ~ 01/2022",
                point1: "Led the development and implementation of business strategies, driving digital transformation, renewable energy adoption, and sustainability goals, while managing budgets, data infrastructure, and risk management.",
                point2: "Directed international development efforts, fostering partnerships, providing technical assistance, and optimizing service delivery in ICT, energy efficiency, and artificial intelligence for business growth and global expansion.",
                skills: "<b>Skills:</b> Renewable Energy, Energy Efficiency, ambitious, taking initiative, Strategy Development, implementation of plans, Resource Mobilization, Technical Assistance, Network Development, Business Administration, Financial Analysis, Technical Support, Capacity Building, Operations Management, Communication, Negotiation, International Development."
              },
            
              lecturerPartTimeMao: {
                title: "Lecturer (Part-time)",
                where: "Institut National Supérieur de Pétrole de Mao | Mao, Chad",
                when: "07/2021 ~ 12/2021",
                point1: "Delivered lectures on oil and gas production, integrating renewable energy systems and sustainable solutions to address global energy transitions, while mentoring students in research methodologies.",
                point2: "Supported capacity building by guiding students in energy systems analysis, sustainability principles, and energy policy development, preparing them for careers in clean energy and resource management.",
                skills: "<b>Skills:</b> Energy Systems, Sustainable Development, Renewable Energy, excellent interpersonal skills, Mentorship, Research Methodologies, active listening, provide guidance, Capacity Building, Strategy Development, Communication, Technical Support, Teaching & Mentorship."
              },
            
              lecturerPartTimeIriba: {
                title: "Lecturer (Part-time)",
                where: "Institut National Supérieur du Sahara et du Sahel d’Iriba | Iriba, Chad",
                when: "11/2020 ~ 12/2020",
                point1: "Taught courses on electrical engineering, biomass, and biofuels, integrating renewable energy concepts with practical industry applications to address energy challenges and promote sustainable solutions.",
                point2: "Guided students through project-based learning, enhancing their skills in energy modeling, digital technologies, and energy system optimization for clean energy transitions.",
                skills: "<b>Skills:</b> Renewable Energy, Energy Modeling, Energy Efficiency, Sustainable Development, Mentorship, Teaching & Capacity Building, active listening, Technical Support, Research Methodologies, communication skills, Communication, Strategy Development."
              },
              assistantNetworkManager: {
                title: "Assistant Network Manager",
                where: "TotalEnergies Marketing Chad | N'Djamena, Chad",
                when: "10/2019 ~ 03/2020",
                point1: "Developed and optimized sales processes, product returns, and reimbursement mechanisms to enhance energy access solutions for solar energy products, improving affordability in both rural and urban areas.",
                point2: "Conducted financial analysis and collaborated with cross-functional teams to optimize product performance and profitability, ensuring alignment with sustainability goals and improving network efficiency.",
                skills: "<b>Skills:</b> Energy Access, Renewable Energy, Financial Analysis, Network Development, Clean Energy, Sales Process Optimization, Strategy Development, Resource Mobilization, Technical Support, Communication, Collaboration."
              },
            
              electricityProductionEngineerIntern: {
                title: "Electricity Production and Transmission Engineer (Intern)",
                where: "National Electricity Company of Chad (SNE) | N'Djamena, Chad",
                when: "07/2019 ~ 10/2019",
                point1: "Managed electricity production and transmission systems, ensuring security, efficiency, and high-quality service across the national grid to support energy access and sustainability goals.",
                point2: "Applied data-driven solutions and digital tools to optimize grid performance, enhance resilience, and collaborate with cross-functional teams to address operational challenges and improve energy infrastructure.",
                skills: "<b>Skills:</b> Energy Systems, Power Systems Management, Grid Optimization, Data Analysis, Renewable Energy, Transmission, Energy Efficiency, Digital Integration, Technical Support, Collaboration."
              },
            
              renewableEnergyEngineer: {
                title: "Renewable Energy Engineer",
                where: "Group Business Services (GBS) | N'Djamena, Chad",
                when: "03/2019 ~ 06/2019",
                point1: "Conducted economic assessments of hybrid solar photovoltaic systems to improve electrification and clean energy access across 10 provinces in Chad, promoting affordable, scalable solutions for businesses and households.",
                point2: "Collaborated with development partners to drive resource mobilization, lead feasibility studies, and design tailored energy solutions, ensuring alignment with sustainable development goals and energy efficiency.",
                skills: "<b>Skills:</b> Renewable Energy, Energy Efficiency, Feasibility Studies, Clean Energy, Economic Assessment, Resource Mobilization, Collaboration, Strategy Development, Technical Assistance, Energy Access."
              },
            
              renewableEnergySpecialist: {
                title: "Renewable Energy Specialist (Voluntary Work, Part-time)",
                where: "Greening Africa Together | Ziguinchor, Senegal",
                when: "12/2018 ~ 02/2019",
                point1: "Conducted demand assessments and technical evaluations for renewable energy systems, ensuring scalability, sustainability, and energy efficiency in both rural and urban environments.",
                point2: "Led financial feasibility studies and collaborated with multidisciplinary teams to implement digital solutions, driving the adoption of renewable energy and enhancing energy access in underserved regions.",
                skills: "<b>Skills:</b> Renewable Energy, Energy Modeling, Feasibility Analysis, Sustainable Energy Solutions, Project Management, Resource Mobilization, Economic Development, Climate Change Adaptation, Communication, International Development."
              },
            
              projectManagerAssistantEngineer: {
                title: "Project Manager Assistant Engineer",
                where: "National Electricity Company of Senegal (SENELEC) | Dakar, Senegal",
                when: "06/2018 ~ 11/2018",
                point1: "Managed renewable energy projects, conducting energy modeling and feasibility studies for rural and urban electrification, ensuring alignment with sustainability and clean energy goals.",
                point2: "Evaluated technical, financial, and investment aspects of projects, developing scalable, cost-effective solutions and supporting rural electrification efforts with a focus on green energy and digital integration.",
                skills: "<b>Skills:</b> Renewable Energy, Energy Modeling, Power Systems Analysis, Project Management, Energy Efficiency, Resource Mobilization, Sustainable Development, Technical Support, Strategy Development, Investment Operations."
              },

              wellIntegritySupervisor: {
                title: "Well Integrity / Well Construction / Field Operations Supervisor",
                where: "Schlumberger (Clients: ExxonMobil, ESSO, Glencore) | Chad",
                when: "10/2013 ~ 02/2016",
                point1: "Led well integrity operations using high-pressure testing and geochemical analysis to ensure the reliability and safety of energy infrastructure, promoting sustainable energy practices.",
                point2: "Conducted performance analysis and optimized operational efficiency, achieving zero safety incidents over two years through advanced safety protocols and risk management.",
                skills: "<b>Skills:</b> Energy Systems, Risk Management, Performance Analysis, Operational Optimization, Technical Support, Sustainable Practices, Communication, Team Leadership, Problem-Solving."
              },
            
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
              school2: {
                title: "Quant Energy Academy (School of Software Engineering for Energy)",
                when: "11/2024 – 11/2025",
                where: "United Kingdom",
                detail: "Advanced Training in Data Science, Optimization, and Machine Learning Applications in Energy"
              },
              school3: {
                title: "MIT Institute for Data, Systems, and Society (IDSS)",
                when: "06/2022 – 10/2022",
                where: "United States of America",
                detail: "Certificate in Data Science and Machine Learning: Making Data-Driven Decisions"
              },
              school4: {
                title: "KALU Institute | Center for Humanitarian Aid Studies",
                when: "10/2021 – 09/2022",
                where: "Spain",
                detail: "Master's in International Cooperation and Humanitarian Aid"
              },
              school5: {
                title: "University of Cape Town – Graduate School of Business",
                when: "05/2021 – 10/2021",
                where: "South Africa",
                detail: "Florence School of Regulation | Italy, Enel Foundation | Italy, Open Africa Power Program 2021 for new generation of Clean Energy for Africa leaders, Regulation for Sustainable Development Goal 7"
              },
              school6: {
                title: "Gaston Berger University of Saint-Louis",
                when: "06/2016 – 12/2018",
                where: "Senegal",
                detail: "Master's in Science and Technology, Applied Physics, Specialization in Renewable Energy"
              },
              school7: {
                title: "Cologne Institute of Renewable Energies / TH Köln - University of Applied Sciences",
                when: "09/2017",
                where: "Germany",
                detail: "Summer School (Renewable Energies and Energy Efficiency)"
              },
              school8: {
                title: "Schlumberger Siberian Training Center",
                when: "08/2015 – 10/2015",
                where: "Tyumen, Russia",
                detail: "Professional Training on Service Delivery and Well Integrity Technology"
              },
              school9: {
                title: "Language Teaching Centre",
                when: "03/2014 – 06/2014",
                where: "Cape-Town, South Africa",
                detail: "Intensive Technical and General English Courses"
              },
              school10: {
                title: "University Institute of Petroleum of Mao",
                when: "11/2010 – 02/2014",
                where: "N'Djamena, Chad",
                detail: "Bachelor's degree in Hydrocarbon Exploitation, specializing in Petroleum Production"
              }
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
            projects: "Expériences",
            contact: "Contact",
            cv: "CV",
            mail: "Mail"
          },
          hero: {
            title: {
              phd: "Doctorant Chercheur",
              strategist: "Stratège en Énergie Durable",
              engineer: "Ingénieur en Énergie et Pétrole"
            },
            description: {
              phrase1: "Bonjour, je suis <strong>Dr. MAHAMAT ADOUM ABDOULAYE</strong>, un spécialiste de l'énergie avec plus d'une décennie d'expérience en <strong>génie pétrolier</strong> et en <strong>énergies renouvelables</strong>. Ayant travaillé en Afrique, Asie et Europe, je suis passionné par la promotion de solutions énergétiques innovantes et durables. Mon expertise inclut les <strong>systèmes hybrides d'énergie renouvelable</strong>, le <strong>stockage de l'hydrogène</strong>, les <strong>technologies de capture du carbone</strong> et l'<strong>optimisation basée sur les données</strong>.",
              phrase2: "Parlant couramment l'anglais, le français et l'arabe, je suis expert dans la traduction de concepts techniques complexes en stratégies concrètes, la promotion des collaborations et la direction d'initiatives pour relever les défis mondiaux de l'énergie et du <strong>climat</strong>."
            }
          },
          experiences: {
            title: "EXPÉRIENCES PROFESSIONNELLES",
            cardTitlte: "Expériences Professionnelle",
            jobs: {
              // Job 1
              researchScientist: {
                title: "Chercheur scientifique",
                where: "Équipe Énergie Distribuée, Institut Coréen de Recherche en Énergie | Jeju, Corée du Sud",
                when: "11/2022 ~ 12/2024",
                point1: "Dirigé le développement de modèles d'intégration des énergies renouvelables, combinant le stockage par batterie et hydrogène avec le couplage des secteurs, optimisant l'efficacité énergétique et favorisant la neutralité carbone dans divers environnements.",
                point2: "Conçu des systèmes de stockage d'énergie de longue durée et réalisé des modélisations énergétiques avancées, tout en fournissant une assistance technique, en favorisant la collaboration et en soutenant le financement de projets de transition énergétique.",
                skills: "<b>Compétences :</b> Modélisation énergétique, Communication écrite, Analyse des systèmes énergétiques, Solutions énergétiques numériques, Visualisation des données, Renforcement des capacités, Compétences en communication orale et écrite, Capacité à travailler de manière autonome, Développement de stratégie, Support technique, Financement des énergies renouvelables."
              },
              
              energyExpert: {
                title: "Expert en énergie",
                where: "Ginger SOFRECO, Pool Énergétique de l'Afrique Centrale (PEAC) | N'Djamena, Tchad",
                when: "06/2022 ~ 08/2022; 11/2021 ~ 01/2022",
                point1: "Analyse des cadres énergétiques régionaux et soutien aux plans d'investissement nationaux, en se concentrant sur l'intégration des énergies propres, l'accès à l'énergie et l'amélioration des infrastructures au Tchad et dans les régions voisines.",
                point2: "Analyse des données pour la planification des systèmes électriques, contribution aux plans directeurs nationaux d'électricité et fourniture de conseils stratégiques sur l'accès à l'énergie et la transition dans les zones à faible revenu.",
                skills: "<b>Compétences :</b> Systèmes énergétiques, Collecte de données, Politique énergétique, Développement international, Efficacité énergétique, Transmission, Mobilisation des ressources, Développement de stratégie, Support technique, Développement des réseaux, Énergies propres, Renforcement des capacités, Recherche, Opérations d'investissement, Analyse financière."
              },
              
              chiefOperatingOfficer: {
                title: "Directeur des opérations",
                where: "Group Business Services (GBS Group) | N'Djamena, Tchad",
                when: "06/2020 ~ 01/2022",
                point1: "Dirigé le développement et la mise en œuvre de stratégies commerciales, stimulant la transformation numérique, l'adoption des énergies renouvelables et les objectifs de durabilité, tout en gérant les budgets, l'infrastructure des données et la gestion des risques.",
                point2: "Dirigé les efforts de développement international, favorisant les partenariats, fournissant une assistance technique et optimisant la prestation de services en TIC, efficacité énergétique et intelligence artificielle pour la croissance des entreprises et l'expansion mondiale.",
                skills: "<b>Compétences :</b> Énergie renouvelable, Efficacité énergétique, Ambition, Prise d'initiative, Développement de stratégie, Mise en œuvre de plans, Mobilisation des ressources, Assistance technique, Développement des réseaux, Administration des affaires, Analyse financière, Support technique, Renforcement des capacités, Gestion des opérations, Communication, Négociation, Développement international."
              },
            
              lecturerPartTimeMao: {
                title: "Lecteur (temps partiel)",
                where: "Institut National Supérieur de Pétrole de Mao | Mao, Tchad",
                when: "07/2021 ~ 12/2021",
                point1: "Animé des cours sur la production de pétrole et de gaz, intégrant des systèmes d'énergie renouvelable et des solutions durables pour aborder les transitions énergétiques mondiales, tout en guidant les étudiants dans les méthodologies de recherche.",
                point2: "Soutenu le renforcement des capacités en guidant les étudiants dans l'analyse des systèmes énergétiques, les principes de durabilité et le développement de politiques énergétiques, les préparant ainsi à des carrières dans l'énergie propre et la gestion des ressources.",
                skills: "<b>Compétences :</b> Systèmes énergétiques, Développement durable, Énergie renouvelable, Excellentes compétences interpersonnelles, Mentorat, Méthodologies de recherche, Écoute active, Fournir des conseils, Renforcement des capacités, Développement de stratégie, Communication, Support technique, Enseignement & Mentorat."
              },
            
              lecturerPartTimeIriba: {
                title: "Lecteur (temps partiel)",
                where: "Institut National Supérieur du Sahara et du Sahel d’Iriba | Iriba, Tchad",
                when: "11/2020 ~ 12/2020",
                point1: "Animé des cours en génie électrique, biomasse et biocarburants, intégrant des concepts d'énergies renouvelables avec des applications pratiques dans l'industrie pour aborder les défis énergétiques et promouvoir des solutions durables.",
                point2: "Guidé les étudiants à travers un apprentissage par projet, améliorant leurs compétences en modélisation énergétique, technologies numériques et optimisation des systèmes énergétiques pour des transitions vers les énergies propres.",
                skills: "<b>Compétences :</b> Énergie renouvelable, Modélisation énergétique, Efficacité énergétique, Développement durable, Mentorat, Enseignement & Renforcement des capacités, Écoute active, Support technique, Méthodologies de recherche, Compétences en communication, Communication, Développement de stratégie."
              },
            
              assistantNetworkManager: {
                title: "Assistant Gestionnaire de Réseau",
                where: "TotalEnergies Marketing Tchad | N'Djamena, Tchad",
                when: "10/2019 ~ 03/2020",
                point1: "Développé et optimisé les processus de vente, les retours de produits et les mécanismes de remboursement pour améliorer les solutions d'accès à l'énergie pour les produits solaires, améliorant l'accessibilité dans les zones rurales et urbaines.",
                point2: "Réalisation d'analyses financières et collaboration avec des équipes interfonctionnelles pour optimiser la performance des produits et la rentabilité, tout en assurant l'alignement avec les objectifs de durabilité et en améliorant l'efficacité du réseau.",
                skills: "<b>Compétences :</b> Accès à l'énergie, Énergie renouvelable, Analyse financière, Développement de réseau, Énergie propre, Optimisation du processus de vente, Développement de stratégie, Mobilisation des ressources, Support technique, Communication, Collaboration."
              },
            
              electricityProductionEngineerIntern: {
                title: "Ingénieur Production et Transmission d'Électricité (Stagiaire)",
                where: "Société Nationale d'Électricité du Tchad (SNE) | N'Djamena, Tchad",
                when: "07/2019 ~ 10/2019",
                point1: "Géré les systèmes de production et de transmission d'électricité, assurant la sécurité, l'efficacité et la qualité du service à travers le réseau national pour soutenir l'accès à l'énergie et les objectifs de durabilité.",
                point2: "Appliqué des solutions basées sur les données et des outils numériques pour optimiser la performance du réseau, améliorer la résilience et collaborer avec des équipes interfonctionnelles pour résoudre les défis opérationnels et améliorer les infrastructures énergétiques.",
                skills: "<b>Compétences :</b> Systèmes énergétiques, Gestion des systèmes électriques, Optimisation du réseau, Analyse des données, Énergie renouvelable, Transmission, Efficacité énergétique, Intégration numérique, Support technique, Collaboration."
              },
            
              renewableEnergyEngineer: {
                title: "Ingénieur en Énergie Renouvelable",
                where: "Group Business Services (GBS) | N'Djamena, Tchad",
                when: "03/2019 ~ 06/2019",
                point1: "Réalisation d'évaluations économiques des systèmes hybrides photovoltaïques solaires pour améliorer l'électrification et l'accès à l'énergie propre à travers 10 provinces du Tchad, favorisant des solutions abordables et évolutives pour les entreprises et les ménages.",
                point2: "Collaboration avec des partenaires de développement pour mobiliser des ressources, diriger des études de faisabilité et concevoir des solutions énergétiques sur mesure, tout en garantissant l'alignement avec les objectifs de développement durable et l'efficacité énergétique.",
                skills: "<b>Compétences :</b> Énergie renouvelable, Efficacité énergétique, Études de faisabilité, Énergie propre, Évaluation économique, Mobilisation des ressources, Collaboration, Développement de stratégie, Assistance technique, Accès à l'énergie."
              },
            
              renewableEnergySpecialist: {
                title: "Spécialiste en Énergie Renouvelable (Travail Volontaire, Temps Partiel)",
                where: "Greening Africa Together | Ziguinchor, Sénégal",
                when: "12/2018 ~ 02/2019",
                point1: "Réalisation d'évaluations de la demande et des évaluations techniques pour les systèmes d'énergie renouvelable, garantissant l'évolutivité, la durabilité et l'efficacité énergétique tant en milieu rural qu'urbain.",
                point2: "Dirigé des études de faisabilité financière et collaboré avec des équipes multidisciplinaires pour mettre en œuvre des solutions numériques, favorisant l'adoption des énergies renouvelables et améliorant l'accès à l'énergie dans les régions sous-desservies.",
                skills: "<b>Compétences :</b> Énergie renouvelable, Modélisation énergétique, Analyse de faisabilité, Solutions énergétiques durables, Gestion de projet, Mobilisation des ressources, Développement économique, Adaptation au changement climatique, Communication, Développement international."
              },
            
              projectManagerAssistantEngineer: {
                title: "Assistant Ingénieur Chef de Projet",
                where: "Société Nationale d'Électricité du Sénégal (SENELEC) | Dakar, Sénégal",
                when: "06/2018 ~ 11/2018",
                point1: "Gestion de projets d'énergie renouvelable, réalisation de modélisations énergétiques et d'études de faisabilité pour l'électrification rurale et urbaine, assurant l'alignement avec les objectifs de durabilité et d'énergie propre.",
                point2: "Évaluation des aspects techniques, financiers et d'investissement des projets, développement de solutions évolutives et rentables et soutien aux efforts d'électrification rurale avec un accent sur l'énergie verte et l'intégration numérique.",
                skills: "<b>Compétences :</b> Énergie renouvelable, Modélisation énergétique, Analyse des systèmes énergétiques, Gestion de projet, Efficacité énergétique, Mobilisation des ressources, Développement durable, Support technique, Développement de stratégie, Opérations d'investissement."
              },
            
              wellIntegritySupervisor: {
                title: "Superviseur de l'Intégrité des Puits / Construction de Puits / Opérations de Terrain",
                where: "Schlumberger (Clients : ExxonMobil, ESSO, Glencore) | Tchad",
                when: "10/2013 ~ 02/2016",
                point1: "Dirigé les opérations d'intégrité des puits en utilisant des tests à haute pression et des analyses géochimiques pour garantir la fiabilité et la sécurité des infrastructures énergétiques, promouvant des pratiques énergétiques durables.",
                point2: "Réalisation d'analyses de performance et optimisation de l'efficacité opérationnelle, obtenant zéro incident de sécurité en deux ans grâce à des protocoles de sécurité avancés et à la gestion des risques.",
                skills: "<b>Compétences :</b> Systèmes énergétiques, Gestion des risques, Analyse de performance, Optimisation des opérations, Support technique, Pratiques durables, Communication, Leadership d'équipe, Résolution de problèmes."
              },
            
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
      ar: {
        translation: {
          welcome: "مرحبا",
          menu: {
            about: "عن",
            journey: "الرحلة",
            projects: "التجارب",
            contact: "اتصال",
            cv: "السيرة الذاتية",
            mail: "البريد الإلكتروني"
          },
          hero: {
            title: {
              phd: "باحث دكتوراه",
              strategist: "استراتيجي الطاقة المستدامة",
              engineer: "مهندس طاقة و نفط"
            },
            description: {
              phrase1: "مرحبًا، أنا <strong>الدكتور. MAHAMAT ADOUM ABDOULAYE</strong>، متخصص في الطاقة مع أكثر من عقد من الخبرة في <strong>الهندسة البترولية</strong> و <strong>الطاقة المتجددة</strong>. بعد العمل في إفريقيا وآسيا وأوروبا، أنا شغوف بدفع الحلول الطاقوية المبتكرة والمستدامة. تشمل خبرتي <strong>أنظمة الطاقة المتجددة الهجينة</strong>، <strong>تخزين الهيدروجين</strong>، <strong>تقنيات احتجاز الكربون</strong> و <strong>التحسين المستند إلى البيانات</strong>.",
              phrase2: "أنا طليق في الإنجليزية والفرنسية والعربية، وأتفوق في ترجمة المفاهيم التقنية المعقدة إلى استراتيجيات قابلة للتنفيذ، وتعزيز التعاونات، وقيادة المبادرات لمواجهة التحديات العالمية في مجالي الطاقة و <strong>المناخ</strong>."
            }
          },

          experiences: {
            title: "الخبرات المهنية",
            cardTitlte: "الخبرات المهنية",
            jobs: {
              // Job 1
              researchScientist: {
                title: "عالم بحوث",
                where: "فريق الطاقة الموزعة، معهد كوريا لأبحاث الطاقة | جيجو، كوريا الجنوبية",
                when: "11/2022 ~ 12/2024",
                point1: "قدت تطوير نماذج تكامل الطاقة المتجددة، من خلال دمج تخزين البطاريات والهيدروجين مع الربط القطاعي، لتحسين كفاءة الطاقة وتعزيز الحياد الكربوني في بيئات متنوعة.",
                point2: "صممت أنظمة تخزين الطاقة على المدى الطويل وأجريت نمذجة متقدمة للطاقة، مع تقديم الدعم الفني وتعزيز التعاون ودعم تمويل مشاريع الانتقال إلى الطاقة.",
                skills: "<b>المهارات:</b> نمذجة الطاقة، التواصل الكتابي، تحليل أنظمة الطاقة، الحلول الرقمية للطاقة، تصوير البيانات، بناء القدرات، مهارات الاتصال الشفوي والكتابي، القدرة على العمل بشكل مستقل، تطوير الاستراتيجيات، الدعم الفني، تمويل الطاقة المتجددة."
              },
            
              energyExpert: {
                title: "خبير طاقة",
                where: "جينجر سوفرِكو، تجمع كهرباء أفريقيا الوسطى (PEAC) | نجامينا، تشاد",
                when: "06/2022 ~ 08/2022; 11/2021 ~ 01/2022",
                point1: "حللت الأطر الإقليمية للطاقة ودعمت خطط الاستثمار الوطنية، مع التركيز على دمج الطاقة النظيفة، وصول الطاقة، وتحسين البنية التحتية في تشاد والمناطق المجاورة.",
                point2: "أجريت تحليل بيانات لتخطيط أنظمة الكهرباء، وساهمت في خطط الكهرباء الوطنية، ووفرت توجيهًا استراتيجيًا حول وصول الطاقة والانتقال في المناطق ذات الدخل المنخفض.",
                skills: "<b>المهارات:</b> أنظمة الطاقة، جمع البيانات، سياسة الطاقة، التنمية الدولية، كفاءة الطاقة، النقل، تعبئة الموارد، تطوير الاستراتيجيات، الدعم الفني، تطوير الشبكات، الطاقة النظيفة، بناء القدرات، البحث، العمليات الاستثمارية، التحليل المالي."
              },
              
              chiefOperatingOfficer: {
                title: "المدير التنفيذي للعمليات",
                where: "خدمات الأعمال الجماعية (GBS Group) | نجامينا، تشاد",
                when: "06/2020 ~ 01/2022",
                point1: "قدت تطوير وتنفيذ استراتيجيات الأعمال، ودفع التحول الرقمي، واعتماد الطاقة المتجددة، وأهداف الاستدامة، مع إدارة الميزانيات، البنية التحتية للبيانات، وإدارة المخاطر.",
                point2: "أدرت الجهود الدولية للتنمية، مع تعزيز الشراكات، وتقديم الدعم الفني، وتحسين تقديم الخدمات في مجالات تكنولوجيا المعلومات، كفاءة الطاقة، والذكاء الاصطناعي لنمو الأعمال والتوسع العالمي.",
                skills: "<b>المهارات:</b> الطاقة المتجددة، كفاءة الطاقة، الطموح، أخذ المبادرة، تطوير الاستراتيجيات، تنفيذ الخطط، تعبئة الموارد، الدعم الفني، تطوير الشبكات، إدارة الأعمال، التحليل المالي، الدعم الفني، بناء القدرات، إدارة العمليات، التواصل، التفاوض، التنمية الدولية."
              },
            
              lecturerPartTimeMao: {
                title: "أستاذ (دوام جزئي)",
                where: "المعهد الوطني العالي للبترول في ماو | ماو، تشاد",
                when: "07/2021 ~ 12/2021",
                point1: "قدمت محاضرات حول إنتاج النفط والغاز، ودمج أنظمة الطاقة المتجددة والحلول المستدامة لمعالجة التحولات العالمية في الطاقة، مع توجيه الطلاب في منهجيات البحث.",
                point2: "دعمت بناء القدرات من خلال توجيه الطلاب في تحليل أنظمة الطاقة، ومبادئ الاستدامة، وتطوير سياسات الطاقة، لتحضيرهم لمسارات مهنية في الطاقة النظيفة وإدارة الموارد.",
                skills: "<b>المهارات:</b> أنظمة الطاقة، التنمية المستدامة، الطاقة المتجددة، مهارات تواصل شخصية ممتازة، الإرشاد، منهجيات البحث، الاستماع النشط، تقديم الإرشاد، بناء القدرات، تطوير الاستراتيجيات، التواصل، الدعم الفني، التدريس والإرشاد."
              },
            
              lecturerPartTimeIriba: {
                title: "أستاذ (دوام جزئي)",
                where: "المعهد الوطني العالي للصحراء والساحل في إيربا | إيربا، تشاد",
                when: "11/2020 ~ 12/2020",
                point1: "قمت بتدريس دورات في الهندسة الكهربائية، والكتلة الحيوية، والوقود الحيوي، مع دمج مفاهيم الطاقة المتجددة مع التطبيقات العملية في الصناعة لمعالجة تحديات الطاقة وتعزيز الحلول المستدامة.",
                point2: "وجهت الطلاب من خلال التعلم القائم على المشاريع، معززة مهاراتهم في نمذجة الطاقة، والتقنيات الرقمية، وتحسين أنظمة الطاقة لانتقال الطاقة النظيفة.",
                skills: "<b>المهارات:</b> الطاقة المتجددة، نمذجة الطاقة، كفاءة الطاقة، التنمية المستدامة، الإرشاد، التدريس وبناء القدرات، الاستماع النشط، الدعم الفني، منهجيات البحث، مهارات التواصل، التواصل، تطوير الاستراتيجيات."
              },
              
              assistantNetworkManager: {
                title: "مساعد مدير الشبكة",
                where: "توتال إنيرجيز ماركتينغ تشاد | نجامينا، تشاد",
                when: "10/2019 ~ 03/2020",
                point1: "طورت وoptimzت عمليات البيع، وآليات الإرجاع، وآليات التعويض لتعزيز حلول وصول الطاقة لمنتجات الطاقة الشمسية، مما حسّن القدرة على تحمل التكاليف في المناطق الريفية والحضرية.",
                point2: "أجريت تحليلات مالية وتعاونت مع الفرق متعددة الوظائف لتحسين أداء المنتج والربحية، مما يضمن التوافق مع أهداف الاستدامة وتحسين كفاءة الشبكة.",
                skills: "<b>المهارات:</b> وصول الطاقة، الطاقة المتجددة، التحليل المالي، تطوير الشبكات، الطاقة النظيفة، تحسين عمليات البيع، تطوير الاستراتيجيات، تعبئة الموارد، الدعم الفني، التواصل، التعاون."
              },
              
              electricityProductionEngineerIntern: {
                title: "مهندس إنتاج الكهرباء ونقلها (متدرب)",
                where: "الشركة الوطنية للكهرباء في تشاد (SNE) | نجامينا، تشاد",
                when: "07/2019 ~ 10/2019",
                point1: "أدرت أنظمة إنتاج الكهرباء والنقل، مع ضمان الأمان والكفاءة وجودة الخدمة عبر الشبكة الوطنية لدعم وصول الطاقة وأهداف الاستدامة.",
                point2: "طبقت حلولًا مدفوعة بالبيانات وأدوات رقمية لتحسين أداء الشبكة، وتعزيز المرونة، والتعاون مع الفرق متعددة الوظائف لمعالجة التحديات التشغيلية وتحسين البنية التحتية للطاقة.",
                skills: "<b>المهارات:</b> أنظمة الطاقة، إدارة أنظمة الطاقة، تحسين الشبكة، تحليل البيانات، الطاقة المتجددة، النقل، كفاءة الطاقة، الدمج الرقمي، الدعم الفني، التعاون."
              },
            
              renewableEnergyEngineer: {
                title: "مهندس طاقة متجددة",
                where: "خدمات الأعمال الجماعية (GBS) | نجامينا، تشاد",
                when: "03/2019 ~ 06/2019",
                point1: "أجريت تقييمات اقتصادية لأنظمة الطاقة الشمسية الهجينة لتحسين الكهرباء والوصول إلى الطاقة النظيفة عبر 10 مقاطعات في تشاد، وتعزيز الحلول القابلة للتوسع والميسورة التكلفة للأعمال التجارية والمنازل.",
                point2: "تعاونت مع شركاء التنمية لدفع تعبئة الموارد، وقادت دراسات الجدوى، وصممت حلول طاقة مخصصة، مع ضمان التوافق مع أهداف التنمية المستدامة وكفاءة الطاقة.",
                skills: "<b>المهارات:</b> الطاقة المتجددة، كفاءة الطاقة، دراسات الجدوى، الطاقة النظيفة، التقييم الاقتصادي، تعبئة الموارد، التعاون، تطوير الاستراتيجيات، الدعم الفني، وصول الطاقة."
              },
            
              renewableEnergySpecialist: {
                title: "أخصائي طاقة متجددة (عمل تطوعي، دوام جزئي)",
                where: "توسيع أفريقيا معًا | زيغينشور، السنغال",
                when: "12/2018 ~ 02/2019",
                point1: "أجريت تقييمات للطلب والتقييمات التقنية لأنظمة الطاقة المتجددة، مع ضمان قابلية التوسع، والاستدامة، وكفاءة الطاقة في البيئات الريفية والحضرية.",
                point2: "قدت دراسات الجدوى المالية وتعاونت مع فرق متعددة التخصصات لتنفيذ الحلول الرقمية، مما ساهم في تبني الطاقة المتجددة وتعزيز وصول الطاقة في المناطق المحرومة.",
                skills: "<b>المهارات:</b> الطاقة المتجددة، نمذجة الطاقة، تحليل الجدوى، حلول الطاقة المستدامة، إدارة المشاريع، تعبئة الموارد، التنمية الاقتصادية، التكيف مع تغير المناخ، التواصل، التنمية الدولية."
              },
            
              projectManagerAssistantEngineer: {
                title: "مساعد مهندس مدير المشروع",
                where: "شركة الكهرباء الوطنية في السنغال (SENELEC) | داكار، السنغال",
                when: "06/2018 ~ 11/2018",
                point1: "أدرت مشاريع الطاقة المتجددة، وأجريت نمذجة الطاقة ودراسات الجدوى للكهرباء الريفية والحضرية، مع ضمان التوافق مع أهداف الاستدامة والطاقة النظيفة.",
                point2: "قمت بتقييم الجوانب الفنية والمالية والاستثمارية للمشاريع، مع تطوير حلول قابلة للتوسع وفعالة من حيث التكلفة ودعم جهود الكهرباء الريفية مع التركيز على الطاقة الخضراء والدمج الرقمي.",
                skills: "<b>المهارات:</b> الطاقة المتجددة، نمذجة الطاقة، تحليل أنظمة الطاقة، إدارة المشاريع، كفاءة الطاقة، تعبئة الموارد، التنمية المستدامة، الدعم الفني، تطوير الاستراتيجيات، العمليات الاستثمارية."
              },
            
              wellIntegritySupervisor: {
                title: "مشرف سلامة الآبار / إنشاء الآبار / العمليات الميدانية",
                where: "شلومبرجر (العملاء: إكسون موبيل، إيسو، جلينكور) | تشاد",
                when: "10/2013 ~ 02/2016",
                point1: "قدت عمليات سلامة الآبار باستخدام اختبارات الضغط العالي والتحليل الجيوكيميائي لضمان موثوقية وسلامة البنية التحتية للطاقة، مما يعزز الممارسات المستدامة للطاقة.",
                point2: "قمت بإجراء تحليل الأداء وتحسين كفاءة العمليات، مع تحقيق صفر حوادث سلامة على مدار عامين من خلال البروتوكولات المتقدمة للسلامة وإدارة المخاطر.",
                skills: "<b>المهارات:</b> أنظمة الطاقة، إدارة المخاطر، تحليل الأداء، تحسين العمليات، الدعم الفني، الممارسات المستدامة، التواصل، قيادة الفريق، حل المشكلات."
              },
            
              petroleumProductionIntern: {
                title: "متدرب في إنتاج النفط",
                where: "شركة الصين الوطنية للبترول الدولية تشاد (CNPCIC) - رونيه / ميموزا / باوباب، تشاد",
                when: "12/2012 ~ 10/2013",
                point1: "أجريت فحوصات والتحقق من آبار إنتاج النفط والمياه، مع ضمان كفاءة العمليات والامتثال للمعايير الأمنية.",
                point2: "تعاونت في إدخال البيانات في قاعدة بيانات إنتاج حقول النفط CNPCIC، مما يعزز تحسين النظام بينما طورت مهارات قوية في حل المشكلات والعمل الجماعي.",
                skills: "<b>المهارات:</b> الموارد الطبيعية، تحليل البيانات، إنتاج النفط، حل المشكلات، التواصل، الدعم الفني، التعاون الجماعي، كفاءة العمليات، أنظمة الطاقة."
              }
            },
            download: "تحميل سيرتي الذاتية",
          },

          educations: {
            title: "التعليم والتدريب",
            schools: {
              school1: {
                title: "جامعة نيروبي",
                when: "11/2021 – 09/2025",
                where: "كينيا",
                detail: "دكتوراه في الفيزياء (تخصص الطاقة، بما في ذلك الطاقة المتجددة)"
              },
              school2: {
                title: "أكاديمية كوانت للطاقة (مدرسة هندسة البرمجيات للطاقة)",
                when: "11/2024 – 11/2025",
                where: "المملكة المتحدة",
                detail: "تدريب متقدم في علوم البيانات، التحسين، وتطبيقات تعلم الآلة في مجال الطاقة"
              },
              school3: {
                title: "معهد ماساتشوستس لعلوم البيانات والأنظمة والمجتمع (IDSS)",
                when: "06/2022 – 10/2022",
                where: "الولايات المتحدة الأمريكية",
                detail: "شهادة في علوم البيانات وتعلم الآلة: اتخاذ القرارات المعتمدة على البيانات"
              },
              school4: {
                title: "معهد كالو | مركز دراسات المساعدات الإنسانية",
                when: "10/2021 – 09/2022",
                where: "إسبانيا",
                detail: "ماجستير في التعاون الدولي والمساعدات الإنسانية"
              },
              school5: {
                title: "جامعة كيب تاون – كلية الدراسات العليا للأعمال",
                when: "05/2021 – 10/2021",
                where: "جنوب أفريقيا",
                detail: "مدرسة فلورنسا للتنظيم | إيطاليا، مؤسسة إنيل | إيطاليا، برنامج الطاقة النظيفة لأفريقيا 2021، تنظيم لتحقيق الهدف السابع من أهداف التنمية المستدامة"
              },
              school6: {
                title: "جامعة غاستون بيرجيه في سانت لويس",
                when: "06/2016 – 12/2018",
                where: "السنغال",
                detail: "ماجستير في العلوم والتكنولوجيا، الفيزياء التطبيقية، تخصص الطاقة المتجددة"
              },
              school7: {
                title: "معهد كولونيا للطاقة المتجددة / جامعة TH كولون للعلوم التطبيقية",
                when: "09/2017",
                where: "ألمانيا",
                detail: "مدرسة صيفية (الطاقات المتجددة وكفاءة الطاقة)"
              },
              school8: {
                title: "مركز شلمبرجير للتدريب السيبيري",
                when: "08/2015 – 10/2015",
                where: "تيومين، روسيا",
                detail: "تدريب مهني على تقديم الخدمات وتقنيات سلامة الآبار"
              },
              school9: {
                title: "مركز تعليم اللغات",
                when: "03/2014 – 06/2014",
                where: "كيب تاون، جنوب أفريقيا",
                detail: "دورات مكثفة في اللغة الإنجليزية التقنية والعامة"
              },
              school10: {
                title: "المعهد الجامعي للبترول في ماو",
                when: "11/2010 – 02/2014",
                where: "نجامينا، تشاد",
                detail: "بكالوريوس في استغلال الهيدروكربونات، تخصص إنتاج البترول"
              }
            }
          },

          publications: {
            title: "النشريات",
            posts: {
              post1: {
                author: 'Phd. MAHAMAT ADOUM ABDOULAYE',
                title: "التحديد الأمثل لنظام هجين شمسي-رياح",
                date: "1 يوليو 2024",
                desc: "مواجهة تحديات الوصول إلى الكهرباء في أفريقيا، خاصة في أفريقيا جنوب الصحراء الكبرى وتشاد، من خلال اعتماد أنظمة هجينة شمسية-رياح مع تخزين الطاقة لتوفير طاقة مستدامة، ميسورة التكلفة وموثوقة لإضاءة المناطق الريفية."
              },
              post2: {
                author: 'Phd. MAHAMAT ADOUM ABDOULAYE',
                title: "التحديد الأمثل للأنظمة الهجينة للطاقة من أجل إضاءة المناطق الريفية في تشاد",
                date: "27 فبراير 2024",
                desc: "التحسينات التقنية والاقتصادية والبيئية لنظام هجيني من الألواح الشمسية/الرياح/البطارية/خلايا الوقود لإضاءة المناطق الريفية في تشاد."
              },
              post3: {
                author: 'Phd. MAHAMAT ADOUM ABDOULAYE',
                title: "أثر تقلبات الطاقة الشمسية على تردد شبكة السنغال",
                date: "يوليو 2020",
                desc: "تحليل أثر تقلبات الطاقة الشمسية (PV) على إدارة التردد في شبكة الكهرباء السنغالية."
              },
            },
          },
          
          

        }
      }
    },
    lng: 'en', // Default language
    fallbackLng: 'en', // Fallback language if translation not found
    interpolation: {
      escapeValue: false, // React already handles escaping
    }
  });

export default i18n;
