'use client';
import '../i18n'; //
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Image from 'next/image';
import { GithubIcon } from './icons/GithubIcon';
import { LinkedinIcon } from './icons/LinkedinIcon'; // Assuming you have or will create this component
import { Button } from '@/components/ui/button';

export const Projects = () => {

    const { t } = useTranslation();
    const projects = [
        {
            id: 1,
            title: "Auprea: Everyone has the right to pass on heritage",
            description: "Developed a comprehensive wealth management platform for personal and family use, designed to track assets, debts, and net worth. Key features include categorized asset input, a real-time financial dashboard, secure document vault, PDF declaration generation, and an optional notary certification service available through subscription.",
            logoUrl: "/images/auprea.ico",
            url: "https://patrimoine-manager.vercel.app/"
        },
        {
            id: 2,
            title: "Seabar Store Locator – Interactive Map Integration",
            description: "Built an interactive store locator with map integration for Seabar, making it easy for users to find nearby shop locations. Focused on a smooth, responsive UI and real-time geolocation to enhance the overall experience.",
            logoUrl: "/images/seabar.png",
            url: "https://seabar.com/pages/store-locator"
        },
        {
            id: 3,
            title: "Ndako Book: Seamless Hotel Reservation System",
            description: "Developed a user-friendly hotel booking platform for Ndako Book, allowing customers to easily search, compare, and book hotels. Focused on delivering a seamless experience with real-time availability, booking confirmations, and responsive design for all devices.",
            logoUrl: "/images/ndako-book.ico",
            url: "https://ndako-book.vercel.app/"
        },
        
        {
            id: 4,
            title: "Ndako – Property Management System",
            description: "A hybrid hotel and property management system, designed to handle room bookings, tenant management, lease tracking, automated invoicing, and financial reporting for both hotels and rental properties.",
            logoUrl: "/images/ndako.png",
            url: "https://ndako.koverae.com"
        },
        {
            id: 5,
            title: "Koverae ERP",
            description: "A next-gen ERP SaaS platform with 12+ integrated apps for business, finance, HR, logistics, and productivity. Includes K-Wallet & Kredits, an internal digital financial system, and Quick Find, an AI-powered business database enrichment tool.",
            logoUrl: "/images/koverae.png",
            url: "https://koverae.com"
        },
        {
            id: 6,
            title: "Koverae Billing - Subscription and billing, simplified for Laravel",
            description: "koverae-billing is a lightweight Laravel package that simplifies subscription and billing management for applications. Whether you're building a SaaS platform, managing recurring payments, or offering metered services, this package provides an intuitive and flexible way to handle billing logic.",
            logoUrl: "/images/wallet.png",
            url: "https://developer.koverae.com/koverae-billing/?utm=ardenbouet"
        },
        {
            id: 7,
            title: "Dr. Mahamat Adoum: Professional Portfolio Website",
            description: "Developed a personal multilingual portfolio for Dr. Mahamat Adoum, showcasing his professional achievements, research, and publications. The portfolio is designed to be easily navigable and accessible in multiple languages, offering a seamless experience across different cultures and regions.",
            logoUrl: "/images/mahamat.png",
            url: "https://mahamat-portfolio.vercel.app/"
        },
    ]
    
    const experiences = [
        {
            id: 1,
            title: "Banking API Integration",
            job: "Financial Software Engineer",
            fromTo: "Sept. 2024 ~ Mar 2025 · 7 months",
            description: "Developed a Laravel API for integrating banking transactions. <br/> Implemented Livewire-powered financial reporting tools.",
            type: "Freelance"
            
        },
        {
            id: 2,
            title: "Business Data Aggregation App",
            job: "API Developer",
            fromTo: "June. 2024 ~ Aug. 2024 · 3 months",
            description: "Built a RESTful API using Laravel & Sanctum for business data aggregation. <br/> Engineered a Livewire-powered admin panel for managing API users. <br/ Developed Python scripts to automate data collection and enrichment.",
            type: "Freelance"
            
        },
        {
            id: 3,
            title: "SuiteScript (Hotel Management SaaS)",
            job: "Fullstack Developer(Laravel & Livewire)",
            fromTo: "Dec. 2023 ~ Mar. 2024 · 4 months",
            description: "Engineered a Laravel-based hotel booking system with reservation tracking, billing, and guest management. <br/> Implemented a Livewire-powered calendar system for room availability tracking. <br/ Developed automated invoicing and expense management tools. <br/ Integrated third-party APIs for payment processing and email notifications.",
            type: "Freelance"
            
        },
        {
            id: 4,
            title: "Velostar Organisation",
            job: "Web Developer",
            fromTo: "Apr. 2023 ~ Oct. 2023 · 7 months",
            description: "Built and maintained a Laravel-based web application for logistics management. <br/> Developed a Livewire-driven dashboard for tracking shipments in real time. <br/ Integrated Alpine.js components for seamless user interactions.",
            type: "Remote"
            
        },
        {
            id: 5,
            title: "Cowema - E-commerce Platform",
            job: "Full-Stack Developer",
            fromTo: "Jan. 2023 ~ Mar. 2023 · 3 months",
            description: "Built a Laravel & Livewire e-commerce platform with a custom admin panel. <br/> Developed a multi-vendor marketplace with product filtering, cart, and checkout. <br/ Integrated Stripe & PayPal for secure online payments.",
            type: "Intern"
            
        },
    ]

    return (

        <div id='projects' className='pt-2 mt-10 w-100 sm:mt-16 lg:mt-20'>
            <h2 className="mb-10 text-2xl font-bold leading-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-sky-500 drop-shadow-xl">
                {t('experiences.title')}
            </h2>
            <div className="flex flex-col min-h-full gap-3 p-4 pt-0 mx-auto mt-4 mb-6 w-100 sm:mt-4 lg:mt-4 sm:flex-row ">

                <div className="w-full p-6 rounded-xl ring-1 ring-zinc-200/80 dark:ring-zinc-700/40 drop-shadow-xl sm:w-1/2 lg:w-4/6">
                        <h2 className="flex items-center text-sm font-semibold font-heading text-zinc-900 dark:text-zinc-100">
                            <svg stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" fill="currentColor" className="flex-none w-6 h-6 fill-zinc-100/10 stroke-zinc-500">
                                <path fill-rule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-4.131A15.838 15.838 0 016.382 15H2.25a.75.75 0 01-.75-.75 6.75 6.75 0 017.815-6.666zM15 6.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" clip-rule="evenodd" />
                                <path d="M5.26 17.242a.75.75 0 10-.897-1.203 5.243 5.243 0 00-2.05 5.022.75.75 0 00.625.627 5.243 5.243 0 005.022-2.051.75.75 0 10-1.202-.897 3.744 3.744 0 01-3.008 1.51c0-1.23.592-2.323 1.51-3.008z" />
                            </svg>
                            <span className="ml-3">{t('experiences.projects.title')} </span>
                        </h2>
                    
                    <ol className="mt-6 space-y-4">
                        
                        {projects.map((project) => (
                        <li className="flex gap-4">
                            <div className="relative flex items-center justify-center flex-none w-10 h-10 rounded-full shadow-md shadow-zinc-800/5 ring-1 ring-zinc-900/5 dark:border dark:border-zinc-700/50 dark:bg-zinc-800 dark:ring-0" >

                                <Image
                                    src={project.logoUrl}
                                    alt={'Profile picture '}
                                    className="rounded-full"
                                    width={300}
                                    height={300}
                                />
                            </div>

                            <div className="flex-1 space-y-0.5" >
                                <div className="flex items-center g ap-x-2" >
                                    <p className="text-sm font-medium text-primary">
                                        {project.title}
                                    </p>
                                </div>
                                <div className="sm:flex sm:items-center sm:justify-between" >
                                    <div className="flex-1" >
                                        <span className="sr-only">Poste</span>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                            {project.description}
                                        </p>
                                    </div>
                                    <div className="mt-1 sm:mt-0" >

                                        <a href={project.url} target='__blank' className="flex items-center group gap-x-2">
                                            <dd className="text-xs text-zinc-500 group-hover:underline group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-200">
                                                {t('experiences.projects.see')}
                                            </dd>
                                            <svg
                                            className="w-5 h-5 text-zinc-500 group-hover:text-zinc-400 dark:group-hover:text-zinc-300"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path
                                                fill-rule="evenodd"
                                                d="M16.72 7.72a.75.75 0 011.06 0l3.75 3.75a.75.75 0 010 1.06l-3.75 3.75a.75.75 0 11-1.06-1.06l2.47-2.47H3a.75.75 0 010-1.5h16.19l-2.47-2.47a.75.75 0 010-1.06z"
                                                clip-rule="evenodd"
                                            />
                                        </svg>

                                        </a>

                                    </div>
                                </div>
                            </div>
                        </li>
                        ))}
                        
                    </ol>

                </div>
                
                <div className="p-6 w-100 rounded-xl ring-1 ring-zinc-200/80 dark:ring-zinc-700/40 drop-shadow-xl sm:w-1/2 lg:w-2/6">
                    <h2 className="flex items-center font-semibold font-heading text-zinc-900 dark:text-zinc-100">
                        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" className="flex-none w-6 h-6">
                            <path d="M2.75 9.75a3 3 0 0 1 3-3h12.5a3 3 0 0 1 3 3v8.5a3 3 0 0 1-3 3H5.75a3 3 0 0 1-3-3v-8.5Z" className="fill-zinc-100/10 stroke-zinc-500" />
                            <path d="M3 14.25h6.249c.484 0 .952-.002 1.316.319l.777.682a.996.996 0 0 0 1.316 0l.777-.682c.364-.32.832-.319 1.316-.319H21M8.75 6.5V4.75a2 2 0 0 1 2-2h2.5a2 2 0 0 1 2 2V6.5" className="stroke-zinc-500" />
                        </svg>
                        <span className="ml-3">{t('experiences.cardTitlte')}</span>
                    </h2>
                    <ol className="mt-6 space-y-4">

                        {experiences.map((experience) => (
                        <li className="flex gap-2">
                            <dl className="flex flex-col mb-4 gap-y-0.5 w-full">
                                <div className='flex w-full'>
                                    <div className='flex-1'>
                                        <dl className="flex-none w-full font-medium text-zinc-800 dark:text-zinc-100">{experience.title}</dl>
                                        <dd className="text-xs text-zinc-500 group-hover:underline group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-200">{experience.job}</dd>
                                        <dd className="text-xs text-zinc-400 dark:text-zinc-500">
                                            <time>{experience.fromTo}</time>
                                        </dd>
                                        <p className='text-sm' dangerouslySetInnerHTML={{ __html: experience.description }}>
                                        </p>
                                    </div>
                                    <div className='flex items-center'>
                                        <span className="inline-flex items-center rounded-full bg-green-500/10 px-1.5 py-0.5 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-500/20">
                                            {experience.type}
                                        </span>
                                    </div>
                                </div>
                            </dl>
                        </li>
                        ))}

                    </ol>
                    <a className="group mt-5 w-full inline-flex items-center justify-center rounded-md border drop-shadow-md py-2.5 px-3  outline-offset-2 transition font-medium bg-zinc-50 text-zinc-900 dark:text-zinc-300 hover:bg-primary hover:text-white" href="/files/cv-v2.pdf">
                        Check my resume !                  
                    </a>
                </div>
            </div>
        </div>
    )
};