import Layout from '../components/Layout';

export default function TermsOfService() {
  return (
    <Layout>
      <div className="static-page">
        <h1 className="page-title">Terms of Service</h1>
        <p className="text-muted">Last updated: January 2024</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By registering for or using UK Tutor Marketplace ("the Platform"), you agree to be bound by
          these Terms of Service. If you do not agree, please do not use the Platform.
        </p>

        <h2>2. Eligibility</h2>
        <p>
          Tutors must be current A-Level or University students based in the UK. Customers must be
          school students (Year 7–13) or their parents/guardians. You must be at least 13 years old
          to use the Platform; users under 18 require parental consent.
        </p>

        <h2>3. Tutor Responsibilities</h2>
        <ul>
          <li>Provide accurate information about your education level, subjects, and availability</li>
          <li>Conduct tutoring sessions professionally and as agreed with customers</li>
          <li>Not share personal contact details outside the Platform</li>
          <li>Comply with all applicable UK laws</li>
        </ul>

        <h2>4. Customer Responsibilities</h2>
        <ul>
          <li>Provide accurate information during registration</li>
          <li>Treat tutors with respect</li>
          <li>Pay for tutoring sessions as agreed via the Platform's payment system</li>
          <li>Not attempt to contact tutors outside the Platform</li>
        </ul>

        <h2>5. Prohibited Conduct</h2>
        <p>You must not:</p>
        <ul>
          <li>Share personal contact details (email, phone, social media) via the Platform</li>
          <li>Post false, misleading, or defamatory content</li>
          <li>Harass, abuse, or threaten other users</li>
          <li>Attempt to circumvent the Platform's payment system</li>
          <li>Use the Platform for any unlawful purpose</li>
        </ul>

        <h2>6. Payments</h2>
        <p>
          All payments are processed via Stripe. The Platform does not store payment card details.
          Tutors set their own hourly rates. The Platform may charge a service fee, which will be
          clearly disclosed before payment.
        </p>

        <h2>7. Reviews</h2>
        <p>
          Reviews must be honest and based on genuine tutoring experiences. The Platform reserves the
          right to remove reviews that violate our content policy, including reviews containing
          profanity, false information, or personal attacks.
        </p>

        <h2>8. Account Termination</h2>
        <p>
          We reserve the right to suspend or terminate accounts that violate these Terms of Service.
          You may request deletion of your account at any time; your data will be removed within 30 days.
        </p>

        <h2>9. Limitation of Liability</h2>
        <p>
          The Platform acts as an intermediary connecting tutors and customers. We are not responsible
          for the quality of tutoring sessions or disputes between users. Our liability is limited to
          the maximum extent permitted by UK law.
        </p>

        <h2>10. Changes to Terms</h2>
        <p>
          We may update these Terms of Service from time to time. Continued use of the Platform after
          changes constitutes acceptance of the updated terms.
        </p>

        <h2>11. Governing Law</h2>
        <p>
          These Terms of Service are governed by the laws of England and Wales. Any disputes shall be
          subject to the exclusive jurisdiction of the courts of England and Wales.
        </p>

        <h2>12. Contact</h2>
        <p>
          For questions about these Terms, contact us at: <strong>legal@uktutormarketplace.co.uk</strong>
        </p>
      </div>
    </Layout>
  );
}
