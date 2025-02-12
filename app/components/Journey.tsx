import Link from 'next/link';
import Image from 'next/image';
import { GithubIcon } from './icons/GithubIcon';
import { LinkedinIcon } from './icons/LinkedinIcon'; // Assuming you have or will create this component
import { Button } from '@/components/ui/button';

export const Journey = () => {
    return (


        <div id='journey' className='max-w-4xl min-h-full pt-2 mx-auto mt-10 sm:mt-16 lg:mt-20 '>
            <h2 className="mb-10 text-2xl font-bold leading-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-sky-500 drop-shadow-xl">
                Educational & Certifications Journey
            </h2>
            <div className="flex flex-col max-w-4xl min-h-full gap-3 p-4 pt-0 mx-auto mt-4 mb-6 sm:mt-4 lg:mt-4 sm:flex-row ">
                
                <ol class="relative border-s border-gray-200 dark:border-gray-700">                  
                    <li class="mb-10 ms-4">
                        <div class="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
                        <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">2019 ~ 2022</time>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">High School Diploma - Mathematics & Sciences <a href='' target='__blank' class="bg-blue-100 text-blue-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-blue-900 dark:text-blue-300 ms-3">School</a></h3>
                        <p class="mb-4 text-base font-normal text-gray-500 dark:text-gray-400">
                            Developed strong analytical and problem-solving skills through intensive coursework in mathematics, physics, and computer science, laying the foundation for a career in technology and software development.
                        </p>
                    </li>
                    <li class="mb-10 ms-4">
                        <div class="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
                        <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">2023</time>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Harvard CS50x: Introduction to Computer Science</h3>
                        <p class="text-base font-normal text-gray-500 dark:text-gray-400">
                            A rigorous introduction to computer science concepts, covering programming, data structures, algorithms, and computational thinking, with projects inspired by real-world applications.
                        </p>
                        <a href="https://cs50.harvard.edu/" target='__blank' class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:outline-none focus:ring-gray-100 focus:text-blue-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-700">Learn more <svg class="w-3 h-3 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                        </svg>
                        </a>
                    </li>
                    <li class="mb-10 ms-4">
                        <div class="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
                        <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">2023</time>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">MIT Introduction to Computer Science and Programming in Python</h3>
                        <p class="text-base font-normal text-gray-500 dark:text-gray-400">
                            Learned the fundamentals of Python programming, algorithmic thinking, and computational problem-solving, with a focus on real-world scenarios and scientific computing.
                        </p>
                        <a href="https://ocw.mit.edu/" target='__blank' class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:outline-none focus:ring-gray-100 focus:text-blue-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-700">Learn more <svg class="w-3 h-3 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                        </svg>
                        </a>
                    </li>
                    <li class="mb-10 ms-4">
                        <div class="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
                        <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">2023</time>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Laravel & PHP Mastery</h3>
                        <p class="text-base font-normal text-gray-500 dark:text-gray-400">
                            Developed expertise in Laravel framework best practices, database management, security, and scalable backend development for web applications.
                        </p>
                        <a href="https://laraveldaily.com/" target='__blank' class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:outline-none focus:ring-gray-100 focus:text-blue-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-700">Learn more <svg class="w-3 h-3 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                        </svg>
                        </a>
                    </li>
                    <li class="mb-10 ms-4">
                        <div class="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
                        <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">2023</time>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Livewire & Alpine.js Advanced Development</h3>
                        <p class="text-base font-normal text-gray-500 dark:text-gray-400">
                            Mastered modern frontend development techniques with Livewire and Alpine.js, enabling the creation of dynamic, real-time web applications without extensive JavaScript dependencies.
                        </p>
                        <a href="https://laraveldaily.com/" target='__blank' class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:outline-none focus:ring-gray-100 focus:text-blue-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-700">Learn more <svg class="w-3 h-3 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                        </svg>
                        </a>
                    </li>
                    <li class="mb-10 ms-4">
                        <div class="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
                        <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">2023</time>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Git & GitHub Version Control Certification</h3>
                        <time class="block mb-2 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">Issued by: <a href="https://udemy.com" target='__blank'>Udemy</a></time>
                        <p class="text-base font-normal text-gray-500 dark:text-gray-400">
                            Gained proficiency in version control workflows, including branching strategies, collaborative coding practices, and best practices for managing repositories on GitHub.
                        </p>
                    </li>
                    <li class="mb-10 ms-4">
                        <div class="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
                        <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">2024</time>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Hosting & Server Management (cPanel Certified)</h3>
                        <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">Issued By: <a href="https://university.cpanel.net/" target="_blank" rel="noopener noreferrer">cPanel University</a></time>
                        <p class="text-base font-normal text-gray-500 dark:text-gray-400">
                            Gained hands-on expertise in managing web hosting environments, configuring domains, optimizing server performance, and ensuring website security.
                        </p>
                    </li>
                    <li class="mb-10 ms-4">
                        <div class="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
                        <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">2024 ~ Present</time>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Bachelor’s Degree – Software Engineering / Computer Science (Ongoing) <a href='https://www.kemu.ac.ke/' target='__blank' class="bg-blue-100 text-blue-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-blue-900 dark:text-blue-300 ms-3">School</a></h3>
                        <p class="text-base font-normal text-gray-500 dark:text-gray-400">
                            Gaining hands-on experience in software engineering principles, programming, and system design, while also exploring emerging technologies such as cloud computing, artificial intelligence, and cybersecurity.
                        </p>
                    </li>
                    <li class="mb-10 ms-4">
                        <div class="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
                        <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">2024</time>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">REST API Development with Laravel</h3>
                        <time class="block mb-2 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">Issued by: <a href="https://udemy.com" target='__blank'>Udemy</a></time>
                        <p class="text-base font-normal text-gray-500 dark:text-gray-400">
                            Built and optimized RESTful APIs using Laravel, focusing on authentication, security, and performance optimization for scalable web applications.
                        </p>
                        <a href="https://academy.postman.com/" target='__blank' class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:outline-none focus:ring-gray-100 focus:text-blue-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-700">Learn more <svg class="w-3 h-3 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                        </svg>
                        </a>
                    </li>
                    <li class="mb-10 ms-4">
                        <div class="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
                        <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">2024</time>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Y Combinator Startup School (SaaS & Business Development Focus)</h3>
                        <p class="text-base font-normal text-gray-500 dark:text-gray-400">
                        Gained insights into startup growth strategies, business development, and the intricacies of building, scaling, and sustaining SaaS-based businesses in a competitive market.
                        </p>
                        <a href="https://www.startupschool.org/" target='__blank' class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:outline-none focus:ring-gray-100 focus:text-blue-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-700">Learn more <svg class="w-3 h-3 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                        </svg>
                        </a>
                    </li>
                    <li class="mb-10 ms-4">
                        <div class="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
                        <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">2024</time>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Software Architecture & Modular Development</h3>
                        <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">Issued By: <a href="https://www.codecademy.com/" target="_blank" rel="noopener noreferrer">Codecacademy</a></time>
                        <p class="text-base font-normal text-gray-500 dark:text-gray-400">
                            Developed skills in designing robust, scalable, and modular software systems, ensuring long-term maintainability and efficient system architecture.
                        </p>
                    </li>
                    <li class="mb-10 ms-4">
                        <div class="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
                        <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">2024</time>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Google IT Support Professional Certificate</h3>
                        <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">Issued By: <a href="https://www.coursera.org/professional-certificates/google-it-support" target="_blank" rel="noopener noreferrer">Google (via Coursera)</a></time>
                        <p class="text-base font-normal text-gray-500 dark:text-gray-400">
                            Acquired in-depth knowledge of IT support fundamentals, including troubleshooting, networking, operating systems, and cybersecurity principles.
                        </p>
                    </li>
                    <li class="mb-10 ms-4">
                        <div class="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
                        <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">2024</time>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Cloud Computing & Deployment (AWS)</h3>
                        <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">Issued By: <a href="https://aws.amazon.com/training/" target="_blank" rel="noopener noreferrer">Amazon Web Services (AWS)</a></time>
                        <p class="text-base font-normal text-gray-500 dark:text-gray-400">
                            Learned how to deploy, manage, and optimize cloud-based applications using AWS services, including EC2, S3, and Lambda for scalable cloud solutions.
                        </p>
                    </li>
                    <li class="mb-10 ms-4">
                        <div class="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
                        <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">2024</time>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Google Cybersecurity Professional Certificate (Google)</h3>
                        <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">Issued By: <a href="https://www.coursera.org/professional-certificates/google-cybersecurity" target="_blank" rel="noopener noreferrer">Google (via Coursera)</a></time>
                        <p class="text-base font-normal text-gray-500 dark:text-gray-400">
                            Developed skills in penetration testing, network security, and ethical hacking techniques, enabling the ability to identify and mitigate cybersecurity threats in web applications.
                        </p>
                    </li>
                    <li class="mb-10 ms-4">
                        <div class="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
                        <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">2024</time>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Docker & Kubernetes for Developers</h3>
                        <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">Issued By: <a href="https://www.udemy.com/" target="_blank" rel="noopener noreferrer">(Kubernetes Official via Udemy)</a></time>
                        <p class="text-base font-normal text-gray-500 dark:text-gray-400">
                            Learned to automate, deploy, and manage scalable cloud-based applications using containerization (Docker) and orchestration (Kubernetes) with AWS infrastructure.
                        </p>
                    </li>
                    <li class="mb-10 ms-4">
                        <div class="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
                        <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">Jan 2025</time>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Google UX Design Professional Certificate</h3>
                        <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">Issued By: <a href="https://www.coursera.org/professional-certificates/google-ux-design" target="_blank" rel="noopener noreferrer">(Google via Coursera)</a></time>
                        <p class="text-base font-normal text-gray-500 dark:text-gray-400">
                        Mastered human-centered design principles, wireframing, prototyping, and user research to create intuitive and engaging user experiences in digital products.
                        </p>
                    </li>
                </ol>


            </div>
        </div>
        
    )
    
};
