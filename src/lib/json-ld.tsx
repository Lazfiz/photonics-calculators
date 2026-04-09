import type { Metadata } from "next";

/**
 * Generate WebPage + FAQPage JSON-LD for a calculator page.
 * Call this from each page.tsx's default export.
 */
export function generateCalculatorJsonLd(
  title: string,
  description: string,
  url: string,
  options?: {
    category?: string;
    formulas?: string[];
    faq?: { question: string; answer: string }[];
  }
): object {
  const faq = options?.faq ?? generateFaqFromDescription(title, description);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: title,
        description,
        url,
        isPartOf: {
          "@type": "WebSite",
          name: "Photonics Calculators",
          url: "https://photonics-calculators.vercel.app",
        },
        ...(options?.category && {
          about: {
            "@type": "Thing",
            name: options.category,
          },
        }),
      },
      ...(faq.length > 0
        ? [
            {
              "@type": "FAQPage",
              mainEntity: faq.map((f) => ({
                "@type": "Question",
                name: f.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: f.answer,
                },
              })),
            },
          ]
        : []),
    ],
  };
}

/**
 * Auto-generate FAQ items from the page title and description.
 * Produces 2-3 relevant questions.
 */
function generateFaqFromDescription(
  title: string,
  description: string
): { question: string; answer: string }[] {
  const faq: { question: string; answer: string }[] = [];

  // "What is X?"
  faq.push({
    question: `What is ${title.toLowerCase()}?`,
    answer: description.endsWith(".")
      ? description
      : description + ".",
  });

  // "How do you calculate X?"
  if (!title.toLowerCase().includes("compare") && !title.toLowerCase().includes("vs")) {
    faq.push({
      question: `How do you calculate ${title.toLowerCase()}?`,
      answer: `Use the ${title} calculator above to compute values interactively. Adjust the input parameters and the results update in real-time with supporting charts and visualizations.`,
    });
  }

  return faq;
}

/**
 * Merge JSON-LD into existing layout JSON-LD.
 * Use this in page components to add page-specific structured data.
 */
export function JsonLdScript({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
