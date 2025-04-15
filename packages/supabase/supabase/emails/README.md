# Supabase Email Templates

## How to Use

1. Copy the contents of `magic-link.html` into the Magic Link template in your Supabase dashboard:

   - Go to Project → Authentication → Templates → Magic Link.
   - Replace the default content with this file.
   - Use `{{ .Token }}` for OTP code entry, or `{{ .ConfirmationURL }}` for magic link.

2. Keep this folder updated with any changes for version control.

## Templates

- `magic-link.html`: Used for OTP code entry (email).
