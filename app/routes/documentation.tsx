import React from 'react';
const APP_NAME = "Text Pilot";
const COMPANY_NAME = "Galaxy WebLinks";
import { MetaFunction } from 'react-router';

export const meta: MetaFunction = () => [
    { title: `Documentation | ${APP_NAME}` },
    {
        name: "description",
        content: `App Documentation for ${APP_NAME}, a Shopify app by ${COMPANY_NAME}. Learn how the app works, how translations are managed, and how storefront integration is set up.`,
    },
];

const TextPilotDocumentation: React.FC = () => {
    return (
        <div style={styles.appFrameMain}>
            <main style={styles.main}>
                <article style={styles.article}>
                    {/* Header area mirroring the template layout */}
                    <header style={styles.header}>
                        <h1 style={styles.pageTitle}>Text Pilot Documentation</h1>
                        <p style={styles.leadParagraph}>
                            Welcome to Text Pilot, a translation management solution built specifically for Shopify Hydrogen storefronts.
                        </p>
                    </header>

                    {/* Section 1: Overview */}
                    <section style={styles.section}>
                        <h2 style={styles.h2}>1. Overview</h2>
                        <p style={styles.p}>
                            While Shopify provides localization support for many native resources, developers often have additional website content such as navigation menus, buttons, banners, headings, forms, product labels, error messages, and other UI text that is hardcoded directly into their Hydrogen application.
                        </p>
                        <p style={styles.p}>
                            Traditionally, managing these translations requires maintaining JSON files, integrating third-party translation libraries, or building custom translation systems.
                        </p>
                        <p style={styles.p}>
                            Text Pilot simplifies this process by storing all custom website translations directly inside Shopify Metaobjects, allowing merchants and developers to manage translations from the Shopify Admin without relying on external databases or translation platforms.
                        </p>
                    </section>

                    {/* Section 2: Why Text Pilot? */}
                    <section style={styles.section}>
                        <h2 style={styles.h2}>2. Why Text Pilot?</h2>
                        <p style={styles.p}>
                            Text Pilot helps you centralize all of your custom storefront translations in Shopify by providing:
                        </p>
                        <ul style={styles.ul}>
                            <li style={styles.li}>Native Shopify Metaobject storage</li>
                            <li style={styles.li}>Individual language management</li>
                            <li style={styles.li}>Bulk translation updates</li>
                            <li style={styles.li}>CSV import support</li>
                            <li style={styles.li}>Free auto translation</li>
                            <li style={styles.li}>Hydrogen integration</li>
                            <li style={styles.li}>No third-party translation database</li>
                            <li style={styles.li}>No JSON translation files</li>
                            <li style={styles.li}>No additional infrastructure</li>
                        </ul>
                    </section>

                    {/* Section 3: Key Features */}
                    <section style={styles.section}>
                        <h2 style={styles.h2}>3. Key Features</h2>

                        <h3 style={styles.h3}>Native Shopify Storage</h3>
                        <p style={styles.p}>
                            All translations are stored securely inside your own Shopify store using Metaobjects. There is no external database, third-party storage, or additional backend service required.
                        </p>
                        <p style={styles.p}>
                            <strong style={styles.strong}>Benefits:</strong>
                        </p>
                        <ul style={styles.ul}>
                            <li style={styles.li}>Your translation data remains inside Shopify.</li>
                            <li style={styles.li}>No external synchronization.</li>
                            <li style={styles.li}>No vendor lock-in.</li>
                            <li style={styles.li}>No additional storage costs.</li>
                        </ul>

                        <h3 style={styles.h3}>Per-Language Editor</h3>
                        <p style={styles.p}>
                            Manage every language independently through an easy-to-use editor.
                        </p>
                        <p style={styles.p}>
                            You can:
                        </p>
                        <ul style={styles.ul}>
                            <li style={styles.li}>Add translation keys</li>
                            <li style={styles.li}>Edit translations</li>
                            <li style={styles.li}>Create flat root keys</li>
                            <li style={styles.li}>Create nested field groups</li>
                            <li style={styles.li}>Delete translation entries</li>
                            <li style={styles.li}>Undo changes before saving</li>
                        </ul>
                        <p style={styles.p}>
                            This gives you complete control over every language from a single interface.
                        </p>

                        <h3 style={styles.h3}>Bulk &amp; CSV Update</h3>
                        <p style={styles.p}>
                            Managing hundreds or thousands of translations becomes much easier with bulk operations.
                        </p>
                        <p style={styles.p}>
                            You can:
                        </p>
                        <ul style={styles.ul}>
                            <li style={styles.li}>Add translation keys to multiple languages at once</li>
                            <li style={styles.li}>Select individual languages or all languages</li>
                            <li style={styles.li}>Import translations using CSV files</li>
                            <li style={styles.li}>Track import progress with a real-time progress bar</li>
                        </ul>
                        <p style={styles.p}>
                            Perfect for migrating existing translations into Shopify.
                        </p>

                        <h3 style={styles.h3}>Free Auto Translation</h3>
                        <p style={styles.p}>
                            Enable Free Auto Translation to automatically generate translations whenever new keys are added. Auto Translation works in both Single Language Management and Multi Language Management workflows.
                        </p>
                        <p style={styles.p}>
                            <strong style={styles.strong}>Note:</strong> Free Auto Translation uses free translation services. Generated translations are not guaranteed to be completely accurate. Always review translations before saving or publishing.
                        </p>

                        <h3 style={styles.h3}>Hydrogen Ready</h3>
                        <p style={styles.p}>
                            Text Pilot is built specifically for Shopify Hydrogen. Your Hydrogen storefront can retrieve translations directly from Shopify Metaobjects using a single GraphQL query.
                        </p>
                        <p style={styles.p}>
                            This means you no longer need to:
                        </p>
                        <ul style={styles.ul}>
                            <li style={styles.li}>Maintain JSON translation files</li>
                            <li style={styles.li}>Bundle language files with every deployment</li>
                            <li style={styles.li}>Install additional i18n libraries</li>
                            <li style={styles.li}>Create custom translation APIs</li>
                        </ul>

                        <h3 style={styles.h3}>Zero Third-Party Dependency</h3>
                        <p style={styles.p}>
                            Everything stays inside Shopify. There are no external databases, translation storage services, additional API keys, or monthly infrastructure costs. Your Hydrogen storefront simply reads translations directly from Shopify Metaobjects at runtime.
                        </p>
                    </section>

                    {/* Section 4: Frequently Asked Questions */}
                    <section style={styles.section}>
                        <h2 style={styles.h2}>4. Frequently Asked Questions</h2>

                        <h3 style={styles.h3}>What is Text Pilot?</h3>
                        <p style={styles.p}>
                            Text Pilot is a translation management application designed specifically for Shopify Hydrogen storefronts.
                        </p>
                        <p style={styles.p}>
                            Although Shopify supports translations for many native resources, developers often have custom website text that exists only inside their Hydrogen application. This includes navigation labels, buttons, headings, banners, forms, error messages, and other interface content.
                        </p>
                        <p style={styles.p}>
                            Without Text Pilot, these translations are commonly managed through JSON files, hardcoded translation objects, or third-party translation services. Text Pilot centralizes all of these translations by storing them inside Shopify Metaobjects, making them easy to manage directly from the Shopify Admin.
                        </p>

                        <h3 style={styles.h3}>Can I edit translations for individual languages?</h3>
                        <p style={styles.p}>
                            Yes. The Per-Language Editor allows you to manage each language separately.
                        </p>
                        <p style={styles.p}>
                            You can:
                        </p>
                        <ul style={styles.ul}>
                            <li style={styles.li}>Add translation keys</li>
                            <li style={styles.li}>Edit existing translations</li>
                            <li style={styles.li}>Create nested translation groups</li>
                            <li style={styles.li}>Remove translation entries</li>
                            <li style={styles.li}>Undo changes before saving</li>
                        </ul>
                        <p style={styles.p}>
                            This provides complete control over every supported language.
                        </p>

                        <h3 style={styles.h3}>Can I update multiple languages at once?</h3>
                        <p style={styles.p}>
                            Yes. Text Pilot includes powerful bulk management tools that let you update multiple languages in a single operation.
                        </p>
                        <p style={styles.p}>
                            You can:
                        </p>
                        <ul style={styles.ul}>
                            <li style={styles.li}>Add translation keys across multiple languages</li>
                            <li style={styles.li}>Select specific languages or all available languages</li>
                            <li style={styles.li}>Import translations using CSV files</li>
                            <li style={styles.li}>Monitor progress with a real-time progress indicator</li>
                        </ul>
                        <p style={styles.p}>
                            This significantly reduces repetitive work for multilingual stores.
                        </p>

                        <h3 style={styles.h3}>What is Free Auto Translation?</h3>
                        <p style={styles.p}>
                            Free Auto Translation automatically generates translations for newly added translation keys using free translation services. This helps you quickly populate translations across supported languages.
                        </p>
                        <p style={styles.p}>
                            <strong style={styles.strong}>Important:</strong> Because free translation services are used, translation quality cannot be guaranteed. Always review generated translations before saving or publishing.
                        </p>

                        <h3 style={styles.h3}>How do I connect Text Pilot with my Hydrogen storefront?</h3>
                        <p style={styles.p}>
                            Text Pilot includes a complete Developer Guide that explains how to integrate your Hydrogen storefront.
                        </p>
                        <p style={styles.p}>
                            The guide covers:
                        </p>
                        <ul style={styles.ul}>
                            <li style={styles.li}>Connecting your Hydrogen project</li>
                            <li style={styles.li}>Querying Shopify Metaobjects</li>
                            <li style={styles.li}>Fetching translation data using GraphQL</li>
                            <li style={styles.li}>Rendering translated content throughout your storefront</li>
                        </ul>
                        <p style={styles.p}>
                            After setup, your storefront can retrieve translations directly from Shopify without maintaining local translation files.
                        </p>

                        <h3 style={styles.h3}>Where are my translations stored?</h3>
                        <p style={styles.p}>
                            All translations are stored inside your own Shopify store using Shopify Metaobjects.
                        </p>
                        <p style={styles.p}>
                            Text Pilot does not require:
                        </p>
                        <ul style={styles.ul}>
                            <li style={styles.li}>External databases</li>
                            <li style={styles.li}>Third-party translation storage</li>
                            <li style={styles.li}>JSON translation files</li>
                            <li style={styles.li}>Additional backend infrastructure</li>
                        </ul>
                        <p style={styles.p}>
                            Your translations remain fully owned by you and are available directly through Shopify.
                        </p>

                        <h3 style={styles.h3}>What are the subscription plans for Text Pilot?</h3>
                        <p style={styles.p}>
                            Text Pilot offers two subscription plans:
                        </p>
                        <ul style={styles.ul}>
                            <li style={styles.li}>
                                <strong style={styles.strong}>Free Plan ($0/month):</strong> Includes support for 1 language definition, standard translation management, and native Shopify storage.
                            </li>
                            <li style={styles.li}>
                                <strong style={styles.strong}>Advance Plan ($5/month):</strong> Unlocks unlimited language definitions, translation key synchronization across all languages, and automatic bulk translation.
                            </li>
                        </ul>
                        <p style={styles.p}>
                            All subscription and recurring charges are processed securely through Shopify's official Billing API.
                        </p>

                        <h3 style={styles.h3}>How many languages does Text Pilot support?</h3>
                        <p style={styles.p}>
                            Text Pilot currently supports 80 languages: Afrikaans, Albanian, Amharic, Arabic, Armenian, Assamese, Azerbaijani, Basque, Bengali, Bulgarian, Burmese, Catalan, Cherokee, Chinese (Hong Kong), Chinese (Simplified), Chinese (Traditional), Croatian, Czech, Danish, Dutch, English (UK), English (US), Estonian, Filipino, Finnish, French, French (Canada), Galician, Georgian, German, Greek, Gujarati, Hebrew, Hindi, Hungarian, Icelandic, Indonesian, Irish, Italian, Japanese, Kannada, Kazakh, Khmer, Korean, Lao, Latvian, Lithuanian, Macedonian, Malay, Malayalam, Marathi, Mongolian, Nepali, Norwegian, Odia, Persian, Polish, Portuguese (Brazil), Portuguese (Portugal), Punjabi, Romanian, Russian, Serbian, Sinhala, Slovak, Slovenian, Spanish, Spanish (Latin America), Swahili, Swedish, Tamil, Telugu, Thai, Turkish, Ukrainian, Urdu, Uzbek, Vietnamese, Welsh, Zulu.
                        </p>
                    </section>

                    {/* Section 5: Managing Languages */}
                    <section style={styles.section}>
                        <h2 style={styles.h2}>5. Managing Languages</h2>
                        <p style={styles.p}>
                            Text Pilot provides three different workflows for managing translations. The instructions below summarize the available actions in the app.
                        </p>

                        <h3 style={styles.h3}>1. Add Language Definitions</h3>
                        <p style={styles.p}>
                            Use the Add Definition page to create new language definitions. You can:
                        </p>
                        <ul style={styles.ul}>
                            <li style={styles.li}>Create an empty language definition.</li>
                            <li style={styles.li}>Sync translation keys from an existing language.</li>
                            <li style={styles.li}>Preview synced keys before creating the language.</li>
                            <li style={styles.li}>Preview existing language definitions.</li>
                            <li style={styles.li}>Remove language definitions when they are no longer needed.</li>
                        </ul>

                        <h3 style={styles.h3}>2. Manage Individual Languages</h3>
                        <p style={styles.p}>
                            Each language can be managed independently. Available features include:
                        </p>
                        <ul style={styles.ul}>
                            <li style={styles.li}>Add translation keys</li>
                            <li style={styles.li}>Edit translations</li>
                            <li style={styles.li}>Search translation keys</li>
                            <li style={styles.li}>Export translations as CSV</li>
                            <li style={styles.li}>Import translation keys</li>
                            <li style={styles.li}>Import keys with translations</li>
                            <li style={styles.li}>Sync missing translation keys</li>
                            <li style={styles.li}>Filter translated and untranslated entries</li>
                            <li style={styles.li}>Generate automatic translations</li>
                            <li style={styles.li}>Save or discard changes</li>
                        </ul>

                        <h3 style={styles.h3}>3. Manage Multiple Languages</h3>
                        <p style={styles.p}>
                            The Multi Language page allows you to update several languages simultaneously. You can:
                        </p>
                        <ul style={styles.ul}>
                            <li style={styles.li}>Select multiple languages</li>
                            <li style={styles.li}>Add translation keys in bulk</li>
                            <li style={styles.li}>Import translation keys via CSV</li>
                            <li style={styles.li}>Generate automatic translations</li>
                            <li style={styles.li}>Preview changes before applying them</li>
                        </ul>
                        <p style={styles.p}>
                            This workflow is recommended when introducing new translation keys across your entire storefront.
                        </p>
                    </section>

                    {/* Section 6: Best Practices */}
                    <section style={styles.section}>
                        <h2 style={styles.h2}>6. Best Practices</h2>
                        <p style={styles.p}>
                            For the best experience with Text Pilot:
                        </p>
                        <ul style={styles.ul}>
                            <li style={styles.li}>Keep translation keys consistent across all languages.</li>
                            <li style={styles.li}>Review automatically generated translations before publishing.</li>
                            <li style={styles.li}>Use CSV imports for large translation updates.</li>
                            <li style={styles.li}>Organize related translations using nested field groups.</li>
                            <li style={styles.li}>Preview bulk updates before saving.</li>
                            <li style={styles.li}>Regularly export translations for backup purposes.</li>
                        </ul>
                    </section>

                    {/* Section 7: Summary */}
                    <section style={styles.section}>
                        <h2 style={styles.h2}>7. Summary</h2>
                        <p style={styles.p}>
                            Text Pilot provides a centralized, Shopify-native way to manage custom Hydrogen storefront translations. By storing translations in Shopify Metaobjects, it eliminates the need for separate JSON files, external databases, and third-party translation infrastructure while giving merchants and developers a simple interface to manage multilingual storefronts efficiently.
                        </p>
                    </section>

                    {/* Conclusion / Contact Card */}
                    <section style={styles.section}>
                        <h2 style={styles.h2}>Contact Us</h2>

                        <p style={styles.p}>
                            If you have any questions, feedback, or require assistance with Text Pilot,
                            please contact our support team.
                        </p>

                        <div style={styles.contactCard}>
                            <p style={styles.contactItem}>
                                <strong style={styles.strongLabel}>App:</strong> Text Pilot
                            </p>

                            <p style={styles.contactItem}>
                                <strong style={styles.strongLabel}>Company:</strong> Galaxy Weblinks
                            </p>
                            <p style={styles.contactItem}>
                                <strong style={styles.strongLabel}>Email:</strong>{" "}
                                <a
                                    href="mailto:appsupport@galaxyweblinks.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={styles.link}
                                >
                                    appsupport@galaxyweblinks.com
                                </a>
                            </p>
                            <p style={styles.contactItem}>
                                <strong style={styles.strongLabel}>Website:</strong>{" "}
                                <a
                                    href="https://www.galaxyweblinks.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={styles.link}
                                >
                                    www.galaxyweblinks.com
                                </a>
                            </p>
                        </div>
                    </section>

                    {/* Footer Section */}
                    <footer style={styles.footer}>
                        <p style={styles.footerText}>© {new Date().getFullYear()} Galaxy Weblinks. All rights reserved.</p>
                    </footer>
                </article>
            </main>
        </div>
    );
};

