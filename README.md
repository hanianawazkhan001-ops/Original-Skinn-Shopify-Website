# Original Skinn – Shopify Theme

A custom Shopify theme for **Original Skinn**, a UK natural skincare brand that makes vegan, small-batch face, body, bath, baby and home-fragrance products.

**Live site:** [originalskinn.com](https://originalskinn.com)

The theme was first designed and approved as a static test site. I then rebuilt it as a full Shopify Online Store 2.0 theme, tested it on a development store, and took it live on the brand's store in November 2026. I still maintain and extend it.

---

## What I worked on

- **UI design and front end.** Layout, typography, colour, components and responsive behaviour for desktop, tablet and mobile.
- **Theme development.** Liquid sections, snippets and JSON templates, vanilla JavaScript and CSS, with every section editable in the Shopify theme editor.
- **Store setup.** Products, variants and bundles, collections, metafields and metaobjects, navigation, policies, shipping and SEO.
- **Go-live.** Moving the theme and catalogue from the development store to the live store, redirects, testing and fixes after launch.

## Features

### Shopping and bundles
- **Ritual bundles.** Sets are sold as Shopify bundles. The Day & Night Face Ritual has three choices: AM set, PM set, or both together.
- **Customer-picked bundles.** In sets like the Ultimate Spa Ritual Set, customers choose the scent of each product inside the set. Their choices are saved on the order.
- **Ritual strips on shop pages.** Each routine is shown step by step, with one button to add the whole routine and an optional upgrade tick box.
- **Product page.** Size and option buttons, a photo for each option, description tabs (how to use, ingredients, details, FAQ), "Complete your ritual" suggestions and customer reviews.
- **Bag.** A free-delivery message, tailored product suggestions, and the scents chosen inside a bundle shown on each item.

### Home page
- **"Find your ritual."** Face, body, bath, hair and baby journeys open into step-by-step routines. The face journey shows morning and evening products side by side, with an optional night-time hand cream add-on.
- **"Shop by ritual."** Photo tiles, including a two-tab card that switches between the baby and adult bedtime rituals.
- **Best sellers, customer reviews** (stored as metaobjects), a skin-quiz banner and a newsletter sign-up.

### Helping customers choose
- **Skin quiz.** A short quiz (face, body, bath or baby) recommends a routine from the range, with "add all to bag".
- **Header and search.** Desktop menu tabs, a slide-out mobile menu with grouped categories, and predictive search with product photos and prices.

### Content and SEO
- Delivery & returns, FAQs, ingredients, about, contact, terms, privacy and cookie pages built as editable theme sections.
- Order tracking page (AfterShip).
- Structured data (JSON-LD) for products, collections and pages. SEO titles and descriptions throughout.

## Tech

- **Shopify:** Online Store 2.0, Liquid, JSON templates, section and block schemas, metafields and metaobjects, product bundles, Shopify GitHub integration.
- **Front end:** HTML, CSS and vanilla JavaScript, with no framework or build step.
- **Apps:** Judge.me (reviews), AfterShip (order tracking).
- **Workflow:** Git and GitHub. The development and live stores both read this repository's `main` branch, so changes are tested on the development store before going live.

## Folder structure

```
assets/      CSS, JavaScript and images
config/      theme settings
layout/      theme.liquid page frame
locales/     text strings
sections/    page sections (home, collection, product, bag, quiz, pages)
snippets/    reusable pieces (product cards, menus, bundle choices, images)
templates/   JSON templates that put the sections together on each page
```

## Running it locally

You need the [Shopify CLI](https://shopify.dev/docs/api/shopify-cli) and access to a Shopify store.

```
shopify theme dev --store your-store.myshopify.com
```

---

Theme code by Hania Nawaz Khan. Product names, photos and brand content belong to Original Skinn.
