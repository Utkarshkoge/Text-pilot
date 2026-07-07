import React from 'react';
import { MetaFunction } from 'react-router';
const APP_NAME = "Text Pilot";
const COMPANY_NAME = "Galaxy WebLinks";

export const meta: MetaFunction = () => [
    { title: `FAQ | ${APP_NAME}` },
    {
        name: "description",
        content: `Frequently Asked Questions for ${APP_NAME}, a Shopify app by ${COMPANY_NAME}. Learn how the app works, how translations are managed, and how storefront integration is set up.`,
    },
];

const TextPilotFAQ: React.FC = () => {
    return (
        <div style={styles.appFrameMain}>
            <main style={styles.main}>
                <article style={styles.article}>
                    {/* Header area mirroring the privacy template layout */}
                    <header style={styles.header}>
                        <h1 style={styles.pageTitle}>Frequently Asked Questions</h1>
                        <p style={styles.leadParagraph}>
                            This FAQ guide explains how <strong style={styles.strong}>Text Pilot</strong> operates, manages your translations,
                            and integrates with your Hydrogen storefront.
                        </p>
                    </header>

                    {/* Section 1 */}
                    <section style={styles.section}>
                        <h2 style={styles.h2}>1. What is this app?</h2>
                        <p style={styles.p}>
                            Text Pilot is a translation management app built specifically for Shopify Hydrogen storefronts.
                        </p>
                        <p style={styles.p}>
                            While Shopify provides translation support for many native resources, developers often have additional website text such as buttons, headings, navigation labels, banners, forms, and other custom content that is hardcoded into their Hydrogen application. Managing these translations with JSON files, custom code, or third-party services can quickly become difficult as your store grows.
                        </p>
                        <p style={styles.p}>
                            Text Pilot solves this by storing your custom translations directly in Shopify Metaobjects. This allows you to manage all of your website translations from the Shopify Admin without maintaining separate translation files or external translation databases.
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section style={styles.section}>
                        <h2 style={styles.h2}>2. Can I edit translations for individual languages?</h2>
                        <p style={styles.p}>
                            Yes.
                        </p>
                        <p style={styles.p}>
                            Text Pilot includes a Per-Language Editor that allows you to manage each language independently. You can:
                        </p>
                        <ul style={styles.ul}>
                            <li style={styles.li}>Add new translation keys.</li>
                            <li style={styles.li}>Edit existing translations.</li>
                            <li style={styles.li}>Organize translations using flat keys or nested field groups.</li>
                            <li style={styles.li}>Delete unwanted entries.</li>
                            <li style={styles.li}>Review and undo changes before saving.</li>
                        </ul>
                        <p style={styles.p}>
                            This gives you complete control over every supported language from a single interface.
                        </p>
                    </section>

                    {/* Section 3 */}
                    <section style={styles.section}>
                        <h2 style={styles.h2}>3. Can I update multiple languages at once?</h2>
                        <p style={styles.p}>
                            Yes.
                        </p>
                        <p style={styles.p}>
                            Text Pilot supports bulk translation management, making it easy to update multiple languages in a single operation.
                        </p>
                        <p style={styles.p}>
                            You can:
                        </p>
                        <ul style={styles.ul}>
                            <li style={styles.li}>Add translation keys across multiple languages simultaneously.</li>
                            <li style={styles.li}>Select specific languages or update all available languages.</li>
                            <li style={styles.li}>Import translations using a CSV file.</li>
                            <li style={styles.li}>Track the import process with a real-time progress indicator.</li>
                        </ul>
                        <p style={styles.p}>
                            This greatly reduces the time required to manage multilingual storefronts.
                        </p>
                    </section>

                    {/* Section 4 */}
                    <section style={styles.section}>
                        <h2 style={styles.h2}>4. What is Free Auto Translation?</h2>
                        <p style={styles.p}>
                            Free Auto Translation automatically generates translations for newly added translation keys using free translation services.
                        </p>
                        <p style={styles.p}>
                            This feature helps speed up the translation process by creating an initial translation for supported languages.
                        </p>
                        <p style={styles.p}>
                            <strong style={styles.strong}>Note:</strong> Free translation services do not guarantee complete accuracy. We recommend reviewing and updating the generated translations before saving or publishing them to ensure they meet your quality standards.
                        </p>
                    </section>

                    {/* Section 5 */}
                    <section style={styles.section}>
                        <h2 style={styles.h2}>5. How do I connect Text Pilot with my Hydrogen storefront?</h2>
                        <p style={styles.p}>
                            Text Pilot is designed to integrate directly with Shopify Hydrogen.
                        </p>
                        <p style={styles.p}>
                            A complete Developer Guide is included with the app, providing step-by-step instructions for:
                        </p>
                        <ul style={styles.ul}>
                            <li style={styles.li}>Connecting your Hydrogen storefront.</li>
                            <li style={styles.li}>Fetching translations from Shopify Metaobjects.</li>
                            <li style={styles.li}>Querying translations using Shopify GraphQL.</li>
                            <li style={styles.li}>Displaying translated content throughout your storefront.</li>
                        </ul>
                        <p style={styles.p}>
                            Following the guide allows your Hydrogen application to retrieve translations directly from Shopify without maintaining local translation files.
                        </p>
                    </section>

                    {/* Section 6 */}
                    <section style={styles.section}>
                        <h2 style={styles.h2}>6. Where are my translations stored?</h2>
                        <p style={styles.p}>
                            All translations are stored securely within your Shopify store using Shopify Metaobjects.
                        </p>
                        <p style={styles.p}>
                            Text Pilot does not require:
                        </p>
                        <ul style={styles.ul}>
                            <li style={styles.li}>External databases</li>
                            <li style={styles.li}>Third-party translation storage</li>
                            <li style={styles.li}>Separate JSON translation files</li>
                            <li style={styles.li}>Additional backend services</li>
                        </ul>
                        <p style={styles.p}>
                            Because your translations live inside Shopify, they can be managed centrally through the Shopify Admin and accessed directly by your Hydrogen storefront whenever needed.
                        </p>
                    </section>

                    {/* Section 7 */}
                    <section style={styles.section}>
                        <h2 style={styles.h2}>7. What are the subscription plans for Text Pilot?</h2>
                        <p style={styles.p}>
                            Text Pilot offers two subscription plans tailored to your store's localization needs:
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
                    </section>

                    {/* Section 8 */}
                    <section style={styles.section}>
                        <h2 style={styles.h2}>8. How many languages does Text Pilot support?</h2>
                        <p style={styles.p}>
                            Text Pilot currently supports 80 languages: Afrikaans, Albanian, Amharic, Arabic, Armenian, Assamese, Azerbaijani, Basque, Bengali, Bulgarian, Burmese, Catalan, Cherokee, Chinese (Hong Kong), Chinese (Simplified), Chinese (Traditional), Croatian, Czech, Danish, Dutch, English (UK), English (US), Estonian, Filipino, Finnish, French, French (Canada), Galician, Georgian, German, Greek, Gujarati, Hebrew, Hindi, Hungarian, Icelandic, Indonesian, Irish, Italian, Japanese, Kannada, Kazakh, Khmer, Korean, Lao, Latvian, Lithuanian, Macedonian, Malay, Malayalam, Marathi, Mongolian, Nepali, Norwegian, Odia, Persian, Polish, Portuguese (Brazil), Portuguese (Portugal), Punjabi, Romanian, Russian, Serbian, Sinhala, Slovak, Slovenian, Spanish, Spanish (Latin America), Swahili, Swedish, Tamil, Telugu, Thai, Turkish, Ukrainian, Urdu, Uzbek, Vietnamese, Welsh, Zulu.
                        </p>
                    </section>

                    {/* Contact Us Section */}
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
                    {/* Footer section matching the template structure */}
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

export default TextPilotFAQ;