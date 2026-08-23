
# Resend setup notes

Official Resend guidance confirms that a sender address does not need to be separately created, but the sending domain must be verified before using addresses at that domain. A friendly sender uses the format `Name <sender@example.com>`. API keys are unique account secrets, can be created from the Resend API keys dashboard, and should be stored only in server-side environment variables. The shared `onboarding@resend.dev` domain is for testing and is restricted to sending to the email address associated with the Resend account; for recipients such as customers or an admin mailbox, a verified domain is required.

Sources:
- https://resend.com/docs/knowledge-base/how-do-I-create-an-email-address-or-sender-in-resend
- https://resend.com/docs/create-an-api-key
- https://resend.com/docs/knowledge-base/403-error-resend-dev-domain
