'use client';
import '../i18n'; //
import { useTranslation } from 'react-i18next';
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import Image from 'next/image';
import { GithubIcon } from './icons/GithubIcon';
import LivewireIcon from "./icons/LivewireIcon";
import CpanelIcon from "./icons/CpanelIcon";
import { LinkedinIcon } from './icons/LinkedinIcon';
import { Button } from '@/components/ui/button';
import AnimatedTitle from "./AnimatedTitle";
import StackIcon from "tech-stack-icons";


export const Hero = () => {
    const { t } = useTranslation();
    return (
        <div id='about' className="flex flex-col items-center justify-center max-w-4xl min-h-full px-4 mx-auto mt-10 sm:mt-16 lg:mt-20">
            <div className="max-w-2xl mx-auto lg:max-w-none">
                <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-y-0">
                    {/* Image container */}
                    <div className="flex justify-center lg:pl-20 lg:justify-start">
                        <div className="relative w-40 sm:w-48 md:w-64 lg:w-auto px-2.5 lg:max-w-none">
                            <div className="p-1 border aspect-square rotate-3 rounded-2xl border-zinc-400/5 bg-zinc-50 dark:shadow-md dark:shadow-zinc-800/5 dark:bg-zinc-800 dark:border-zinc-700/50">
                                <div className="pointer-events-none md:max-w-2xl">
                                    {/* Gradient and animation layers */}
                                    <div className="absolute -right-14 -top-10 h-px w-[400%] bg-gradient-to-l from-slate-400 opacity-20"></div>
                                    <div
                                        className="absolute top-[-135%] bottom-[-65%] -right-12 w-px opacity-20"
                                        style={{
                                            backgroundImage:
                                                'linear-gradient(to bottom, rgba(148, 163, 184, 0) 30%, rgb(148, 163, 184), rgba(148, 163, 184, 0))',
                                        }}
                                    ></div>
                                    <div
                                        className="absolute -right-28 -bottom-10 h-px w-[400%] opacity-30"
                                        style={{
                                            backgroundImage:
                                                'linear-gradient(to right, rgba(119, 185, 250, 0) 60%, rgb(119, 185, 250) 77%, rgba(119, 185, 250, 0) 94%)',
                                        }}
                                    ></div>
                                    <div
                                        className="absolute top-[-120%] bottom-[-80%] -left-12 w-px opacity-20"
                                        style={{
                                            backgroundImage:
                                                'linear-gradient(to bottom, rgba(148, 163, 184, 0) 30%, rgb(148, 163, 184), rgba(148, 163, 184, 0))',
                                        }}
                                    ></div>
                                    <div className="absolute -top-10 right-1 mt-[-0.5px] h-[2px] w-28 rounded-full bg-gradient-to-r from-blue-500 animate-move"></div>
                                    <div className="absolute -left-12 bottom-50 ml-[-0.5px] h-28 w-[2px] rounded-full bg-gradient-to-t from-violet-400 animate-move-down"></div>
                                </div>
                                <Image
                                    src="/images/profile-1.jpg"
                                    alt={'Profile picture '}
                                    className="relative object-cover rounded-2xl bg-zinc-50 dark:bg-zinc-800"
                                    width={300}
                                    height={300}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Text content */}
                    <div className="relative flex flex-col items-center text-center lg:order-first lg:row-span-2 lg:text-left lg:items-start">
                        <div className="z-10">
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl font-heading lg:text-4xl lg:leading-none">
                                <AnimatedTitle /> {t("hero.title.openSource")}
                            </h1>
                            <div className="mt-6 space-y-5 leading-[1.65rem] font-medium text-md text-zinc-900">
                                <p className='mb-2' dangerouslySetInnerHTML={{ __html: t('hero.description.phrase1') }}>
                                </p>
                                <p className="mb-2" dangerouslySetInnerHTML={{ __html: t('hero.description.phrase2') }}>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tech Stack Section */}
                <div className="max-w-4xl mt-10 text-center lg:text-left">
                    <h2 className="mb-2 text-2xl font-bold leading-8 text-transparent bg-clip-text bg-gradient-to-r from-black to-sky-500 drop-shadow-xl">
                        {t('hero.stack')}
                    </h2>
                    <div className="grid items-center justify-center grid-cols-4 mt-5 gap-x-8 gap-y-10 sm:grid-cols-6 sm:gap-x-10 lg:grid-cols-8">
                        <StackIcon name="laravel" className='w-12 transition-all duration-300 hover:-translate-y-2 hover:translate-x-1' />
                        <LivewireIcon name="livewire" className='w-12 transition-all duration-300 hover:-translate-y-2 hover:translate-x-1' />
                        <StackIcon name="python" className='w-12 transition-all duration-300 hover:-translate-y-2 hover:translate-x-1' />
                        <StackIcon name="js" className='w-12 transition-all duration-300 hover:-translate-y-2 hover:translate-x-1' />
                        <StackIcon name="tailwindcss" className='w-12 transition-all duration-300 hover:-translate-y-2 hover:translate-x-1' />
                        {/* <StackIcon name="bootstrap5" className='w-12 transition-all duration-300 hover:-translate-y-2 hover:translate-x-1' /> */}
                        <StackIcon name="mysql" className='w-12 transition-all duration-300 hover:-translate-y-2 hover:translate-x-1' />
                        <StackIcon name="reactjs" className='w-12 ml-5 transition-all duration-300 hover:-translate-y-2 hover:translate-x-1' />
                        <StackIcon name="alpinejs" className='w-12 ml-5 transition-all duration-300 hover:-translate-y-2 hover:translate-x-1' />
                        <StackIcon name="docker" className='w-12 transition-all duration-300 hover:-translate-y-2 hover:translate-x-1' />
                        <StackIcon name="git" className='w-12 transition-all duration-300 hover:-translate-y-2 hover:translate-x-1' />
                        <StackIcon name="github" className='w-12 transition-all duration-300 hover:-translate-y-2 hover:translate-x-1' />
                        <StackIcon name="redis" className='w-12 transition-all duration-300 hover:-translate-y-2 hover:translate-x-1' />
                        <StackIcon name="aws" className='w-12 transition-all duration-300 hover:-translate-y-2 hover:translate-x-1' />
                        <StackIcon name="gcloud" className='w-12 transition-all duration-300 hover:-translate-y-2 hover:translate-x-1' />
                        <CpanelIcon name="cpanel" className='w-12 transition-all duration-300 hover:-translate-y-2 hover:translate-x-1' />
                        <StackIcon name="openai" className='w-12 transition-all duration-300 hover:-translate-y-2 hover:translate-x-1' />
                    </div>
                </div>
            </div>
        </div>
    );
};

