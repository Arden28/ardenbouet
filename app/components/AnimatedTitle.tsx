"use client";
import { useEffect, useRef } from "react";
import Typed from "typed.js";
import { useTranslation } from 'react-i18next';

export default function AnimatedTitle() {
  const el = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    const typed = new Typed(el.current, {
      strings: [t("hero.title.fullstack"), t("hero.title.engineer")],
      typeSpeed: 100,
      backSpeed: 50,
      backDelay: 2000,
      loop: true,
    });

    return () => typed.destroy();
  }, []);

  return (
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-sky-500">
      <span ref={el} />
    </span>
  );
}
