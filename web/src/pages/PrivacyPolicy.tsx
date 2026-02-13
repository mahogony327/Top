export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: February 13, 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
          <p className="text-gray-300 mb-2">
            When you use Top, we collect the following information:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
            <li>Account information (email, username, display name)</li>
            <li>Content you create (categories, submissions, rankings)</li>
            <li>Usage data (how you interact with the app)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
          <p className="text-gray-300 mb-2">We use your information to:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
            <li>Provide and maintain the Top service</li>
            <li>Allow you to create and share your rankings</li>
            <li>Enable social features like following other users</li>
            <li>Improve and personalize your experience</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
          <p className="text-gray-300">
            We do not sell your personal information. Your public rankings and profile 
            information may be visible to other users based on your privacy settings. 
            Private categories are only visible to you.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
          <p className="text-gray-300">
            We implement appropriate security measures to protect your personal information. 
            Your password is encrypted and never stored in plain text.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">5. Your Rights</h2>
          <p className="text-gray-300 mb-2">You have the right to:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
            <li>Access your personal data</li>
            <li>Update or correct your information</li>
            <li>Delete your account and associated data</li>
            <li>Control the privacy of your categories</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">6. Contact Us</h2>
          <p className="text-gray-300">
            If you have questions about this Privacy Policy, please contact us at{' '}
            <a href="mailto:privacy@topranking.app" className="text-sky-400 hover:underline">
              privacy@topranking.app
            </a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">7. Changes to This Policy</h2>
          <p className="text-gray-300">
            We may update this Privacy Policy from time to time. We will notify you of 
            any changes by posting the new Privacy Policy on this page and updating the 
            "Last updated" date.
          </p>
        </section>
      </div>
    </div>
  );
}
