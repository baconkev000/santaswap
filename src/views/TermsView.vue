<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <article class="legal-page">
    <div class="prose-container">
      <RouterLink class="legal-page__brand brand-wordmark" to="/">
        <span class="brand-wordmark__santa">Santa</span><span class="brand-wordmark__swap">Swap</span>
      </RouterLink>
      <hr class="legal-page__rule" />

      <h1>Terms &amp; Conditions</h1>
      <p class="legal-page__updated">Last updated: November 25, 2026</p>

      <div class="legal-content">
        <section aria-labelledby="terms-acceptance">
          <h2 id="terms-acceptance">Acceptance of Terms</h2>
          <p>
            SantaSwap is a product and DBA of KBCoding LLC. SantaSwap is a brand
            name used by KBCoding LLC and is not a separate legal entity.
            References to “SantaSwap,” “we,” “us,” or “our” in these Terms mean
            KBCoding LLC, doing business as SantaSwap.
          </p>
          <p>
            These Terms &amp; Conditions (“Terms”) govern your access to and use
            of the SantaSwap website, mobile application, and related services
            (the “Service”). By accessing or using SantaSwap, you agree to these
            Terms. If you do not agree, do not use the Service.
          </p>
        </section>

        <section aria-labelledby="terms-service">
          <h2 id="terms-service">Description of Service</h2>
          <p>
            SantaSwap is a tool that helps users organize Secret Santa gift
            exchanges. Organizers can create exchanges, add participants (including
            names and phone numbers), set optional gift-budget information and
            exchange dates, generate assignments, share an invitation link, and
            allow participants to privately view their own assignments on the
            SantaSwap website.
          </p>
          <p>
            SantaSwap does not send assignments or exchange details by SMS or
            other text message. Assignments are shown in the Service after a
            participant provides the phone number associated with their entry in
            the exchange.
          </p>
          <p>
            SantaSwap provides software features for organizing exchanges. It is
            not responsible for gifts, purchases, interpersonal disputes, or the
            actual carrying out of any Secret Santa exchange among participants.
          </p>
        </section>

        <section aria-labelledby="terms-responsibilities">
          <h2 id="terms-responsibilities">User Responsibilities</h2>
          <p>You are responsible for:</p>
          <ul>
            <li>Providing accurate information</li>
            <li>
              Having appropriate permission to provide participant names and
              phone numbers
            </li>
            <li>Using the Service lawfully</li>
            <li>
              Not using the Service for spam, harassment, fraud, or unsolicited
              marketing
            </li>
            <li>
              Keeping account information secure where an account is used
            </li>
          </ul>
          <p>
            Organizers should only enter another person’s contact information when
            they have an appropriate basis to do so for organizing the exchange.
            Entering another person’s phone number into SantaSwap does not, by
            itself, mean SantaSwap will contact that person by SMS.
          </p>
          <p>
            You agree not to interfere with the operation of the Service, attempt
            unauthorized access, or use SantaSwap in any way that could harm
            other users or service providers.
          </p>
        </section>

        <section aria-labelledby="terms-acceptable-use">
          <h2 id="terms-acceptable-use">Acceptable Use</h2>
          <p>Users may not use SantaSwap to:</p>
          <ul>
            <li>Harass, abuse, or impersonate others</li>
            <li>Submit fraudulent or illegal content</li>
            <li>Attempt to access another participant’s assignment without authorization</li>
            <li>Probe, scrape, or overload the Service in a way that harms it</li>
            <li>Violate applicable law</li>
          </ul>
          <p>
            SantaSwap reserves the right to restrict or terminate access to the
            Service for abuse or violations of these Terms.
          </p>
        </section>

        <section aria-labelledby="terms-privacy">
          <h2 id="terms-privacy">Privacy</h2>
          <p>
            How SantaSwap collects and uses information, including names and phone
            numbers, is described in our
            <RouterLink to="/privacy">Privacy Policy</RouterLink>
            (<a href="https://santaswap.us/privacy">https://santaswap.us/privacy</a>).
          </p>
        </section>

        <section aria-labelledby="terms-third-parties">
          <h2 id="terms-third-parties">Third-Party Services</h2>
          <p>
            SantaSwap relies on third-party infrastructure providers to operate
            the Service, including hosting and database providers. Those
            providers’ services may be subject to their own terms and policies.
            SantaSwap does not reproduce third-party terms here, and your use of
            third-party services may be governed by those separate terms.
          </p>
        </section>

        <section aria-labelledby="terms-availability">
          <h2 id="terms-availability">Service Availability</h2>
          <p>
            SantaSwap is provided on an “as available” basis. Availability may
            occasionally be interrupted for maintenance, outages, network
            issues, provider disruptions, or other reasons. We do not promise
            uninterrupted or error-free operation.
          </p>
        </section>

        <section aria-labelledby="terms-liability">
          <h2 id="terms-liability">Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by applicable law, SantaSwap and its
            operators will not be liable for indirect, incidental, special,
            consequential, or punitive damages, or for any loss of profits,
            data, goodwill, or other intangible losses, arising out of or
            related to your use of (or inability to use) the Service.
          </p>
          <p>
            Without limiting the foregoing, SantaSwap is not responsible for
            gifts, purchases, delivery of gifts, interpersonal disputes among
            participants, or the outcome of any Secret Santa exchange. The
            Service is a tool for organizing exchanges and displaying
            assignments.
          </p>
          <p>
            Some jurisdictions do not allow certain limitations of liability, so
            some of the above limitations may not apply to you.
          </p>
        </section>

        <section aria-labelledby="terms-disclaimer">
          <h2 id="terms-disclaimer">Disclaimer of Warranties</h2>
          <p>
            The Service is provided “as is” and “as available,” without
            warranties of any kind, whether express or implied, including
            implied warranties of merchantability, fitness for a particular
            purpose, and non-infringement, to the extent permitted by law.
          </p>
        </section>

        <section aria-labelledby="terms-changes">
          <h2 id="terms-changes">Changes to These Terms</h2>
          <p>
            SantaSwap may update these Terms from time to time. The current
            version will be posted on this page, and the “Last updated” date
            will be revised when changes are made. Continued use of the Service
            after updates constitutes acceptance of the revised Terms where
            legally applicable.
          </p>
        </section>

        <section aria-labelledby="terms-governing-law">
          <h2 id="terms-governing-law">Governing Law</h2>
          <p>
            These Terms will be governed by applicable law, subject to the
            requirements of the jurisdiction in which the applicable user or
            KBCoding LLC is located.
          </p>
        </section>

        <section aria-labelledby="terms-contact">
          <h2 id="terms-contact">Contact</h2>
          <p>Questions about these Terms?</p>
          <p>
            SantaSwap is operated by KBCoding LLC. Please contact SantaSwap
            through the contact method provided in the application.
          </p>
          <p>
            Website: <a href="https://santaswap.us">https://santaswap.us</a>
          </p>
          <p>
            Privacy Policy:
            <a href="https://santaswap.us/privacy">https://santaswap.us/privacy</a>
          </p>
          <p>
            Terms &amp; Conditions:
            <a href="https://santaswap.us/terms">https://santaswap.us/terms</a>
          </p>
        </section>
      </div>

      <hr class="legal-page__rule" />
      <p class="legal-page__updated">
        <RouterLink to="/privacy">Privacy Policy</RouterLink>
        &nbsp;|&nbsp;
        <RouterLink to="/terms">Terms</RouterLink>
      </p>
    </div>
  </article>
</template>
