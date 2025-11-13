import Link from "next/link";

const footerLinkClass = "underline text-gray-300 hover:no-underline hover:text-white transition-all duration-200";

export default function Footer() {
    return (
        <footer className="py-8 bg-neutral-900 text-white">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
                    <div>
                        <h5 className="text-xl font-bold mb-4">About Lifted</h5>
                        <div className="w-10 h-0.5 mb-4" style={{backgroundColor: 'var(--cornell-red)'}} />
                        <p className="mb-2 text-gray-200">Lifted is a student organization at Cornell University dedicated to spreading positivity and gratitude across campus.</p>
                        <p className="text-gray-200">Our end-of-semester events are designed to lift spirits and foster community.</p>
                    </div>
                    <div>
                        <h5 className="text-xl font-bold mb-4">Quick Links</h5>
                        <div className="w-10 h-0.5 mb-4" style={{backgroundColor: 'var(--cornell-red)'}} />
                        <ul className="space-y-2">
                            <li><Link href="/" className={footerLinkClass}>Home</Link></li>
                            <li><Link href="/send-message" className={footerLinkClass}>Send a Message</Link></li>
                            <li><Link href="/messages" className={footerLinkClass}>View Messages</Link></li>
                            <li><Link href="/faqs" className={footerLinkClass}>FAQs</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="text-xl font-bold mb-4">Contact Us</h5>
                        <div className="w-10 h-0.5 mb-4" style={{backgroundColor: 'var(--cornell-red)'}} />
                        <p className="mb-2 text-gray-200">Have questions or feedback? We'd love to hear from you!</p>
                        <p className="mb-2"><a href="mailto:lifted@cornell.edu" className={footerLinkClass}>lifted@cornell.edu</a></p>
                        <div className="flex items-center mt-3 space-x-4">
                            <a href="https://www.instagram.com/cornelllifted" target="_blank">
                                <img src="../images/ig.png" width="30" height="30" alt="Instagram Logo" />
                            </a>
                        </div>
                    </div>
                </div>
                <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-300 space-y-4">
                    <p>Version 4.1 (10/11/25) | <a href="https://reidserver.statuspage.io" target="_blank" className={footerLinkClass}>System Status</a> | <Link href="/about-this-website" className={footerLinkClass}>About this Website</Link></p>
                    <p className="mt-2">© 2025 Lifted at Cornell</p>
                    <p className="mt-2">This organization is a registered student organization of Cornell University.</p>
                    <p className="mt-2"><a href="https://hr.cornell.edu/about/workplace-rights/equal-education-and-employment" target="_blank" className={footerLinkClass}>Equal Education and Employment Opportunity (EEEO) Statement</a></p>
                    <p className="mt-2 mb-0">Made with 💌 by <Link href="/circle" className={footerLinkClass} style={{ textDecoration: "none" }}>🐏</Link></p>
                </div>
            </div>
        </footer>
    );
}