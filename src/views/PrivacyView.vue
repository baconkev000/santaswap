<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <article class="legal-page">
    <div class="prose-container">
      <RouterLink class="legal-page__brand" to="/">SantaSwap</RouterLink>
      <hr class="legal-page__rule" />

      <h1>Privacy Policy</h1>
      <p class="legal-page__updated">Last updated: September 29, 2026</p>

      <div class="legal-content">
        <section aria-labelledby="privacy-intro">
          <h2 id="privacy-intro">Introduction</h2>
          <p>
            SantaSwap is a product and DBA of KBCoding LLC. SantaSwap is a brand
            name used by KBCoding LLC and is not a separate legal entity.
          </p>
          <p>
            This Privacy Policy explains how SantaSwap, a product and DBA of
            KBCoding LLC (“SantaSwap,” “we,” “us,” or “our”), collects, uses,
            and shares information in connection with the SantaSwap mobile
            application, the website at
            <a href="https://santaswap.us">https://santaswap.us</a>, and related
            services (the “Service”). SantaSwap helps people organize Secret
            Santa gift exchanges, generate assignments, and send participants
            private assignment messages by SMS.
          </p>
          <p>
            By using the Service, you acknowledge the practices described in this
            Privacy Policy. If you do not agree with this Privacy Policy, please
            do not use the Service. Use of the Service is also subject to our
            <RouterLink to="/terms">Terms &amp; Conditions</RouterLink>.
          </p>
        </section>

        <section aria-labelledby="privacy-collect">
          <h2 id="privacy-collect">Information We Collect</h2>
          <p>
            Depending on how you use SantaSwap, we may collect the following
            categories of information:
          </p>
          <ul>
            <li>Name</li>
            <li>Phone number</li>
            <li>Email address, if provided</li>
            <li>Secret Santa group information</li>
            <li>Secret Santa assignments</li>
            <li>
              SMS message status information, such as whether a message was
              submitted for delivery, a message identifier from our SMS provider,
              and error information if a message could not be sent
            </li>
            <li>Basic account and application information</li>
            <li>
              Technical information necessary to operate and secure the Service
              (such as device, app, or log information generated through normal
              use of the Service)
            </li>
          </ul>
          <p>
            We collect this information when you create or manage an exchange,
            add participants, generate assignments, send messages, create or use
            an account where applicable, or otherwise interact with the Service.
          </p>
        </section>

        <section aria-labelledby="privacy-use">
          <h2 id="privacy-use">How We Use Information</h2>
          <p>We use personal information for purposes such as:</p>
          <ul>
            <li>Creating and managing Secret Santa exchanges</li>
            <li>Identifying participants</li>
            <li>Generating Secret Santa assignments</li>
            <li>
              Sending transactional Secret Santa SMS messages, as described in
              the SMS Messaging section below
            </li>
            <li>Providing and maintaining the Service</li>
            <li>Troubleshooting and security</li>
            <li>Communicating with users when necessary</li>
          </ul>
          <p>
            We do not use phone numbers or SMS consent to send marketing or
            promotional messages.
          </p>
        </section>

        <section aria-labelledby="privacy-sms-program">
          <h2 id="privacy-sms-program">SMS Messaging</h2>
          <p>
            SantaSwap collects and uses phone numbers to provide its SMS
            functionality. SantaSwap SMS messages are transactional,
            service-related messages associated with Secret Santa exchanges.
            Examples include:
          </p>
          <ul>
            <li>Secret Santa assignments</li>
            <li>Exchange dates</li>
            <li>Gift budgets</li>
            <li>Exchange-related notifications</li>
            <li>Similar service notifications related to a Secret Santa exchange</li>
          </ul>
          <p>
            <strong>Consent.</strong> Users opt in to receive SantaSwap SMS
            messages through the SantaSwap application. SMS consent is separate
            from acceptance of our Terms &amp; Conditions and this Privacy
            Policy. SantaSwap does not use SMS consent as permission to send
            unrelated marketing messages.
          </p>
          <p>
            <strong>Message frequency.</strong> Message frequency varies based on
            your participation in SantaSwap exchanges.
          </p>
          <p>
            <strong>Costs.</strong> Message and data rates may apply.
          </p>
          <p>
            <strong>Opt out.</strong> You can reply <strong>STOP</strong> to any
            SantaSwap SMS message to opt out of SMS messages.
          </p>
          <p>
            <strong>Help.</strong> You can reply <strong>HELP</strong> to any
            SantaSwap SMS message for assistance.
          </p>
          <p>
            We do not sell or share your SMS opt-in data or personal information with third parties for marketing purposes.
          </p>
          <p>
            SantaSwap does not sell or share mobile phone numbers or SMS
            consent/opt-in information with third parties or affiliates for
            their own marketing or promotional purposes.
          </p>
        </section>

        <section aria-labelledby="privacy-sms">
          <h2 id="privacy-sms">SMS and Phone Number Information</h2>
          <p>
            SantaSwap uses phone numbers to send the Secret Santa-related SMS
            messages described above, such as private assignment notifications
            and other exchange-related service messages.
          </p>
          <p>
            SantaSwap does not sell or share mobile phone numbers or SMS
            opt-in/consent information with third parties or affiliates for
            their own marketing or promotional purposes.
          </p>
          <p>
            Third-party service providers may process information when necessary
            to provide SantaSwap’s services. SantaSwap uses Twilio for SMS
            delivery. Twilio may process phone numbers and message-related
            information (such as message content, delivery status, and message
            identifiers) as necessary to provide SMS delivery and related
            operational services.
          </p>
          <p>
            To help track delivery, SantaSwap records message status information
            such as whether a message was submitted, a Twilio message
            identifier, and error information. SantaSwap does not store the full
            text of assignment SMS messages in its message status records.
          </p>
        </section>

        <section aria-labelledby="privacy-assignments">
          <h2 id="privacy-assignments">Secret Santa Assignment Privacy</h2>
          <p>
            Secret Santa assignments are treated as private information.
            SantaSwap uses participant assignment information to provide each
            participant with their intended Secret Santa recipient. Each
            assignment SMS is intended to contain only that participant’s own
            assignment information.
          </p>
          <p>
            Assignments are not shared with all participants by default. Whether
            an organizer can view the final assignment list depends on the
            application’s organizer settings for that exchange.
          </p>
        </section>

        <section aria-labelledby="privacy-sharing">
          <h2 id="privacy-sharing">How We Share Information</h2>
          <p>
            We may share information with service providers that help us operate
            the Service (such as our SMS delivery provider), when required by
            law, to protect rights and safety, or in connection with a business
            transfer if KBCoding LLC’s assets related to SantaSwap are involved
            in a merger, acquisition, or similar transaction.
          </p>
          <p>
            We do not sell personal information for money. We also do not share
            mobile phone numbers or SMS consent information with third parties
            or affiliates for those parties’ own marketing or promotional use.
          </p>
        </section>

        <section aria-labelledby="privacy-third-parties">
          <h2 id="privacy-third-parties">Third-Party Services</h2>
          <p>
            SantaSwap may use third-party service providers that are necessary to
            operate the Service. These providers process information only as
            needed to perform services on our behalf. Examples include:
          </p>
          <ul>
            <li>
              Supabase, for backend, database, and authentication infrastructure
            </li>
            <li>
              Twilio, for SMS delivery. Twilio may process phone numbers and
              message-related information as necessary to provide SMS delivery
              and related operational services.
            </li>
          </ul>
          <p>
            These providers have their own privacy and security practices.
            SantaSwap does not claim any certifications or security guarantees
            belonging solely to those providers as its own.
          </p>
        </section>

        <section aria-labelledby="privacy-retention">
          <h2 id="privacy-retention">Data Retention</h2>
          <p>
            SantaSwap retains personal information only for as long as
            reasonably necessary to provide the Service, comply with legal
            obligations, resolve disputes, and enforce agreements. Retention
            periods may vary depending on the type of information and how it is
            used.
          </p>
        </section>

        <section aria-labelledby="privacy-security">
          <h2 id="privacy-security">Data Security</h2>
          <p>
            SantaSwap uses reasonable administrative, technical, and
            organizational safeguards designed to protect personal information.
            No method of transmission or storage is completely secure, and we
            cannot guarantee absolute security.
          </p>
        </section>

        <section aria-labelledby="privacy-children">
          <h2 id="privacy-children">Children’s Privacy</h2>
          <p>
            SantaSwap is intended for adults and general users organizing gift
            exchanges. The Service is not specifically directed toward children,
            and we do not knowingly collect personal information from children.
            If you believe a child has provided personal information to
            SantaSwap, please contact us through the contact method provided in
            the application so we can take appropriate action.
          </p>
        </section>

        <section aria-labelledby="privacy-rights">
          <h2 id="privacy-rights">Your Choices and Requests</h2>
          <p>
            You can opt out of SantaSwap SMS messages at any time by replying
            <strong>STOP</strong> to any SantaSwap SMS message. Reply
            <strong>HELP</strong> for assistance.
          </p>
          <p>
            Depending on where you live, you may have rights to request access
            to, correction of, or deletion of certain personal information, or
            to ask questions about how your information is handled. To make a
            request, please contact SantaSwap through the contact method
            provided in the application.
          </p>
        </section>

        <section aria-labelledby="privacy-updates">
          <h2 id="privacy-updates">Updates to This Privacy Policy</h2>
          <p>
            SantaSwap may update this Privacy Policy from time to time. The
            current version will be posted on this page, and the “Last updated”
            date will be revised when changes are made. We encourage you to
            review this page periodically.
          </p>
        </section>

        <section aria-labelledby="privacy-contact">
          <h2 id="privacy-contact">Contact</h2>
          <p>Questions about this Privacy Policy?</p>
          <p>
            SantaSwap is operated by KBCoding LLC. Please contact SantaSwap
            through the contact method provided in the application. For help
            with SMS messages, reply <strong>HELP</strong> to any SantaSwap SMS
            message.
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
