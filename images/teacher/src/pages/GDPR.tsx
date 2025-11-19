export default function GDPR() {
  return (
    <div className="container">
      <div className="row">
        <div className="ten columns offset-by-one">
          <h2>GDPR Compliance</h2>
          <p><em>Last updated: {new Date().toLocaleDateString()}</em></p>

          <h4>Our Commitment to GDPR</h4>
          <p>
            Checkpoint is committed to complying with the General Data Protection Regulation (GDPR) and
            protecting the privacy rights of all our users in the European Union and European Economic Area.
            This page outlines our GDPR compliance measures and your rights under this regulation.
          </p>

          <h4>Data Controller Information</h4>
          <p>
            <strong>Controller:</strong> Checkpoint<br />
            <strong>Contact:</strong> jan@tastbaar.studio<br />
            <strong>Location:</strong> Belgium
          </p>

          <h4>Legal Basis for Processing</h4>
          <p>We process personal data under the following legal bases:</p>
          <ul>
            <li><strong>Contract Performance:</strong> Processing necessary to provide our educational services</li>
            <li><strong>Legitimate Interest:</strong> Improving our services and ensuring security</li>
            <li><strong>Consent:</strong> Where explicitly obtained for specific purposes</li>
            <li><strong>Legal Obligation:</strong> Compliance with applicable laws</li>
          </ul>

          <h4>Your Rights Under GDPR</h4>
          <p>As a data subject, you have the following rights:</p>

          <h5>Right to Access (Article 15)</h5>
          <p>
            You can request a copy of all personal data we hold about you. This includes your account
            information, classroom memberships, checkpoints, and feedback data.
          </p>

          <h5>Right to Rectification (Article 16)</h5>
          <p>
            You can update your personal information through your profile page or request corrections to
            inaccurate data by contacting us.
          </p>

          <h5>Right to Erasure (Article 17)</h5>
          <p>
            You can request deletion of your personal data. Note that some data may be retained for legal
            compliance or legitimate educational record-keeping purposes.
          </p>

          <h5>Right to Restrict Processing (Article 18)</h5>
          <p>
            You can request that we limit the processing of your personal data under certain circumstances.
          </p>

          <h5>Right to Data Portability (Article 20)</h5>
          <p>
            You can request your data in a structured, commonly used, machine-readable format to transfer to
            another service.
          </p>

          <h5>Right to Object (Article 21)</h5>
          <p>
            You can object to processing of your personal data for certain purposes, including direct
            marketing.
          </p>

          <h5>Right to Withdraw Consent (Article 7)</h5>
          <p>
            Where processing is based on consent, you can withdraw your consent at any time without affecting
            the lawfulness of processing before withdrawal.
          </p>

          <h4>Data Protection Measures</h4>
          <ul>
            <li><strong>Encryption:</strong> Data transmitted via HTTPS; passwords hashed with bcrypt</li>
            <li><strong>Access Controls:</strong> Role-based access ensuring data is only visible to authorized users</li>
            <li><strong>Data Minimization:</strong> We collect only data necessary for the service</li>
            <li><strong>Secure Storage:</strong> Data stored on secure servers with regular security updates</li>
            <li><strong>Breach Notification:</strong> We will notify authorities and affected users within 72 hours of discovering a breach</li>
          </ul>

          <h4>Data Processing Activities</h4>
          <table className="u-full-width">
            <thead>
              <tr>
                <th>Data Category</th>
                <th>Purpose</th>
                <th>Retention Period</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Account Data</td>
                <td>Authentication & Profile Management</td>
                <td>Until account deletion</td>
              </tr>
              <tr>
                <td>Classroom Data</td>
                <td>Educational Progress Tracking</td>
                <td>Duration of classroom + archival</td>
              </tr>
              <tr>
                <td>Feedback Content</td>
                <td>Student-Teacher Communication</td>
                <td>Duration of classroom + archival</td>
              </tr>
              <tr>
                <td>Uploaded Images</td>
                <td>Visual Feedback Documentation</td>
                <td>Duration of classroom + archival</td>
              </tr>
              <tr>
                <td>Contact Inquiries</td>
                <td>Customer Support</td>
                <td>3 years or until resolved</td>
              </tr>
            </tbody>
          </table>

          <h4>Third-Party Processors</h4>
          <p>
            We may use third-party service providers who process data on our behalf. All processors are
            required to comply with GDPR and have signed Data Processing Agreements (DPAs) with us.
          </p>

          <h4>International Transfers</h4>
          <p>
            If your data is transferred outside the EEA, we ensure adequate protection through Standard
            Contractual Clauses or other approved mechanisms.
          </p>

          <h4>Children's Data</h4>
          <p>
            For users under 16 years of age, parental or guardian consent is required. Teachers are
            responsible for obtaining appropriate consent when onboarding minor students.
          </p>

          <h4>Exercising Your Rights</h4>
          <p>
            To exercise any of your GDPR rights, please contact us at{' '}
            <a href="/contact">our contact page</a> or email jan@tastbaar.studio. We will respond to your
            request within 30 days. For complex requests, we may extend this period by an additional 60 days,
            in which case we will inform you.
          </p>

          <h4>Complaints</h4>
          <p>
            If you believe your data protection rights have been violated, you have the right to lodge a
            complaint with your local Data Protection Authority. In Belgium, this is the Data Protection
            Authority (Gegevensbeschermingsautoriteit).
          </p>

          <h4>Updates to This Page</h4>
          <p>
            We may update this GDPR compliance information as regulations evolve or our practices change. The
            date of the last update is shown at the top of this page.
          </p>
        </div>
      </div>
    </div>
  )
}
