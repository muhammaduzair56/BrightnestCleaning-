
# SMTP evaluation notes

Gmail SMTP can use `smtp.gmail.com` with port 587 and STARTTLS or port 465 with SSL, but Google requires an App Password when using this style of authentication; the account must have 2-Step Verification enabled. The normal Gmail password must not be used. Brevo provides a transactional SMTP relay and requires an SMTP key rather than a Brevo API key; its documented ports include 587, 465, and 2525.

Sources:
- https://support.google.com/mail/answer/185833?hl=en
- https://support.google.com/accounts/answer/185833?hl=en
- https://developers.brevo.com/docs/smtp-integration
