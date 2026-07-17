# Patch: Amazon listing fields for saved ideas

Adds 3 fields to the Saved Ideas table:

- Product image / mockup URL
- Product height
- Product weight

The Amazon listing AI prompt now uses:

- product link
- image URL
- product height
- product weight
- target customer
- notes
- niche, sub-niche, product type

Run `supabase/migrate_saved_idea_listing_fields.sql` once in Supabase SQL Editor before using the new fields.
