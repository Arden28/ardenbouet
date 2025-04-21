'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GithubIcon } from './icons/GithubIcon';
import { LinkedinIcon } from './icons/LinkedinIcon'; // Assuming you have or will create this component
import { Button } from '@/components/ui/button';

export const Header = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="z-10 max-w-xl px-10 pb-3 mx-auto sm:max-w-4xl pt-7">
            <div className="flex items-center justify-between">
                {/* Logo Section */}
                <div className="relative flex items-center ">
                    <div className="h-10 w-10 rounded-full bg-white/90 p-0.5 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur dark:bg-zinc-800/90 dark:ring-white/10 mr-20">
                        <a href="" className="block w-full h-full">
                            <span className="sr-only">Arden BOUET</span>
                            <Image 
                                src={'/images/avatar-1.jpg'} 
                                alt={'logo'}
                                className='object-cover rounded-full' 
                                width={40}
                                height={40}
                            />
                        </a>
                    </div>
                </div>

                {/* Burger Menu Icon for Mobile */}
                <div className="sm:hidden">
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white focus:outline-none"
                    >
                        {/* Burger icon */}
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            {/* Icon paths will go here */}
                            <path d="M5 6.5H19V8H5V6.5Z" fill="#1F2328"></path> <path d="M5 16.5H19V18H5V16.5Z" fill="#1F2328"></path> <path d="M5 11.5H19V13H5V11.5Z" fill="#1F2328"></path>
                        </svg>
                    </button>
                </div>

                {/* Desktop Nav Links */}
                <div className="items-center justify-between flex-1 hidden sm:flex">
                    <nav className="flex flex-1 gap-x-20">
                        <ul id="nav" className="flex px-10 text-sm font-medium rounded-full shadow-lg shadow-zinc-800/5 ring-1 backdrop-blur text-zinc-800 ring-zinc-900/5 bg-white/90 dark:bg-zinc-800/90 dark:text-zinc-200 dark:ring-white/10">
                            <li>
                                <Link className="relative block px-3 py-2 font-medium transition hover:text-primary hover:font-bold dark:hover:text-white" href="#about">About</Link>
                            </li>
                            <li>
                                <Link className="relative block px-3 py-2 font-medium transition hover:text-primary hover:font-bold dark:hover:text-white" href="#journey">My Journey</Link>
                            </li>
                            <li>
                                <Link className="relative block px-3 py-2 font-medium transition hover:text-primary hover:font-bold dark:hover:text-white" href="#projects">My Projects</Link>
                            </li>
                            <li>
                                <Link className="relative block px-3 py-2 font-medium transition hover:text-primary hover:font-bold dark:hover:text-white" href="#contact">Contact</Link>
                            </li>
                            <li>
                                <a className="relative block px-3 py-2 font-medium transition hover:text-primary hover:font-bold dark:hover:text-white" href="/files/cv-v2.pdf">CV</a>
                            </li>
                        </ul>
                    </nav>

                    <div className="flex items-center space-x-4">
                        <a href="https://www.linkedin.com/in/arden-bouet/" className="transition text-zinc-500 hover:text-[#0a66c2]">
                        <svg fill="#000000" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><title>Upwork icon</title><path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.828v7.112c-.002 1.406-1.141 2.546-2.547 2.548-1.405-.002-2.543-1.143-2.545-2.548V3.492H0v7.112c0 2.914 2.37 5.303 5.281 5.303 2.913 0 5.283-2.389 5.283-5.303v-1.19c.529 1.107 1.182 2.229 1.974 3.221l-1.673 7.873h2.797l1.213-5.71c1.063.679 2.285 1.109 3.686 1.109 3 0 5.439-2.452 5.439-5.45 0-3-2.439-5.439-5.439-5.439z"></path></g></svg>
                        </a>
                        <a href="https://www.linkedin.com/in/arden-bouet/" className="transition text-zinc-500 hover:text-[#0a66c2]">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5.00351 6.99992H4.97535C4.66873 7.01841 4.36159 6.97349 4.07311 6.86796C3.78463 6.76242 3.521 6.59855 3.29869 6.38657C3.07638 6.17458 2.90016 5.91904 2.78104 5.6359C2.66192 5.35276 2.60245 5.04811 2.60635 4.74095C2.61025 4.4338 2.67743 4.13075 2.8037 3.85072C2.92997 3.5707 3.11262 3.31972 3.34024 3.11344C3.56786 2.90717 3.83556 2.75004 4.12663 2.65187C4.4177 2.5537 4.72588 2.51658 5.03193 2.54286C5.3395 2.52058 5.64835 2.56218 5.93906 2.66504C6.22978 2.7679 6.49607 2.92979 6.72119 3.14054C6.94631 3.35129 7.12539 3.60634 7.24718 3.88964C7.36896 4.17295 7.43082 4.47839 7.42885 4.78676C7.42689 5.09513 7.36114 5.39975 7.23575 5.68148C7.11036 5.96322 6.92804 6.21596 6.70025 6.42382C6.47246 6.63168 6.20413 6.79017 5.91213 6.88931C5.62013 6.98845 5.31077 7.02611 5.00351 6.99992Z"></path>
                                <path d="M7.01801 10H3.01801V22H7.01801V10Z"></path>
                                <path d="M17.5175 10C16.8435 10.0018 16.1786 10.156 15.5725 10.451C14.9664 10.746 14.4348 11.1741 14.0175 11.7034V10H10.0175V22H14.0175V16.5C14.0175 15.9696 14.2282 15.4609 14.6033 15.0858C14.9784 14.7107 15.4871 14.5 16.0175 14.5C16.548 14.5 17.0567 14.7107 17.4317 15.0858C17.8068 15.4609 18.0175 15.9696 18.0175 16.5V22H22.0175V14.5C22.0175 13.9091 21.9011 13.3239 21.675 12.7779C21.4488 12.232 21.1174 11.7359 20.6995 11.318C20.2816 10.9002 19.7856 10.5687 19.2396 10.3425C18.6936 10.1164 18.1085 10 17.5175 10Z"></path>
                            </svg>
                        </a>
                        <a href="https://github.com/Arden28" className="transition text-zinc-500 hover:text-zinc-900 dark:hover:text-[#fafafa]">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.467-1.11-1.467-.907-.62.069-.608.069-.608 1.003.071 1.531 1.031 1.531 1.031.892 1.529 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.338-2.22-.254-4.555-1.113-4.555-4.95 0-1.093.39-1.988 1.029-2.688-.103-.254-.447-1.276.098-2.66 0 0 .84-.27 2.75 1.025a9.6 9.6 0 012.5-.336c.849.004 1.704.115 2.5.337 1.909-1.296 2.748-1.025 2.748-1.025.546 1.383.202 2.405.099 2.659.64.7 1.028 1.595 1.028 2.688 0 3.845-2.337 4.693-4.566 4.943.358.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.748 0 .268.18.58.688.482A10.022 10.022 0 0022 12.017C22 6.484 17.523 2 12 2z" clip-rule="evenodd"></path>
                            </svg>
                        </a>
                        <a href="mailto:laudbouetoumoussa@koverae.com" className="inline-block px-4 py-2 text-sm font-medium leading-5 transition rounded-full shadow-lg ring-1 backdrop-blur bg-white/90 shadow-zinc-800/5 ring-zinc-900/5 dark:bg-zinc-800/90 dark:text-zinc-200 dark:ring-white/10 dark:hover:ring-white/20 hover:text-primary hover:font-bold">
                            Mail
                        </a>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="mt-4 space-y-4 sm:hidden">
                    <ul className="flex flex-col items-center text-sm font-medium">
                        <li>
                            <Link className="block px-3 py-2 transition hover:text-primary dark:hover:text-white" href="#about">A Propos</Link>
                        </li>
                        <li>
                            <Link className="block px-3 py-2 transition hover:text-primary dark:hover:text-white" href="#journey">My Journey</Link>
                        </li>
                        <li>
                            <Link className="block px-3 py-2 transition hover:text-primary dark:hover:text-white" href="#projects">My Projects</Link>
                        </li>
                        <li>
                            <Link className="block px-3 py-2 transition hover:text-primary dark:hover:text-white" href="#contact">Contact</Link>
                        </li>
                        <li>
                            <a className="block px-3 py-2 transition hover:text-primary dark:hover:text-white" href="/files/cv-v2.pdf">CV</a>
                        </li>
                        <li className="flex space-x-4">
                            <a href="mailto:laudbouetoumoussa@koverae.com" className="transition text-zinc-500 hover:text-black dark:hover:text-white">
                            <svg viewBox="0 0 24 24" className='w-6 h-6' fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M3.75 5.25L3 6V18L3.75 18.75H20.25L21 18V6L20.25 5.25H3.75ZM4.5 7.6955V17.25H19.5V7.69525L11.9999 14.5136L4.5 7.6955ZM18.3099 6.75H5.68986L11.9999 12.4864L18.3099 6.75Z" fill="#616161"></path> </g></svg>
                            </a>
                            <a href="https://www.linkedin.com/in/arden-bouet/" className="transition text-zinc-500 hover:text-[#0a66c2]">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5.00351 6.99992H4.97535C4.66873 7.01841 4.36159 6.97349 4.07311 6.86796C3.78463 6.76242 3.521 6.59855 3.29869 6.38657C3.07638 6.17458 2.90016 5.91904 2.78104 5.6359C2.66192 5.35276 2.60245 5.04811 2.60635 4.74095C2.61025 4.4338 2.67743 4.13075 2.8037 3.85072C2.92997 3.5707 3.11262 3.31972 3.34024 3.11344C3.56786 2.90717 3.83556 2.75004 4.12663 2.65187C4.4177 2.5537 4.72588 2.51658 5.03193 2.54286C5.3395 2.52058 5.64835 2.56218 5.93906 2.66504C6.22978 2.7679 6.49607 2.92979 6.72119 3.14054C6.94631 3.35129 7.12539 3.60634 7.24718 3.88964C7.36896 4.17295 7.43082 4.47839 7.42885 4.78676C7.42689 5.09513 7.36114 5.39975 7.23575 5.68148C7.11036 5.96322 6.92804 6.21596 6.70025 6.42382C6.47246 6.63168 6.20413 6.79017 5.91213 6.88931C5.62013 6.98845 5.31077 7.02611 5.00351 6.99992Z"></path>
                                <path d="M7.01801 10H3.01801V22H7.01801V10Z"></path>
                                <path d="M17.5175 10C16.8435 10.0018 16.1786 10.156 15.5725 10.451C14.9664 10.746 14.4348 11.1741 14.0175 11.7034V10H10.0175V22H14.0175V16.5C14.0175 15.9696 14.2282 15.4609 14.6033 15.0858C14.9784 14.7107 15.4871 14.5 16.0175 14.5C16.548 14.5 17.0567 14.7107 17.4317 15.0858C17.8068 15.4609 18.0175 15.9696 18.0175 16.5V22H22.0175V14.5C22.0175 13.9091 21.9011 13.3239 21.675 12.7779C21.4488 12.232 21.1174 11.7359 20.6995 11.318C20.2816 10.9002 19.7856 10.5687 19.2396 10.3425C18.6936 10.1164 18.1085 10 17.5175 10Z"></path>
                            </svg>
                            </a>
                            <a href="https://github.com/Arden28" className="transition text-zinc-500 hover:text-zinc-900 dark:hover:text-[#fafafa]">
                            <span className="sr-only">GitHub</span>
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.467-1.11-1.467-.907-.62.069-.608.069-.608 1.003.071 1.531 1.031 1.531 1.031.892 1.529 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.338-2.22-.254-4.555-1.113-4.555-4.95 0-1.093.39-1.988 1.029-2.688-.103-.254-.447-1.276.098-2.66 0 0 .84-.27 2.75 1.025a9.6 9.6 0 012.5-.336c.849.004 1.704.115 2.5.337 1.909-1.296 2.748-1.025 2.748-1.025.546 1.383.202 2.405.099 2.659.64.7 1.028 1.595 1.028 2.688 0 3.845-2.337 4.693-4.566 4.943.358.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.748 0 .268.18.58.688.482A10.022 10.022 0 0022 12.017C22 6.484 17.523 2 12 2z" clip-rule="evenodd"></path>
                            </svg>
                            </a>
                        </li>

                    </ul>
                </div>
            )}
        </nav>
    );
};
