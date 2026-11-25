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

      <h1>Privacy Policy</h1>
      <p class="legal-page__updated">Last updated: October 4, 2026</p>

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
            Santa gift exchanges, generate assignments, and let each participant
            privately view their own assignment on the SantaSwap website after
            verifying their phone number.
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
              Phone verification information, such as verification requests,
              verification attempts, and whether verification succeeded
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
            add participants, generate assignments, create or use an account
            where applicable, verify your phone number to view an assignment, or
            otherwise interact with the Service. If you are a participant, your
            name and phone number may have been provided by the organizer who
            created the exchange.
          </p>
        </section>

        <section aria-labelledby="privacy-use">
          <h2 id="privacy-use">How We Use Information</h2>
          <p>We use personal information for purposes such as:</p>
          <ul>
            <li>Creating and managing Secret Santa exchanges</li>
            <li>Identifying participants and associating them with an exchange</li>
            <li>Generating Secret Santa assignments</li>
            <li>
              Verifying control of a participant’s phone number and sending a
              one-time verification code, as described in the SMS and Phone
              Verification section below
            </li>
            <li>
              Displaying each participant’s own assignment after successful
              verification, and preventing unauthorized access to it
            </li>
            <li>Providing, maintaining, and securing the Service</li>
            <li>Troubleshooting</li>
            <li>Communicating with users when necessary</li>
          </ul>
          <p>
            We do not use phone numbers to send marketing or promotional
            messages.
          </p>
        </section>

        <section aria-labelledby="privacy-sms">
          <h2 id="privacy-sms">SMS and Phone Verification</h2>
          <p>
            SantaSwap uses SMS only to verify phone numbers. SantaSwap does not
            send Secret Santa assignments, recipient names, exchange dates, gift
            budgets, or other exchange details by SMS. That information is
            displayed in the SantaSwap application and on the SantaSwap website.
          </p>
          <p>
            <strong>How phone numbers are collected.</strong> SantaSwap collects
            participant phone numbers as part of a Secret Santa exchange. An
            organizer may enter participant names and phone numbers when
            creating an exchange.
          </p>
          <p>
            <strong>How the invitation and verification work.</strong>
            Participants may receive a SantaSwap invitation link from the
            organizer. The link identifies the Secret Santa exchange but does not
            contain the participant’s assignment. A participant must provide the
            requested identifying information and successfully complete phone
            verification before SantaSwap displays their private assignment.
          </p>
          <p>
            Organizers share invitation links using their own messaging app,
            email, or other method; SantaSwap does not send invitation messages.
            Opening an invitation link does not by itself authenticate the
            participant. On the SantaSwap website, a
            participant enters the group invitation link or code and their phone
            number. Before revealing the participant’s private Secret Santa
            assignment, SantaSwap verifies control of that phone number by
            sending a one-time verification code by SMS. The participant enters
            the code on the SantaSwap website. Successful verification allows
            SantaSwap to display that participant’s own private assignment.
          </p>
          <p>
            <strong>Nature of the messages.</strong> Verification messages are
            transactional, security-related messages sent at the participant’s
            request. They contain a one-time verification code and do not contain
            assignment information. Participants are not subscribed to recurring
            SMS messages, and SantaSwap does not use phone numbers for marketing
            or promotional SMS.
          </p>
          <p>
            <strong>Twilio Verify.</strong> SantaSwap uses Twilio Verify to send
            one-time verification codes by SMS when a participant verifies the
            phone number associated with a Secret Santa exchange. To provide
            this service, Twilio may process the participant’s phone number,
            verification code information, message delivery information, and
            technical information necessary to provide the verification service.
          </p>
          <p>
            <strong>Message frequency.</strong> Verification messages are sent
            only when a participant requests phone verification or needs to
            complete the verification process. The number of verification
            messages may vary depending on participant activity, including
            verification attempts or requests for a new verification code.
          </p>
          <p>
            <strong>Costs.</strong> Message and data rates may apply.
          </p>
          <p>
            <strong>STOP and HELP.</strong> Where supported by the messaging
            service, recipients may reply <strong>STOP</strong> to opt out of SMS
            messages or <strong>HELP</strong> for assistance. Opting out may
            prevent you from receiving verification codes needed to view your
            assignment on the SantaSwap website.
          </p>
          <p>
            We do not sell or share your SMS opt-in data or personal information with third parties for marketing purposes.
          </p>
          <p>
            We do not share, sell, or provide mobile phone numbers or messaging consent data to third parties or affiliates for marketing or promotional purposes.
          </p>
        </section>

        <section aria-labelledby="privacy-assignments">
          <h2 id="privacy-assignments">Secret Santa Assignment Privacy</h2>
          <p>
            Secret Santa assignments are treated as private information. A
            participant can see only their own assignment. The SantaSwap website
            does not reveal other participants’ assignments, the participant
            list, or other participants’ phone numbers to someone viewing an
            assignment.
          </p>
          <p>
            An invitation link or group code alone is not enough to view an
            assignment. Phone verification is part of the security mechanism
            SantaSwap uses before displaying a participant’s assignment.
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
            SantaSwap may provide personal information to service providers that
            process information on SantaSwap’s behalf to operate the Service.
            These providers may include infrastructure, database,
            authentication, and SMS verification providers. Such providers
            receive information only as reasonably necessary to provide their
            services and are not authorized to use SantaSwap’s mobile phone
            numbers or messaging consent data for their own marketing or
            promotional purposes.
          </p>
          <p>
            We may also share information when required by law, to protect
            rights and safety, or in connection with a business transfer if
            KBCoding LLC’s assets related to SantaSwap are involved in a merger,
            acquisition, or similar transaction.
          </p>
          <p>
            We do not sell personal information. We do not share mobile phone
            numbers or messaging consent data with third parties or affiliates
            for marketing or promotional purposes.
          </p>
        </section>

        <section aria-labelledby="privacy-third-parties">
          <h2 id="privacy-third-parties">Third-Party Services</h2>
          <p>
            SantaSwap uses the following service providers to operate the
            Service. They process information only as needed to perform services
            on our behalf:
          </p>
          <ul>
            <li>
              Supabase, for backend, database, and authentication infrastructure
            </li>
            <li>
              Twilio, for SMS phone verification through Twilio Verify, as
              described in the SMS and Phone Verification section above
            </li>
            <li>
              Apple, if you choose to sign in to the SantaSwap mobile application
              with Sign in with Apple
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
            used. Phone verification records and the temporary access granted
            after verification are designed to be short-lived.
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
            Where supported by the messaging service, you may reply
            <strong>STOP</strong> to a SantaSwap verification message to opt out
            of SMS messages, or <strong>HELP</strong> for assistance. See the SMS
            and Phone Verification section above for details.
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
            with a verification message, reply <strong>HELP</strong> where
            supported by the messaging service.
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
