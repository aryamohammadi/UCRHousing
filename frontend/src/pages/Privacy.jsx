import React from 'react'

function Privacy() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-2xl sm:text-3xl font-semibold text-navy-900 mb-4">
          Privacy Policy
        </h1>
        
        <div className="text-sm text-gray-500 mb-8">
          <p>Effective Date: December 30, 2025</p>
          <p>Site: https://www.dormduos.com</p>
          <p>Owner: Arya Mohammadi</p>
          <p>Contact: <a href="mailto:dormduos@gmail.com" className="text-navy-700 hover:underline">dormduos@gmail.com</a></p>
        </div>

        <div className="text-base text-gray-600 leading-relaxed space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-navy-900 mt-8 mb-2">
              Purpose
            </h2>
            <p>
              This Privacy Policy describes how DormDuos collects, uses, and protects your personal information when you use our housing platform website.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy-900 mt-8 mb-2">
              Consent
            </h2>
            <p>
              By using our website, you consent to the collection and use of your personal information as described in this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy-900 mt-8 mb-2">
              Personal Data We Collect
            </h2>
            <p className="mb-2">We collect the following personal information:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Address (for property listings)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy-900 mt-8 mb-2">
              How We Use Personal Data
            </h2>
            <p className="mb-2">We use your personal data for the following purposes:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>User authentication and account management</li>
              <li>Displaying contact information on property listings you post</li>
              <li>Communicating with you about your account and listings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy-900 mt-8 mb-2">
              Who We Share Personal Data With
            </h2>
            <p className="mb-2">We share your personal data with the following third-party services:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>MongoDB Atlas:</strong> Our database hosting service that stores your account and listing information</li>
              <li><strong>Vercel:</strong> Our hosting platform that processes and serves our website</li>
            </ul>
            <p className="mt-4">
              We do not sell, rent, or trade your personal information to third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy-900 mt-8 mb-2">
              How Long We Store Personal Data
            </h2>
            <p>
              We retain your personal data for as long as your account is active or as needed to provide you services. If you wish to delete your account, you may contact us at dormduos@gmail.com and we will delete your personal information in accordance with applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy-900 mt-8 mb-2">
              How We Protect Your Personal Data
            </h2>
            <p className="mb-2">We implement the following security measures to protect your personal data:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Password Hashing:</strong> All passwords are hashed using bcrypt before storage</li>
              <li><strong>Database Encryption:</strong> MongoDB Atlas provides encryption at rest and in transit</li>
              <li><strong>HTTPS:</strong> All data transmission is encrypted using HTTPS via Vercel</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy-900 mt-8 mb-2">
              Children
            </h2>
            <p>
              We do not knowingly collect personal information from children under the age of 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at dormduos@gmail.com.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy-900 mt-8 mb-2">
              How to Access, Modify, Delete, or Challenge Data Collected
            </h2>
            <p>
              You have the right to access, modify, delete, or challenge the personal data we have collected about you. To exercise these rights, please contact us at dormduos@gmail.com. We will respond to your request within a reasonable timeframe.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy-900 mt-8 mb-2">
              Do Not Track Notice
            </h2>
            <p>
              Our website does not respond to Do Not Track signals from your browser. We do not track your browsing activity across other websites.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy-900 mt-8 mb-2">
              Cookie Policy
            </h2>
            <p>
              We use functional cookies only, which are necessary for the website to function properly. These cookies are used for authentication and session management. We do not use tracking cookies or cookies for advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy-900 mt-8 mb-2">
              Modifications
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective Date" at the top of this policy. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-navy-900 mt-8 mb-2">
              Contact Information
            </h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at <a href="mailto:dormduos@gmail.com" className="text-navy-700 hover:underline">dormduos@gmail.com</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

export default Privacy