// Styling structure converted to react clean CSS system
const styles: Record<string, React.CSSProperties> = {
    appFrameMain: {
        width: '100%',
        backgroundColor: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    main: {
        display: 'block',
    },
    article: {
        maxWidth: '780px',
        margin: '0 auto',
        padding: '4rem 1.5rem 6rem 1.5rem',
        color: '#202223',
    },
    header: {
        marginBottom: '3rem',
        borderBottom: '1px solid #e1e3e5',
        paddingBottom: '2rem',
    },
    pageTitle: {
        fontSize: '2.25rem',
        fontWeight: 700,
        lineHeight: '2.75rem',
        color: '#1a1c1d',
        margin: '0 0 1rem 0',
        letterSpacing: '-0.025em',
    },
    leadParagraph: {
        fontSize: '1.125rem',
        lineHeight: '1.75rem',
        color: '#6d7175',
        margin: 0,
    },
    section: {
        marginBottom: '2.5rem',
    },
    h2: {
        fontSize: '1.375rem',
        fontWeight: 600,
        lineHeight: '1.875rem',
        color: '#1a1c1d',
        margin: '2rem 0 1rem 0',
    },
    h3: {
        fontSize: '1.05rem',
        fontWeight: 600,
        lineHeight: '1.5rem',
        color: '#202223',
        margin: '1.5rem 0 0.5rem 0',
    },
    p: {
        fontSize: '1rem',
        lineHeight: '1.625rem',
        color: '#454f5b',
        margin: '0 0 1rem 0',
    },
    ul: {
        paddingLeft: '1.5rem',
        margin: '0 0 1.25rem 0',
        listStyleType: 'disc',
    },
    ol: {
        paddingLeft: '1.5rem',
        margin: '0 0 1.25rem 0',
        listStyleType: 'decimal',
    },
    li: {
        fontSize: '1rem',
        lineHeight: '1.625rem',
        color: '#454f5b',
        marginBottom: '0.5rem',
    },
    strong: {
        fontWeight: 600,
        color: '#1a1c1d',
    },
    footer: {
        borderTop: '1px solid #e1e3e5',
        paddingTop: '2rem',
    },
    footerText: {
        fontSize: '0.875rem',
        color: '#8c9196',
        margin: 0,
    },
    contactCard: {
        marginTop: '1rem',
        padding: '1.25rem',
        border: '1px solid #e1e3e5',
        borderRadius: '8px',
        backgroundColor: '#f9fafb',
    },
    contactItem: {
        margin: '0 0 0.75rem 0',
        color: '#454f5b',
        fontSize: '1rem',
    },
    strongLabel: {
        fontWeight: 600,
        color: '#1a1c1d',
    },
    link: {
        color: '#005bd3',
        textDecoration: 'none',
    },
};

export default TextPilotDocumentation;