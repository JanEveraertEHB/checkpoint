export default function Privacy() {
  return (
    <div className=" single_container container">
      <div className="row">
        <div className="ten columns offset-by-one">
          <h2>Privacy Policy</h2>
          <p><em>Last updated: {new Date().toLocaleDateString()}</em></p>

          <h4>1. Introduction</h4>
          <p>
            This Privacy Policy explains how Checkpoint ("we", "us", or "our") collects, uses, and protects
            your personal information when you use our educational platform. We are committed to protecting
            your privacy and ensuring the security of your data.
          </p>

          <h4>2. Information We Collect</h4>
          <p>We collect the following types of information:</p>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, date of birth, and password (stored securely hashed)</li>
            <li><strong>Classroom Data:</strong> Classroom names, academic years, membership information</li>
            <li><strong>Progress Data:</strong> Checkpoint completions, feedback entries, and timestamps</li>
            <li><strong>Content:</strong> Images and text uploaded as part of feedback</li>
            <li><strong>Technical Data:</strong> IP addresses, browser type, and usage patterns</li>
          </ul>

          <h4>3. How We Use Your Information</h4>
          <p>We use your information to:</p>
          <ul>
            <li>Provide and maintain the Service</li>
            <li>Authenticate users and manage accounts</li>
            <li>Enable classroom management and progress tracking</li>
            <li>Send important service notifications</li>
            <li>Respond to your inquiries and support requests</li>
            <li>Improve our Service and user experience</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h4>4. Data Storage and Security</h4>
          <p>
            Your data is stored on secure servers with industry-standard encryption. Passwords are hashed
            using bcrypt before storage. We implement appropriate technical and organizational measures to
            protect your personal data against unauthorized access, alteration, disclosure, or destruction.
          </p>

          <h4>5. Data Sharing</h4>
          <p>We do not sell your personal information. We may share your data with:</p>
          <ul>
            <li><strong>Other Users:</strong> Teachers can see student data in their classrooms; students can see their own data</li>
            <li><strong>Service Providers:</strong> Third-party services that help us operate (e.g., email services)</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
          </ul>

          <h4>6. Data Retention</h4>
          <p>
            We retain your personal information for as long as your account is active or as needed to provide
            the Service. Classroom data is retained even after completion for historical reference. You may
            request deletion of your data by contacting us.
          </p>

          <h4>7. Your Rights</h4>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your data in a portable format</li>
            <li>Withdraw consent for data processing</li>
            <li>Lodge a complaint with a supervisory authority</li>
          </ul>

          <h4>8. Cookies and Tracking</h4>
          <p>
            We use local storage to maintain your authentication session. We do not use tracking cookies or
            third-party analytics services that track individual users across websites.
          </p>

          <h4>9. Children's Privacy</h4>
          <p>
            Our Service is designed for educational use and may be used by minors under teacher supervision.
            We collect only the minimum information necessary for the Service. Parents or guardians may
            contact us to review or delete their child's information.
          </p>

          <h4>10. International Data Transfers</h4>
          <p>
            Your information may be transferred to and processed in countries other than your own. We ensure
            appropriate safeguards are in place for such transfers in compliance with applicable data
            protection laws.
          </p>

          <h4>11. Changes to This Policy</h4>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting
            the new Privacy Policy on this page and updating the "Last updated" date.
          </p>

          <h4>12. Contact Us</h4>
          <p>
            If you have questions about this Privacy Policy or your personal data, please contact us at{' '}
            <a href="/contact">our contact page</a> or email us at jan@tastbaar.studio.
          </p>
        </div>
      </div>
    </div>
  )
}
