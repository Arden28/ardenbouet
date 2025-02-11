import Link from 'next/link';
import Image from 'next/image';
import { GithubIcon } from './icons/GithubIcon';
import { LinkedinIcon } from './icons/LinkedinIcon'; // Assuming you have or will create this component
import { Button } from '@/components/ui/button';

export const Projects = () => {
    return (





        <div id='projects' className='max-w-4xl min-h-full pt-2 mx-auto mt-10 sm:mt-16 lg:mt-20 '>
            <h2 className="mb-10 text-2xl font-bold leading-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-sky-500 drop-shadow-xl">
                Projects and Experiences
            </h2>
            <div className="flex flex-col max-w-4xl min-h-full gap-3 p-4 pt-0 mx-auto mt-4 mb-6 sm:mt-4 lg:mt-4 sm:flex-row ">

                <div className="w-full p-6 rounded-xl ring-1 ring-zinc-200/80 dark:ring-zinc-700/40 sm:w-4/6 drop-shadow-xl" >
                <h2 className="flex items-center text-sm font-semibold font-heading text-zinc-900 dark:text-zinc-100">
                            <svg stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" fill="currentColor" className="flex-none w-6 h-6 fill-zinc-100/10 stroke-zinc-500">
                                <path fill-rule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-4.131A15.838 15.838 0 016.382 15H2.25a.75.75 0 01-.75-.75 6.75 6.75 0 017.815-6.666zM15 6.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" clip-rule="evenodd" />
                                <path d="M5.26 17.242a.75.75 0 10-.897-1.203 5.243 5.243 0 00-2.05 5.022.75.75 0 00.625.627 5.243 5.243 0 005.022-2.051.75.75 0 10-1.202-.897 3.744 3.744 0 01-3.008 1.51c0-1.23.592-2.323 1.51-3.008z" />
                            </svg>
                            <span className="ml-3">Projects </span>
                        </h2>
                    
                    <ol className="mt-6 space-y-4">
                        <li className="flex gap-4">
                            <div className="relative flex items-center justify-center flex-none w-10 h-10 rounded-full shadow-md shadow-zinc-800/5 ring-1 ring-zinc-900/5 dark:border dark:border-zinc-700/50 dark:bg-zinc-800 dark:ring-0" >
                                <img className='rounded-full' src="https://media.licdn.com/dms/image/v2/D4D0BAQHOahZl1GeQBA/company-logo_200_200/company-logo_200_200/0/1705755050847?e=1733356800&v=beta&t=KLIWMVLEnumjsHuZ7iXr1tBHg3FxWzRz8TBugi_BW4k" alt="" />
                            </div>

                            <div className="flex-1 space-y-0.5" >
                                <div className="flex items-center g ap-x-2" >


                                    <p className="text-sm font-medium text-primary">
                                        Project name 
                                    </p>
                                </div>
                                <div className="sm:flex sm:items-center sm:justify-between" >
                                    <div className="flex-1" >
                                        <span className="sr-only">Poste</span>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                            Worpress E-comm , for a B2B company specialized in <br />selling  Made with WooCommerce.
                                        </p>
                                    </div>
                                    <div className="mt-1 sm:mt-0" >

                                        <a href="" className="flex items-center group gap-x-2">
                                            <dd className="text-xs text-zinc-500 group-hover:underline group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-200">
                                                Voir le projet
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
                        
                        <li className="flex gap-4">
                            <div className="relative flex items-center justify-center flex-none w-10 h-10 bg-white rounded-full shadow-md shadow-zinc-800/5 ring-1 ring-zinc-900/5 dark:border dark:border-zinc-700/50 dark:bg-zinc-800 dark:ring-0" >
                                <img className='p-1 rounded-full' src="/images/ezpass.ico"  />
                            </div>

                            <div className="flex-1 space-y-0.5" >
                                <div className="flex items-center gap-x-2" >


                                    <p className="text-sm font-medium text-primary">
                                    Project name
                                    </p>
                                    <span className="inline-flex items-center rounded-full mx-1.5 bg-green-500/10 px-1.5 py-0.5 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-500/20">
                                        Opensource
                                    </span>
                                </div>
                                <div className="sm:flex sm:items-center sm:justify-between" >
                                    <div className="flex-1" >
                                        <span className="sr-only">Poste</span>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        A custom prator designed to create secure and <br />
                                         memorable passwords. 
                                        Made with React and TailwindCSS.
                                        </p>
                                    </div>
                                    <div className="mt-1 sm:mt-0" >

                                        <a href="" className="flex items-center group gap-x-2">
                                            <dd className="text-xs text-zinc-500 group-hover:underline group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-200">
                                                Voir le projet
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
                        <li className="flex gap-4">
                            <div className="relative flex items-center justify-center flex-none w-10 h-10 bg-white rounded-full shadow-md shadow-zinc-800/5 ring-1 ring-zinc-900/5 dark:border dark:border-zinc-700/50 dark:bg-zinc-800 dark:ring-0" >
                                <img className='p-1 rounded-full' src="/images/dp.png"  />
                            </div>

                            <div className="flex-1 space-y-0.5" >
                                <div className="flex items-center gap-x-2" >


                                    <p className="text-sm font-medium text-primary">
                                    Developper Portfolio
                                    </p>
                                    <span className="inline-flex items-center rounded-full mx-1.5 bg-green-500/10 px-1.5 py-0.5 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-500/20">
                                        Opensource
                                    </span>
                                </div>
                                <div className="sm:flex sm:items-center sm:justify-between" >
                                    <div className="flex-1" >
                                        <span className="sr-only">Poste</span>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        A nice and simple Web Portfolio for developpers ,  <br /> 
                                        Made with Nextjs, TailwindCSS and Daisyui.
                                        </p>
                                    </div>
                                    <div className="mt-1 sm:mt-0" >

                                        <a href="https://github.com/7wenty7/Developper-Portfolio" className="flex items-center group gap-x-2">
                                            <dd className="text-xs text-zinc-500 group-hover:underline group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-200">
                                                Voir le projet
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
                        
                    </ol>

                </div>
                <div
                    className="w-full p-6 rounded-xl ring-1 ring-zinc-200/70 dark:ring-zinc-700/40 sm:w-2/6 "
                >
                    <h2 className="flex items-center text-sm font-semibold font-heading text-zinc-900 dark:text-zinc-100">
                        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" className="flex-none w-6 h-6">
                            <path d="M2.75 9.75a3 3 0 0 1 3-3h12.5a3 3 0 0 1 3 3v8.5a3 3 0 0 1-3 3H5.75a3 3 0 0 1-3-3v-8.5Z" className="fill-zinc-100/10 stroke-zinc-500" />
                            <path d="M3 14.25h6.249c.484 0 .952-.002 1.316.319l.777.682a.996.996 0 0 0 1.316 0l.777-.682c.364-.32.832-.319 1.316-.319H21M8.75 6.5V4.75a2 2 0 0 1 2-2h2.5a2 2 0 0 1 2 2V6.5" className="stroke-zinc-500" />
                        </svg>
                        <span className="ml-3">Expériences</span>
                    </h2>
                    <ol className="mt-6 space-y-4">
                        <li className="flex gap-2">
                            <dl className="flex flex-col mb-4 gap-y-0.5 w-full">
                                <div className='flex w-full'>
                                    <div className='flex-1'>
                                        <dl className="flex-none w-full text-sm font-medium text-zinc-800 dark:text-zinc-100">Entreprise name</dl>
                                        <dd className="text-xs text-zinc-500 group-hover:underline group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-200">Web developer</dd>
                                        <dd className="text-xs text-zinc-400 dark:text-zinc-500">
                                            <time>Avr. 2023 - Janv. 2024 · 10 mois</time>
                                        </dd>
                                    </div>
                                    <div className='flex items-center'>
                                        <span className="inline-flex items-center rounded-full bg-green-500/10 px-1.5 py-0.5 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-500/20">
                                            intern
                                        </span>
                                    </div>
                                </div>
                            </dl>
                        </li>

                        <li className="flex gap-2">
                            <dl className="flex flex-col mb-4 gap-y-0.5 w-full">
                                <div className='flex w-full'>
                                    <div className='flex-1'>
                                        <dl className="flex-none w-full text-sm font-medium text-zinc-800 dark:text-zinc-100"> Organisation Name</dl>
                                        <dd className="text-xs text-zinc-500 group-hover:underline group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-200">Web developer</dd>
                                        <dd className="text-xs text-zinc-400 dark:text-zinc-500">
                                            <time>Avr. 2024 - Aout. 2024 · 5 mois</time>
                                        </dd>
                                    </div>
                                    <div className='flex items-center'>
                                        <span className="inline-flex items-center rounded-full bg-green-500/10 px-1.5 py-0.5 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-500/20">
                                            intern
                                        </span>
                                    </div>
                                </div>
                            </dl>
                        </li>
                    </ol>
                    <a className="group mt-5 w-full inline-flex items-center justify-center rounded-md border drop-shadow-md py-2.5 px-3 text-sm outline-offset-2 transition font-medium bg-zinc-50 text-zinc-900 dark:text-zinc-300 hover:bg-primary hover:text-white" href="">
                        Check my resume !
                    </a>
                </div>
            </div>
        </div>
    )
};