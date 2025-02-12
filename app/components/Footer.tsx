
import Image from 'next/image';

export const Footer = () => {
    return (
        <footer className="footer  text-neutral-content items-center p-4 max-w-4xl m-auto rounded-t-lg bg-white/0 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur dark:bg-zinc-800/90 dark:ring-white/10">
            <div className="flex flex-col md:flex-row justify-between items-center w-full">
                
                {/* Left Side: Logo and Copyright */}
                <aside className="flex items-center">
            
                    <Image src="/images/avatar-1.jpg" alt="logo" className="rounded-full mr-5" width={30} height={30} />
                    <p className="text-zinc-800"> Copyright © Arden BOUET {new Date().getFullYear()} - All rights reserved </p>
                </aside>
            </div>
        </footer>
    );
};

