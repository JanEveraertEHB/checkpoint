export default function Terms() {
  return (
    <div className="container">
      <div className="row">
        <div className="ten columns offset-by-one">
          <h2>Terms & Conditions</h2>
          <p><em>Last updated: {new Date().toLocaleDateString()}</em></p>

          <h4>1. Acceptance of Terms</h4>
          <p>
            By accessing and using Checkpoint ("the Service"), you accept and agree to be bound by the terms
            and provisions of this agreement. If you do not agree to abide by these terms, please do not use
            this service.
          </p>

          <h4>2. Description of Service</h4>
          <p>
            Checkpoint is an educational platform that provides classroom management tools, including student
            progress tracking through checkpoints and feedback management. The Service is intended for use by
            educational institutions, teachers, and students.
          </p>

          <h4>3. User Accounts</h4>
          <p>
            To use the Service, you must register for an account. You are responsible for maintaining the
            confidentiality of your account credentials and for all activities that occur under your account.
            You agree to notify us immediately of any unauthorized use of your account.
          </p>

          <h4>4. Acceptable Use</h4>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose</li>
            <li>Share your account credentials with others</li>
            <li>Attempt to gain unauthorized access to the Service or its systems</li>
            <li>Upload malicious content or viruses</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Use the Service to collect personal information about others without consent</li>
          </ul>

          <h4>5. Intellectual Property</h4>
          <p>
            The Service and its original content, features, and functionality are owned by Checkpoint and are
            protected by international copyright, trademark, patent, trade secret, and other intellectual
            property laws. User-generated content remains the property of the respective users.
          </p>

          <h4>6. User Content</h4>
          <p>
            Users retain ownership of content they upload to the Service (including feedback, images, and
            classroom materials). By uploading content, you grant us a license to store, display, and
            transmit that content as necessary to provide the Service.
          </p>

          <h4>7. Privacy</h4>
          <p>
            Your use of the Service is also governed by our Privacy Policy. Please review our Privacy Policy
            to understand our practices regarding the collection and use of your personal information.
          </p>

          <h4>8. Termination</h4>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, for any
            reason, including breach of these Terms. Upon termination, your right to use the Service will
            immediately cease.
          </p>

          <h4>9. Disclaimer of Warranties</h4>
          <p>
            The Service is provided "as is" and "as available" without any warranties of any kind, either
            express or implied. We do not warrant that the Service will be uninterrupted, secure, or
            error-free.
          </p>

          <h4>10. Limitation of Liability</h4>
          <p>
            In no event shall Checkpoint, its directors, employees, partners, agents, suppliers, or
            affiliates be liable for any indirect, incidental, special, consequential, or punitive damages,
            including loss of profits, data, or other intangible losses.
          </p>

          <h4>11. Changes to Terms</h4>
          <p>
            We reserve the right to modify or replace these Terms at any time. We will provide notice of any
            material changes by posting the new Terms on this page with an updated revision date.
          </p>

          <h4>12. Governing Law</h4>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of Belgium, without
            regard to its conflict of law provisions.
          </p>

          <h4>13. Contact Information</h4>
          <p>
            If you have any questions about these Terms, please contact us at{' '}
            <a href="/contact">our contact page</a> or email us at jan@tastbaar.studio.
          </p>
        </div>
      </div>
    </div>
  )
}
