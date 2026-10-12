# Assumptions to verify against real statements

These are guesses where I couldn't confirm the real bank export. Check them when you test with your own statement.

- HDFC, SBI, Kotak CSV and XLS header text. Parsers match by synonym, so small differences should still work.
- Kotak column list (Sl. No., Transaction Date, Value Date, Description, Chq/Ref No., Debit/Credit, Balance, Dr/Cr).
- How common services appear in descriptors (gateway prefixes, mandate keywords).
- Credit card CSV layouts for every issuer, including whether purchases are positive or negative.
- Whether a SI or AUTOPAY marker appears on a given bank's card statement.
