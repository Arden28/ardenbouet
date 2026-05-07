
import { Hero } from "./components/Hero"
import { Projects } from "./components/Projects"
import { Journey } from "./components/Journey"
import { Contact } from "./components/Contact"
import ExperienceReel from "./components/ExperienceReel"
import Notes from "./components/Notes"
import { Header } from "./components/Header"
export default function Home() {

  return (
    <main>
      <Hero></Hero>
      <Projects></Projects>
      <ExperienceReel></ExperienceReel> 
      <Journey></Journey>
      <Contact/>
      <Notes />

    </main>
  );
}
