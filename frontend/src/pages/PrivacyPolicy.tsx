import Layout from '../components/Layout';

export default function PrivacyPolicy() {
  return (
    <Layout>
      <div className="static-page">
        <h1 className="page-title">Privacy Policy</h1>
        <p className="text-muted">Last updated: January 2024</p>

        <h2>1. Introduction</h2>
        <p>
          UK Tutor Marketplace ("we", "us", or "our") is committed to protecting your personal data in accordance
          with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
          This Privacy Policy explains how we collect, use, and protect your information.
        </p>

        <h2>2. Data We Collect</h2>
        <p>We collect the following personal data when you register and use our platform:</p>
        <ul>
          <li>Full name, email address, and phone number</li>
          <li>For tutors: education level, institution name, subjects, year groups, hourly rate, and bio</li>
          <li>For students: year group and role (student or parent/guardian)</li>
          <li>Messages exchanged between connected users</li>
          <li>Payment transaction records (processed via Stripe)</li>
          <li>Reviews and ratings submitted on the platform</li>
        </ul>

        <h2>3. How We Use Your Data</h2>
        <p>We use your personal data to:</p>
        <ul>
          <li>Create and manage your account</li>
          <li>Enable tutors to be discovered by customers via search and listing pages</li>
          <li>Facilitate in-app communication between connected users</li>
          <li>Process payments via our payment provider (Stripe)</li>
          <li>Send transactional emails (account verification, notifications)</li>
          <li>Comply with legal obligations</li>
        </ul>

        <h2>4. Contact Details</h2>
        <p>
          Tutor contact details (email address and phone number) are never shared with customers or displayed
          publicly on the platform. All communication takes place through our in-app messaging system.
        </p>

        <h2>5. Data Retention</h2>
        <p>
          We retain your personal data for as long as your account is active. If you request account deletion,
          your personal data will be permanently removed within 30 days in accordance with UK GDPR requirements.
          Payment records may be retained in anonymised form for legal and financial compliance purposes.
        </p>

        <h2>6. Your Rights</h2>
        <p>Under UK GDPR, you have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your personal data</li>
          <li>Object to or restrict processing of your data</li>
          <li>Data portability</li>
        </ul>

        <h2>7. Third Parties</h2>
        <p>
          We share your data with third parties only as necessary to provide our services. This includes
          Stripe for payment processing. We do not sell your personal data to third parties.
        </p>

        <h2>8. Cookies</h2>
        <p>
          We use essential cookies to maintain your session and authentication state. No third-party
          tracking cookies are used.
        </p>

        <h2>9. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy or wish to exercise your data rights,
          please contact us at: <strong>privacy@uktutormarketplace.co.uk</strong>
        </p>
      </div>
    </Layout>
  );
}
