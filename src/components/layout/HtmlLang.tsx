"use client";

import { useEffect } from "react";

interface HtmlLangProps {
  locale: string;
  dir?: "ltr" | "rtl";
}

export default function HtmlLang({ locale, dir = "ltr" }: HtmlLangProps) {
  useEffect(() => {
    const root = document.documentElement;
    if (root.lang !== locale) {
      root.lang = locale;
    }
    if (root.dir !== dir) {
      root.dir = dir;
    }
  }, [locale, dir]);

  return null;
}


